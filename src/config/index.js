import fs from "fs-extra";
import path from "path";
import { ROOT_DIR, getWorkspacePath, APP_SOURCE_DIR } from "../core/paths.js";
import eventService from "../utils/events.js";
import { getActiveWorkspaceId } from "../core/workspace.js";

class Config {
  constructor() {
    this._activeConfig = null;
    this.DEFAULT_GLOBAL_CONFIG = JSON.parse(
      fs.readFileSync(path.resolve(APP_SOURCE_DIR, ".romi", "config.json")),
    );
  }

  mergeDeep(target, source) {
    const output = { ...target };
    if (
      target &&
      typeof target === "object" &&
      source &&
      typeof source === "object"
    ) {
      Object.keys(source).forEach((key) => {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key]) &&
          target[key] &&
          typeof target[key] === "object" &&
          !Array.isArray(target[key])
        ) {
          output[key] = this.mergeDeep(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  }

  async loadGlobalConfig() {
    const configPath = path.join(ROOT_DIR, "config.json");
    let globalConfig = {};

    await fs.ensureDir(ROOT_DIR);

    if (await fs.pathExists(configPath)) {
      try {
        globalConfig = await fs.readJson(configPath);
      } catch (error) {
        globalConfig = {};
      }
    } else {
      await fs.writeJson(configPath, this.DEFAULT_GLOBAL_CONFIG, { spaces: 2 });
    }
    return this.mergeDeep(this.DEFAULT_GLOBAL_CONFIG, globalConfig);
  }

  async loadWorkspaceConfig(workspaceId) {
    const workspaceConfigPath = path.join(
      getWorkspacePath(workspaceId),
      "config.json",
    );
    let workspaceConfig = {};

    await fs.ensureDir(getWorkspacePath(workspaceId));

    if (await fs.pathExists(workspaceConfigPath)) {
      try {
        workspaceConfig = await fs.readJson(workspaceConfigPath);
      } catch (error) {
        workspaceConfig = {};
      }
    }
    return workspaceConfig;
  }

  async getActiveConfig() {
    if (this._activeConfig) return this._activeConfig;

    const globalConfig = await this.loadGlobalConfig();
    const workspaceId = getActiveWorkspaceId();
    const workspaceConfig = await this.loadWorkspaceConfig(workspaceId);

    this._activeConfig = this.mergeDeep(globalConfig, workspaceConfig);
    return this._activeConfig;
  }

  invalidateCache() {
    this._activeConfig = null;
    eventService.emit("config:invalidated");
  }
}

const config = new Config();
export default config;

export const getActiveConfig = () => config.getActiveConfig();
export const invalidateActiveConfigCache = () => config.invalidateCache();
