import path from "path";
import { getWorkspacePath, readWorkspaceFile } from "../core/workspace.js";
import logger from "../utils/logger.js";
import config from "../config/index.js";
import { processMessage } from "../core/agent.js";

const HEARTBEAT_OK_TOKEN = "HEARTBEAT_OK";

class Heartbeat {
  constructor() {
    this._timer = null;
    this._config = null;
  }

  isHeartbeatEmpty(content) {
    if (!content) return true;
    const lines = content.split("\n");
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || line.startsWith("<!--")) continue;
      if (line === "- [ ]" || line === "- [x]") continue;
      return false;
    }
    return true;
  }

  async start() {
    this._config = await config.getActiveConfig();
    const enabled = this._config.heartbeat?.enabled;
    const intervalMs = (this._config.heartbeat?.interval || 30) * 60 * 1000;

    if (!enabled) {
      logger.info("HEARTBEAT", "Service is disabled in config.");
      return;
    }

    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this.tick(), intervalMs);
    logger.info("HEARTBEAT", `Started (every ${intervalMs / 1000}s)`);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  async tick() {
    const content = readWorkspaceFile("HEARTBEAT.md");
    if (this.isHeartbeatEmpty(content)) {
      logger.debug("HEARTBEAT", "No tasks");
      return;
    }

    logger.info("HEARTBEAT", "Checking for tasks...");
    try {
      const prompt = `Read HEARTBEAT.md in your workspace. Follow any instructions or tasks listed there. If nothing needs attention, reply with: HEARTBEAT_OK`;
      const response = await processMessage(prompt, {
        channel: "heartbeat",
        from: "system",
      });

      if (
        response &&
        response.toUpperCase().includes(HEARTBEAT_OK_TOKEN.replace("_", ""))
      ) {
        logger.info("HEARTBEAT", "OK (no action needed)");
      } else {
        logger.info("HEARTBEAT", "Completed task");
      }
    } catch (err) {
      logger.error("HEARTBEAT", `Execution failed: ${err.message}`);
    }
  }

  async triggerNow() {
    const prompt = `Read HEARTBEAT.md in your workspace. Follow any instructions or tasks listed there. If nothing needs attention, reply with: HEARTBEAT_OK`;
    return await processMessage(prompt, {
      channel: "heartbeat",
      from: "system",
    });
  }
}

const heartbeat = new Heartbeat();
export default heartbeat;

// For backward compatibility if needed, though bin/romi.js used new HeartbeatService
export const HeartbeatService = class {
  constructor({ onHeartbeat }) {
    // This wrapper maintains compatibility with old pattern
    this.onHeartbeat = onHeartbeat;
  }
  start() {
    return heartbeat.start();
  }
  stop() {
    return heartbeat.stop();
  }
  triggerNow() {
    return heartbeat.triggerNow();
  }
};
