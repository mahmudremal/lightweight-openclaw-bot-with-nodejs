import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const APP_SOURCE_DIR = path.resolve(__dirname, "../../");
export const ROOT_DIR = path.resolve(os.homedir(), ".romi");
export const WORKSPACES_DIR = path.resolve(ROOT_DIR, "workspaces");

export function getWorkspacePath(workspaceId) {
  if (!workspaceId) return WORKSPACES_DIR;
  return path.resolve(WORKSPACES_DIR, workspaceId);
}
