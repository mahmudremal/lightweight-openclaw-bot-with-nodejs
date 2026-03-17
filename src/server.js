import express from "express";
import bodyParser from "body-parser";
import { processMessage } from "./core/agent.js";
import logger from "./utils/logger.js";
import { browserController } from "./utils/browser.js";
import network from "./utils/network.js";
import events from "./utils/events.js";

class RomiServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
    network.isOnline();
  }

  setupMiddleware() {
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());
  }

  setupRoutes() {
    this.app.get("/health", (req, res) =>
      res.json({
        ok: true,
        time: new Date().toISOString(),
        uptime: process.uptime(),
      }),
    );

    this.app.post("/webhook/message", async (req, res) => {
      try {
        const { channel, from, body } = req.body || {};
        if (!channel || !from || !body) {
          return res.status(400).json({ ok: false, error: "Missing fields" });
        }
        const reply = await processMessage(body, { channel, from });
        res.json({ ok: true, reply });
      } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
      }
    });

    // Internal Browser API
    this.app.get("/api/browsers", (req, res) => {
      res.json(browserController.getClientsList());
    });

    this.app.post("/api/browsers/exec", async (req, res) => {
      req.setTimeout(0); // Disable request timeout for long-running tasks
      try {
        const { id, action, params } = req.body;
        const result = await browserController.sendCommand(action, params, id);
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  async start(port = 8765) {
    if (this.server) return this.server;

    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        logger.log("SERVER", `Romi server listening on port ${port}`);
        browserController.startServer({
          server: this.server,
          path: "/ws/browser",
        });
        events.emit("server:initiated", this.app);
        resolve(this.server);
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      browserController.stopServer();
    }
  }
}

const romiServer = new RomiServer();
export default romiServer;

export const startServer = (port) => romiServer.start(port);
