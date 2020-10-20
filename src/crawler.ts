import * as path from 'path';
import { Cluster } from 'puppeteer-cluster';
import { staticScanForSPAFramework, mergeDetectorOutput, SpaDetectorOutput }  from './static_detector';

const { dynamicScanForSPAFramework } = require("./dynamic_detector");
const debug = require("debug")("spa");

async function runOnPage(page, domain) {
  const sources: {url: string, content: string}[] = [];
  page.on("console", msg => {
    // TODO: msg.args() to capture console content
  });
  page.evaluateOnNewDocument(() => {
    // TODO: add code that will be run in the browser context
  });

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
      const content = (await response.text()).toLowerCase();
      sources.push({ url: response.url(), content })
    } catch {
      // console.log(`x Response read failed for ${response.url()}`);
    }
  });

  debug(`Navigating to ${domain}`);
  await page.goto(domain, {waitUntil: "networkidle2"});

  // IMPORTANT: we need to add the HTML after rendering into sources for search (in the Angular case)
  const finalPageContent = await page.content();
  sources.push({ url: domain, content: finalPageContent });
  // TODO: consider forcefully push LICENSE file into list of sources. This requires us to somehow be able to identify URLs to LICENSE files
  // For example, Airbnb will inline URL to LICENSE file: https://a0.muscache.com/airbnb/static/packages/moment-3cf2a832.js, pointing to https://a0.muscache.com/airbnb/static/packages/moment-879e3275.js.LICENSE.txt

  const staticOutput = staticScanForSPAFramework(sources, new URL(domain).hostname);
  const dynamicOutput = await page.evaluate(dynamicScanForSPAFramework);

  debug(`Finish task for ${domain}`);
  return mergeDetectorOutput(staticOutput, dynamicOutput);
}

async function createCustomBrowser() {
  const customArgs = [
    `--load-extension=${path.resolve("./extensions/react_devtools/")}`
  ];
  return {
    // defaultViewport: null,
    // executablePath: process.env.chrome,
    // headless: false, // WARNING: we have to make it NOT headless to get the extension to work! This is a sad compromise... See https://bugs.chromium.org/p/chromium/issues/detail?id=706008#c5
    ignoreDefaultArgs: ["--disable-extensions"],
    args: customArgs,
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
  for (let domain of domains) {
    cluster.queue(async ({ page }) => {
      try {
        results.push({
          domain,
          output: await runOnPage(page, domain)
        });
      } catch (e) {
        console.error(e);
      }
    });
  };

  await cluster.idle();
  debug("Shutting down cluster...")
  await cluster.close();
  debug("Done");

  return results.sort((a, b) => a.domain.localeCompare(b.domain));
}