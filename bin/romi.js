#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import Table from "cli-table3";
dotenv.config();

import { startServer } from "../src/server.js";
import { startCron } from "../src/scheduler/cron.js";
import { HeartbeatService } from "../src/scheduler/heartbeat.js";
import { startWhatsAppClient, sendWhatsApp } from "../src/channels/whatsapp.js";
import { startChat } from "../src/channels/terminal.js";
import { initProject } from "../src/init.js";
import { processMessage } from "../src/core/agent.js";
import {
  setActiveWorkspace,
  listWorkspaces,
  createWorkspace,
  getActiveWorkspaceId,
  isInitialized,
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

let heartbeat = null;

async function cleanup() {
  logger.log("ROMI", "\nShutting down...");
  try {
    if (heartbeat) heartbeat.stop();
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
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

program
  .command("start")
  .description("Start server + scheduler + heartbeat + whatsapp")
  .option("-p, --port <n>", "server port", PORT)
  .action(async (opts) => {
    setActiveWorkspace("default");
    logger.info("ROMI", `Starting services in default workspace.`);

    startServer(Number(opts.port));
    startCron();

    heartbeat = new HeartbeatService({
      onHeartbeat: async (prompt) => {
        return await processMessage(prompt, {
          channel: "heartbeat",
          from: "system",
        });
      },
    });
    heartbeat.start();

    await startWhatsAppClient();
  });

program
  .command("chat")
  .description("Interactive terminal chat with Romi")
  .option("-w, --workspace <name>", "Specify the workspace to chat in")
  .action(async (opts) => {
    let workspaceName = opts.workspace;

    if (!workspaceName) {
      const workspaces = await listWorkspaces();
      if (workspaces.length === 0) {
        logger.info(
          "ROMI",
          "No workspaces found. Creating a 'default' workspace.",
        );
        await createWorkspace("default");
        workspaceName = "default";
      } else if (workspaces.length === 1) {
        workspaceName = workspaces[0];
        logger.info(
          "ROMI",
          `Automatically selected workspace: '${workspaceName}'`,
        );
      } else {
        logger.info("ROMI", "Available workspaces:");
        workspaces.forEach((ws, index) =>
          logger.info("ROMI", `  ${index + 1}. ${ws}`),
        );
        const answer = await askQuestion(
          "Enter the number of the workspace you want to use, or type a new name to create one: ",
        );
        const selectedIndex = parseInt(answer, 10) - 1;

        if (
          !isNaN(selectedIndex) &&
          selectedIndex >= 0 &&
          selectedIndex < workspaces.length
        ) {
          workspaceName = workspaces[selectedIndex];
        } else {
          workspaceName = answer.trim();
          try {
            await createWorkspace(workspaceName);
            logger.info("ROMI", `Created new workspace: '${workspaceName}'`);
          } catch (error) {
            if (error.message.includes("already exists")) {
              logger.info(
                "ROMI",
                `Workspace '${workspaceName}' already exists. Using it.`,
              );
            } else {
              logger.error(
                "ROMI",
                `Error creating workspace '${workspaceName}': ${error.message}`,
              );
              process.exit(1);
            }
          }
        }
      }
    }

    const allWorkspaces = await listWorkspaces();
    if (!allWorkspaces.includes(workspaceName)) {
      logger.error(
        "ROMI",
        `Workspace '${workspaceName}' not found. Please create it first or choose an existing one.`,
      );
      process.exit(1);
    }

    setActiveWorkspace(workspaceName);
    logger.info("ROMI", `Chatting in workspace: '${workspaceName}'`);
    startChat(rl);
  });

program
  .command("ask <message...>")
  .description("Send a single message and get a reply")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (message, opts) => {
    let workspaceName = opts.workspace || "default";

    const allWorkspaces = await listWorkspaces();
    if (!allWorkspaces.includes(workspaceName)) {
      logger.error(
        "ROMI",
        `Workspace '${workspaceName}' not found. Please create it first or choose an existing one.`,
      );
      process.exit(1);
    }
    setActiveWorkspace(workspaceName);
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
  .action(async (opts) => {
    setActiveWorkspace("default");
    logger.info("ROMI", `Starting server in default workspace.`);
    startServer(Number(opts.port));
  });

program
  .command("cron")
  .description("Start scheduler")
  .action(async () => {
    setActiveWorkspace("default");
    logger.info("ROMI", `Starting cron scheduler in default workspace.`);
    startCron();
  });

program
  .command("send <to> <message...>")
  .description("Send a WhatsApp message")
  .option("-w, --workspace <name>", "Specify the workspace to use")
  .action(async (to, message, opts) => {
    let workspaceName = opts.workspace || "default";

    const allWorkspaces = await listWorkspaces();
    if (!allWorkspaces.includes(workspaceName)) {
      logger.error(
        "ROMI",
        `Workspace '${workspaceName}' not found. Please create it first or choose an existing one.`,
      );
      process.exit(1);
    }
    setActiveWorkspace(workspaceName);
    logger.info(
      "ROMI",
      `Using workspace: '${workspaceName}' for send command.`,
    );

    try {
      await sendWhatsApp(
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
  .action(async () => {
    const activeWorkspaceId = getActiveWorkspaceId();
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
  .action(async () => {
    const activeWorkspaceId = getActiveWorkspaceId();
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
  .action(async (skillName) => {
    const activeWorkspaceId = getActiveWorkspaceId();
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
  .action(async (skillName) => {
    const activeWorkspaceId = getActiveWorkspaceId();
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
