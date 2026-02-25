#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import Table from "cli-table3";
dotenv.config();

import { startServer } from "../src/server.js";
import cron from "../src/scheduler/cron.js";
import heartbeat from "../src/scheduler/heartbeat.js";
import channels from "../src/channels/index.js";
import { startChat } from "../src/channels/terminal.js";
import { initProject } from "../src/init.js";
import { processMessage } from "../src/core/agent.js";
import { initializeTools } from "../src/tools/index.js";
import {
  setActiveWorkspace,
  listWorkspaces,
  createWorkspace,
  getActiveWorkspaceId,
  isInitialized,
  resolveWorkspace,
} from "../src/core/workspace.js";
import {
  getWorkspaceSkills,
  getInstallableSkills,
  installSkill,
  removeSkill,
} from "../src/core/skillManager.js";
import {
  listProviders,
  addProvider,
  toggleProvider,
} from "../src/core/providerManager.js";
import browser from "../src/utils/browser.js";
import logger from "../src/utils/logger.js";
import readline from "readline";
import path from "path";

const PORT = 8123;
const program = new Command();
program
  .name("romi")
  .description("Romi — lightweight AI agent")
  .version("0.1.1");

// Initialize tools on startup
initializeTools();

async function cleanup() {
  logger.log("ROMI", "\nShutting down...");
  try {
    if (heartbeat) heartbeat.stop();
    if (cron) cron.stop();
    await browser.close();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: (line) => {
    // Basic autocomplete for / (skills) and @ (files)
    const lastWord = line.split(/\s+/).pop();

    if (lastWord.startsWith("/")) {
      const skillsDir = path.resolve(process.cwd(), "workspace", "skills");
      if (fs.existsSync(skillsDir)) {
        const skills = fs
          .readdirSync(skillsDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => `/${d.name}`);
        const hits = skills.filter((s) => s.startsWith(lastWord));
        return [hits.length ? hits : skills, lastWord];
      }
    }

    if (lastWord.startsWith("@")) {
      const dir = process.cwd();
      const files = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((f) => !f.isDirectory())
        .map((f) => `@${f.name}`);
      const hits = files.filter((f) => f.startsWith(lastWord));
      return [hits.length ? hits : files, lastWord];
    }

    return [[], line];
  },
});

import fs from "fs";

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

program
  .command("start")
  .description("Start server + scheduler + heartbeat + whatsapp")
  .option("-p, --port <n>", "server port", PORT)
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (opts) => {
    await resolveWorkspace(opts.workspace);
    logger.info(
      "ROMI",
      `Starting services in workspace: '${getActiveWorkspaceId()}'`,
    );

    startServer(Number(opts.port));
    await cron.init();
    await heartbeat.start();
    await channels.init();
  });

program
  .command("chat")
  .description("Interactive terminal chat with Romi")
  .option("-w, --workspace <name>", "Specify the workspace to chat in")
  .action(async (opts) => {
    const workspaceName = await resolveWorkspace(opts.workspace, askQuestion);
    logger.info("ROMI", `Chatting in workspace: '${workspaceName}'`);
    startChat(rl);
  });

program
  .command("ask <message...>")
  .description("Send a single message and get a reply")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (message, opts) => {
    const workspaceName = await resolveWorkspace(opts.workspace);
    logger.info("ROMI", `Using workspace: '${workspaceName}' for ask command.`);

    const text = Array.isArray(message) ? message.join(" ") : message;
    try {
      const reply = await processMessage(text, {
        channel: "cli",
        from: "cli:user",
      });
      logger.log("ROMI", reply);
      process.exit(0);
    } catch (err) {
      logger.error("ROMI", err.message);
      process.exit(1);
    }
  });

program
  .command("server")
  .description("Start webhook server only")
  .option("-p, --port <n>", "server port", PORT)
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (opts) => {
    const workspaceName = await resolveWorkspace(opts.workspace);
    logger.info("ROMI", `Starting server in workspace: '${workspaceName}'`);
    startServer(Number(opts.port));
  });

program
  .command("cron")
  .description("Start scheduler")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (opts) => {
    const workspaceName = await resolveWorkspace(opts.workspace);
    logger.info(
      "ROMI",
      `Starting cron scheduler in workspace: '${workspaceName}'`,
    );
    await cron.init();
  });

