class RomiBrowser {
  constructor() {
    this.wsUrl = "ws://localhost:8765/ws/browser";
    this.reconnectInterval = null;
    this.ws = null;
    this.init();
  }

  init() {
    this.connect();
    chrome.runtime.onMessage.addListener(this.handlePopupMessage.bind(this));
    chrome.tabs.onCreated.addListener((tab) => {
      console.log(`Tab created with ID: ${tab.id}`);
    });
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url) {
        console.log(`Tab ${tabId} navigated to ${changeInfo.url}`);
      }
    });
    this.keep_alive();
  }

  keep_alive() {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      } else {
        // here whatif ws is not open? then we might need to keep running communicate between content script and background script, if this approatch keeps service worker alive
        chrome.runtime.sendMessage({ type: "keepAlive" }, (response) => {
          console.log("Romi: Keep-alive message sent.");
        });
      }
    }, 30000); // Send ping every 30 seconds
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log("Romi: Browser extension connected to server");
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    };

    this.ws.onclose = (event) => {
      console.warn(
        `Romi: Connection closed (Code: ${event?.code}). Retrying in 5s...`,
      );
      if (!this.reconnectInterval) {
        this.reconnectInterval = setInterval(() => this.connect(), 5000);
      }
    };

    this.ws.onerror = (err) => {
      console.error("Romi: WebSocket error:", err);
    };

    this.ws.onmessage = async (event) => {
      const command = JSON.parse(event.data);
      try {
        const result = await this.executeCommand(command);
        this.ws.send(JSON.stringify({ requestId: command.requestId, result }));
      } catch (err) {
        this.ws.send(
          JSON.stringify({
            requestId: command?.requestId,
            result: { error: err.message },
          }),
        );
      }
    };
  }

  async executeCommand(command = {}) {
    const { action, params } = command;

    if (action === "create") {
      let tab;

      if (params.incognito) {
        const window = await chrome.windows.create({
          url: params.url,
          incognito: true,
        });
        if (window && window.tabs && window.tabs.length > 0) {
          tab = window.tabs[0];
        } else {
          console.error("Failed to create tab in incognito mode");
        }
      } else {
        tab = await chrome.tabs.create({ url: params.url });
      }
      return {
        success: !!tab,
        tab: {
          id: tab?.id ?? false,
          active: tab?.active ?? false,
          incognito: tab?.incognito ?? false,
        },
        params,
      };
    }

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) return { error: "No active tab. Create one first" };

    if (action === "navigate") {
      await chrome.tabs.update(tab.id, { url: params.url });
      if (params.untilLoad) {
        await new Promise((resolve) => {
          const listener = (tabId, changeInfo) => {
            if (
              tabId === tab.id &&
              changeInfo.status === "complete" &&
              changeInfo.url === params.url
            ) {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });
      }
      return { success: true, url: params.url };
    }

    if (action === "screenshot") {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: "png",
      });
      return { success: true, screenshot: dataUrl };
    }

    if (action === "close") {
      const targetTabId = params.tabId || tab?.id;
      if (targetTabId) {
        await chrome.tabs.remove(targetTabId);
        return { success: true, tabId: targetTabId };
      }
      return { error: "No tabId provided to close" };
    }

    const results = await chrome.scripting.executeScript({
      // world: "MAIN",
      target: { tabId: tab.id },
      args: [action, params],
      func: (action, params) => {
        try {
          const actions = {
            click: () => {
              const el = document.querySelector(params.selector);
              if (!el) throw new Error(`Element not found: ${params.selector}`);
              el.click();
              return { success: true };
            },
            write: () => {
              const el = document.querySelector(params.selector);
              if (!el) throw new Error(`Element not found: ${params.selector}`);
              el.focus();
              if (["quill"].includes(params?.editor)) {
                el.innerHTML = params.text;
                el.dispatchEvent(new Event("input", { bubbles: true }));
              } else {
                el.value = params.text;
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
              }
              if (params.keyPress) {
                const [key, keyCode] = params.keyPress.split(",");
                const keyEvent = new KeyboardEvent("keydown", {
                  key: key,
                  code: key,
                  keyCode: Number(keyCode),
                  which: Number(keyCode),
                  bubbles: true,
                  cancelable: true,
                });
                el.dispatchEvent(keyEvent);
              }
              return { success: true, text: params.text };
            },
            getText: () => {
              let text = "";
              if (params.selector) {
                const el = document.querySelector(params.selector);
                if (!el)
                  throw new Error(`Element not found: ${params.selector}`);
                text = el.innerText;
              } else {
                text = document.body.innerText;
              }
              // Limit text to 20k characters
              if (text.length > 20000) {
                text = text.substring(0, 20000) + "... [Text Truncated]";
              }
              return { success: true, text };
            },
            scroll: () => {
              window.scrollBy({
                top:
                  (params.direction || "down") === "down"
                    ? params.amount || 300
                    : -(params.amount || 300),
                behavior: "smooth",
              });
              return { success: true };
            },
            hover: () => {
              const el = document.querySelector(params.selector);
              if (!el) throw new Error(`Element not found: ${params.selector}`);
              el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
              return { success: true };
            },
            waitFor: () => {
              return new Promise((resolve) => {
                const timeout = params.timeout || 10000;
                const startTime = Date.now();
                const check = () => {
                  const elements = document.querySelectorAll(params.selector);
                  if (elements.length > 0) {
                    resolve({ success: true });
                  } else if (Date.now() - startTime > timeout) {
                    resolve({
                      error: `Timeout waiting for element: ${params.selector}`,
                    });
                  } else {
                    setTimeout(check, 100);
                  }
                };
                check();
              });
            },
            getElements: () => {
              const elements = Array.from(
                document.querySelectorAll(params.selector),
              );
              const results = elements.map((el) => {
                if (params.attribute)
                  return (
                    el[params.attribute] || el.getAttribute(params.attribute)
                  );
                return el.innerText || el.value;
              });
              return { success: true, results };
            },
            evaluate: () => {
              if (params.script.includes("document.querySelectorAll")) {
                const match = params.script.match(
                  /querySelectorAll\(['"](.+?)['"]\)/,
                );
                if (match) {
                  const selector = match[1];
                  const elements = Array.from(
                    document.querySelectorAll(selector),
                  );
                  return {
                    success: true,
                    result: elements.map((el) => el.innerText),
                  };
                }
              }
              return {
                error:
                  "Complex evaluate blocked by CSP. Use specialized actions like getElements or query.",
              };
            },
            query: () => {
              const root = params.selector
                ? document.querySelectorAll(params.selector)
                : [document];
              const results = Array.from(root).map((el) => {
                const item = {};
                for (const [key, selector] of Object.entries(
                  params.map || {},
                )) {
                  if (params.multiple) {
                    item[key] = Array.from(el.querySelectorAll(selector)).map(
                      (e) => e.innerText.trim(),
                    );
                  } else {
                    const sub = el.querySelector(selector);
                    item[key] = sub ? sub.innerText.trim() : null;
                  }
                }
                return item;
              });
              return { success: true, results };
            },
            press: () => {
              const el = document.querySelector(params.selector);
              if (!el) throw new Error(`Element not found: ${params.selector}`);
              const event = new KeyboardEvent("keydown", {
                key: params.key,
                code: params.code,
                keyCode: params.keyCode,
                which: params.keyCode,
                bubbles: true,
                cancelable: true,
                ctrlKey: params.ctrlKey || false,
                shiftKey: params.shiftKey || false,
                altKey: params.altKey || false,
                metaKey: params.metaKey || false,
              });
              el.dispatchEvent(event);
              return { success: true };
            },
          };

          if (!actions[action]) throw new Error(`Unknown action: ${action}`);
          return actions[action]();
        } catch (err) {
          return { error: err.message };
        }
      },
    });

    return results[0]?.result || { error: "No result" };
  }

  handlePopupMessage(message, sender, sendResponse) {
    if (message.type === "getStatus") {
      sendResponse({
        connected: this.ws && this.ws.readyState === WebSocket.OPEN,
      });
    }
    return true;
  }
}

new RomiBrowser();
