import { promisify } from "util";
import { promises as fs } from "fs";
import * as path from "path";
import { strict as assert } from "assert";

const resolve = promisify(require("resolve"));
import * as parser from "@babel/parser";
import traverse from "@babel/traverse"; // default
import * as t from "@babel/types";

import makeDebug from "debug";
const debug = makeDebug("collect_imports");

/**
 * Recursively walk all files and collect dependencies along the way. New discoveries will be dumped into `seen` and `externalDeps`.
 * @param filename 
 * @param seen Notice it is a Map. Key to this map is file path, value is file content.
 * @param externalDeps
 */
async function walkRecursive(filename: string, seen: Map<string, string>, externalDeps: Set<string>): Promise<void> {
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
    const sources: string[] = [];
    traverse(ast, {
      enter(path) {
        if (t.isImportDeclaration(path.node)) { // Not handling export {...} from "./deps" syntax: too new.
          const source = path.node.source.value;
          if (source) {
            sources.push(source);
          }
        } else if (t.isCallExpression(path.node)
          // @ts-ignore
          && path.node.callee.name === "require"
          && path.node.arguments && path.node.arguments.length > 0) { // Not handling dynamic import: too unusual.
          const sourceArgument = path.node.arguments[0];
          if (t.isStringLiteral(sourceArgument)) { // Not handling variable require(var) case: unusual
            sources.push(sourceArgument.value);
          }
        }
      }
    });
    const internalDeps: string[] = [];
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
 * @param filename entry point to collect
 * @param pastInternalMap internal map that has been scanned in the past to avoid duplicate scanning (when a package has many entry points). New entries will be added to it
 * @returns `internal` means dependencies appearning in the same package, represented as full path to the dep file. `external` means external dependencies, likely package names or Node builtin modules.
 */
export async function collectImports(filename: string, pastInternalMap = new Map<string, string>()): Promise<{ internal: Map<string, string>, external: Set<string> }> {
  const internal = pastInternalMap;
  const external = new Set<string>();
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


function setEquals<T>(as: Set<T>, bs: Set<T>): boolean {
  if (as.size !== bs.size) {
    return false;
  }
  for (let a of as) {
    if (!bs.has(a)) {
      return false;
    }
  }
  return true;
}
async function main() {
  const {internal, external} = await collectImports("./test/sample.js");
  assert(setEquals(new Set(internal.keys()), new Set([
    await resolve("./test/a", { basedir: "." }),
    await resolve("./test/b.js", { basedir: "." }),
    await resolve("./test/sample.js", { basedir: "." })
  ])));
  assert(setEquals(external, new Set(["Ea", "Eb"])))
}
if (require.main === module) {
  main();
}
