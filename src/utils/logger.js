import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_DIR } from "../core/workspace.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

const LOG_COLORS = {
  ERROR: "\x1b[31m",
  WARN: "\x1b[33m",
  INFO: "\x1b[36m",
  DEBUG: "\x1b[35m",
  TRACE: "\x1b[90m",
  RESET: "\x1b[0m",
};

class Logger {
  constructor() {
    this.logTerminal = true;
    this.fileWriteLog = true;
    const envLevel = process.env.LOG_LEVEL;
    this.logLevel = LOG_LEVELS[envLevel] ? envLevel : "INFO";
    this.logDir = path.join(
      ROOT_DIR,
      "storage",
      "logs",
      new Date().toISOString().split("T")[0],
    );
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogFileName() {
    const date = new Date();
    return path.join(this.logDir, `app-${date.getHours()}.log`);
  }

  formatValue(val) {
    if (val === undefined) return "undefined";
    if (val === null) return "null";
    if (typeof val === "object") {
      try {
        return JSON.stringify(val, null, 2);
      } catch (e) {
        return "[Circular or Large Object]";
      }
    }
    return val;
  }

  formatMessage(level, context, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const msgStr = this.formatValue(message);
    const metaStr =
      Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] [${context}] ${msgStr}${metaStr}`;
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.logLevel];
  }

  writeToFile(message) {
    if (!this.fileWriteLog) return;
    try {
      const logFile = this.getLogFileName();
      fs.appendFileSync(logFile, message + "\n", "utf8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  log(level, context, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    if (message === undefined && typeof context === "string") {
      message = context;
      context = "LOG";
    }

    const formattedMessage = this.formatMessage(level, context, message, meta);
    const coloredMessage = `${LOG_COLORS[level]}${formattedMessage}${LOG_COLORS.RESET}`;

    this.logTerminal && console.log(coloredMessage);
    this.writeToFile(formattedMessage);
  }

  error(context, message, meta = {}) {
    this.log("ERROR", context, message, meta);
  }

  warn(context, message, meta = {}) {
    this.log("WARN", context, message, meta);
  }

  info(context, message, meta = {}) {
    this.log("INFO", context, message, meta);
  }

  debug(context, message, meta = {}) {
    this.log("DEBUG", context, message, meta);
  }

  trace(context, message, meta = {}) {
    this.log("TRACE", context, message, meta);
  }

  request(req) {
    this.info("HTTP", `${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      query: req.query,
      body: req.method !== "GET" ? req.body : undefined,
    });
  }

  response(req, res, duration) {
    const level = res.statusCode >= 400 ? "ERROR" : "INFO";
    this.log(level, "HTTP", `${req.method} ${req.path} - ${res.statusCode}`, {
      duration: `${duration}ms`,
    });
  }
}

const logger = new Logger();
export default logger;
