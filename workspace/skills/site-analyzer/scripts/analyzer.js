import https from "https";
import http from "http";
import fs from "fs";
import path from "path";

const request = (method, urlStr, headers, data) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === "https:" ? https : http;
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let body = [];
        res.on("data", (chunk) => body.push(chunk));
        res.on("end", () => {
          const buffer = Buffer.concat(body);
          const contentType = res.headers["content-type"] || "";
          if (contentType.includes("application/json")) {
            try {
              resolve(JSON.parse(buffer.toString()));
            } catch {
              resolve(buffer.toString());
            }
          } else {
            resolve(buffer);
          }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(typeof data === "string" ? data : JSON.stringify(data));
    req.end();
  });
};

class SiteAnalyzer {
  constructor() {
    this.secretsFile = "./secrets.json";
    this.secrets = fs.existsSync(this.secretsFile) ? JSON.parse(fs.readFileSync(this.secretsFile)) : null;
    this.args = process.argv.slice(2).reduce((acc, arg) => {
      const [key, value] = arg.split("=");
      acc[key.replace("--", "")] = value || true;
      return acc;
    }, {});
    
    if (Object.keys(this.args).length > 0) this.execute();
  }

  async execute() {
    if (!this.secrets || !this.secrets.api) {
      console.log(JSON.stringify({ error: "API credentials not configured in secrets.json" }));
      return;
    }

    const { baseUrl, token } = this.secrets.api;
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const { action, site, fields, report, attachment, platform, value } = this.args;

    try {
      if (action === "addSite") {
        if (!site) return console.log(JSON.stringify({ error: "Site required" }));
        const payload = {
          url: site,
          selectedTypes: fields && typeof fields === "string" ? fields.split(",") : ["seo", "performance", "accessibility"],
          source: "api-submit"
        };
        const res = await request("POST", `${baseUrl}/domains`, headers, payload);
        console.log(JSON.stringify(res));

      } else if (action === "get") {
        if (!site) return console.log(JSON.stringify({ error: "Site required" }));
        const domainsRes = await request("GET", `${baseUrl}/domains/my?url=${encodeURIComponent(site)}`, headers);
        const reportsRes = await request("GET", `${baseUrl}/audit-reports?url=${encodeURIComponent(site)}`, headers);
        console.log(JSON.stringify({ domains: domainsRes, reports: reportsRes }));

      } else if (action === "report") {
        if (!site) return console.log(JSON.stringify({ error: "Site required" }));
        if (attachment === "True" || attachment === true) {
          const fileBuffer = await request("GET", `${baseUrl}/audit-reports/download?url=${encodeURIComponent(site)}`, headers);
          const filePath = path.join(process.cwd(), `${site.replace(/[^a-z0-9]/gi, '_')}.pdf`);
          fs.writeFileSync(filePath, fileBuffer);
          console.log(JSON.stringify({ success: true, filePath }));
        } else {
          const reportsRes = await request("GET", `${baseUrl}/audit-reports?url=${encodeURIComponent(site)}`, headers);
          console.log(JSON.stringify(reportsRes));
        }

      } else if (action === "delete") {
        if (!site) return console.log(JSON.stringify({ error: "Site required" }));
        const res = await request("DELETE", `${baseUrl}/domains?url=${encodeURIComponent(site)}`, headers);
        console.log(JSON.stringify(res));

      } else if (action === "contacts") {
        if (!site) return console.log(JSON.stringify({ error: "Site required" }));
        const res = await request("GET", `${baseUrl}/leads?domain=${encodeURIComponent(site)}`, headers);
        console.log(JSON.stringify(res));

      } else if (action === "add-contact") {
        if (!site || !platform || !value) return console.log(JSON.stringify({ error: "Site, platform, and value required" }));
        const payload = { domain: site, platform, value };
        const res = await request("POST", `${baseUrl}/leads`, headers, payload);
        console.log(JSON.stringify(res));

      } else {
        console.log(JSON.stringify({ error: "Invalid action" }));
      }
    } catch (e) {
      console.log(JSON.stringify({ error: e.message }));
    }
  }
}

new SiteAnalyzer();
