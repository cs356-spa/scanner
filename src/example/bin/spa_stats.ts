import { promises as fs } from "fs";
import * as yargs from "yargs";
import { parseCSV } from "../../top-sites";
import { main as crawl } from "../../crawler";
import { SPA_TYPES, SpaType } from "../../static_detector";

require('util').inspect.defaultOptions.depth = null

const argv = yargs
  .usage("Usage: ts-node ./spa_stats.ts -i [string]")
  .example("ts-node /spa_stats.ts -i ./top_100.csv", "Run CSV version scanning on sites in ./top_100.csv")
  .describe("i", "Filename of input top website CSV file")
  .demandOption(["i"])
  .help("h")
  .alias("h", "help")
  .argv;

function maybeWrapProtocol(domain: string): string {
  if (!domain.startsWith("http:") && !domain.startsWith("https:")) {
    return "http://" + domain;
  }
  return domain;
}

async function main(): Promise<void> {
  if (!argv.i) {
    return;
  }
  const inputFilename = argv.i as string;
  const rawData = await fs.readFile(inputFilename, "utf8");
  const sites = parseCSV(rawData);
  const perSiteOutputs = await crawl(sites.map(site => maybeWrapProtocol(site.Domain)));

  const spaUseCount: {[spaName in SpaType]: number} = {
    "react": 0,
    "angular": 0,
    "angularjs": 0,
    "vue": 0,
  };
  const spaVersionCount: {[spaName in SpaType]: Map<string, number>}  = {
    "react": new Map(),
    "angular": new Map(),
    "angularjs": new Map(),
    "vue": new Map(),
  };
  
  console.log(perSiteOutputs);
  console.log(perSiteOutputs.length);
  for (const spaOutput of perSiteOutputs) {
    const spaInfo = spaOutput.output;
    for (const SPA_TYPE of SPA_TYPES) {
      // Add to count if framework detected
      if (SPA_TYPE in spaInfo) {
        spaUseCount[SPA_TYPE] = (spaUseCount[SPA_TYPE] || 0) + 1;
        if (spaInfo[SPA_TYPE].version) {
          const spaVersion = spaInfo[SPA_TYPE].version;
          // JS Map has janky API design...
          if (!spaVersionCount[SPA_TYPE].has(spaVersion)) {
            spaVersionCount[SPA_TYPE].set(spaVersion, 0);
          }
          spaVersionCount[SPA_TYPE].set(spaVersion, spaVersionCount[SPA_TYPE].get(spaVersion)! + 1);
        }
      }
    }
  }
  console.log(spaUseCount);
  console.log(spaVersionCount);
}

main().catch(console.error);