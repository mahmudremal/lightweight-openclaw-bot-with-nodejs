import { getActiveConfig } from "../config/index.js";
import fs from "fs-extra";
import path from "path";
import { ROOT_DIR } from "./workspace.js";

const CONFIG_PATH = path.join(ROOT_DIR, "config.json");

export async function listProviders() {
  const config = await getActiveConfig();
  const channels = config.channels || {};

  // For now, we define what providers are available in the system
  // This could be dynamic based on files in src/channels
  const available = ["whatsapp", "telegram", "slack", "discord"];

  return available.map((name) => ({
    name,
    active: !!(channels[name] && channels[name].enabled),
  }));
}

export async function toggleProvider(name, active) {
  let config = {};
  if (await fs.pathExists(CONFIG_PATH)) {
    config = await fs.readJson(CONFIG_PATH);
  }

  if (!config.channels) config.channels = {};
  if (!config.channels[name]) {
    config.channels[name] = { enabled: active };
  } else {
    config.channels[name].enabled = active;
  }

  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
  return `Provider '${name}' is now ${active ? "active" : "inactive"}.`;
}

export async function addProvider(name) {
  let config = {};
  if (await fs.pathExists(CONFIG_PATH)) {
    config = await fs.readJson(CONFIG_PATH);
  }

  if (!config.channels) config.channels = {};
  if (config.channels[name]) {
    return `Provider '${name}' already exists.`;
  }

  config.channels[name] = { enabled: true };
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
  return `Provider '${name}' added and activated.`;
}
