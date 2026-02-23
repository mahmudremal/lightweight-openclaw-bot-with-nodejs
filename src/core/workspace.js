import fs from "fs-extra";
import path from "path";
import config from "../config/index.js";
import {
  ROOT_DIR,
  WORKSPACES_DIR,
  getWorkspacePath as getBaseWorkspacePath,
  APP_SOURCE_DIR,
} from "./paths.js";
import skillManager from "./skillManager.js";

class Workspace {
  constructor() {
    this.activeWorkspaceId = "default";
  }

  setActiveWorkspace(id) {
    if (this.activeWorkspaceId !== id) {
      this.activeWorkspaceId = id;
      config.invalidateCache();
    }
  }

  getActiveWorkspaceId() {
    return this.activeWorkspaceId;
  }

  getWorkspacePath(workspaceId = this.activeWorkspaceId) {
    return getBaseWorkspacePath(workspaceId);
  }

  async listWorkspaces() {
    await fs.ensureDir(WORKSPACES_DIR);
    const entries = await fs.readdir(WORKSPACES_DIR, { withFileTypes: true });
    return entries
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  }

  async createWorkspace(workspaceId) {
    const targetPath = this.getWorkspacePath(workspaceId);
    if (await fs.pathExists(targetPath))
      throw new Error(`Workspace '${workspaceId}' exists.`);

    const templatePath = path.resolve(APP_SOURCE_DIR, "workspace");
    await fs.copy(templatePath, targetPath, {
      overwrite: false,
      filter: (src) => !path.relative(templatePath, src).startsWith("skills"),
    });

    await fs.ensureDir(path.join(targetPath, "memory"));
    await fs.ensureDir(path.join(targetPath, "skills"));
  }

  readWorkspaceFile(filename, workspaceId = this.activeWorkspaceId) {
    const filePath = path.join(this.getWorkspacePath(workspaceId), filename);
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  }

  writeWorkspaceFile(filename, content, workspaceId = this.activeWorkspaceId) {
    const filePath = path.join(this.getWorkspacePath(workspaceId), filename);
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf8");
  }

  async loadAgentContext(workspaceId = this.activeWorkspaceId) {
    const workspacePath = this.getWorkspacePath(workspaceId);
    if (!fs.existsSync(workspacePath)) return "";

    let files = fs.readdirSync(workspacePath).filter((i) => i.endsWith(".md"));

    if (files.includes("BOOTSTRAP.md")) {
      files = files.filter((f) => !["SKILLS.md", "HEARTBEAT.md"].includes(f));
    }

    const sortOrder = [
      "BOOTSTRAP.md",
      "AGENT.md",
      "IDENTITY.md",
      "SOUL.md",
      "SKILLS.md",
      "TOOLS.md",
      "USER.md",
      "HEARTBEAT.md",
      "memory/MEMORY.md",
    ];

    const sortedFiles = files.sort((a, b) => {
      const idxA = sortOrder.indexOf(a);
      const idxB = sortOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const parts = sortedFiles
      .map((f) => fs.readFileSync(path.join(workspacePath, f), "utf8").trim())
      .filter((c) => c);

    const skills = await skillManager.getWorkspaceSkills(workspaceId);
    if (skills.length > 0) {
      const skillLines = skills
        .map((s) => `- **${s.name}**: ${s.description}`)
        .join("\n");
      parts.push(
        `## Installed Skills\nYou have these skills. For details, read 'skills/[name]/SKILL.md'.\n\n${skillLines}`,
      );
    }

    const memoryGuidance = `
### Memory and File Conventions
- Human user info -> USER.md
- Your "soul"/personality -> SOUL.md
- Your identity -> IDENTITY.md
- Long-term memories -> memory/MEMORY.md
- Task contextual info -> memory/[task_name].md

### Project Structure
- corn/jobs.json: Scheduled jobs
- HEARTBEAT.md: Periodic background tasks
`;

    return parts.join("\n\n---\n\n") + "\n\n" + memoryGuidance;
  }

  isInitialized() {
    return fs.existsSync(ROOT_DIR);
  }
}

const workspace = new Workspace();
export default workspace;

export { ROOT_DIR, WORKSPACES_DIR };
export const getWorkspacePath = (id) => workspace.getWorkspacePath(id);
export const setActiveWorkspace = (id) => workspace.setActiveWorkspace(id);
export const getActiveWorkspaceId = () => workspace.getActiveWorkspaceId();
export const listWorkspaces = () => workspace.listWorkspaces();
export const createWorkspace = (id) => workspace.createWorkspace(id);
export const readWorkspaceFile = (f, id) => workspace.readWorkspaceFile(f, id);
export const writeWorkspaceFile = (f, c, id) =>
  workspace.writeWorkspaceFile(f, c, id);
export const loadAgentContext = (id) => workspace.loadAgentContext(id);
export const isInitialized = () => workspace.isInitialized();
