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

  async setChannelConfig(channel, key, value) {
    let config = {};
    if (await fs.pathExists(this.CONFIG_PATH)) {
      config = await fs.readJson(this.CONFIG_PATH);
    }

    if (!config.channels) config.channels = {};
    if (!config.channels[channel]) config.channels[channel] = {};

    config.channels[channel][key] = value;

    await fs.writeJson(this.CONFIG_PATH, config, { spaces: 2 });
    return `Config '${key}' for '${channel}' updated to '${value}'.`;
  }

  async getChannelConfig(channel) {
    if (await fs.pathExists(this.CONFIG_PATH)) {
      const config = await fs.readJson(this.CONFIG_PATH);
      return config.channels?.[channel] || {};
    }
    return {};
  }
}

const providerManager = new ProviderManager();
export default providerManager;

export const listProviders = async () => {
  const config = await fs.readJson(path.join(ROOT_DIR, "config.json"));
  return Object.entries(config.channels || {}).map(([name, val]) => ({
    name,
    active: val.enabled,
  }));
};
export const toggleProvider = (n, a) => providerManager.toggleProvider(n, a);
export const addProvider = (n) => providerManager.addProvider(n);
export const setChannelConfig = (c, k, v) =>
  providerManager.setChannelConfig(c, k, v);
export const getChannelConfig = (c) => providerManager.getChannelConfig(c);
