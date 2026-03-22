import http from "http";
const PORT = 8765;

class Browser {
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
          res.on("end", () => resolve(JSON.parse(body)));
        },
      );
      req.on("error", reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  async exec(action, params = {}, id = null) {
    return this.request("/api/browsers/exec", "POST", { id, action, params });
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export default new Browser();
