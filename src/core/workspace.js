import fs from "fs-extra";
import path from "path";
import os from "os";
import config from "../config/index.js";

export const ROOT_DIR = path.resolve(os.homedir(), ".romi");
export const WORKSPACES_DIR = path.resolve(ROOT_DIR, "workspaces");

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
    return path.resolve(WORKSPACES_DIR, workspaceId);
  }

  async listWorkspaces() {
    await fs.ensureDir(WORKSPACES_DIR);
    const entries = await fs.readdir(WORKSPACES_DIR, { withFileTypes: true });
    return entries
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  }

  async ensureDefaultWorkspaceFiles(dir) {
    const defaults = {};
    for (const [file, content] of Object.entries(defaults)) {
      const filePath = path.join(dir, file);
      if (!(await fs.pathExists(filePath))) {
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content, "utf8");
      }
    }
  }

  async createWorkspace(workspaceId) {
    const targetPath = this.getWorkspacePath(workspaceId);
    if (await fs.pathExists(targetPath)) {
      throw new Error(`Workspace '${workspaceId}' already exists.`);
    }

    const projectWorkspaceTemplatePath = path.resolve(
      process.cwd(),
      "workspace",
    );

    await fs.copy(projectWorkspaceTemplatePath, targetPath, {
      overwrite: false,
      errorOnExist: false,
      filter: (src, dest) => {
        const relativePath = path.relative(projectWorkspaceTemplatePath, src);
        return relativePath !== "skills";
      },
    });

    await fs.ensureDir(path.join(targetPath, "memory"));
    await this.ensureDefaultWorkspaceFiles(targetPath);
    await fs.ensureDir(path.join(targetPath, "skills"));
  }

  readWorkspaceFile(filename, workspaceId = this.activeWorkspaceId) {
    const filePath = path.join(this.getWorkspacePath(workspaceId), filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
    return "";
  }

  writeWorkspaceFile(filename, content, workspaceId = this.activeWorkspaceId) {
    const filePath = path.join(this.getWorkspacePath(workspaceId), filename);
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf8");
  }

  loadAgentContext(workspaceId = this.activeWorkspaceId) {
    const workspacePath = this.getWorkspacePath(workspaceId);
    if (!fs.existsSync(workspacePath)) return "";

    const excludedList = [];
    let files = fs
      .readdirSync(workspacePath)
      .filter((i) => i.endsWith(".md"))
      .filter((i) => !excludedList.includes(i));

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
    ];

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

    const memoryGuidance = `
### Memory and File Conventions
You MUST follow these file naming conventions for saving information:
- Human user information (preferences, name, etc.) -> USER.md
- Your "soul" or personality/beliefs -> SOUL.md
- Your identity, role, and capabilities -> IDENTITY.md
- General long-term memories or facts -> memory/MEMORY.md
- Specific contextual tasks or project info -> memory/[task_name].md

### Project Structure
- src/tools/: Your available tools
- .romi/corn/jobs.json: Storage for scheduled jobs (cron)
- HEARTBEAT.md: Monitored for background tasks you should perform periodically
`;

    return parts.join("\n\n---\n\n") + "\n\n" + memoryGuidance;
  }

  isInitialized() {
    return fs.existsSync(ROOT_DIR);
  }
}

const workspace = new Workspace();
export default workspace;

export const setActiveWorkspace = (id) => workspace.setActiveWorkspace(id);
export const getActiveWorkspaceId = () => workspace.getActiveWorkspaceId();
export const getWorkspacePath = (id) => workspace.getWorkspacePath(id);
export const listWorkspaces = () => workspace.listWorkspaces();
export const createWorkspace = (id) => workspace.createWorkspace(id);
export const readWorkspaceFile = (f, id) => workspace.readWorkspaceFile(f, id);
export const writeWorkspaceFile = (f, c, id) =>
  workspace.writeWorkspaceFile(f, c, id);
export const loadAgentContext = (id) => workspace.loadAgentContext(id);
export const isInitialized = () => workspace.isInitialized();
