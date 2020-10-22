import { promises as fs } from "fs";
import * as path from "path";
import { promisify as p } from "util";

import * as parser from "@babel/parser";
import traverse from "@babel/traverse"; // default
import * as t from "@babel/types";
import makeDebug from "debug";
import * as npm from "npm";

import { collectImports } from "./collect_imports";
import { enterTempDir } from "./util";

const debug = makeDebug("packageUtils");

const MIN_NOTABLE_STRING_LENGTH = 20;
const DEFAULT_MAX_NOTABLE_STRING_COUNT_LIMIT = 50;

function popShortestStringFromSet(set: Set<string>): void {
  let shortest = "";
  for (const v of set.values()) {
    if (v.length < shortest.length) {
      shortest = v;
    }
  }
  set.delete(shortest);
}

/**
 * Collect all notable strings from a string, assuming it is a JS file.
 * @param content 
 * @param pastSet a set containing past strings to allow incremental addition to an existing set.
 * @param limit Limit interesting strings to top N longest
 */
export function collectNotableStrings(content: string, pastSet = new Set<string>(), limit = DEFAULT_MAX_NOTABLE_STRING_COUNT_LIMIT): Set<string> {
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
 * @param pathToModulePackageJson path to the package.json file of a node module
 * @param mainOnly only extract from entry points from "main" field of package.json
 * @returns Set of paths for interesting source files
 */
export async function collectSourcePathsFromNodeModule(pathToModulePackageJson: string, mainOnly = false): Promise<Map<string, string>> {
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
 * @param pathToModulePackageJson 
 * @param mainOnly only extract from entry points from "main" field of package.json
 * @param limit Limit interesting strings to top N longest
 * @returns Notable strings in this package
 */
export async function collectPackageNotableStrings(pathToModulePackageJson: string, mainOnly = false, limit = DEFAULT_MAX_NOTABLE_STRING_COUNT_LIMIT): Promise<Set<string>> {
  const sources = await collectSourcePathsFromNodeModule(pathToModulePackageJson, mainOnly);
  const strs = new Set<string>();
  for (const content of sources.values()) {
    collectNotableStrings(content, strs, limit);
  }
  return strs;
}

type MatchResult = { matched: Set<string>, unmatched: Set<string>, extra: Set<string> }

function testStringsOnBundleStrings(bundleStrs: Set<string>, strs: Set<string>): MatchResult {
  const matched = new Set<string>();
  const unmatched = new Set<string>();
  for (const s of strs) {
    if (bundleStrs.has(s)) {
      matched.add(s);
    } else {
      unmatched.add(s);
    }
  }
  const extra = new Set([...bundleStrs].filter(x => !matched.has(x))); // extra = bundleStrs \ matched, AKA extra strings not present in the bundle.
  return {
    matched,
    unmatched,
    extra
  };
}

/**
 * Testing a list of strings on a bundle's content. The output is similar to that of `testPackageNotableStringsOnBundle`
 * TODO: consider making bundleContent a list, such it could be a list of potential chunks
 * @param bundleContent string content of a bundle
 * @param strs a list of strings to test if they appear in the bundle.
 */
export async function testStringsOnBundle(bundleContent: string, strs: Set<string>): Promise<MatchResult> {
  const bundleStrs = await collectNotableStrings(bundleContent, new Set(), Infinity);
  return testStringsOnBundleStrings(bundleStrs, strs);
}

/**
 * Output string match result of a bundle on a specific package.
 * If you want to supply past recorded package strings instead of package.json path (resulting in package reparsing), use `testStringsOnBundle` instead.
 * output.matched means string presenting in both the bundle and the package.
 * 
 * @param bundleContent string content of a bundle
 * @param pathToModulePackageJson 
 * @param mainOnly 
 * @returns Result of matching. `output.matched` means string presenting in both the bundle and the package, `output.unmatched` means strings in package but not in bundle, `output.extra = bundle_strings \ package_strings`
 */
export async function testPackageNotableStringsOnBundle(bundleContent: string, pathToModulePackageJson: string, mainOnly = false): Promise<MatchResult> {
  const strs = await collectPackageNotableStrings(pathToModulePackageJson, mainOnly);
  return await testStringsOnBundle(bundleContent, strs);
}

export type PackageStringsByVersionMap = { [version: string]: string[] };

async function collectPackageNotableStringsIntoDict(dictToFill: PackageStringsByVersionMap, packageDirPath: string, version: string, limit: number): Promise<void> {
  const packageJsonPath = path.join(packageDirPath, "package.json");
  const stringSet = await collectPackageNotableStrings(packageJsonPath, false, limit);
  dictToFill[version] = [...stringSet];
}

/**
 * Automatically download packages of different versions (into an auto-remove temp dir) and extract out a string map per version.
 * If a version does not exist, silently fail for that case and continue generate for the rest.
 * @param packageName name of the package (on NPM)
 * @param versions versions of interest to collect. Please ensure they are valid versions
 * @param limit limit to the number of longest strings we should collect.
 */
export async function extractStringsFromPackageVersions(packageName: string, versions: string[], limit = DEFAULT_MAX_NOTABLE_STRING_COUNT_LIMIT): Promise<PackageStringsByVersionMap> {
  const output = {};
  await enterTempDir(async (tempDir) => {
    debug(`Enter temp directory "${tempDir}"`);
    const versionToInstallDirMap = new Map<string, string>();
    debug(`npm load config`);
    await p(npm.load)();
    // await fs.writeFile(path.join(tempDir, ".npmrc"), "yes = true");
    npm.config.set("yes", true); // This is stupid: "-y" flag does not work in the init command: I have to explicitly set it as part of the config (I have to go through the source code to do so...)
    debug(`npm init`);
    await p(npm.commands.init)([]);
    // NPM has a lock thing, so still sequentially install all the packages.
    for (const version of versions) {
      const realPackageName = `${packageName}@${version}`;
      const targetDirName = `${packageName}~${version}`;
      const packageNameToInstall = `${targetDirName}@npm:${realPackageName}`; // NPM alias trick to install multiple packages at the same time.
      debug(`npm install ${packageNameToInstall}`);
      try {
        await p(npm.commands.install)([packageNameToInstall]);
      } catch (e) {
        console.error(`>>> Failed to install ${realPackageName}:`)
        console.log(e);
      }
      const targetDirPath = path.join(tempDir, "node_modules", targetDirName); // We are actually also in the right directory anyways though...
      versionToInstallDirMap.set(version, targetDirPath);
    }
    debug(`Begin scanning for strings in each package.`);
    const parallelScans: Promise<void>[] = [];
    for (const version of versions) {
      if (versionToInstallDirMap.has(version)) {
        parallelScans.push(collectPackageNotableStringsIntoDict(output, versionToInstallDirMap.get(version)!, version, limit));
      }
    }
    await Promise.all(parallelScans);
  }, true); // Set to `true` if you want to auto remove temp directory
  return output;
}

type PackageStringsMatchResult = { [version: string]: number };

/**
 * Test matches of strings inside a bundle across different possible package versions.
 * @param bundleContent 
 * @param stringsByVersion 
 */
export async function matchBundleWithPackageVersionStrings(bundleContent: string, stringsByVersion: PackageStringsByVersionMap): Promise<PackageStringsMatchResult> {
  const bundleStrs = await collectNotableStrings(bundleContent, new Set(), Infinity);
  const output = {};
  for (const version in stringsByVersion) {
    const matchResult = testStringsOnBundleStrings(bundleStrs, new Set(stringsByVersion[version]));
    output[version] = matchResult.matched.size;
  }
  return output;
}

async function main() {
  // const mapOfSources = await collectSourcePathsFromNodeModule("/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/package_analyzer/node_modules/ejs/package.json");
  // console.log(Array.from(mapOfSources.keys()));
  // console.log(await collectPackageNotableStrings("/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/package_analyzer/node_modules/react-slick/package.json"))

  const BUNDLE_16_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/src/package_analyzer/test/bundles/react.16.umd.web.prod.js";
  const BUNDLE_15_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/src/package_analyzer/test/bundles/react.15.umd.web.prod.js";
  const BUNDLE_14_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/src/package_analyzer/test/bundles/react.0.14.umd.web.prod.js";
  const BUNDLE_16 = await fs.readFile(BUNDLE_16_PATH, "utf8");
  const BUNDLE_15 = await fs.readFile(BUNDLE_15_PATH, "utf8");
  const BUNDLE_14 = await fs.readFile(BUNDLE_14_PATH, "utf8");

  const reactStrings = JSON.parse(await fs.readFile("./test/react_strings.json", "utf8"));

  console.log("========== Testing bundle generated by React@16 ==========")
  const result_16_on_16 = await testStringsOnBundle(BUNDLE_16, new Set(reactStrings[16].ReactDOM));
  console.log(">> MATCHED react-dom@16 count", result_16_on_16.matched.size);
  const result_16_on_15 = await testStringsOnBundle(BUNDLE_16, new Set(reactStrings[15].ReactDOM));
  console.log(">> MATCHED react-dom@15 count", result_16_on_15.matched.size);
  const result_16_on_14 = await testStringsOnBundle(BUNDLE_16, new Set(reactStrings[14].React)); // Special: react-dom@0.14 is reexported out of react@0.14
  console.log(">> MATCHED react-dom@0.14 count", result_16_on_14.matched.size);

  console.log("========== Testing bundle generated by React@15 ==========")
  const result_15_on_16 = await testStringsOnBundle(BUNDLE_15, new Set(reactStrings[16].ReactDOM));
  console.log(">> MATCHED react-dom@16 count", result_15_on_16.matched.size);
  const result_15_on_15 = await testStringsOnBundle(BUNDLE_15, new Set(reactStrings[15].ReactDOM));
  console.log(">> MATCHED react-dom@15 count", result_15_on_15.matched.size);
  const result_15_on_14 = await testStringsOnBundle(BUNDLE_15, new Set(reactStrings[14].React)); // Special: react-dom@0.14 is reexported out of react@0.14
  console.log(">> MATCHED react-dom@0.14 count", result_15_on_14.matched.size);

  console.log("========== Testing bundle generated by React@0.14 ==========")
  const result_14_on_16 = await testStringsOnBundle(BUNDLE_14, new Set(reactStrings[16].ReactDOM));
  console.log(">> MATCHED react-dom@16 count", result_14_on_16.matched.size);
  const result_14_on_15 = await testStringsOnBundle(BUNDLE_14, new Set(reactStrings[15].ReactDOM));
  console.log(">> MATCHED react-dom@15 count", result_14_on_15.matched.size);
  const result_14_on_14 = await testStringsOnBundle(BUNDLE_14, new Set(reactStrings[14].React)); // Special: react-dom@0.14 is reexported out of react@0.14
  console.log(">> MATCHED react-dom@0.14 count", result_14_on_14.matched.size);

  // const BUNDLE_16_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/test/webpack_test/dist/main.umd.web.prod.js";
  // const BUNDLE_15_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/test/webpack_test_2/dist/main.umd.web.prod.js";
  // const BUNDLE_14_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/test/webpack_test_3/dist/main.umd.web.prod.js";

  // const SOURCE_16_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/test/webpack_test/node_modules/react/package.json";
  // const SOURCE_15_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/test/webpack_test_2/node_modules/react/package.json";
  // const SOURCE_14_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/test/webpack_test_3/node_modules/react/package.json";
  // const SOURCE_DOM_16_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/test/webpack_test/node_modules/react-dom/package.json";
  // const SOURCE_DOM_15_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/test/webpack_test_2/node_modules/react-dom/package.json";
  // const SOURCE_DOM_14_PATH = "/Users/kun/Desktop/Fall_2020/CS356/Project/test/webpack_test_3/node_modules/react-dom/package.json";

  // const react_16_strings = [...await collectPackageNotableStrings(SOURCE_16_PATH, false, Infinity)];
  // const react_15_strings = [...await collectPackageNotableStrings(SOURCE_15_PATH, false, Infinity)];
  // const react_14_strings = [...await collectPackageNotableStrings(SOURCE_14_PATH, false, Infinity)];
  // const react_dom_16_strings = [...await collectPackageNotableStrings(SOURCE_DOM_16_PATH, false, Infinity)];
  // const react_dom_15_strings = [...await collectPackageNotableStrings(SOURCE_DOM_15_PATH, false, Infinity)];
  // const react_dom_14_strings = [...await collectPackageNotableStrings(SOURCE_DOM_14_PATH, false, Infinity)];
  // const stringJSONObject = {
  //   16: {
  //     React: react_16_strings,
  //     ReactDOM: react_dom_16_strings
  //   },
  //   15: {
  //     React: react_15_strings,
  //     ReactDOM: react_dom_15_strings
  //   },
  //   14: {
  //     React: react_14_strings,
  //     ReactDOM: react_dom_14_strings
  //   }
  // };
  // await fs.writeFile("./test/react_strings.json", JSON.stringify(stringJSONObject, null, 2));

  // console.log("========== Testing bundle generated by React@16 ==========")
  // const result_16_on_16 = await testPackageNotableStringsOnBundle(await fs.readFile(BUNDLE_16_PATH, "utf8"), SOURCE_DOM_16_PATH, false);
  // console.log(">> MATCHED react-dom@16 count", result_16_on_16.matched.size);
  // const result_16_on_15 = await testPackageNotableStringsOnBundle(await fs.readFile(BUNDLE_16_PATH, "utf8"), SOURCE_DOM_15_PATH, false);
  // console.log(">> MATCHED react-dom@15 count", result_16_on_15.matched.size);
  // const result_16_on_14 = await testPackageNotableStringsOnBundle(await fs.readFile(BUNDLE_16_PATH, "utf8"), SOURCE_14_PATH, false); // Special: react-dom@0.14 is reexported out of react@0.14
  // console.log(">> MATCHED react-dom@0.14 count", result_16_on_14.matched.size);

  // console.log("========== Testing bundle generated by React@15 ==========")
  // const result_15_on_16 = await testPackageNotableStringsOnBundle(await fs.readFile(BUNDLE_15_PATH, "utf8"), SOURCE_DOM_16_PATH, false);
  // console.log(">> MATCHED react-dom@16 count", result_15_on_16.matched.size);
  // const result_15_on_15 = await testPackageNotableStringsOnBundle(await fs.readFile(BUNDLE_15_PATH, "utf8"), SOURCE_DOM_15_PATH, false);
  // console.log(">> MATCHED react-dom@15 count", result_15_on_15.matched.size);
  // const result_15_on_14 = await testPackageNotableStringsOnBundle(await fs.readFile(BUNDLE_15_PATH, "utf8"), SOURCE_14_PATH, false); // Special: react-dom@0.14 is reexported out of react@0.14
  // console.log(">> MATCHED react-dom@0.14 count", result_15_on_14.matched.size);

  // console.log("========== Testing bundle generated by React@0.14 ==========")
  // const result_14_on_16 = await testPackageNotableStringsOnBundle(await fs.readFile(BUNDLE_14_PATH, "utf8"), SOURCE_DOM_16_PATH, false);
  // console.log(">> MATCHED react-dom@16 count", result_14_on_16.matched.size);
  // const result_14_on_15 = await testPackageNotableStringsOnBundle(await fs.readFile(BUNDLE_14_PATH, "utf8"), SOURCE_DOM_15_PATH, false);
  // console.log(">> MATCHED react-dom@15 count", result_14_on_15.matched.size);
  // const result_14_on_14 = await testPackageNotableStringsOnBundle(await fs.readFile(BUNDLE_14_PATH, "utf8"), SOURCE_14_PATH, false); // Special: react-dom@0.14 is reexported out of react@0.14
  // console.log(">> MATCHED react-dom@0.14 count", result_14_on_14.matched.size);
}
if (require.main === module) {
  main();
}

// TODO: we need to know which files in node_modules are the most important ones (actual source code)
// We need to use package.json information to tell. https://github.com/babel-utils/babel-collect-imports can be used to grab all necessary internal deps and run resolution logic.