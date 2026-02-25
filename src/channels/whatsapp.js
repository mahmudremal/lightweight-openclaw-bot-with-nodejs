import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs-extra";
import { processMessage } from "../core/agent.js";
import logger from "../utils/logger.js";
import { ROOT_DIR } from "../core/workspace.js";
import config from "../config/index.js";

class WhatsApp {
  constructor() {
    this.sock = null;
    this.authState = null;
  }

  async init() {
    if (this.sock) return this.sock;

    const storagePath = path.resolve(ROOT_DIR, "storage", "whatsapp-session");
    await fs.ensureDir(storagePath);

    const activeConfig = await config.getActiveConfig();
    const waConfig = activeConfig.channels?.whatsapp || {};

    if (!waConfig.enabled) {
      logger.info("WHATSAPP", "WhatsApp is disabled in config.");
      return;
    }

    const { state, saveCreds } = await useMultiFileAuthState(storagePath);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false, // We'll handle it manually for better logging
      logger: undefined, // Replace with internal logger if needed
    });

    this.sock.ev.on("creds.update", saveCreds);

    this.sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info("WHATSAPP", "Scan QR code to connect:");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect.error?.output?.statusCode !==
          DisconnectReason.loggedOut;
        logger.warn(
          "WHATSAPP",
          `Connection closed due to ${lastDisconnect.error}, reconnecting ${shouldReconnect}`,
        );
        if (shouldReconnect) {
          this.sock = null;
          this.init();
        }
      } else if (connection === "open") {
        logger.log("WHATSAPP", "WhatsApp connection opened successfully");
      }
    });

    this.sock.ev.on("messages.upsert", async (m) => {
      if (m.type !== "notify") return;

      for (const msg of m.messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const from = msg.key.remoteJid;
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text) continue;

        logger.log("WHATSAPP", `[WA] ${from} -> ${text}`);

        try {
          const reply = await processMessage(text, {
            channel: "whatsapp",
            from: `whatsapp:${from}`,
            message: msg,
          });

          if (reply) {
            await this.sendMessage(from, reply);
          }
        } catch (err) {
          logger.error("WHATSAPP", "Error handling incoming WA message:", err);
        }
      }
    });

    return this.sock;
  }

  async sendMessage(to, message) {
    if (!this.sock) {
      await this.init();
    }

    let jid = to;
    if (typeof to === "string") {
      if (to.startsWith("whatsapp:")) {
        jid = to.split(":")[1];
      }
      if (!jid.includes("@")) {
        jid = `${jid.replace("+", "")}@s.whatsapp.net`;
      }
    }

    try {
      return await this.sock.sendMessage(jid, { text: message });
    } catch (err) {
      logger.error("WHATSAPP", "sendMessage error:", err.message);
      throw err;
    }
  }

  // Helper for backward compatibility or future use
  async getChats() {
    return []; // Baileys doesn't store chats by default without a Store
  }

  async getMessages(chatId, limit = 20) {
    return []; // Baileys doesn't store messages by default without a Store
  }
}

const whatsapp = new WhatsApp();
export default whatsapp;

export const startWhatsAppClient = () => whatsapp.init();
export const sendWhatsApp = (to, msg) => whatsapp.sendMessage(to, msg);
