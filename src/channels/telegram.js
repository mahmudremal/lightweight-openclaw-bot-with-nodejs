import { Telegraf } from "telegraf";
import config from "../config/index.js";
import logger from "../utils/logger.js";
import { processMessage } from "../core/agent.js";

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
        const from = `telegram:${ctx.from.id}`;
        const body = ctx.message.text || "";

        if (!body) return; // Ignore non-text messages for now

        logger.log("TELEGRAM", `[TG] ${from} -> ${body}`);

        const reply = await processMessage(body, {
          channel: "telegram",
          from,
          ctx,
        });

        if (reply) await ctx.reply(reply);
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
      return await this.bot.telegram.sendMessage(to, message);
    } catch (err) {
      logger.error("TELEGRAM", "sendMessage error:", err.message);
      throw err;
    }
  }
}

const telegram = new Telegram();
export default telegram;
