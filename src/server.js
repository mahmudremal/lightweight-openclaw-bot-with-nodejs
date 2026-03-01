/**
 * If we face issues, we can see this file
 * D:\workspace\remal-bot\src\server.js here through used express with socket.io but there we might be able to figureout how to use ws instead.
 */
import express from "express";
import bodyParser from "body-parser";
import { processMessage } from "./core/agent.js";
import logger from "./utils/logger.js";
import { browserController } from "./tools/browser_tool.js";

export function startServer(port = 8123) {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.get("/health", (req, res) =>
    res.json({
      ok: true,
      time: new Date().toISOString(),
      uptime: process.uptime(),
    }),
  );

  app.post("/webhook/message", async (req, res) => {
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

  const server = app.listen(port, () => {
    logger.log("SERVER", `Romi server listening on port ${port}`);
  });

  // For an error, just pause it for now.
  // browserController.startServer({ server });
}
