import { Telegraf } from "telegraf";
import config from "../config/index.js";
import logger from "../utils/logger.js";
import { processMessage } from "../core/agent.js";
import Formatter from "../utils/formatter.js";

class Telegram {
  constructor() {
    this.bot = null;
  }

  async init() {
    if (this.bot) return this.bot;

    const activeConfig = await config.getActiveConfig();
    const tgConfig = activeConfig.channels?.telegram || {};

    if (!tgConfig.enabled || !tgConfig.token) {
      if (tgConfig.enabled) {
        logger.warn("TELEGRAM", "Telegram enabled but no token provided.");
      } else {
        logger.info("TELEGRAM", "Telegram is disabled in config.");
      }
      return;
    }

    // logger.info("TELEGRAM", "Telegram token is " + tgConfig.token);
    this.bot = new Telegraf(tgConfig.token);

    this.bot.start((ctx) => {
      logger.info(
        "TELEGRAM",
        `New user started bot: ${ctx.from.username || ctx.from.id}`,
      );
      ctx.reply("Romi is here. How can I help you today?");
    });

    this.bot.on("message", async (ctx) => {
      try {
        const from = ctx.chat.id;
        const senderId = ctx.from.id;
        const username = ctx.from.username ? `@${ctx.from.username}` : null;
        const body = ctx.message.text || "";

        if (!body) return; // Ignore non-text messages for now

        const isGroup = ctx.chat.type !== "private";
        const senderName =
          ctx.from.first_name || ctx.from.username || String(senderId);
        const isOwner =
          tgConfig.allow_from?.includes(String(senderId)) ||
          (username && tgConfig.allow_from?.includes(username));

        logger.log(
          "TELEGRAM",
          `[TG] ${isGroup ? "[GROUP] " : ""}${from} (from: ${senderName}) -> ${body}`,
        );

        const reply = await processMessage(body, {
          channel: "telegram",
          from: String(from),
          senderId: String(senderId),
          senderName,
          isGroup,
          isOwner,
          ctx,
        });

        if (reply) {
          await ctx.reply(Formatter.toTelegramHTML(reply), {
            parse_mode: "HTML",
          });
        }
      } catch (err) {
        logger.error("TELEGRAM", "Error handling incoming TG message:", err);
      }
    });

    this.bot
      .launch()
      .then(() => logger.log("TELEGRAM", "Telegram bot started"))
      .catch((err) =>
        logger.error("TELEGRAM", "Failed to start Telegram bot:", err),
      );

    // Enable graceful stop
    process.once("SIGINT", () => this.bot.stop("SIGINT"));
    process.once("SIGTERM", () => this.bot.stop("SIGTERM"));

    return this.bot;
  }

  async sendMessage(to, message) {
    if (!this.bot) {
      await this.init();
    }

    if (!this.bot) throw new Error("Telegram bot not initialized.");

    try {
      // 'to' should be the chat ID
      const formatted = Formatter.toTelegramHTML(message);
      return await this.bot.telegram.sendMessage(to, formatted, {
        parse_mode: "HTML",
      });
    } catch (err) {
      logger.error("TELEGRAM", "sendMessage error:", err.message);
      throw err;
    }
  }
}

const telegram = new Telegram();
export default telegram;
