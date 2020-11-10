import { writeFileSync } from "fs";
import { readFileSync } from "fs";

const domains = JSON.parse(readFileSync(__dirname + "/output.json").toString());

const domainsNoneDetected = domains.filter(e => Object.keys(e.output).length === 0);
const domainsDetected = domains.filter(e => Object.keys(e.output).length > 0);

const packages = {};
const packageTotals = {};

for (let domain of domainsDetected) {
  for (let packageName in domain.output) {
    const packageDetails = domain.output[packageName];
    if (!packages[packageName]) packages[packageName] = {};
    if (!packageTotals[packageName]) packageTotals[packageName] = 0;
    if (!packages[packageName][packageDetails.version]) packages[packageName][packageDetails.version] = 0;
    packages[packageName][packageDetails.version]++;

    packageTotals[packageName]++;
  }
}

// const stats = `
// Total domains: ${domains.length}
// Domains without versions: ${domainsNoneDetected.length}
// Domains with versions: ${domainsDetected.length}
// ${JSON.stringify(packageTotals, null, 2)}
// ${JSON.stringify(packages, null, 2)}
// `;

const stats = {
  totalDomains: domains.length,
  domainsNoneDetected: domainsNoneDetected.length,
  domainsDetected: domainsDetected.length,
  packageTotals,
  packages
};

writeFileSync(__dirname + "/stats.json", JSON.stringify(stats, null, 2));


packages["react"].total = Object.values(packages["react"]).reduce((a: number, b: number) => a + b, 0);
const reactVersions = Object.keys(packages["react"]).map(e => ({version: e, count: packages['react'][e]}) ).sort((a, b) => b.count - a.count);
console.log(reactVersions);

const latex = `\\begin{tabular}{ll}
\\hline
\\multicolumn{1}{|l|}{Package name} & \\multicolumn{1}{l|}{Total} \\\\ \\hline
${reactVersions.map(e => `\\multicolumn{1}{|l|}{${e.version}} & \\multicolumn{1}{l|}{${e.count}} \\\\ \\hline`).join("\n")}
\\end{tabular}
`;

// console.log(latex);