program
  .command("send <to> <message...>")
  .description("Send a WhatsApp message")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (to, message, opts) => {
    const workspaceName = await resolveWorkspace(opts.workspace);
    logger.info(
      "ROMI",
      `Using workspace: '${workspaceName}' for send command.`,
    );

    try {
      const whatsapp = channels.getChannel("whatsapp");
      await whatsapp.sendMessage(
        to,
        Array.isArray(message) ? message.join(" ") : message,
      );
      logger.log("ROMI", "Message sent.");
      process.exit(0);
    } catch (err) {
      logger.error("ROMI", err.message);
      process.exit(1);
    }
  });

program
  .command("dashboard")
  .description("Open dashboard web interface")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (to, message, opts) => {
    try {
      // like an url will open on default browser `http://localhost:${config.dashboard.port}?token={config.dashboard.token}`
      logger.log("ROMI", "Dashboard Opened.");
      process.exit(0);
    } catch (err) {
      logger.error("ROMI", err.message);
      process.exit(1);
    }
  });

const skills = program
  .command("skills")
  .description("Manage skills in the current workspace");

skills
  .command("list")
  .description("List all skills")
  .action(async () => {
    const installable = await getInstallableSkills();
    const table = new Table({ head: ["Name", "Emoji", "Description"] });
    installable.forEach((s) =>
      table.push([s.name, s.emoji || "", s.description]),
    );
    console.log(table.toString());
    process.exit(0);
  });

skills
  .command("installed")
  .description("List installed skills")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (opts) => {
    const activeWorkspaceId = await resolveWorkspace(opts.workspace);
    const installed = await getWorkspaceSkills(activeWorkspaceId);
    if (installed.length === 0) {
      logger.info(
        "ROMI",
        `No skills installed in workspace '${activeWorkspaceId}'.`,
      );
    } else {
      const table = new Table({ head: ["Name", "Emoji", "Description"] });
      installed.forEach((s) =>
        table.push([s.name, s.emoji || "", s.description]),
      );
      console.log(table.toString());
    }
    process.exit(0);
  });

skills
  .command("available")
  .description("List available skills not yet installed")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (opts) => {
    const activeWorkspaceId = await resolveWorkspace(opts.workspace);
    const installed = await getWorkspaceSkills(activeWorkspaceId);
    const all = await getInstallableSkills();
    const installedNames = installed.map((s) => s.name);
    const available = all.filter((s) => !installedNames.includes(s.name));
    const table = new Table({ head: ["Name", "Emoji", "Description"] });
    available.forEach((s) =>
      table.push([s.name, s.emoji || "", s.description]),
    );
    console.log(table.toString());
    process.exit(0);
  });

skills
  .command("install <skillName>")
  .description("Install a skill")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (skillName, opts) => {
    const activeWorkspaceId = await resolveWorkspace(opts.workspace);
    try {
      const result = await installSkill(skillName, activeWorkspaceId);
      console.log(result);
      logger.log("ROMI", result);
    } catch (error) {
      logger.error("ROMI", `Failed to install: ${error.message}`);
    }
    process.exit(0);
  });

skills
  .command("remove <skillName>")
  .description("Remove a skill")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (skillName, opts) => {
    const activeWorkspaceId = await resolveWorkspace(opts.workspace);
    try {
      const result = await removeSkill(skillName, activeWorkspaceId);
      logger.log("ROMI", result);
    } catch (error) {
      logger.error("ROMI", `Failed to remove: ${error.message}`);
    }
    process.exit(0);
  });

// Providers management
const providers = program
  .command("providers")
  .description("Manage message providers (active/inactive)");

providers
  .command("list")
  .description("List all message providers")
  .action(async () => {
    const list = await listProviders();
    const table = new Table({ head: ["Name", "Status"] });
    list.forEach((p) =>
      table.push([p.name, p.active ? "Active ✅" : "Inactive ❌"]),
    );
    console.log(table.toString());
    process.exit(0);
  });

providers
  .command("add <name>")
  .description("Add/Activate a provider")
  .action(async (name) => {
    const result = await addProvider(name);
    logger.info("ROMI", result);
    process.exit(0);
  });

program
  .command("init [dir]")
  .description("Initialize a Romi project and workspace")
  .action(async (dir = "default") => {
    await initProject();
    if (dir !== "default") {
      try {
        await createWorkspace(dir);
        logger.log("ROMI", `Created new workspace: '${dir}'`);
      } catch (error) {
        if (error.message.includes("already exists")) {
          logger.warn("ROMI", `Workspace '${dir}' already exists.`);
        } else {
          logger.error(
            "ROMI",
            `Error creating workspace '${dir}': ${error.message}`,
          );
          process.exit(1);
        }
      }
    } else {
      logger.log("ROMI", `Ensured default workspace is initialized.`);
    }
    process.exit(0);
  });

program.parse(process.argv);

process.on("exit", () => {
  rl.close();
});
