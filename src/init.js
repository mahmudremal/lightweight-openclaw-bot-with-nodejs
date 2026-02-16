import fs from "fs-extra";
import path from "path";

export async function initProject(dir = ".") {
  const base = path.resolve(dir);
  await fs.ensureDir(base);

  const cfg = {
    name: "romi-project",
    channels: {
      whatsapp: {
        provider: "twilio",
        from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886",
      },
    },
    llm: { provider: "openai" },
    tools: { search: "duckduckgo" },
    server: { port: 8123 },
  };

  const cronjobs = [
    { name: "morning", schedule: "0 8 * * *", message: "Good morning!" },
  ];

  const cfgPath = path.join(base, "romi.config.json");
  if (!(await fs.pathExists(cfgPath))) {
    await fs.writeJson(cfgPath, { ...cfg, cron: cronjobs }, { spaces: 2 });
  }

  const envPath = path.join(base, ".env");
  if (!(await fs.pathExists(envPath))) {
    const exampleEnv = path.join(base, ".env.example");
    if (await fs.pathExists(exampleEnv)) {
      await fs.copy(exampleEnv, envPath);
    }
  }
}
