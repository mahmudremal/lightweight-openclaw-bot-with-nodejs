import fs from "fs-extra";
import path from "path";
import { getWorkspacePath } from "./workspace.js";

export function appendHistory(entry) {
  const workspacePath = getWorkspacePath();
  const memoryDir = path.join(workspacePath, "memory");
  const historyFile = path.join(memoryDir, "HISTORY.md");

  fs.ensureDirSync(memoryDir);
  fs.appendFileSync(historyFile, entry.trimEnd() + "\n\n", "utf8");
}
