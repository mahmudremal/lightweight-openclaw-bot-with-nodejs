import http from "http";

const PORT = 8765;

class AnswerSocrates {
  constructor() {
    if (process.argv[1] && process.argv[1].includes("answersocrates.js")) {
      const keyword = process.argv.slice(2).join(" ");
      this.init(keyword);
    }
  }

  request(path, method, data) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "localhost",
          port: PORT,
          path,
          method,
          headers: { "Content-Type": "application/json" },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve(body);
            }
          });
        },
      );
      req.on("error", reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  exec(action, params = {}, id = null) {
    return this.request("/api/browsers/exec", "POST", { id, action, params });
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async init(keyword) {
    const isCLI =
      process.argv[1] && process.argv[1].includes("answersocrates.js");

    if (!keyword) {
      console.log("Usage: node answersocrates.js <keyword>");
      if (isCLI) process.exit(1);
      return null;
    }

    try {
      const clients = await this.request("/api/browsers", "GET");
      if (!clients.length) throw new Error("No browser connected");
      const clientId = clients[0].id;

      console.log(`🔍 Starting keyword research for: ${keyword}`);

      const {
        tab: { id: tabId },
      } = await this.exec(
        "create",
        {
          url: "https://answersocrates.com/deepseek-seo-keyword-research-tool",
          untilLoad: true,
        },
        clientId,
      );
      await this.sleep(3000);

      const inputSelector =
        'main div.max-w-5xl input[name="q"], main div.max-w-5xl input[type="text"]';
      const buttonSelector = 'main div.max-w-5xl button[type="submit"]';

      console.log("✍️ Entering keyword...");
      await this.exec(
        "write",
        {
          selector: inputSelector,
          text: keyword,
          editor: "text",
          // writeThrough: "KeyboardEvent",
          // event: "",
          tabId,
        },
        clientId,
      );
      await this.sleep(1000);

      console.log("🖱️ Clicking search...");
      await this.exec("click", { selector: buttonSelector, tabId }, clientId);

      console.log("⏳ Waiting 30s for AI generation...");
      await this.sleep(31000);

      console.log("📊 Extracting results...");

      const queryParams = {
        selector: "main > div > .max-w-5xl > div > .grid > div",
        map: {
          title: "h3",
          keywords: "li",
        },
        multiple: true,
        tabId,
      };

      const res = await this.exec("query", queryParams, clientId);

      if (res.error) throw new Error(res.error);

      const output = (res.results || [])
        .map((item) => {
          if (!item.title) return null;
          const cleanTitle = item.title?.replace?.(/Copy/i, "")?.trim?.();
          const keywords = item.keywords.join(",\n\t");
          return `${cleanTitle || item.title}\n\t${keywords}`;
        })
        .filter(Boolean)
        .join("\n\n");

      console.log("\n✅ Research Complete:\n");
      console.log(output || "No results found.");

      await this.exec("close", { tabId }, clientId);

      if (isCLI) process.exit(0);
      return output;
    } catch (err) {
      console.error("❌ Error:", err.message);
      if (isCLI) process.exit(1);
      return null;
    }
  }
}

export default new AnswerSocrates();
