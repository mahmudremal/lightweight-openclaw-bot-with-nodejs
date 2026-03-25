import https from "https";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const secretsPath = join(__dirname, "secrets.json");

class BingWebMaster {
  constructor() {
    this.secretsPath = secretsPath;
    this.secrets = fs.existsSync(this.secretsPath)
      ? JSON.parse(fs.readFileSync(this.secretsPath, "utf-8"))
      : {};
    this.apiKey = this.secrets?.bing?.webmaster_api_key;
    
    // Fallback if inside a different folder structure
    if (!this.apiKey && fs.existsSync("./secrets.json")) {
        const rootSecrets = JSON.parse(fs.readFileSync("./secrets.json", "utf-8"));
        this.apiKey = rootSecrets?.bing?.webmaster_api_key;
    }
  }

  async run(keyword = null) {
    try {
      const KEYWORD = keyword || process.argv.slice(2).join(" ");
      if (!KEYWORD) {
        console.log("Usage: node bing-webmasters.js <keyword>");
        process.exit(1);
      }

      if (!this.apiKey) {
        console.log("❌ Error: Bing Webmaster API key not found in secrets.json");
        process.exit(1);
      }

      console.log(`🔍 Starting Bing Webmaster keyword research for: ${KEYWORD}`);

      const url = `https://ssl.bing.com/webmaster/api.svc/json/GetKeywordStats?q=${encodeURIComponent(KEYWORD)}&country=us&language=en-US&apikey=${this.apiKey}`;

      const res = await this.request(url);
      
      console.log("\n✅ Research Complete:\n");
      const results = this.formatResults(res, KEYWORD);
      console.log(results);

      return results;
    } catch (e) {
      console.error("❌ Error:", e.message);
      if (!keyword) process.exit(1);
      return null;
    }
  }

  request(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`API Error ${res.statusCode}: ${body}`));
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      }).on("error", reject);
    });
  }

  formatResults(data, keyword) {
    if (data && data.d) data = data.d;
    if (!data) return "No data found.";
    
    // If it's returning the standard array of weekly historic data
    if (Array.isArray(data)) {
        let totalImpressions = 0;
        let rows = data.map(item => {
            const date = item.Date || item.Time || "";
            const imps = item.Impressions || item.SearchVolume || 0;
            totalImpressions += parseInt(imps) || 0;
            return `Date: ${date} | Impressions: ${imps}`;
        });
        rows.unshift(`Total Impressions: ${totalImpressions}\n`);
        return rows.join("\n");
    }
    
    return JSON.stringify(data, null, 2);
  }
}

const bingWebMaster = new BingWebMaster();

if (process.argv[1] && process.argv[1].includes("bing-webmasters.js")) {
  bingWebMaster.run();
}

export default bingWebMaster;
