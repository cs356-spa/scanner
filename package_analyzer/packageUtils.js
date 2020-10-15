const fs = require("fs").promises;
const path = require("path");

const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const { collectImports } = require("./collect_imports");
const debug = require("debug")("packageUtils");

const MIN_NOTABLE_STRING_LENGTH = 20;
const DEFAULT_MAX_NOTABLE_STRING_COUNT_LIMIT = 50;

/**
 * @param {Set<string>} set 
 */
function popShortestStringFromSet(set) {
  let shortest = "";
  for (const v of set.values()) {
    if (v.length < shortest) {
      shortest = v;
    }
  }
  set.delete(shortest);
}

/**
 * Collect all notable strings from a string, assuming it is a JS file.
 * @param {string} content
 * @param {Set<string>=} pastSet a set containing past strings to allow incremental addition to an existing set.
 * @param {number=} limit Limit interesting strings to top N, such that 
 * @returns {Set<string>}
 */
function collectNotableStrings(content, pastSet = new Set(), limit = DEFAULT_MAX_NOTABLE_STRING_COUNT_LIMIT) {
  const strs = pastSet;
  // TODO: refer to this: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md
  try {
    const ast = parser.parse(content, {
      allowAwaitOutsideFunction: true, // Just in case of new Node versions that supports TLA
      sourceType: "unambiguous",
    });
  
    traverse(ast, {
      enter(path) {
        // Collect strings of length long enough from the package.
        if (t.isStringLiteral(path.node)) {
          const stringContent = path.node.value;
          if (stringContent.length >= MIN_NOTABLE_STRING_LENGTH) {
            strs.add(stringContent);
            if (strs.size > limit) {
              popShortestStringFromSet(strs);
            }
          }
        }
      }
    });
  } catch (e) {
    debug(`Error during notable string collection: ${e.message}`);
    /* Might error out when the file is NOT a JS file, or with unrecognized syntax by Babel that requires option tweaks. */
  }
  return strs;
}

/**
 * Get all source file paths from a module (such that tests and other irrelevant files are ignored);
 * @param {string} pathToModulePackageJson path to the package.json file of a node module
 * @param {boolean=} mainOnly only extract from entry points from "main" field of package.json
 * @returns {Promise<Map<string, string>>} Set of paths for interesting source files
 */
async function collectSourcePathsFromNodeModule(pathToModulePackageJson, mainOnly = false) {
  const packageJsonFileContent = await fs.readFile(pathToModulePackageJson, "utf8");
  const packageDir = path.dirname(pathToModulePackageJson)
  const packageJson = JSON.parse(packageJsonFileContent);

  const sources = new Map();
  // https://nodejs.org/api/packages.html#packages_package_entry_points
  if (packageJson["main"]) {
    let entryPath = path.resolve(packageDir, packageJson["main"]);
    const {internal, external} = await collectImports(entryPath);
    for (const [filePath, content] of internal) {
      sources.set(filePath, content);
    }
  }
  if (!mainOnly) {
    if (packageJson["exports"]) {
      const moduleExports = packageJson["exports"];
      const internalIncrementalMap = new Map();
      for (const k in moduleExports) {
        let entryPath = path.resolve(moduleExports[k], pathToModulePackageJson);
        await collectImports(entryPath, internalIncrementalMap);
      }
      for (const [filePath, content] of internalIncrementalMap) {
        sources.set(filePath, content);
      }
    }
  }
  // TODO: validate logic here: https://nodejs.org/api/modules.html#modules_all_together
  return sources;
}

/**
 * Collect all notable strings inside a package.
 * @param {string} pathToModulePackageJson 
 * @param {boolean=} mainOnly 
 */
async function collectPackageNotableStrings(pathToModulePackageJson, mainOnly = false) {
  const sources = await collectSourcePathsFromNodeModule(pathToModulePackageJson, mainOnly);
  const strs = new Set();
  for (const content of sources.values()) {
    collectNotableStrings(content, strs);
  }
  return strs;
}

// console.log(collectNotableStrings(`
// const a = 1;
// const b = "abc" + "defdfadsfdsfdsafdasfdsfdsfdsfdsafdasas" + "defdfadsfdsfdsafdasfdsfdsfdsfdsafdasasffff";
// const c = \`template\`;
// `));

async function main() {
  // const mapOfSources = await collectSourcePathsFromNodeModule("/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/package_analyzer/node_modules/ejs/package.json");
  // console.log(Array.from(mapOfSources.keys()));
  console.log(await collectPackageNotableStrings("/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/package_analyzer/node_modules/ws/package.json"))
}
main();

// console.log(collectImportsSync("../spa/test.js"));

// console.log(dependencyTree.toList({
//   filename: "./node_modules/ws/package.json",
//   directory: "./node_modules/ws/",
// }))

// TODO: we need to know which files in node_modules are the most important ones (actual source code)
// We need to use package.json information to tell. https://github.com/babel-utils/babel-collect-imports can be used to grab all necessary internal deps and run resolution logic.