import * as fs from "fs";
import axios from "axios";

const DOWNLOAD_URL = "http://downloads.majestic.com/majestic_million.csv";
const PATH = "/tmp/million.csv";

const getCSV = async () => {
  if (fs.existsSync(PATH)) {
    return fs.readFileSync(PATH);
  }
  const {data} = await axios.get(DOWNLOAD_URL);
  fs.writeFileSync(PATH, data);
  return data;
}

export const download = async () => {
  return String(await getCSV());
}