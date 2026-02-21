import puppeteer from "puppeteer";
import { getActiveConfig } from "../config/index.js"; // Import getActiveConfig
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

    const config = await getActiveConfig(); // Get the active config

    const puppeteerConfig = config.channels.whatsapp.puppeteer || {}; // Get puppeteer config for whatsapp channel

    this.currentInstance = await puppeteer.launch({
      executablePath: puppeteerConfig.browserPath || null, // Use config value
      userDataDir: userDataDir,
      defaultViewport: null,
      headless: puppeteerConfig.headless ? "new" : false, // Use config value
      args: puppeteerConfig.args || [ // Use args from config, or default if not specified
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-session-crashed-bubble",
        "--disable-restore-session-state",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-gpu",
        "--disable-background-networking",
        "--disable-sync",
        "--metrics-recording-only",
        "--disable-features=IsolateOrigins,site-per-process,Translate,BackForwardCache",
        "--disable-blink-features=AutomationControlled",
      ],
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

const browser = new Browser();
export default browser;
