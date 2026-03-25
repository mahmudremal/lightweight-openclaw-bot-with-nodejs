import https from "https";
class RequestManager {
  send(method, urlStr, headers, data, retries = 3) {
    return new Promise((resolve, reject) => {
      const attempt = (n) => {
        const url = new URL(urlStr);
        const req = https.request(
          { hostname: url.hostname, port: 443, path: url.pathname + url.search, method, headers },
          (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
              if (res.statusCode >= 400) {
                if (n > 1 && (res.statusCode === 429 || res.statusCode >= 500)) return setTimeout(() => attempt(n - 1), 1000);
                resolve({ error: true, status: res.statusCode, data: body });
                return;
              }
              try { resolve(JSON.parse(body)); } catch { resolve(body); }
            });
          }
        );
        req.on("error", (e) => {
          if (n > 1) return setTimeout(() => attempt(n - 1), 1000);
          reject(e);
        });
        if (data) req.write(typeof data === "string" ? data : JSON.stringify(data));
        req.end();
      };
      attempt(retries);
    });
  }
}
export default new RequestManager();
