import http from "http";

const PORT = 8765;

class Ubersuggest {
  constructor() {
    if (process.argv[1] && process.argv[1].includes("ubersuggest.js")) {
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
    const isCLI = process.argv[1] && process.argv[1].includes("ubersuggest.js");
    const keywords = keyword
      .split(" ")
      .map((i) => i.trim())
      .filter(Boolean);

    if (!keywords.length) {
      console.log("Usage: node ubersuggest.js <keyword>");
      if (isCLI) process.exit(1);
      return null;
    }

    try {
      const clients = await this.request("/api/browsers", "GET");
      if (!clients.length) throw new Error("No browser connected");
      const clientId = clients[0].id;

      console.log(`🔍 Starting keyword research for: ${keywords.join(", ")}`);

      const {
        tab: { id: tabId },
      } = await this.exec(
        "create",
        {
          url: `https://app.neilpatel.com/en/ubersuggest/keyword_ideas/?ai-keyword=${keywords[0]}&domain=&extraKeywords=${keywords.slice(1).join("%20")}&keyword=${keywords[0]}&lang=en&locId=0000&mode=keyword`,
          untilLoad: true,
        },
        clientId,
      );

      console.log("⏳ Waiting 15s for results...");
      await this.sleep(15000);

      console.log("📊 Extracting results...");

      const extractTable = async () => {
        const rowRes = await this.exec(
          "query",
          {
            selector:
              "#table-container table thead tr, #table-container table tbody tr",
            map: { cells: "td,th" },
            multiple: true,
            tabId,
          },
          clientId,
        );

        if (rowRes.error) {
          console.error("Table extraction error:", rowRes.error);
          return "";
        }

        const rows = (rowRes.results || [])
          .filter((r) => r.cells && r.cells.length > 0)
          .map((r) => {
            let cells = r.cells;
            if (cells.length > 2) {
              cells = cells.slice(1);
            }
            return cells
              .join(", ")
              .replaceAll("CopyResultsAdd toAI Writer", "");
          })
          .filter(Boolean)
          .join("\n");

        return rows;
      };

      let output = "";
      let maxPages = 10;
      let currentPage = 0;

      while (currentPage < maxPages) {
        currentPage++;
        const pageData = await extractTable();
        if (pageData) {
          output += (output ? "\n" : "") + pageData;
        }

        const nextReq = await this.exec(
          "query",
          {
            selector: '[data-testid="pagination-arrow-right"]:not([disabled])',
            tabId,
          },
          clientId,
        );

        if (nextReq.results && nextReq.results.length > 0) {
          await this.exec(
            "click",
            { selector: '[data-testid="pagination-arrow-right"]', tabId },
            clientId,
          );
          await this.sleep(1500);
        } else {
          break;
        }
      }

      output = output
        .replaceAll(", ,", "")
        .replaceAll("  ,\n", "\n")
        .replaceAll("\n\n", "\n");

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

export default new Ubersuggest();
