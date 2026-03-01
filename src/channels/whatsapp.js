import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs-extra";
import pino from "pino";
import { processMessage } from "../core/agent.js";
import logger from "../utils/logger.js";
import { ROOT_DIR } from "../core/workspace.js";
import config from "../config/index.js";
import Formatter from "../utils/formatter.js";

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
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
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
        const sender = msg.key.participant || msg.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.buttonsResponseMessage?.selectedButtonId ||
          msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
          "";

        if (!text) continue;

        const senderPhone = sender.split("@")[0];
        const senderName = msg.pushName || senderPhone;
        const isOwner =
          waConfig.allow_from?.includes(`+${senderPhone}`) ||
          waConfig.allow_from?.includes(senderPhone);

        logger.log(
          "WHATSAPP",
          `[WA] ${isGroup ? "[GROUP] " : ""}${from} (${senderName}) -> ${text}`,
        );

        try {
          const reply = await processMessage(text, {
            channel: "whatsapp",
            from: from,
            senderId: sender,
            senderName,
            isGroup,
            isOwner,
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
      const formattedMessage = Formatter.toWhatsApp(message);
      return await this.sock.sendMessage(jid, { text: formattedMessage });
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
