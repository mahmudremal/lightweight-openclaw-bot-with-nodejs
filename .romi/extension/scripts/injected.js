class RomiInjected {
  constructor() {
    this.port = chrome.runtime.connect({ name: "romi-channel" });
    this.rules = [];
    this.inject();
    this.listen();
  }

  inject() {
    const script = document.createElement("script");
    script.textContent = `(${this.pageScript.toString()})();`;
    document.documentElement.appendChild(script);
    script.remove();
  }

  listen() {
    window.addEventListener("message", (e) => {
      if (e.source !== window) return;
      if (!e.data || e.data.type !== "ROMI_EVENT") return;
      if (!this.match(e.data.payload)) return;
      this.port.postMessage({ type: "EVENT", payload: e.data.payload });
    });

    this.port.onMessage.addListener((msg) => {
      if (msg.type === "SET_RULES") {
        this.rules = msg.rules || [];
      }
    });
  }

  match(data) {
    if (!this.rules.length) return false;
    return this.rules.some((rule) => {
      const urlOk = rule.url ? new RegExp(rule.url).test(data.url) : true;
      const methodOk = rule.method ? rule.method === data.method : true;
      const bodyOk = rule.bodyKey
        ? data.requestBody && data.requestBody.includes(rule.bodyKey)
        : true;
      return urlOk && methodOk && bodyOk;
    });
  }

  pageScript() {
    const send = (payload) => {
      window.postMessage({ type: "ROMI_EVENT", payload }, "*");
    };

    const { fetch: originalFetch } = window;

    window.fetch = new Proxy(originalFetch, {
      apply: (target, that, args) => {
        const [input, init] = args;
        const url = typeof input === "string" ? input : input.url;
        const method = (init && init.method) || "GET";
        const body = init && init.body;
        const start = Date.now();

        return target.apply(that, args).then(async (res) => {
          let text;
          try {
            text = await res.clone().text();
          } catch {
            text = null;
          }

          send({
            type: "fetch",
            url,
            method,
            status: res.status,
            requestBody: body || null,
            response: text,
            headers: [...res.headers.entries()],
            time: Date.now() - start,
          });

          return res;
        });
      },
    });

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._romi = { method, url };
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      const start = Date.now();
      this.addEventListener("load", function () {
        send({
          type: "xhr",
          url: this._romi.url,
          method: this._romi.method,
          status: this.status,
          requestBody: body || null,
          response: this.response,
          headers: this.getAllResponseHeaders(),
          time: Date.now() - start,
        });
      });
      return origSend.apply(this, arguments);
    };
  }
}

new RomiInjected();
