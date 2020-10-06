const puppeteer = require("puppeteer");
const { staticScanForSPA, mergeDetectorOutput } = require("./static_detector");
const { dynamicScanForSPA } = require("./dynamic_detector");
const debug = require("debug")("spa");

async function runOnPage(page, domain) {
  const sources = [];
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

  const staticOutput = staticScanForSPA(sources, new URL(domain).hostname);
  const dynamicOutput = await page.evaluate(dynamicScanForSPA);

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
]

async function main() {
  const browser = await puppeteer.launch();
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

main();