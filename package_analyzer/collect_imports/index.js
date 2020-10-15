const { promisify } = require("util");
const fs = require("fs").promises;
const path = require("path");

const resolve = promisify(require("resolve"));
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

const debug = require("debug")("collect_imports");

/**
 * Recursively walk all files and collect dependencies along the way.
 * @param {string} filename 
 * @param {Map<string, string>} seen 
 * @param {Set<string>} externalDeps
 */
async function walkRecursive(filename, seen, externalDeps) {
  try {
    const normalizedFilePath = await resolve(path.resolve(filename));
    if (seen.has(normalizedFilePath) || normalizedFilePath.endsWith(".node")) { // .json is fine (also valid JS, and strings are imported anyways). We don't want .node files.
      return; // Already seen, no longer attempt to resolve.
    }

    let content = await fs.readFile(normalizedFilePath, "utf8");

    // If someone else happens to done the file in the meantime, we immediately quit (this is possible due to race condition)
    if (seen.has(normalizedFilePath)) {
      return; // Already seen, no longer attempt to resolve.
    }

    // Mark that I will start the processing, lock all others.
    seen.set(normalizedFilePath, content);

    const ast = parser.parse(content, {
      allowAwaitOutsideFunction: true, // Just in case of new Node versions that supports TLA
      sourceType: "unambiguous",
    });

    // Refer to https://github.com/babel/babel/blob/master/packages/babel-parser/ast/spec.md
    // and https://astexplorer.net/
    const sources = [];
    traverse(ast, {
      enter(path) {
        if (t.isImportDeclaration(path.node)) { // Not handling export {...} from "./deps" syntax: too new.
          const source = path.node.source.value;
          if (source) {
            sources.push(source);
          }
        } else if (t.isCallExpression(path.node)
          && path.node.callee.name === "require"
          && path.node.arguments && path.node.arguments.length > 0) { // Not handling dynamic import: too unusual.
          const sourceArgument = path.node.arguments[0];
          if (t.isStringLiteral(sourceArgument)) { // Not handling variable require(var) case: unusual
            sources.push(sourceArgument.value);
          }
        }
      }
    });
    const internalDeps = [];
    for (const source of sources) {
      if (source.startsWith("./") || source.startsWith("../") || source === "." || source === "..") {
        const resolvedSource = await resolve(source, { basedir: path.dirname(normalizedFilePath) });
        internalDeps.push(resolvedSource);
      } else {
        externalDeps.add(source);
      }
    }
    await Promise.all(internalDeps.map(source => walkRecursive(source, seen, externalDeps))); // All promises are run concurrently.
  } catch (e) {
    debug(`Error during collect imports: ${e.message}`); // Try resolve as much as possible (definitely edge cases we do not resolve cleanly), so hide the errors
    return;
  }
}

/**
 * Collect all import statements (internal/external ones) limited inside of this package (a.k.a. does not resolve into node_modules and builtin modules).
 * This is used to avoid including test files etc.
 * @param {string} filename entry point to collect
 * @param {Map<string, string>=} pastInternalMap internal map that has been scanned in the past to avoid duplicate scanning (when a package has many entry points). New entries will be added to it
 * @returns {{internal: Map<string, string>, external: Set<string>}}
 */
async function collectImports(filename, pastInternalMap = new Map()) {
  const internal = pastInternalMap;
  const external = new Set();
  try {
    await walkRecursive(filename, internal, external);
  } catch (e) {
    debug(`Error during collect imports: ${e.message}`);
  }
  return {
    internal,
    external,
  };
}

module.exports = {
  collectImports,
}

// async function main() {
//   // const m = new Map();
//   // const s = new Set();
//   // await walkRecursive("../test.js", m, s);
//   // console.log(m);
//   // console.log(s);
//   const {internal, external} = await collectImports("../node_modules/react-slick/lib");
//   console.log("Internal deps:", Array.from(internal.keys()));
//   console.log("External deps:", external);
// }

// main();
