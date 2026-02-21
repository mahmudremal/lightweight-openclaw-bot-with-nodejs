import express from "express";
import bodyParser from "body-parser";
import { processMessage } from "./core/agent.js";
import logger from "./utils/logger.js";

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

  app.listen(port, () => {
    logger.log("SERVER", `Romi server listening on port ${port}`);
  });
}
