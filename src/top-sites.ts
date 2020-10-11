import * as fs from "fs";
import axios from "axios";
import * as Papa from "papaparse";

const DOWNLOAD_URL = "http://downloads.majestic.com/majestic_million.csv";
const PATH = "/tmp/million.csv";

interface TopWebsiteData {
  GlobalRank: string;
  Domain: string;
  RefSubNets: string;
  IDN_Domain: string;
  PrevGlobalRank: string;
  PrevRefSubNets: string;
  TldRank: string;
  TLD: string;
  RefIPs: string;
  IDN_TLD: string;
  PrevTldRank: string;
  PrevRefIPs: string;
}

/**
 * Gets the raw CSV of all sites from the
 * Majestic Million list (response is cached).
 */
export const getCSV = async () => {
  if (fs.existsSync(PATH)) {
    return fs.readFileSync(PATH);
  }
  const {data} = await axios.get(DOWNLOAD_URL);
  fs.writeFileSync(PATH, data);
  return data;
}

/**
 * Gets and parses top site data.
 */
export const download = async () => {
  console.log(String(await getCSV()).substring(0, 1000));
  return Papa.parse(String(await getCSV()), {header: true}).data as TopWebsiteData[];
}