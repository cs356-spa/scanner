import { promises as fs } from "fs";
import { extractStringsFromPackageVersions } from "../npmUtils";

const USAGE = `Generate and write a dictionary of strings contains in different versions of a package.
The format of output JSON file is { [version: string]: string[] }
Usage:

$ ts-node collect_version_strings.ts [pathToJsonFileToWrite] [packageName] [versionListDelimitedByComma]

# Example
$ ts-node collect_version_strings.ts ./react_strings.json react 16,15,0.14
`;

function logUsageAndExit() {
  console.log(USAGE);
  process.exit(1);
}

if (process.argv.length < 4) {
  logUsageAndExit();
}

const targetFile = process.argv[2].trim();
if (targetFile === "") {
  logUsageAndExit();
}

async function main(): Promise<void> {
  const packageName = process.argv[3];
  let packageVersions: string[];
  if (process.argv.length < 5) { // No given version, auto select versions
    packageVersions = []; // 30 as an initial test starting point
  } else {
    packageVersions = process.argv[4].split(",").map(s => s.trim());
    if (packageVersions.length === 0 || packageVersions.includes("")) {
      logUsageAndExit();
    }
  }

  const output = await extractStringsFromPackageVersions(packageName, packageVersions, Infinity); 
  const jsonOutput = JSON.stringify(output, null, 2); // TODO: replace this with JSON.stringify(output) is no formatting is necessary
  await fs.writeFile(targetFile, jsonOutput);
}

main().catch(console.error);