#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import fs from "fs";
import readline from "readline";
import path from "path";

dotenv.config();

// CLI Commands
import { registerStartCommand } from "./commands/start.js";
import { registerChatCommands } from "./commands/chat.js";
import { registerSkillsCommands } from "./commands/skills.js";
import { registerChannelsCommands } from "./commands/channels.js";
import { registerBrowsersCommands } from "./commands/browsers.js";
import { registerUtilCommands } from "./commands/utils.js";

// Core Services
import romiServer from "../src/server.js";
import cron from "../src/scheduler/cron.js";
import heartbeat from "../src/scheduler/heartbeat.js";
import channels from "../src/channels/index.js";
import hlBrowser from "../src/utils/browser.js";
import logger from "../src/utils/logger.js";
import { initializeTools } from "../src/tools/index.js";
import workspace, {
  getActiveWorkspaceId,
  getWorkspacePath,
} from "../src/core/workspace.js";
import skillManager from "../src/core/skillManager.js";

class RomiCLI {
  constructor() {
    this.program = new Command();
    this.rl = null;
    this.initialize();
  }

  initialize() {
    this.program
      .name("romi")
      .description("Romi — lightweight AI personal assistant")
      .version("0.1.2");

    // Initialize core tools
    try {
      initializeTools();
    } catch (err) {
      logger.error("CLI", "Failed to initialize tools: " + err.message);
    }

    this.setupReadline();
    this.registerCommands();
    this.handleProcessEvents();
  }

  setupReadline() {
    // Readline is now managed by individual commands to avoid conflicts
  }

  completer(line, callback) {
    const lastWord = line.split(/\s+/).pop();
    if (!lastWord) return callback(null, [[], line]);

    const workspaceId = getActiveWorkspaceId();
    const workspacePath = getWorkspacePath(workspaceId);

    // Use a self-executing async function to handle async calls
    (async () => {
      try {
        // Skills autocomplete
        if (lastWord.startsWith("/")) {
          const skills = await skillManager.getWorkspaceSkills(workspaceId);
          const skillNames = skills.map((s) => `/${s.name}`);
          const hits = skillNames.filter((s) => s.startsWith(lastWord));
          return callback(null, [hits.length ? hits : skillNames, lastWord]);
        }

        // Files autocomplete
        if (lastWord.startsWith("@")) {
          if (fs.existsSync(workspacePath)) {
            const files = fs
              .readdirSync(workspacePath, { withFileTypes: true })
              .filter((f) => !f.isDirectory())
              .map((f) => `@${f.name}`);
            const hits = files.filter((f) => f.startsWith(lastWord));
            return callback(null, [hits.length ? hits : files, lastWord]);
          }
        }
        callback(null, [[], line]);
      } catch (err) {
        callback(null, [[], line]);
      }
    })();
  }

  askQuestion(query) {
    return new Promise((resolve) => this.rl.question(query, resolve));
  }

  registerCommands() {
    const ask = (q) => this.askQuestion(q);

    registerStartCommand(this.program);
    registerChatCommands(this.program, ask);
    registerSkillsCommands(this.program);
    registerChannelsCommands(this.program);
    registerBrowsersCommands(this.program);
    registerUtilCommands(this.program);
  }

  handleProcessEvents() {
    const cleanup = async () => {
      logger.log("ROMI", "\nShutting down gracefully...");
      try {
        if (heartbeat) heartbeat.stop();
        if (cron) cron.stop();
        await channels.stopAll();
        romiServer.stop();
        await hlBrowser.close();
        if (this.rl) this.rl.close();
        process.exit(0);
      } catch (err) {
        logger.error("CLI", "Error during shutdown: " + err.message);
        process.exit(1);
      }
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }

  run() {
    this.program.parse(process.argv);
  }
}

const cli = new RomiCLI();
cli.run();
