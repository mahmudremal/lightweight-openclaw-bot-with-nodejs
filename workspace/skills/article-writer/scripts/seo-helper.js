const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: node seo-helper.js <file_path> <main_keyword>");
  process.exit(1);
}

const filePath = path.resolve(args[0]);
const keyword = args[1].toLowerCase();

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, "utf8");
const words = content
  .toLowerCase()
  .split(/\W+/)
  .filter((w) => w.length > 0);
const wordCount = words.length;

const keywordMatches = (
  content.toLowerCase().match(new RegExp(keyword, "g")) || []
).length;
const density = ((keywordMatches / wordCount) * 100).toFixed(2);

console.log(`\n📊 SEO Analysis for: ${path.basename(filePath)}`);
console.log(`──────────────────────────────────────────`);
console.log(`📝 Word Count: ${wordCount}`);
console.log(`🔑 Keyword: "${keyword}"`);
console.log(`📈 Occurrences: ${keywordMatches}`);
console.log(`📉 Density: ${density}% (Target: 0.5% - 2.0%)`);
console.log(`──────────────────────────────────────────`);

if (density < 0.5)
  console.log("⚠️  Keyword density too low. Consider mentioning it more.");
if (density > 2.5)
  console.log("⚠️  Keyword density too high. Avoid keyword stuffing.");
if (wordCount < 1000)
  console.log("⚠️  Article is thin (<1000 words). Expand for better ranking.");
else console.log("✅ Article length is healthy.");
