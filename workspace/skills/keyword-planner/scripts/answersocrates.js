import http from "http";

const PORT = 8765;
const KEYWORD = process.argv.slice(2).join(" ");

if (!KEYWORD) {
  console.log("Usage: node answersocrates.js <keyword>");
  process.exit(1);
}

const request = (path, method, data) => {
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
};

const exec = async (action, params = {}, id = null) => {
  return request("/api/browsers/exec", "POST", { id, action, params });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  try {
    const clients = await request("/api/browsers", "GET");
    if (!clients.length) throw new Error("No browser connected");
    const clientId = clients[0].id;

    console.log(`🔍 Starting keyword research for: ${KEYWORD}`);

    const {
      tab: { id: tabId },
    } = await exec(
      "create",
      {
        url: "https://answersocrates.com/deepseek-seo-keyword-research-tool",
        untilLoad: true,
      },
      clientId,
    );
    await sleep(3000);

    const inputSelector =
      'main div.max-w-5xl input[name="q"], main div.max-w-5xl input[type="text"]';
    const buttonSelector = 'main div.max-w-5xl button[type="submit"]';

    console.log("✍️ Entering keyword...");
    await exec("write", { selector: inputSelector, text: KEYWORD }, clientId);
    await sleep(1000);

    console.log("🖱️ Clicking search...");
    await exec("click", { selector: buttonSelector }, clientId);

    console.log("⏳ Waiting 30s for AI generation...");
    await sleep(31000);

    console.log("📊 Extracting results...");

    // Structured extraction using the safe 'query' action
    const queryParams = {
      selector: "main > div > .max-w-5xl > div > .grid > div",
      map: {
        title: "h3",
        keywords: "li",
      },
      multiple: true, // Keywords are a list
    };

    const res = await exec("query", queryParams, clientId);

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

    await exec("close", { tabId }, clientId);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

run();
