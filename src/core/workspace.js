import fs from "fs-extra";
import path from "path";

const WORKSPACE_DIR = path.resolve(process.cwd(), "workspace");

export function getWorkspacePath() {
  return WORKSPACE_DIR;
}

export function readWorkspaceFile(filename) {
  const filePath = path.join(WORKSPACE_DIR, filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf8");
  }
  return "";
}

export function writeWorkspaceFile(filename, content) {
  const filePath = path.join(WORKSPACE_DIR, filename);
  fs.ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

export function loadAgentContext() {
  const soul = readWorkspaceFile("SOUL.md");
  const agents = readWorkspaceFile("AGENTS.md");
  const user = readWorkspaceFile("USER.md");
  const memory = readWorkspaceFile("memory/MEMORY.md");

  const parts = [];
  if (soul) parts.push(soul);
  if (agents) parts.push(agents);
  if (user) parts.push(user);
  if (memory) parts.push(`## Long-term Memory\n${memory}`);
  return parts.join("\n\n---\n\n");
}

export function ensureWorkspace() {
  fs.ensureDirSync(WORKSPACE_DIR);
  fs.ensureDirSync(path.join(WORKSPACE_DIR, "memory"));

  const defaults = {
    "SOUL.md": `# Soul\n\nI am Romi, a lightweight AI personal assistant.\n`,
    "AGENTS.md": `# Agent Instructions\n\nYou are Romi, a helpful AI assistant.\n`,
    "USER.md": `# User Profile\n`,
    "HEARTBEAT.md": `# Heartbeat Tasks\n\n## Active Tasks\n\n## Completed\n`,
    "memory/MEMORY.md": `# Long-term Memory\n`,
  };

  for (const [file, content] of Object.entries(defaults)) {
    const filePath = path.join(WORKSPACE_DIR, file);
    if (!fs.existsSync(filePath)) {
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeFileSync(filePath, content, "utf8");
    }
  }
}
