import { download } from "./top-sites";
import { main } from "./crawler";
import { writeFileSync } from "fs";

(async () => {
  const sites = await download();
  console.log(sites);

  const results = await main(sites.map(e => `https://${e.Domain}`).slice(0, 1000));
  console.log("Got", results.length, "results");
  writeFileSync('output.json', JSON.stringify(results, null, 2));
})();