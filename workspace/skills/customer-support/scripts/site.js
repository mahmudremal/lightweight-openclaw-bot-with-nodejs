import http from "http";
import fs from "fs";

const request = (url, method, data) => {
  return new Promise((resolve, reject) => {
    const { hostname, path, port } = url;
    const req = http.request(
      {
        hostname: hostname || "localhost",
        port: port || 80,
        path,
        method,
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(JSON.parse(body)));
      },
    );
    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

class Site {
  constructor() {
    this.secrets = fs.existsSync("./secrets.json") ? JSON.parse(fs.readFileSync("./secrets.json")) : {};
    this.args = process.argv.slice(2).reduce((acc, arg) => {
      const [key, value] = arg.split("=");
      acc[key.replace("--", "")] = value;
      return acc;
    }, {});
    if (Object.keys(this.args).length > 0) this.init();
  }

  async init() {
    const { action, id, data } = this.args;
    try {
      if (action === "getTicket") {
        const res = await this.dummyRequest("GET", `/wp-json/support/v1/tickets/${id}`);
        console.log(JSON.stringify(res));
      } else if (action === "createTicket") {
        const res = await this.dummyRequest("POST", `/wp-json/support/v1/tickets`, data ? JSON.parse(data) : {});
        console.log(JSON.stringify(res));
      } else if (action === "updateTicket") {
        const res = await this.dummyRequest("PUT", `/wp-json/support/v1/tickets/${id}`, data ? JSON.parse(data) : {});
        console.log(JSON.stringify(res));
      } else if (action === "deleteTicket") {
        const res = await this.dummyRequest("DELETE", `/wp-json/support/v1/tickets/${id}`);
        console.log(JSON.stringify(res));
      } else {
        console.log(JSON.stringify({ error: "Invalid action" }));
      }
    } catch (e) {
      console.log(JSON.stringify({ error: e.message }));
    }
  }

  dummyRequest(method, path, data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          method,
          path,
          receivedData: data,
          dummy: true
        });
      }, 100);
    });
  }
}

new Site();
