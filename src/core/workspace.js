import fs from "fs-extra";
import path from "path";
import os from "os";
import { invalidateActiveConfigCache } from "../config/index.js";

export const ROOT_DIR = path.resolve(os.homedir(), ".romi");
export const WORKSPACES_DIR = path.resolve(ROOT_DIR, "workspaces");

let activeWorkspaceId = "default";

export function setActiveWorkspace(id) {
  if (activeWorkspaceId !== id) {
    activeWorkspaceId = id;
    invalidateActiveConfigCache();
  }
}

export function getActiveWorkspaceId() {
  return activeWorkspaceId;
}

export function getWorkspacePath(workspaceId = activeWorkspaceId) {
  return path.resolve(WORKSPACES_DIR, workspaceId);
}

export async function listWorkspaces() {
  await fs.ensureDir(WORKSPACES_DIR);
  const entries = await fs.readdir(WORKSPACES_DIR, { withFileTypes: true });
  return entries
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

async function ensureDefaultWorkspaceFiles(dir) {
  const defaults = {};

  for (const [file, content] of Object.entries(defaults)) {
    const filePath = path.join(dir, file);
    if (!(await fs.pathExists(filePath))) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, "utf8");
    }
  }
}

export async function createWorkspace(workspaceId) {
  const targetPath = getWorkspacePath(workspaceId);
  if (await fs.pathExists(targetPath)) {
    throw new Error(`Workspace '${workspaceId}' already exists.`);
  }

  const projectWorkspaceTemplatePath = path.resolve(process.cwd(), "workspace");

  // Copy contents of the project's workspace template to the target workspace, EXCLUDING the 'skills' directory
  await fs.copy(projectWorkspaceTemplatePath, targetPath, {
    overwrite: false,
    errorOnExist: false,
    filter: (src, dest) => {
      // Exclude copying the 'skills' directory from the template
      const relativePath = path.relative(projectWorkspaceTemplatePath, src);
      return relativePath !== "skills";
    },
  });

  await fs.ensureDir(path.join(targetPath, "memory"));
  await ensureDefaultWorkspaceFiles(targetPath);
  // Ensure the workspace's skills directory exists, but it should be empty
  await fs.ensureDir(path.join(targetPath, "skills"));
}

export function readWorkspaceFile(filename, workspaceId = activeWorkspaceId) {
  const filePath = path.join(getWorkspacePath(workspaceId), filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf8");
  }
  return "";
}

export function writeWorkspaceFile(
  filename,
  content,
  workspaceId = activeWorkspaceId,
) {
  const filePath = path.join(getWorkspacePath(workspaceId), filename);
  fs.ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

export function loadAgentContext(workspaceId = activeWorkspaceId) {
  const workspacePath = getWorkspacePath(workspaceId);
  if (!fs.existsSync(workspacePath)) return "";

  let files = fs.readdirSync(workspacePath).filter((i) => i.endsWith(".md"));
  // here i think we need to do a thing (maybe), like if `BOOTSTRAP.md` file exists, that means we need to focus on that like so like reducing some files will solve token burns and focus on getting information about him? see below i tried a bit
  if (files.includes("BOOTSTRAP.md")) {
    files = files.filter((f) => !["SKILLS.md", "HEARTBEAT.md"].includes(f));
  }

  const toSortList = [
    "BOOTSTRAP.md",
    "AGENT.md",
    "IDENTITY.md",
    "SOUL.md",
    "SKILLS.md",
    "TOOLS.md",
    "USER.md",
    "HEARTBEAT.md",
    "memory/MEMORY.md",
    // this is my prediction if it's work better but upto you decide.
  ];
  // Sort files based on toSortList
  const sortedFiles = files.sort((a, b) => {
    const indexA = toSortList.indexOf(a);
    const indexB = toSortList.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.localeCompare(b);
  });

  const parts = sortedFiles
    .map((f) => {
      const content = fs.readFileSync(path.join(workspacePath, f), "utf8");
      if (content.trim()) {
        return content;
      }
      return null;
    })
    .filter((c) => c);

  return parts.join("\n\n---\n\n");
}

export function isInitialized() {
  return fs.existsSync(ROOT_DIR);
}
