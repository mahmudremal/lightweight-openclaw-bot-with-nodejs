import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SerpScraper {
  async scrape(keywords) {
    let keywordData = "";
    const keyword = keywords[0] || "Topic";

    const ahrefsPath = path.resolve(__dirname, "../../../../../keyword-planner/scripts/ahrefs.js");
    const googlePath = path.resolve(__dirname, "./google.js");

    if (fs.existsSync(ahrefsPath)) {
      try {
        const ahrefs = await import(`file://${ahrefsPath}`);
        keywordData = await ahrefs.run(keyword);
      } catch (err) {
        console.error("Error using ahrefs:", err);
      }
    }

    if (!keywordData && fs.existsSync(googlePath)) {
      try {
        const google = await import(`file://${googlePath}`);
        keywordData = await google.run(keyword);
      } catch (err) {
        console.error("Error using google:", err);
      }
    }

    let parsedKeywords = [];
    if (keywordData && typeof keywordData === "string") {
      const lines = keywordData.split("\n").map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (!line.toLowerCase().includes("keyword")) {
          parsedKeywords.push(line.split(",")[0].trim());
        }
      }
    }

    if (!parsedKeywords.length) {
      parsedKeywords = [keyword, `${keyword} tips`, `${keyword} guide`];
    } else {
      parsedKeywords = parsedKeywords.slice(0, 5); // Limit to top 5
    }

    return {
      keywords,
      results: parsedKeywords.map((kw, index) => ({
        title: (index === 0 ? "The Ultimate Guide to " : "Top Tips for ") + kw,
        headings: [
          "Introduction",
          "What is " + kw,
          "Benefits",
          "How to use",
          "Conclusion",
        ],
        wordCount: index === 0 ? 1500 : 1200,
        structure:
          index === 0 ? "Introduction -> Definition -> Benefits -> Steps -> Conclusion" : "Listicle",
      })),
    };
  }
}

export default new SerpScraper();
