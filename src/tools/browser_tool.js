import WebSocket from "ws";
import logger from "../utils/logger.js";

class BrowserController {
  constructor() {
    this.wsServer = null;
    this.connectedClients = new Set();
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  startServer({ server, port = 8765 }) {
    if (this.wsServer) return;

    // TypeError: WebSocket.Server is not a constructor - see here it shows this error
    this.wsServer = new WebSocket.Server({ port });

    this.wsServer.on("connection", (ws) => {
      logger.info("BROWSER_TOOL", "Browser extension connected");
      this.connectedClients.add(ws);

      ws.on("message", (data) => {
        try {
          const response = JSON.parse(data.toString());
          const pending = this.pendingRequests.get(response.requestId);
          if (pending) {
            pending.resolve(response.result);
            this.pendingRequests.delete(response.requestId);
          }
        } catch (err) {
          logger.error("BROWSER_TOOL", "Failed to parse response:", err);
        }
      });

      ws.on("close", () => {
        this.connectedClients.delete(ws);
        logger.info("BROWSER_TOOL", "Browser extension disconnected");
      });
    });

    logger.info("BROWSER_TOOL", `WebSocket server started on port ${port}`);
  }

  hasConnectedClient() {
    return this.connectedClients.size > 0;
  }

  async sendCommand(action, params = {}) {
    if (this.connectedClients.size === 0) {
      return { error: "No browser extension connected" };
    }

    const requestId = ++this.requestId;
    const command = { requestId, action, params };

    return new Promise((resolve) => {
      this.pendingRequests.set(requestId, { resolve });

      // Send to all connected clients (usually just one)
      for (const client of this.connectedClients) {
        client.send(JSON.stringify(command));
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          resolve({ error: "Request timeout" });
        }
      }, 30000);
    });
  }

  async click(selector) {
    return this.sendCommand("click", { selector });
  }

  async type(selector, text) {
    return this.sendCommand("type", { selector, text });
  }

  async screenshot() {
    return this.sendCommand("screenshot");
  }

  async getText(selector = null) {
    return this.sendCommand("getText", { selector });
  }

  async navigate(url) {
    return this.sendCommand("navigate", { url });
  }

  async scroll(direction = "down", amount = 300) {
    return this.sendCommand("scroll", { direction, amount });
  }

  async hover(selector) {
    return this.sendCommand("hover", { selector });
  }

  async waitFor(selector, timeout = 5000) {
    return this.sendCommand("waitFor", { selector, timeout });
  }

  async evaluate(script) {
    return this.sendCommand("evaluate", { script });
  }
}

const browserController = new BrowserController();

export const browser_tool = {
  name: "browser",
  description:
    "Control a Chromium browser through a connected browser extension. Actions: navigate, click, type, screenshot, getText, scroll, hover, waitFor, evaluate. Requires the browser skill to be read first, and the Romi browser extension to be installed and connected.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "navigate",
          "click",
          "type",
          "screenshot",
          "getText",
          "scroll",
          "hover",
          "waitFor",
          "evaluate",
        ],
        description: "The browser action to perform",
      },
      selector: {
        type: "string",
        description:
          "CSS selector for click, type, hover, waitFor actions (e.g., 'button.submit', '#login-form')",
      },
      url: {
        type: "string",
        description: "URL to navigate to (for navigate action)",
      },
      text: {
        type: "string",
        description: "Text to type (for type action)",
      },
      direction: {
        type: "string",
        enum: ["up", "down"],
        description: "Scroll direction (for scroll action)",
      },
      amount: {
        type: "number",
        description: "Scroll amount in pixels (for scroll action)",
      },
      timeout: {
        type: "number",
        description:
          "Timeout in milliseconds for waitFor action (default: 5000)",
      },
      script: {
        type: "string",
        description:
          "JavaScript code to execute in the browser (for evaluate action)",
      },
    },
    required: ["action"],
  },
  handler: async (args) => {
    const { action, selector, url, text, direction, amount, timeout, script } =
      args;

    if (!browserController.hasConnectedClient()) {
      return "No browser extension connected. Please install and enable the Romi browser extension.";
    }

    switch (action) {
      case "navigate":
        if (!url) return "Error: 'url' is required for navigate action";
        return browserController.navigate(url);

      case "click":
        if (!selector) return "Error: 'selector' is required for click action";
        return browserController.click(selector);

      case "type":
        if (!selector) return "Error: 'selector' is required for type action";
        if (text === undefined)
          return "Error: 'text' is required for type action";
        return browserController.type(selector, text);

      case "screenshot":
        return browserController.screenshot();

      case "getText":
        return browserController.getText(selector);

      case "scroll":
        return browserController.scroll(direction, amount);

      case "hover":
        if (!selector) return "Error: 'selector' is required for hover action";
        return browserController.hover(selector);

      case "waitFor":
        if (!selector)
          return "Error: 'selector' is required for waitFor action";
        return browserController.waitFor(selector, timeout);

      case "evaluate":
        if (!script) return "Error: 'script' is required for evaluate action";
        return browserController.evaluate(script);

      default:
        return `Unknown action: ${action}`;
    }
  },
};

export { browserController };
