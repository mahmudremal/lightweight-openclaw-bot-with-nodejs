import fs from "fs-extra";
import path from "path";
import { getWorkspacePath } from "./workspace.js";

const memoryDir = path.join(getWorkspacePath(), "memory");
const memoryFile = path.join(memoryDir, "MEMORY.md");
const historyFile = path.join(memoryDir, "HISTORY.md");

export function readLongTermMemory() {
  if (fs.existsSync(memoryFile)) {
    return fs.readFileSync(memoryFile, "utf8");
  }
  return "";
}

export function writeLongTermMemory(content) {
  fs.ensureDirSync(memoryDir);
  fs.writeFileSync(memoryFile, content, "utf8");
}

export function appendHistory(entry) {
  fs.ensureDirSync(memoryDir);
  fs.appendFileSync(historyFile, entry.trimEnd() + "\n\n", "utf8");
}

export function getMemoryContext() {
  const longTerm = readLongTermMemory();
  return longTerm ? `## Long-term Memory\n${longTerm}` : "";
}
