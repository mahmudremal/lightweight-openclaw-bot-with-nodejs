import express from "express";
import bodyParser from "body-parser";
import { processMessage } from "./core/agent.js";
import logger from "./utils/logger.js";
import { browserController } from "./tools/browser_tool.js";

class RomiServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
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
        resolve(this.server);
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

const romiServer = new RomiServer();
export default romiServer;

export const startServer = (port) => romiServer.start(port);
