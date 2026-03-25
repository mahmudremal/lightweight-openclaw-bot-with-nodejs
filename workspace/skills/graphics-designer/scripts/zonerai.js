import http from "http";

const PORT = 8765;

class Zonerai {
  constructor() {
    if (process.argv[1] && process.argv[1].includes("zonerai.js")) {
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
    const isCLI = process.argv[1] && process.argv[1].includes("zonerai.js");
    const keywords = keyword
      .split(" ")
      .map((i) => i.trim())
      .filter(Boolean);

    if (!keywords.length) {
      console.log("Usage: node zonerai.js <keyword>");
      if (isCLI) process.exit(1);
      return null;
    }

    try {
      const clients = await this.request("/api/browsers", "GET");
      if (!clients.length) throw new Error("No browser connected");
      const clientId = clients[0].id;

      console.log(`🔍 Starting operation with: ${keywords.join(", ")}`);

      // const {
      //   tab: { id: tabId },
      // } = await this.exec(
      //   "create",
      //   {
      //     url: `https://zonerai.com/en/image-creator`,
      //     untilLoad: true,
      //   },
      //   clientId,
      // );

      // console.log("⏳ Waiting 10s for page load...");
      // await this.sleep(10000);
      const tabId = 714164755;

      let output = "";

      output = await this.exec(
        "intercept",
        {
          tabId,
          rules: [
            {
              url: "http://localhost:8765/api/web/skills",
              method: "GET",
              // bodyKey: "email",
            },
          ],
          timeout: 30000,
        },
        clientId,
      );

      console.log("\n✅ Research Complete:\n");
      console.log(output || "No results found.");

      // await this.exec("close", { tabId }, clientId);

      if (isCLI) process.exit(0);
      return output;
    } catch (err) {
      console.error("❌ Error:", err.message);
      if (isCLI) process.exit(1);
      return null;
    }
  }
}

export default new Zonerai();
