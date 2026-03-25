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
          url: "https://answersocrates.com",
          untilLoad: true,
        },
        clientId,
      );
      await this.sleep(3000);

      const inputSelector = 'input[type="text"]#query';
      const buttonSelector = 'button[type="submit"]#submit';

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
      // const tabId = 714164403;

      let output = "";

      const headTextRes = await this.exec(
        "getElements",
        { selector: ".query-container .query-header > div:first-child", tabId },
        clientId,
      );
      const headText = headTextRes.results?.[0] || "";

      const headSvgRes = await this.exec(
        "getElements",
        {
          selector: ".query-container .query-header > div:first-child svg",
          attribute: "class",
          tabId,
        },
        clientId,
      );

      let svgClassVal = "";
      if (headSvgRes.results && headSvgRes.results[0]) {
        svgClassVal =
          typeof headSvgRes.results[0] === "string"
            ? headSvgRes.results[0]
            : JSON.stringify(headSvgRes.results[0]);
      }

      const trending = svgClassVal.includes("-up")
        ? "Trending UP"
        : "Trending Down";

      if (headText) {
        output += `# ${headText.trim()} ${trending}\n\n`;
      }

      const paaItemsRes = await this.exec(
        "getElements",
        {
          selector:
            ".query-container .paa-container h1, .query-container .paa-container li",
          tabId,
        },
        clientId,
      );
      if (paaItemsRes.results && paaItemsRes.results.length > 0) {
        output += paaItemsRes.results.join("\n") + "\n\n";
      }

      const trendsTextRes = await this.exec(
        "getElements",
        { selector: ".query-container .paa-container .trends-card", tabId },
        clientId,
      );
      if (trendsTextRes.results && trendsTextRes.results[0]) {
        output += trendsTextRes.results[0].replaceAll("\n\n", "\n") + "\n\n";
      }

      const extractGridData = async () => {
        const gridRes = await this.exec(
          "query",
          {
            selector: ".query-container .suggestions-grid > .suggestions-card",
            map: { items: "h3, li" },
            multiple: true,
            tabId,
          },
          clientId,
        );

        return (gridRes.results || [])
          .filter((r) => r.items && r.items.length > 0)
          .map((r) => {
            return r.items
              .map((item, index) => (index === 0 ? `### ${item}` : `- ${item}`))
              .join("\n\n");
          })
          .join("\n\n");
      };

      const tabsRes = await this.exec(
        "getElements",
        {
          selector:
            ".query-container .tabs-container > div:not(:first-child) button",
          tabId,
        },
        clientId,
      );
      const tabTexts = tabsRes.results || [];

      for (let i = 0; i < tabTexts.length; i++) {
        const tabName = tabTexts[i];
        const divIndex = i + 2;

        await this.exec(
          "click",
          {
            selector: `.query-container .tabs-container > div:nth-child(${divIndex}) button`,
            tabId,
          },
          clientId,
        );
        await this.sleep(2000);

        const extracted = await extractGridData();
        if (extracted.trim()) {
          output += `## Tab: ${tabName}\n\n${extracted}\n\n`;
        }
      }

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
