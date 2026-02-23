import fs from "fs-extra";
import path from "path";
import { ROOT_DIR } from "./workspace.js";
import channels from "../channels/index.js";

class ProviderManager {
  constructor() {
    this.CONFIG_PATH = path.join(ROOT_DIR, "config.json");
  }

  async listProviders() {
    return await channels.availableChannels();
  }

  async toggleProvider(name, active) {
    let config = {};
    if (await fs.pathExists(this.CONFIG_PATH)) {
      config = await fs.readJson(this.CONFIG_PATH);
    }

    if (!config.channels) config.channels = {};
    if (!config.channels[name]) {
      config.channels[name] = { enabled: active };
    } else {
      config.channels[name].enabled = active;
    }

    await fs.writeJson(this.CONFIG_PATH, config, { spaces: 2 });
    return `Provider '${name}' is now ${active ? "active" : "inactive"}.`;
  }

  async addProvider(name) {
    let config = {};
    if (await fs.pathExists(this.CONFIG_PATH)) {
      config = await fs.readJson(this.CONFIG_PATH);
    }

    if (!config.channels) config.channels = {};
    if (config.channels[name]) {
      return `Provider '${name}' already exists.`;
    }

    config.channels[name] = { enabled: true };
    await fs.writeJson(this.CONFIG_PATH, config, { spaces: 2 });
    return `Provider '${name}' added and activated.`;
  }
}

const providerManager = new ProviderManager();
export default providerManager;

export const listProviders = () => providerManager.listProviders();
export const toggleProvider = (n, a) => providerManager.toggleProvider(n, a);
export const addProvider = (n) => providerManager.addProvider(n);
