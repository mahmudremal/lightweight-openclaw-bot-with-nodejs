import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs-extra";
import browser from "../utils/browser.js";
import { processMessage } from "../core/agent.js";
import logger from "../utils/logger.js";
import { ROOT_DIR } from "../core/workspace.js";
import config from "../config/index.js";

class WhatsApp {
  constructor() {
    this.client = null;
  }

  async init() {
    if (this.client) return this.client;

    const storagePath = path.resolve(ROOT_DIR, "storage", "whatsapp-session");
    await fs.ensureDir(storagePath);

    const activeConfig = await config.getActiveConfig();
    const waConfig = activeConfig.channels?.whatsapp || {};

    if (!waConfig.enabled) {
      logger.info("WHATSAPP", "WhatsApp is disabled in config.");
      return;
    }

    const browserInstance = await browser.getBrowser();
    const browserWSEndpoint = browserInstance.wsEndpoint();

    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: "romi", dataPath: storagePath }),
      authTimeoutMs: 120000,
      puppeteer: {
        browserWSEndpoint,
        ...(waConfig.puppeteer || {}),
      },
    });

    this.client.on("qr", (qr) => {
      logger.info("WHATSAPP", "Scan QR code to connect:");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("ready", () =>
      logger.log("WHATSAPP", "WhatsApp client ready"),
    );

    this.client.on("auth_failure", (msg) =>
      logger.error("WHATSAPP", "WhatsApp auth failure:", msg),
    );

    this.client.on("disconnected", (reason) =>
      logger.warn("WHATSAPP", `WhatsApp client disconnected: ${reason}`),
    );

    this.client.on("message", async (msg) => {
      try {
        const from = `whatsapp:${msg.from}`;
        const body = msg.body || "";
        logger.log("WHATSAPP", `[WA] ${from} -> ${body}`);

        // Skip messages from self to avoid loops unless explicitly allowed
        if (msg.fromMe) return;

        const reply = await processMessage(body, {
          channel: "whatsapp",
          from,
          message: msg,
        });
        if (reply) await this.sendMessage(msg.from, reply);
      } catch (err) {
        logger.error("WHATSAPP", "Error handling incoming WA message:", err);
      }
    });

    await this.client
      .initialize()
      .catch((err) =>
        logger.error("WHATSAPP", "Failed to initialize WhatsApp client:", err),
      );

    return this.client;
  }

  async sendMessage(to, message) {
    if (!this.client) {
      await this.init();
    }

    let chatId = to;
    if (typeof to === "string") {
      if (to.startsWith("whatsapp:")) {
        const n = to.split(":")[1];
        chatId = n.includes("@") ? n : `${n.replace("+", "")}@c.us`;
      } else if (/^\+?\d+$/.test(to)) {
        chatId = `${to.replace("+", "")}@c.us`;
      } else if (!to.includes("@")) {
        chatId = `${to}@c.us`;
      }
    }

    try {
      return await this.client.sendMessage(chatId, message);
    } catch (err) {
      logger.error("WHATSAPP", "sendMessage error:", err.message);
      throw err;
    }
  }

  async getChats() {
    if (!this.client) return [];
    return await this.client.getChats();
  }

  async getMessages(chatId, limit = 20) {
    if (!this.client) return [];
    const chat = await this.client.getChatById(chatId);
    return await chat.fetchMessages({ limit });
  }
}

const whatsapp = new WhatsApp();
export default whatsapp;

export const startWhatsAppClient = () => whatsapp.init();
export const sendWhatsApp = (to, msg) => whatsapp.sendMessage(to, msg);
