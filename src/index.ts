import { download } from "./top-sites";
import { main } from "./crawler";
import { writeFileSync } from "fs";

(async () => {
  console.log(process.argv);
  const length = process.argv[2] ? Number(process.argv[2]): 10;
  const sites = await download(length);
  console.log(sites.length);

  const results = await main(sites.map(e => `https://${e.Domain}`));
  console.log("Got", results.length, "results");
  writeFileSync('output.json', JSON.stringify(results, null, 2));
})();