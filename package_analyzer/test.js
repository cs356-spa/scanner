const fs = require("fs");
const { parseBundle } = require("./parseUtils");

const TEST_FILES = [
  "./examples/treehacks_2.f3a9833e.chunk.js",
]

// const content = fs.readFileSync(TEST_FILES[0], "utf8");
const parseResult = parseBundle(TEST_FILES[0]);
console.log(Object.keys(parseResult.modules).length);
for (const k in parseResult.modules) {
  if (parseResult.modules[k].includes("slick-carousel")) {
    console.log(k);
  }
}