import express from "express";
import path from "path";
import fs from "fs-extra";
import romiServer from "../server.js";
import logger from "../utils/logger.js";
import { processMessage } from "../core/agent.js";
import preprocessor from "../utils/preprocessor.js";
import skillManager from "../core/skillManager.js";
import { getWorkspacePath, getActiveWorkspaceId } from "../core/workspace.js";
import events from "../utils/events.js";
import { APP_SOURCE_DIR } from "../core/paths.js";

class WebChannel {
  constructor() {
    this.app = null;
  }
  async init() {
    logger.info("WEB", "Initializing Web Dashboard channel...");
    if (romiServer.server) {
      this.setupRoutes(romiServer.app);
    } else {
      events.on("server:initiated", (app) => this.setupRoutes(app));
    }
  }

  setupRoutes(app) {
    this.app = app;
    const dashboardPath = path.join(APP_SOURCE_DIR, "dashboard");

    // Serve static files
    this.app.use("/dashboard", express.static(dashboardPath));

    // API to get skills
    this.app.get("/api/web/skills", async (req, res) => {
      try {
        const workspaceId = getActiveWorkspaceId();
        const skills = await skillManager.getWorkspaceSkills(workspaceId);
        res.json({
          ok: true,
          skills: skills.map((s) => ({
            name: s.name,
            description: s.description,
          })),
        });
      } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
      }
    });

    // API to get files
    this.app.get("/api/web/files", async (req, res) => {
      try {
        const workspaceId = getActiveWorkspaceId();
        const workspacePath = getWorkspacePath(workspaceId);
        let files = [];
        if (fs.existsSync(workspacePath)) {
          files = fs
            .readdirSync(workspacePath)
            .filter((f) => fs.statSync(path.join(workspacePath, f)).isFile());
        }
        res.json({ ok: true, files });
      } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
      }
    });

    // Chat API with streaming
    this.app.post("/api/web/chat", async (req, res) => {
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Transfer-Encoding", "chunked");

      const session = req.body.session || "user";
      const text = req.body.text || "";

      if (!text) {
        res.write(
          JSON.stringify({ type: "error", message: "Empty message" }) + "\n",
        );
        return res.end();
      }

      try {
        const expandedBody = await preprocessor.expandMentions(text);

        const onEvent = (event) => {
          res.write(JSON.stringify(event) + "\n");
        };

        const reply = await processMessage(expandedBody, {
          channel: "cli",
          from: "cli:user",
          isOwner: true,
          // senderName: session,
          onEvent,
        });

        res.write(JSON.stringify({ type: "reply", text: reply }) + "\n");
      } catch (err) {
        logger.error("WEB", "Error processing chat:", err);
        res.write(
          JSON.stringify({ type: "error", message: err.message }) + "\n",
        );
      }

      res.end();
    });

    logger.info("WEB", "Web Dashboard initialized at /dashboard");
  }

  async stop() {
    logger.info("WEB", "Stopping Web channel (tied to main server)");
  }
}

const web = new WebChannel();
export default web;
