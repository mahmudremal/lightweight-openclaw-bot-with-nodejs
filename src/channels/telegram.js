import { Telegraf } from "telegraf";
import config from "../config/index.js";
import logger from "../utils/logger.js";
import { processMessage } from "../core/agent.js";
import Formatter from "../utils/formatter.js";
import fs from "fs-extra";
import path from "path";
import skillManager from "../core/skillManager.js";
import { getWorkspacePath, getActiveWorkspaceId } from "../core/workspace.js";
import preprocessor from "../utils/preprocessor.js";

class Telegram {
  constructor() {
    this.needConnection = true;
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
      ctx.reply("Romi is here. How can I help you today?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📜 List Skills", callback_data: "list_skills" }],
            [{ text: "📁 List Files", callback_data: "list_files" }],
          ],
        },
      });
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
          // Expansion logic (similar to terminal)
          const expandedBody = await this.preProcessInput(body);

          // Send typing action
          await ctx.sendChatAction("typing");

          // Natural delay to give user time to read/start typing
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const reply = await processMessage(expandedBody, {
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

    this.setupHandlers();

    this.bot
      .launch()
      .then(async () => {
        this.retryCount = 0;
        logger.log("TELEGRAM", "Telegram bot started");
        await this.updateCommands().catch((err) =>
          logger.error("TELEGRAM", "Error setting commands:", err),
        );
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
  async preProcessInput(text) {
    return preprocessor.expandMentions(text);
  }

  setupHandlers() {
    // Inline query handler for autocompletion (triggered by @botname)
    this.bot.on("inline_query", async (ctx) => {
      const query = ctx.inlineQuery.query;
      const workspaceId = getActiveWorkspaceId();
      const workspacePath = getWorkspacePath(workspaceId);
      const results = [];

      try {
        // Skills
        const skills = await skillManager.getWorkspaceSkills(workspaceId);
        skills.forEach((s) => {
          if (!query || s.name.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              type: "article",
              id: `skill:${s.name}`,
              title: `Skill: /${s.name}`,
              description: s.description || "Run this skill",
              input_message_content: { message_text: `/${s.name}` },
            });
          }
        });

        // Files
        if (fs.existsSync(workspacePath)) {
          const files = fs
            .readdirSync(workspacePath)
            .filter((f) => fs.statSync(path.join(workspacePath, f)).isFile());
          files.forEach((f) => {
            if (!query || f.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                type: "article",
                id: `file:${f}`,
                title: `File: @${f}`,
                description: `Include content of ${f}`,
                input_message_content: { message_text: `@${f}` },
              });
            }
          });
        }

        await ctx.answerInlineQuery(results.slice(0, 50));
      } catch (err) {
        logger.error("TELEGRAM", "Inline query error:", err);
      }
    });

    // Callback query handler
    this.bot.on("callback_query", async (ctx) => {
      const data = ctx.callbackQuery.data;
      const workspaceId = getActiveWorkspaceId();

      if (data === "list_skills") {
        const skills = await skillManager.getWorkspaceSkills(workspaceId);
        if (skills.length === 0) {
          return ctx.answerCbQuery("No skills installed.");
        }
        const buttons = skills.map((s) => [
          { text: `/${s.name}`, callback_data: `run_skill:${s.name}` },
        ]);
        await ctx.editMessageText("Available Skills:", {
          reply_markup: { inline_keyboard: buttons },
        });
      } else if (data === "list_files") {
        const workspacePath = getWorkspacePath(workspaceId);
        if (fs.existsSync(workspacePath)) {
          const files = fs
            .readdirSync(workspacePath)
            .filter((f) => fs.statSync(path.join(workspacePath, f)).isFile());
          if (files.length === 0) {
            return ctx.answerCbQuery("No files in workspace.");
          }
          const buttons = files
            .slice(0, 50)
            .map((f) => [
              { text: `@${f}`, callback_data: `mention_file:${f}` },
            ]);
          await ctx.editMessageText("Workspace Files:", {
            reply_markup: { inline_keyboard: buttons },
          });
        }
      } else if (data.startsWith("run_skill:")) {
        const skill = data.split(":")[1];
        await ctx.answerCbQuery(`Use /${skill} to run this skill.`);
        await ctx.reply(`/${skill}`);
      } else if (data.startsWith("mention_file:")) {
        const file = data.split(":")[1];
        await ctx.answerCbQuery(`Mentioned @${file}`);
        await ctx.reply(`@${file}`);
      }
    });

    // Explicit command handlers for skills
    this.bot.command("skills", async (ctx) => {
      const workspaceId = getActiveWorkspaceId();
      const skills = await skillManager.getWorkspaceSkills(workspaceId);
      const text = skills
        .map((s) => `/${s.name} - ${s.description}`)
        .join("\n");
      await ctx.reply(text || "No skills found.");
    });

    this.bot.command("files", async (ctx) => {
      const workspaceId = getActiveWorkspaceId();
      const workspacePath = getWorkspacePath(workspaceId);
      if (fs.existsSync(workspacePath)) {
        const files = fs
          .readdirSync(workspacePath)
          .filter((f) => fs.statSync(path.join(workspacePath, f)).isFile());
        const text = files.map((f) => `@${f}`).join("\n");
        await ctx.reply(text || "No files found.");
      }
    });
  }

  async updateCommands() {
    if (!this.bot) return;
    try {
      const workspaceId = getActiveWorkspaceId();
      const skills = await skillManager.getWorkspaceSkills(workspaceId);
      const commands = skills.map((s) => ({
        command: s.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"), // TG rules
        description: s.description.substring(0, 100) || `Run skill ${s.name}`,
      }));

      // Add default commands
      if (commands.length < 100) {
        commands.push({ command: "start", description: "Start the bot" });
      }

      await this.bot.telegram.setMyCommands(commands.slice(0, 100));
      logger.log(
        "TELEGRAM",
        `Registered ${commands.length} skills as commands`,
      );
    } catch (err) {
      logger.error("TELEGRAM", "Failed to update bot commands:", err.message);
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
