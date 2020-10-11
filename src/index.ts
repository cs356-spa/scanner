import { download } from "./top-sites";

(async () => {
  const sites = await download();
  console.log(sites);
})();