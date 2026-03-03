import http from "http";

const PORT = 8765;
const KEYWORD = process.argv.slice(2).join(" ");

if (!KEYWORD) {
  console.log("Usage: node keyword-surfer.js <keyword>");
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

    console.log(`🔍 Searching Google for: ${KEYWORD}`);

    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(KEYWORD)}`;
    const {
      tab: { id: tabId },
    } = await exec("create", { url: googleUrl, untilLoad: true }, clientId);
    await sleep(5000);

    const sidebar = "keyword-surfer-sidebar.keyword-surfer";
    console.log("⏳ Waiting for Keyword Surfer sidebar...");
    await exec(
      "waitFor",
      { selector: sidebar, state: "visible", timeout: 30000 },
      clientId,
    );
    await sleep(2000);

    console.log("📊 Extracting Table Data...");

    const finalResults = [];

    // Header extraction
    const headerRes = await exec(
      "getElements",
      {
        selector: `${sidebar} table.table-auto tr th:not(:first-child)`,
      },
      clientId,
    );
    finalResults.push((headerRes.results || []).join(", "));

    const nextBtnSelector = `${sidebar} table.table-auto + div > button:last-child:not(:disabled)`;

    let page = 1;
    while (page <= 5) {
      // Row extraction
      const rowRes = await exec(
        "query",
        {
          selector: `${sidebar} table.table-auto tr`,
          map: { cells: "td:not(:first-child)" },
          multiple: true,
        },
        clientId,
      );

      const rows = (rowRes.results || [])
        .filter((r) => r.cells.length > 0)
        .map((r) => r.cells.join(", "))
        .join("\n");

      if (rows) finalResults.push(rows);

      // Check for next button and click
      const nextBtnCheck = await exec(
        "getElements",
        { selector: nextBtnSelector },
        clientId,
      );
      if (!nextBtnCheck.results || nextBtnCheck.results.length === 0) break;

      console.log(`⏭️ Moving to page ${page + 1}...`);
      await exec("click", { selector: nextBtnSelector }, clientId);
      await sleep(2000);
      page++;
    }

    console.log("\n✅ Research Complete:\n");
    console.log(finalResults.join("\n"));

    await exec("close", { tabId }, clientId);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

run();
