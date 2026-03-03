import puppeteer from "puppeteer";
import { WebSocketServer } from "ws";
import config from "../config/index.js";
import logger from "./logger.js";
import path from "path";
import fs from "fs";
import { ROOT_DIR } from "../core/workspace.js";

class Browser {
  currentInstance = null;
  constructor() {}

  async setup_browser() {
    logger.info("BROWSER", "Launching shared browser instance...");

    const userDataDir = path.resolve(ROOT_DIR, "storage", "browser-data");
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    const agentConfig = await config.getActiveAgentConfig();
    const puppeteerConfig = agentConfig?.puppeteer || {};

    this.currentInstance = await puppeteer.launch({
      executablePath: puppeteerConfig.browserPath || null, // Use config value
      userDataDir: userDataDir,
      defaultViewport: null,
      headless: puppeteerConfig?.headless ?? "new", // Use config value //
      args: puppeteerConfig.args || [],
    });

    this.currentInstance._realClose = this.currentInstance.close;
    this.currentInstance.close = async () => {
      logger.debug("BROWSER", "Shared browser close requested (ignoring)");
      return Promise.resolve();
    };

    logger.info("BROWSER", "Shared browser instance launched successfully");
    return this.currentInstance;
  }

  async getBrowser() {
    if (!this.currentInstance) {
      return await this.setup_browser();
    }
    return this.currentInstance;
  }

  async close() {
    if (this.currentInstance) {
      if (this.currentInstance?._realClose) {
        await this.currentInstance._realClose();
      } else {
        await this.currentInstance.close();
      }
      this.currentInstance = null;
    }
    return null;
  }

  async newPage() {
    const browser = await this.getBrowser();
    return browser.newPage();
  }
}

const hlBrowser = new Browser();
export default hlBrowser;

class BrowserController {
  constructor() {
    this.wsServer = null;
    this.connectedClients = new Map();
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.clientCounter = 0;
    this.pingInterval = null;
  }

  stopServer() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = null;
    }
    this.connectedClients.clear();
  }

  startServer({ server, port = 8765, path = "/ws/browser" }) {
    if (this.wsServer) return;

    if (server) {
      this.wsServer = new WebSocketServer({ server, path });
      logger.info(
        "BROWSER_TOOL",
        `WebSocket server attached to Express on ${path}`,
      );
    } else {
      this.wsServer = new WebSocketServer({ port, path });
      logger.info(
        "BROWSER_TOOL",
        `WebSocket server started on port ${port} at ${path}`,
      );
    }

    this.wsServer.on("connection", (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      const clientId = `browser-${++this.clientCounter}`;
      ws.id = clientId;
      ws.ip = clientIp;
      logger.info(
        "BROWSER_TOOL",
        `Browser extension connected from ${clientIp} (ID: ${clientId})`,
      );
      this.connectedClients.set(clientId, ws);

      logger.info(
        "BROWSER_TOOL",
        `Total Connected: ${this.connectedClients.size}`,
      );
      // Ping pong to keep alive
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

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

      ws.on("close", (code, reason) => {
        this.connectedClients.delete(clientId);
        logger.info(
          "BROWSER_TOOL",
          `Browser disconnected: ${clientId} (Code: ${code}, Reason: ${reason})`,
        );
      });

      ws.on("error", (err) => {
        logger.error("BROWSER_TOOL", `WebSocket error (${clientId}):`, err);
      });
    });
    this.wsServer.on("close", (ws, req) => {
      --this.clientCounter;
    });

    // Setup interval to check for dead clients
    this.pingInterval = setInterval(() => {
      this.connectedClients.forEach((ws, id) => {
        if (ws.isAlive === false) {
          logger.warn("BROWSER_TOOL", `Client ${id} timed out, terminating...`);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  hasConnectedClient() {
    return this.connectedClients.size > 0;
  }

  getClientsList() {
    return Array.from(this.connectedClients.keys()).map((id) => {
      const ws = this.connectedClients.get(id);
      return { id, ip: ws.ip };
    });
  }

  async sendCommand(action, params = {}, clientId = null) {
    if (this.connectedClients.size === 0) {
      return { error: "No browser extension connected" };
    }

    const requestId = ++this.requestId;
    const command = { requestId, action, params };

    if (clientId) {
      const client =
        this.connectedClients.get(clientId) ||
        Array.from(this.connectedClients.values())[0];
      if (!client) return { error: `Client ${clientId} not found` };
      client.send(JSON.stringify(command));
    } else {
      // Send to all connected clients (usually just one)
      for (const client of this.connectedClients.values()) {
        client.send(JSON.stringify(command));
      }
    }

    const timeoutMs = (params.timeout || 60000) + 10000; // Param timeout + 10s buffer

    return new Promise((resolve) => {
      this.pendingRequests.set(requestId, { resolve });

      // Dynamic timeout based on request parameters
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          resolve({
            error: `Browser request timeout after ${timeoutMs}ms (Action: ${action})`,
          });
        }
      }, timeoutMs);
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

export { browserController };
