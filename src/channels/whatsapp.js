/**
 * Forany confusions, you can get idea how they created
 * picoclaw-main\pkg\channels\whatsapp.go
 */

import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs-extra";
import browser from "../utils/browser.js";
import { processMessage } from "../core/agent.js";
import logger from "../utils/logger.js";
import { ROOT_DIR } from "../core/workspace.js";
import { getActiveConfig } from "../config/index.js";

let client = null;

export async function startWhatsAppClient() {
  if (client) return client;

  const storagePath = path.resolve(ROOT_DIR, "storage", "browser-data");
  await fs.ensureDir(storagePath);

  const browserInstance = await browser.getBrowser();
  const browserWSEndpoint = browserInstance.wsEndpoint();

  const config = await getActiveConfig();

  const puppeteerOpts = config.channels.whatsapp.puppeteer;

  client = new Client({
    authStrategy: new LocalAuth({ clientId: "romi", dataPath: storagePath }),
    authTimeoutMs: 120000,
    puppeteer: {
      browserWSEndpoint,
      ...puppeteerOpts,
    },
  });

  client.on("qr", (qr) => qrcode.generate(qr, { small: true }));

  client.on("ready", () => logger.log("WHATSAPP", "WhatsApp client ready"));

  client.on("auth_failure", (msg) =>
    logger.error("WHATSAPP", "WhatsApp auth failure:", msg),
  );

  client.on("disconnected", (reason) =>
    console.warn("WhatsApp client disconnected:", reason),
  );

  client.on("message", async (msg) => {
    try {
      const from = `whatsapp:${msg.from}`;
      const body = msg.body || "";
      logger.log("WHATSAPP", `[WA] ${from} -> ${body}`);
      const reply = await processMessage(body, { channel: "whatsapp", from });
      if (reply) await sendWhatsApp(from, reply);
    } catch (err) {
      logger.error("WHATSAPP", "Error handling incoming WA message:", err);
    }
  });

  await client
    .initialize()
    .catch((err) =>
      logger.error("WHATSAPP", "Failed to initialize WhatsApp client:", err),
    );
  return client;
}

export async function sendWhatsApp(to, message) {
  if (!client) throw new Error("WhatsApp client not initialized.");

  let chatId = to;
  if (typeof to === "string") {
    if (to.startsWith("whatsapp:")) {
      const n = to.split(":")[1];
      chatId = `${n.replace("+", "")}@c.us`;
    } else if (/^\+?\d+$/.test(to)) {
      chatId = `${to.replace("+", "")}@c.us`;
    }
  }

  try {
    return await client.sendMessage(chatId, message);
  } catch (err) {
    logger.error("WHATSAPP", "sendWhatsApp error:", err.message);
    throw err;
  }
}
