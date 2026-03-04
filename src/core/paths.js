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

export function rootify(rawPath) {
  if (!rawPath) return ".";

  // 1. Normalize separators for consistency
  let filePath = rawPath.replace(/\\/g, "/");

  // 2. Remove workspace root markers (e.g. /root/, /home/, ~/, ./)
  filePath = filePath
    .replace(/^\/?root\//i, "")
    .replace(/^\/?home\//i, "")
    .replace(/^~\//, "")
    .replace(/^\.\//, "")
    .replace(/^\//, "");

  // 3. Normalize to prevent directory traversal (e.g. removing ../)
  // We use path.join and path.relative to ensure it's a clean relative path
  const normalized = path.normalize(filePath).replace(/\\/g, "/");

  // If it tries to go up (starts with ..), strip those parts to keep it in root
  return normalized.startsWith("..")
    ? normalized.replace(/^(\.\.\/)+/, "")
    : normalized;
}
