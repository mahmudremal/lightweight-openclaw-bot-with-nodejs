import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs-extra";
import browser from "../utils/browser.js";
import { processMessage } from "../core/agent.js";

let client = null;

export async function startWhatsAppClient() {
  if (client) return client;

  const storagePath = path.resolve(process.cwd(), "storage", "browser-data");
  fs.ensureDirSync(storagePath);

  const browserInstance = await browser.getBrowser();
  const browserWSEndpoint = browserInstance.wsEndpoint();

  client = new Client({
    authStrategy: new LocalAuth({ clientId: "romi", dataPath: storagePath }),
    authTimeoutMs: 120000,
    puppeteer: {
      browserWSEndpoint,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    },
  });

  client.on("qr", (qr) => qrcode.generate(qr, { small: true }));

  client.on("ready", () => console.log("WhatsApp client ready"));

  client.on("auth_failure", (msg) =>
    console.error("WhatsApp auth failure:", msg),
  );

  client.on("disconnected", (reason) =>
    console.warn("WhatsApp client disconnected:", reason),
  );

  client.on("message", async (msg) => {
    try {
      const from = `whatsapp:${msg.from}`;
      const body = msg.body || "";
      console.log(`[WA] ${from} -> ${body}`);
      const reply = await processMessage(body, { channel: "whatsapp", from });
      if (reply) await sendWhatsApp(from, reply);
    } catch (err) {
      console.error("Error handling incoming WA message:", err);
    }
  });

  await client
    .initialize()
    .catch((err) =>
      console.error("Failed to initialize WhatsApp client:", err),
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
    console.error("sendWhatsApp error:", err.message);
    throw err;
  }
}
