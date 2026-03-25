import http from "http";

const PORT = 8765;

// console.log(process.argv.slice(2));

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

async function run(keyWord = null) {
  try {
    const KEYWORD = keyWord || process.argv.slice(2).join(" ");

    if (!KEYWORD) {
      console.log("Usage: node ahrefs.js <keyword>");
      return null;
    }

    const clients = await request("/api/browsers", "GET");
    if (!clients.length) throw new Error("No browser connected");
    const clientId = clients[0].id;

    console.log(`🔍 Starting Ahrefs keyword research for: ${KEYWORD}`);

    const {
      tab: { id: tabId },
    } = await exec(
      "create",
      {
        url: "https://ahrefs.com/keyword-generator",
        untilLoad: true,
      },
      clientId,
    );
    await sleep(3000);

    const inputSelector = '#root input[placeholder="Enter keyword"]';

    console.log("✍️ Entering keyword...");
    // Using standard write action instead of manual events, as the automation tools handle React inputs internally
    await exec(
      "write",
      {
        selector: inputSelector,
        text: KEYWORD,
        editor: "text",
        writeThrough: "KeyboardEvent",
        event: "",
        tabId,
      },
      clientId,
    );
    await sleep(1000);

    console.log("🖱️ Submitting search...");
    // Submitting the form (via typical Ahrefs button or fallback)
    await exec(
      "click",
      { selector: "#root form button[type='submit']", tabId },
      clientId,
    );

    console.log("⏳ Waiting for results popup or table...");
    try {
      // Waiting for the modal wrapper or the table
      await exec(
        "waitFor",
        {
          selector:
            ".css-1tt6ytp-contentAfterOpen .css-dy3tow-modalWrapper, .css-1tg7zy2-table",
          state: "visible",
          timeout: 30000,
          tabId,
        },
        clientId,
      );
    } catch (e) {
      console.log("Wait timed out, continuing...");
    }

    await sleep(2000);

    console.log("📊 Extracting Table Data...");

    const extractTable = async () => {
      const rowRes = await exec(
        "query",
        {
          selector: ".css-1tg7zy2-table tr",
          map: { cells: "td,th" },
          multiple: true,
          tabId,
        },
        clientId,
      );

      const rows = (rowRes.results || [])
        .filter((r) => r.cells && r.cells.length > 0)
        .map((r) => r.cells.join(",")) // mapping cells to CSV-like format as in your script
        .join("\n");

      return rows;
    };

    const buttonsMap = await exec(
      "query",
      {
        selector:
          ".css-dy3tow-modalWrapper .css-1mu98kz-inlineRow button[type=submit]",
        map: { text: "span" },
        multiple: true,
        tabId,
      },
      clientId,
    );
    const buttons = buttonsMap
      ? buttonsMap.results.map((r) => r.text.find((t) => t.trim()))
      : [];

    let result = "";
    let initialResults = await extractTable();
    if (initialResults) {
      console.log("Initial extractions ready.");
      result += "# " + buttons[0] + "\n\n" + initialResults + "\n\n";
    }
    await exec(
      "click",
      {
        selector:
          ".css-dy3tow-modalWrapper .css-1mu98kz-inlineRow button[type=submit]:not(.css-eeihp9-textColor)",
        tabId,
      },
      clientId,
    );

    console.log("⏳ Waiting 2s for additional data...");
    await sleep(2000);

    console.log("📊 Extracting Final Table Data...");
    initialResults = await extractTable();
    if (initialResults) {
      result += "# " + buttons[1] + "\n\n" + initialResults + "\n\n";
    }

    console.log("\n✅ Research Complete:\n");
    console.log(result || "No results found.");

    await exec("close", { tabId }, clientId);
    return result || "";
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
    return null;
  }
}

if (process.argv.length >= 2) {
  await run();
  process.exit(0);
}

export { run };
