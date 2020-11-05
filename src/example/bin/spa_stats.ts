import { promises as fs } from "fs";
import * as util from "util";
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

  const weirdReactOutput: any[] = [];

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

          // Detection of aberrant React version:
          if (SPA_TYPE === "react" && spaVersion.startsWith("0.")) {
            weirdReactOutput.push(spaInfo[SPA_TYPE]);
          }
        }
      }
    }
  }
  console.log(spaUseCount);
  console.log(spaVersionCount);
  // Logging for weird React version numbers
  if (weirdReactOutput.length > 0) {
    console.log(">>> WEIRD React versions:");
    console.log(util.inspect(weirdReactOutput, {showHidden: false, depth: null}));
  }
}

main().catch(console.error);

/*
>>> WEIRD React versions:
[
  {
    version: '0.2.1',
    reasonURL: 'https://www.economist.com/engassets/_next/static/chunks/ca336c76f79e6301c475d274322d308e34e43749.e0bb5e2268a83ba1540e.js',
    confidence: 1,
    isStatic: true
  },
  {
    version: '0.13.3',
    reasonURL: 'https://www.fbi.gov/++plone++production/++unique++2020-09-16T02:24:29.864787/default.js',
    confidence: 1,
    isStatic: true
  },
  {
    version: '0.0.1',
    reasonURL: 'https://usa.kaspersky.com/gatsby-component---src-wms-templates-page-template-static-jsx-65777fa12df244db4d88.js',
    confidence: 1,
    isStatic: true
  },
  {
    version: '0.8.2',
    reasonURL: 'https://static.zdassets.com/web_widget/latest/vendors~web_widget.ca239eb7094b76c34e1a.chunk.js',
    confidence: 1,
    isStatic: true
  },
  {
    version: '0.13.3',
    reasonURL: 'https://www.rollingstone.com/wp-content/plugins/pmc-plugins/pmc-swiftype/assets/js/SwiftypeComponents.min.js?ver=2.0',
    confidence: 1,
    isStatic: true
  },
  {
    version: '0.13.3',
    reasonURL: 'https://variety.com/wp-content/plugins/pmc-plugins/pmc-swiftype/assets/js/SwiftypeComponents.min.js?ver=2.0',
    confidence: 1,
    isStatic: true
  }
]

Manual investigation:
While others are false positives, all above 0.13.3 are actually the CORRECT react versions they used!

Updated: replacing the scanning with a new strategy, we detect a site using a version as old as 0.10.0:
[
  {
    version: '0.10.0',
    reasonURL: 'https://assets.acs.org/acs-bootstrap/v2.0/js/acs.min.js',
    confidence: 1,
    isStatic: true
  },
  {
    version: '0.13.3',
    reasonURL: 'https://www.fbi.gov/++plone++production/++unique++2020-09-16T02:24:29.864787/default.js',
    confidence: 1,
    isStatic: true
  }
]
*/