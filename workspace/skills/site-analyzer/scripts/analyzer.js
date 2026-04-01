import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { URL, URLSearchParams, fileURLToPath } from "url";

import domain from "./analysis-parts/domain.js";
import leads from "./analysis-parts/leads.js";
import calendar from "./analysis-parts/calendar.js";
import communication from "./analysis-parts/communication.js";
import others from "./analysis-parts/others.js";

const parts = { ...domain, ...leads, ...calendar, ...communication, ...others };

class SiteAnalyzer {
  constructor() {
    this.secretsFile = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "secrets.json",
    );
    this.secrets = JSON.parse(fs.readFileSync(this.secretsFile, "utf8"));
    this.args = process.argv.slice(2).reduce((acc, arg) => {
      const [key, value] = arg.split("=");
      acc[key.replace("--", "")] = value === undefined ? true : value;
      return acc;
    }, {});
    if (this.args.action) this.run();
  }

  async run() {
    const { action } = this.args;
    if (!parts[action]) {
      console.error(JSON.stringify({ error: `Action ${action} not found` }));
      return;
    }
    this.processDates();
    try {
      const config = parts[action](this.args);
      let res = await this.request(
        config.method,
        config.path,
        config.body,
        config.query,
      );
      if (res && res.error === "Unauthorized") {
        await this.login();
        res = await this.request(
          config.method,
          config.path,
          config.body,
          config.query,
        );
      }
      if (config.process) res = await config.process(res);
      console.log(JSON.stringify(res, null, 2));
    } catch (e) {
      console.error(JSON.stringify({ error: e.message }));
    }
  }

  processDates() {
    const dateFields = [
      "startTime",
      "endTime",
      "start",
      "end",
      "scheduleDate",
      "created_at",
      "updated_at",
    ];
    dateFields.forEach((f) => {
      if (this.args[f]) this.args[f] = this.parseDate(this.args[f]);
    });
  }

  parseDate(str) {
    if (!isNaN(str)) return parseInt(str);
    const getBase = () => new Date();
    if (str === "today")
      return Math.floor(getBase().setHours(0, 0, 0, 0) / 1000);
    if (str === "tomorrow") {
      const d = getBase();
      d.setDate(d.getDate() + 1);
      return Math.floor(d.setHours(0, 0, 0, 0) / 1000);
    }
    if (str === "yesterday") {
      const d = getBase();
      d.setDate(d.getDate() - 1);
      return Math.floor(d.setHours(0, 0, 0, 0) / 1000);
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? str : Math.floor(d.getTime() / 1000);
  }

  async login() {
    const res = await this.request("POST", "/auth/login", {
      email: this.secrets.email,
      password: this.secrets.password,
    });
    if (res.token) {
      this.secrets.token = res.token;
      fs.writeFileSync(this.secretsFile, JSON.stringify(this.secrets, null, 2));
    } else {
      throw new Error("Login failed");
    }
  }

  async executeAction(action) {
    const config = parts[action](this.args);
    return this.request(config.method, config.path, config.body, config.query);
  }

  request(method, path, body, query) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.secrets.baseUrl + path);
      if (query)
        Object.entries(query).forEach(
          ([k, v]) => v && url.searchParams.append(k, v),
        );
      const client = url.protocol === "https:" ? https : http;
      const headers = { "Content-Type": "application/json" };
      if (this.secrets.token)
        headers["Authorization"] = `Bearer ${this.secrets.token}`;

      const req = client.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname + url.search,
          method,
          headers,
          rejectUnauthorized: false,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode === 401) resolve({ error: "Unauthorized" });
              else resolve(parsed);
            } catch {
              resolve(data);
            }
          });
        },
      );
      req.on("error", reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
}

new SiteAnalyzer();
