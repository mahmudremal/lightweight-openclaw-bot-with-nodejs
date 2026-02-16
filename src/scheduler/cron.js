import node_cron from "node-cron";
import { sendWhatsApp } from "../channels/whatsapp.js";

const jobs = [];

export function startCron() {
  const recipient = process.env.WHATSAPP_TO;
  if (!recipient) {
    console.warn("WHATSAPP_TO not set. Cron will not send messages.");
    return;
  }

  const morningJob = node_cron.schedule("0 8 * * *", async () => {
    try {
      await sendWhatsApp(
        recipient,
        "Good morning! ☀️ How can I help you today?",
      );
    } catch (err) {
      console.error("Cron morning job error:", err.message);
    }
  });

  jobs.push(morningJob);
  console.log("Cron scheduler started.");
}
