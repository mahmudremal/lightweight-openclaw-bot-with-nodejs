import path from "path";
import { getWorkspacePath, readWorkspaceFile } from "../core/workspace.js";
import logger from "../utils/logger.js";
import { getActiveConfig } from "../config/index.js";

const HEARTBEAT_OK_TOKEN = "HEARTBEAT_OK";

function isHeartbeatEmpty(content) {
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

export class HeartbeatService {
  constructor({ onHeartbeat }) {
    this.onHeartbeat = onHeartbeat;
    this._timer = null;
    this._config = null;
  }

  async start() {
    this._config = await getActiveConfig();
    const enabled = this._config.heartbeat?.enabled;
    const intervalMs = (this._config.heartbeat?.interval || 30) * 60 * 1000;

    if (!enabled) {
        logger.info("HEARTBEAT", "Heartbeat service is disabled in config.");
        return;
    }
    this._timer = setInterval(() => this._tick(), intervalMs);
    logger.info("HEARTBEAT", `Started (every ${intervalMs / 1000}s)`);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._config = null;
  }

  async _tick() {
    const content = readWorkspaceFile("HEARTBEAT.md");
    if (isHeartbeatEmpty(content)) {
      logger.debug("HEARTBEAT", "No tasks");
      return;
    }

    logger.info("HEARTBEAT", "Checking for tasks...");
    if (this.onHeartbeat) {
      try {
        const prompt = `Read HEARTBEAT.md in your workspace. Follow any instructions or tasks listed there. If nothing needs attention, reply with: HEARTBEAT_OK`;
        const response = await this.onHeartbeat(prompt);
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
  }

  async triggerNow() {
    if (this.onHeartbeat) {
      const prompt = `Read HEARTBEAT.md in your workspace. Follow any instructions or tasks listed there. If nothing needs attention, reply with: HEARTBEAT_OK`;
      return await this.onHeartbeat(prompt);
    }
    return null;
  }
}
