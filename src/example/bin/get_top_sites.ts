import { promises as fs } from "fs";
import * as yargs from "yargs";
import { getCSVHead } from "../../top-sites";

const argv = yargs
  .usage("Usage: ts-node ./get_top_sites.ts -n [number] -o [string]")
  .example("ts-node ./get_top_sites.ts -n 100 -o ./top_100.csv", "Downloading top 100 sites and save its CSV representation into output file ./top_100.csv")
  .describe("n", "Number of top sites to extract from all data")
  .describe("o", "Output filename")
  .demandOption(["n", "o"])
  .help("h")
  .alias("h", "help")
  .argv;

async function main(): Promise<void> {
  if (!argv.n || !argv.o) {
    return;
  }
  const numRecords = argv.n as number;
  const outputFilename = argv.o as string;
  const data = await getCSVHead(numRecords);
  await fs.writeFile(outputFilename, data);
}

main().catch(console.error);