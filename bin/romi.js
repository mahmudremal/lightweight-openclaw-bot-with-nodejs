#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
dotenv.config();

import { startServer } from "../src/server.js";
import { startCron } from "../src/scheduler/cron.js";
import { HeartbeatService } from "../src/scheduler/heartbeat.js";
import { startWhatsAppClient, sendWhatsApp } from "../src/channels/whatsapp.js";
import { startChat } from "../src/channels/terminal.js";
import { initProject } from "../src/init.js";
import { processMessage } from "../src/core/agent.js";
import { ensureWorkspace } from "../src/core/workspace.js";
import browser from "../src/utils/browser.js";

const PORT = 8123;
const program = new Command();
program
  .name("romi")
  .description("Romi — lightweight AI agent")
  .version("0.1.1");

let heartbeat = null;

async function cleanup() {
  console.log("\nShutting down...");
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

program
  .command("start")
  .description("Start server + scheduler + heartbeat + whatsapp")
  .option("-p, --port <n>", "server port", PORT)
  .action(async (opts) => {
    ensureWorkspace();
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
  .action(() => {
    ensureWorkspace();
    startChat();
  });

program
  .command("ask <message...>")
  .description("Send a single message and get a reply")
  .action(async (message) => {
    ensureWorkspace();
    const text = Array.isArray(message) ? message.join(" ") : message;
    try {
      const reply = await processMessage(text, {
        channel: "cli",
        from: "cli:user",
      });
      console.log(reply);
      process.exit(0);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  });

program
  .command("server")
  .description("Start webhook server only")
  .option("-p, --port <n>", "server port", PORT)
  .action(async (opts) => startServer(Number(opts.port)));

program
  .command("cron")
  .description("Start scheduler")
  .action(async () => startCron());

program
  .command("send <to> <message...>")
  .description("Send a WhatsApp message")
  .action(async (to, message) => {
    try {
      await sendWhatsApp(
        to,
        Array.isArray(message) ? message.join(" ") : message,
      );
      console.log("Message sent.");
      process.exit(0);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  });

program
  .command("init [dir]")
  .description("Initialize a Romi project and workspace")
  .action(async (dir = ".") => {
    await initProject(dir);
    ensureWorkspace();
    console.log("Initialized Romi project in", dir);
  });

program.parse(process.argv);
