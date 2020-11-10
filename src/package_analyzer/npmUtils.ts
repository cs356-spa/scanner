import { debug } from "console";
import path from "path";
import { PackageStringsByVersionMapWithInfo, PackageStringsByVersionMap, collectPackageNotableStringsIntoDict, DEFAULT_MAX_NOTABLE_STRING_COUNT_LIMIT } from "./packageUtils";
import { enterTempDir } from "./util";
import * as npm from "npm";
import { promisify as p } from "util";

/**
 * Query NPM to extract a list of versions of a package that we should build string map for.
 * @param packageName name of the package
 * @param versionCountLimit number of versions we are expecting to build a map from
 * @param ignoreAlphaBetaRc Whether to ignore packages with alpha/beta/rc in their name (e.g. this happens a lot for webpack)
 */
export async function extractVersionsToSample(packageName: string, versionCountLimit: number = Infinity, ignoreAlphaBetaRc = true) {
  debug(`npm load config`);
  // await p(npm.load)();
  const output = (await p(npm.commands.view)([packageName, "versions", "--json"])) as object;
  // output format: { [latest_version]: { versions: [list of versions] } }
  let originalVersions: string[] = [];
  for (const k in output) {
    if (output[k].versions && Array.isArray(output[k].versions)) {
      originalVersions.push(...(output[k].versions as string[]));
    }
  }
  // We will assume that originalVersions does go with the order of the releases
  if (ignoreAlphaBetaRc) {
    originalVersions = originalVersions.filter(v => !v.includes("alpha") && !v.includes("beta") && !v.includes("rc"));
  }

  if (versionCountLimit < originalVersions.length) {
    const stepSize = Math.floor(originalVersions.length / versionCountLimit);
    const outputVersions: string[] = [];
    let i = 0;
    while (outputVersions.length < versionCountLimit && i < originalVersions.length) {
      outputVersions.push(originalVersions[i]);
      i += stepSize;
    }
    return outputVersions;
  } else {
    return originalVersions;
  }
}

export async function extractStringsFromPackage(packageName: string, versionCountLimit: number = Infinity, ignoreAlphaBetaRc = true, limit = DEFAULT_MAX_NOTABLE_STRING_COUNT_LIMIT): Promise<PackageStringsByVersionMapWithInfo> {
  const versions = await extractVersionsToSample(packageName, versionCountLimit, ignoreAlphaBetaRc);
  return await extractStringsFromPackageVersions(packageName, versions, limit);
}

/**
 * Automatically download packages of different versions (into an auto-remove temp dir) and extract out a string map per version.
 * If a version does not exist, silently fail for that case and continue generate for the rest.
 * @param packageName name of the package (on NPM)
 * @param versions versions of interest to collect. Please ensure they are valid versions
 * @param limit limit to the number of longest strings we should collect.
 */
export async function extractStringsFromPackageVersions(packageName: string, versions: string[] = [], limit = DEFAULT_MAX_NOTABLE_STRING_COUNT_LIMIT): Promise<PackageStringsByVersionMapWithInfo> {
  const versionsOutput: PackageStringsByVersionMap = {};
  const installedVersions: string[] = []; // some versions can fail unfortunately...
  await enterTempDir(async (tempDir) => {
    debug(`Enter temp directory "${tempDir}"`);
    const versionToInstallDirMap = new Map<string, string>();
    debug(`npm load config`);
    await p(npm.load)();
    // await fs.writeFile(path.join(tempDir, ".npmrc"), "yes = true");
    npm.config.set("yes", true); // This is stupid: "-y" flag does not work in the init command: I have to explicitly set it as part of the config (I have to go through the source code to do so...)
    npm.config.set("no-optional", true);
    npm.config.set("ignore-scripts", true); // Ignore postinstall build scripts... e.g. old jquery uses jsdom that uses a bad version of contextify that no longer builds
    debug(`npm init`);
    await p(npm.commands.init)([]);
    if (versions.length == 0) {
      versions = await extractVersionsToSample(packageName, Infinity, true); // TODO: change this Infinity to other values if we want to create a smaller sample.
    }
    // NPM has a lock thing, so still sequentially install all the packages.
    for (const version of versions) {
      const realPackageName = `${packageName}@${version}`;
      const targetDirName = `${packageName}~${version}`;
      const packageNameToInstall = `${targetDirName}@npm:${realPackageName}`; // NPM alias trick to install multiple packages at the same time.
      debug(`npm install ${packageNameToInstall}`);
      try {
        await p(npm.commands.install)([packageNameToInstall]);
        installedVersions.push(version); // Only for installed case do we handle the version.
        const targetDirPath = path.join(tempDir, "node_modules", targetDirName); // We are actually also in the right directory anyways though...
        versionToInstallDirMap.set(version, targetDirPath);
      } catch (e) {
        console.error(`>>> Failed to install ${realPackageName}:`)
        console.log(e);
      }
    }
    debug(`Begin scanning for strings in each package.`);
    const parallelScans: Promise<void>[] = [];
    for (const version of versions) {
      if (versionToInstallDirMap.has(version)) {
        parallelScans.push(collectPackageNotableStringsIntoDict(versionsOutput, versionToInstallDirMap.get(version)!, version, limit));
      }
    }
    await Promise.all(parallelScans);
  }, true); // Set to `true` if you want to auto remove temp directory
  return {
    packageName,
    versionOrder: installedVersions,
    versions: versionsOutput,
  }
}