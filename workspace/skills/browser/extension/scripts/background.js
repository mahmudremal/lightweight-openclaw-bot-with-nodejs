class RomiBrowser {
  constructor() {
    this.wsUrl = "ws://localhost:8765";
    this.ws = null;
    this.reconnectInterval = null;
    this.init();
  }

  init() {
    this.connect();
    chrome.runtime.onMessage.addListener(this.handlePopupMessage.bind(this));
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    };

    this.ws.onclose = () => {
      if (!this.reconnectInterval) {
        this.reconnectInterval = setInterval(() => this.connect(), 5000);
      }
    };

    this.ws.onmessage = async (event) => {
      try {
        const command = JSON.parse(event.data);
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

  async executeCommand(command) {
    const { action, params } = command;
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) return { error: "No active tab" };

    if (action === "navigate") {
      await chrome.tabs.update(tab.id, { url: params.url });
      return { success: true, url: params.url };
    }

    if (action === "screenshot") {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: "png",
      });
      return { success: true, screenshot: dataUrl };
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: this.executeInPage,
      args: [action, params],
    });

    return results[0]?.result || { error: "No result" };
  }

  executeInPage(action, params) {
    try {
      const actions = {
        click: () => {
          const el = document.querySelector(params.selector);
          if (!el) throw new Error(`Element not found: ${params.selector}`);
          el.click();
          return { success: true };
        },
        type: () => {
          const el = document.querySelector(params.selector);
          if (!el) throw new Error(`Element not found: ${params.selector}`);
          el.focus();
          el.value = params.text;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return { success: true, text: params.text };
        },
        getText: () => {
          if (params.selector) {
            const el = document.querySelector(params.selector);
            if (!el) throw new Error(`Element not found: ${params.selector}`);
            return { success: true, text: el.innerText };
          }
          return { success: true, text: document.body.innerText };
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
            const timeout = params.timeout || 5000;
            const startTime = Date.now();
            const check = () => {
              if (document.querySelector(params.selector)) {
                resolve({ success: true });
              } else if (Date.now() - startTime > timeout) {
                resolve({ error: `Timeout waiting for: ${params.selector}` });
              } else {
                requestAnimationFrame(check);
              }
            };
            check();
          });
        },
        evaluate: () => {
          const result = eval(params.script);
          return { success: true, result };
        },
      };

      if (!actions[action]) throw new Error(`Unknown action: ${action}`);
      return actions[action]();
    } catch (err) {
      return { error: err.message };
    }
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
