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
    this.retryCount = 0;
    this.reconnectTimeout = null;
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
          this.retryCount++;
          const delays = [2000, 4000, 30000, 60000];
          const delay =
            delays[Math.min(this.retryCount - 1, delays.length - 1)];

          logger.info(
            "WHATSAPP",
            `Retrying connection in ${delay / 1000}s (Attempt ${this.retryCount})`,
          );

          if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => this.init(), delay);
        }
      } else if (connection === "open") {
        this.retryCount = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
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
          waConfig.human?.some(
            (h) =>
              h.includes(senderPhone) ||
              senderPhone.includes(h.replace("+", "")),
          ) || false;

        const isAllowed =
          !waConfig.allow_from ||
          waConfig.allow_from.length === 0 ||
          waConfig.allow_from.some(
            (h) =>
              h.includes(senderPhone) ||
              senderPhone.includes(h.replace("+", "")),
          );

        if (!isAllowed) {
          logger.debug(
            "WHATSAPP",
            `Ignoring message from ${senderPhone} (not in allow_from)`,
          );
          continue;
        }

        logger.log(
          "WHATSAPP",
          `[WA] ${isGroup ? "[GROUP] " : ""}${from} (${senderName}) -> ${text}`,
        );

        try {
          // Send typing indicator
          await this.sock.sendPresenceUpdate("composing", from);

          // Natural delay to give user time to read/start typing
          await new Promise((resolve) => setTimeout(resolve, 2000));

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
            // Stop typing indicator before sending message
            await this.sock.sendPresenceUpdate("paused", from);
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

  async stop() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.sock) {
      try {
        await this.sock.end();
      } catch (e) {}
      this.sock = null;
    }
  }
}

const whatsapp = new WhatsApp();
export default whatsapp;

export const startWhatsAppClient = () => whatsapp.init();
export const sendWhatsApp = (to, msg) => whatsapp.sendMessage(to, msg);
