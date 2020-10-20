import { promises as fs } from "fs";
import { extractStringsFromPackageVersions } from "../packageUtils";

const USAGE = `Generate and write a dictionary of strings contains in different versions of a package.
The format of output JSON file is { [version: string]: string[] }
Usage:

$ ts-node collect_version_strings.ts [packageName] [versionListDelimitedByComma] [pathToJsonFileToWrite]

# Example
$ ts-node collect_version_strings.ts react 16,15,0.14 ./react_strings.json
`;

function logUsageAndExit() {
  console.log(USAGE);
  process.exit(1);
}

if (process.argv.length < 5) {
  logUsageAndExit();
}

const packageName = process.argv[2];
const packageVersions = process.argv[3].split(",").map(s => s.trim());
if (packageVersions.length === 0 || packageVersions.includes("")) {
  logUsageAndExit();
}
const targetFile = process.argv[4].trim();
if (targetFile === "") {
  logUsageAndExit();
}

async function main(): Promise<void> {
  const output = await extractStringsFromPackageVersions(packageName, packageVersions, Infinity);
  const jsonOutput = JSON.stringify(output, null, 2); // TODO: replace this with JSON.stringify(output) is no formatting is necessary
  await fs.writeFile(targetFile, jsonOutput);
}

main().catch(console.error);