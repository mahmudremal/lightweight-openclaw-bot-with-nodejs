import fs from "fs-extra";
import path from "path";
import {
  ROOT_DIR,
  getWorkspacePath,
  getActiveWorkspaceId,
} from "../core/workspace.js";

export const PROJECT_APPLICATION_DIR = "D:\workspace\remal-bot";

const DEFAULT_GLOBAL_CONFIG = JSON.parse(
  fs.readFileSync(path.resolve(".romi", "config.json")),
);

function mergeDeep(target, source) {
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
        output[key] = mergeDeep(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

async function loadGlobalConfig() {
  const configPath = path.join(ROOT_DIR, "config.json");
  let globalConfig = {};

  await fs.ensureDir(ROOT_DIR);

  if (await fs.pathExists(configPath)) {
    try {
      globalConfig = await fs.readJson(configPath);
    } catch (error) {
      console.error(
        `Error reading global config.json at ${configPath}:`,
        error,
      );
      globalConfig = {};
    }
  } else {
    await fs.writeJson(configPath, DEFAULT_GLOBAL_CONFIG, { spaces: 2 });
    console.log(`Created default global config.json at ${configPath}`);
  }
  return mergeDeep(DEFAULT_GLOBAL_CONFIG, globalConfig);
}

async function loadWorkspaceConfig(workspaceId) {
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
      console.error(
        `Error reading workspace config.json for '${workspaceId}' at ${workspaceConfigPath}:`,
        error,
      );
      workspaceConfig = {};
    }
  } else {
    // await fs.writeJson(workspaceConfigPath, {}, { spaces: 2 });
    // console.log(
    //   `Created empty workspace config.json for '${workspaceId}' at ${workspaceConfigPath}`,
    // );
  }
  return workspaceConfig;
}

let _activeConfig = null;

export async function getActiveConfig() {
  if (_activeConfig) {
    return _activeConfig;
  }

  const globalConfig = await loadGlobalConfig();
  const workspaceId = getActiveWorkspaceId();
  const workspaceConfig = await loadWorkspaceConfig(workspaceId);

  _activeConfig = mergeDeep(globalConfig, workspaceConfig);
  return _activeConfig;
}

export function invalidateActiveConfigCache() {
  _activeConfig = null;
}
