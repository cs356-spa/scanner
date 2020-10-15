const path = require('path');

const puppeteer = require("puppeteer");
const { staticScanForSPAFramework, mergeDetectorOutput } = require("./static_detector");
const { dynamicScanForSPAFramework } = require("./dynamic_detector");
const debug = require("debug")("spa");

/**
 * Async wrapper to sleep for a while. Try `await sleep(1000)` to sleep for 1 second.
 * @param {number} ms Milliseconds to sleep.
 * @return {Promise<void>}
 */
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

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

  console.log(mergeDetectorOutput(staticOutput, dynamicOutput));
  debug(`Finish task for ${domain}`);
}

const testDomains = [
  // Angular test targets
  "https://angular.io/",
  // "https://www.delta.com/", // Delta seems to have protection against crawler, causing an infinite redirect to self.
  "https://clarity.design/",
  "https://ng.ant.design/docs/introduce/en",

  // Vue test targets
  "https://vuejs.org/",

  // React test targets
  // Dynamic extension based scan give concrete results (when NOT under headless, and extension is loaded)
  "https://reactjs.org",
  "https://airbnb.com",
  "https://webpack.js.org",
  // (Occasionally, sometimes not working) Only detecting React presence (old versions of React, likely before 0.15.x/15.x)
  "https://facebook.com",

  // Ember test targets
  "https://emberjs.com"
]

async function createCustomBrowser() {
  const customArgs = [
    `--load-extension=${path.resolve("./extensions/react_devtools/")}`
  ];
  const browser = await puppeteer.launch({
    // defaultViewport: null,
    // executablePath: process.env.chrome,
    // headless: false, // WARNING: we have to make it NOT headless to get the extension to work! This is a sad compromise... See https://bugs.chromium.org/p/chromium/issues/detail?id=706008#c5
    ignoreDefaultArgs: ["--disable-extensions"],
    args: customArgs,
  });
  return browser;
}

export async function main() {
  // const browser = await puppeteer.launch();
  const browser = await createCustomBrowser();
  const page = await browser.newPage();
  for (const domain of testDomains) {
    try {
      await runOnPage(page, domain);
    } catch (e) {
      console.log(e);
    }
  }
  debug("Shutting down browser...")
  await browser.close();
}