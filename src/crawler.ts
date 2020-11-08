import * as fs from "fs";
import { Cluster } from 'puppeteer-cluster';
import { staticScanForSPAFramework, mergeDetectorOutput, SpaDetectorOutput, isBundledFileStrict }  from './static_detector';
import { parseCSV } from "./top-sites";

const { dynamicScanForSPAFramework } = require("./dynamic_detector");
const debug = require("debug")("spa");

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const DEBUG_DISPLAY_NUM_SITES_WITH_BUNDLE = true;
let numSitesWithBundle = 0;

async function runOnPage(page, domain) {
  const sources: {url: string, content: string}[] = [];
  page.on("console", msg => {
    // TODO: msg.args() to capture console content
  });
  // page.evaluateOnNewDocument(() => {
  //   // TODO: add code that will be run in the browser context
  // });

  await page.setRequestInterception(true);
  page.on("request", async request => {
    try {
      if (request.isNavigationRequest() && request.redirectChain().length > 10) { // prevent too many redirects failure.
        await request.abort();
      } else {
        await request.continue();
      }
    } catch {}
  });

  // await page.setRequestInterception(true); // Used to inject custom scripts
  page.on("response", async response => {
    try {
      const content = await response.text(); // .toLowerCase(); // Don't do this!!!
      sources.push({ url: response.url(), content })
    } catch {
      // console.log(`x Response read failed for ${response.url()}`);
    }
  });

  debug(`Navigating to ${domain}`);
  // Racing between networkidle2 and a given timeout. If wait for TOO long, page explodes under puppeteer...
  await Promise.race([page.goto(domain, {waitUntil: "networkidle2"}), sleep(10000)])
  // await page.goto(domain, {waitUntil: "networkidle2"});

  // IMPORTANT: we need to add the HTML after rendering into sources for search (in the Angular case)
  try {
    // TODO: mysterious error keeps popping up:
    // Error: Execution context was destroyed, most likely because of a navigation.
      // at rewriteError (/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/node_modules/puppeteer/lib/cjs/puppeteer/common/ExecutionContext.js:261:23)
      // at runMicrotasks (<anonymous>)
      // at processTicksAndRejections (internal/process/task_queues.js:93:5)
      // at ExecutionContext._evaluateInternal (/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/node_modules/puppeteer/lib/cjs/puppeteer/common/ExecutionContext.js:215:61)
      // at ExecutionContext.evaluate (/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/node_modules/puppeteer/lib/cjs/puppeteer/common/ExecutionContext.js:106:16)
      // at DOMWorld.content (/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/node_modules/puppeteer/lib/cjs/puppeteer/common/DOMWorld.js:115:16)
      // at Page.content (/Users/kun/Desktop/Fall_2020/CS356/Project/scanner/node_modules/puppeteer/lib/cjs/puppeteer/common/Page.js:819:16)
    // const finalPageContent = await page.content();
    // console.log(await page.evaluate(function () { console.log("HI"); return window.location.href }));
    // const finalPageContent = await page.evaluate(function () { return document.documentElement.outerHTML; });
    const finalPageContent = await page.content();
    sources.push({ url: domain, content: finalPageContent });
  } catch (_e) {
    console.log(`>>> Content Error for ${domain}`);
  }
  // TODO: consider forcefully push LICENSE file into list of sources. This requires us to somehow be able to identify URLs to LICENSE files
  // For example, Airbnb will inline URL to LICENSE file: https://a0.muscache.com/airbnb/static/packages/moment-3cf2a832.js, pointing to https://a0.muscache.com/airbnb/static/packages/moment-879e3275.js.LICENSE.txt

  const staticOutput = staticScanForSPAFramework(sources, new URL(domain).hostname);
  // Catch the potential case where dynamic evaluation fails.
  const dynamicOutput = await page.evaluate(dynamicScanForSPAFramework).catch(() => ({}));

  if (DEBUG_DISPLAY_NUM_SITES_WITH_BUNDLE) {
    const hasBundledFile = sources.reduce((acc, s) => acc || isBundledFileStrict(s), false);
    if (hasBundledFile) {
      numSitesWithBundle++;
    }
  }

  debug(`Finish task for ${domain}`);
  const output = mergeDetectorOutput(staticOutput, dynamicOutput);

  try {
    // Kill the page when necessary. This is required to allow a clear profile when navigating to the next page.
    // page.evaluate also has the change of failure similar to above.
    await page.evaluate(() => window.stop());
  } catch (_e) {}

  return output;
}

async function createCustomBrowser() {
  const customArgs = [
    '--disable-dev-shm-usage',
    '--no-sandbox',
    // `--load-extension=${path.resolve("./extensions/react_devtools/")}`
  ];
  return {
    // defaultViewport: null,
    // executablePath: process.env.chrome,
    headless: true, // WARNING: we have to make it NOT headless to get the extension to work! This is a sad compromise... See https://bugs.chromium.org/p/chromium/issues/detail?id=706008#c5
    // ignoreDefaultArgs: ["--disable-extensions"],
    args: customArgs,
    product: 'chrome',
    executablePath: 'google-chrome-stable'
  };
}

export async function main(domains: string[]) {
  const browserArgs = await createCustomBrowser();
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 50,
    puppeteerOptions: browserArgs
  });
  console.log('starting browser...');

  const results: {domain: string, output: SpaDetectorOutput}[] = [];
  for (let i in domains) {
    const domain = domains[i];
    cluster.queue(async ({ page }) => {
      try {
        results.push({
          domain,
          output: await runOnPage(page, domain)
        });
        console.log(domain, i, domains.length);
      } catch (e) {
        console.error(`>>> on domain "${domain}"`, e);
      }
    });
  };

  await cluster.idle();
  debug("Shutting down cluster...")
  await cluster.close();
  debug("Done");

  if (DEBUG_DISPLAY_NUM_SITES_WITH_BUNDLE) {
    console.log(`>>> ${numSitesWithBundle}/${domains.length} sites has bundled file`);
  }

  return results.sort((a, b) => a.domain.localeCompare(b.domain));
}

/**
 * Using this comparison, we can use this file both as a module AND as a running file.
 * Usage: ts-node ./crawler.ts ./example/top_100.csv
 */
if (require.main === module) {
  if (process.argv.length < 3) {
    console.error("Error: please provide filename of domains");
  }
  const domainCSVFilename = process.argv[2];
  const domainCSVRawContent = fs.readFileSync(domainCSVFilename, "utf8");
  const domains = parseCSV(domainCSVRawContent);

  // TODO: implement read csv file. need PR master merge.
  const result = main(domains.map(d => `http://${d.Domain}`));
  result.then(res => {
    console.log(`>>> In total ${res.length} sites successfully scanned to some extent`);
  })
}