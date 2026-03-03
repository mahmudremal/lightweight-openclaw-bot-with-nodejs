import { Telegraf } from "telegraf";
import config from "../config/index.js";
import logger from "../utils/logger.js";
import { processMessage } from "../core/agent.js";
import Formatter from "../utils/formatter.js";

class Telegram {
  constructor() {
    this.bot = null;
    this.retryCount = 0;
    this.reconnectTimeout = null;
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

        const senderName =
          ctx.from.first_name || ctx.from.username || String(senderId);

        const isOwner =
          tgConfig.human?.some(
            (h) =>
              h === String(senderId) ||
              (username && h.toLowerCase() === username.toLowerCase()),
          ) || false;

        const isAllowed =
          !tgConfig.allow_from ||
          tgConfig.allow_from.length === 0 ||
          tgConfig.allow_from.some(
            (h) =>
              h === String(senderId) ||
              (username && h.toLowerCase() === username.toLowerCase()),
          );

        const isGroup = ctx.chat.type !== "private";

        if (!isAllowed) {
          logger.debug(
            "TELEGRAM",
            `Ignoring message from ${senderName} (not in allow_from)`,
          );
          return;
        }

        logger.log(
          "TELEGRAM",
          `[TG] ${isGroup ? "[GROUP] " : ""}${from} (from: ${senderName}) -> ${body}`,
        );

        try {
          // Send typing action
          await ctx.sendChatAction("typing");

          // Natural delay to give user time to read/start typing
          await new Promise((resolve) => setTimeout(resolve, 2000));

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
      } catch (err) {
        logger.error("TELEGRAM", "Fatal error in message event:", err);
      }
    });

    this.bot
      .launch()
      .then(() => {
        this.retryCount = 0;
        logger.log("TELEGRAM", "Telegram bot started");
      })
      .catch((err) => {
        logger.error("TELEGRAM", "Failed to start Telegram bot:", err);
        this.retryCount++;
        const delays = [2000, 4000, 30000, 60000];
        const delay = delays[Math.min(this.retryCount - 1, delays.length - 1)];

        logger.info(
          "TELEGRAM",
          `Retrying connection in ${delay / 1000}s (Attempt ${this.retryCount})`,
        );
        this.bot = null;
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.init(), delay);
      });

    // Enable graceful stop
    const stopBot = () => {
      if (this.bot && this.bot.polling && this.bot.polling.started) {
        try {
          this.bot.stop("SIGINT");
        } catch (e) {
          // Ignore "Bot is not running" error
        }
      }
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
    };

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
  async stop() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.bot) {
      try {
        if (this.bot.polling && this.bot.polling.started) {
          await this.bot.stop();
        }
      } catch (err) {
        // Ignore "already stopped"
      }
      this.bot = null;
    }
  }
}

const telegram = new Telegram();
export default telegram;
