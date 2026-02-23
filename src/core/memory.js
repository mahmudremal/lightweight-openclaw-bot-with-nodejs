import fs from "fs-extra";
import path from "path";
import { getWorkspacePath } from "./workspace.js";

const memoryDir = path.join(getWorkspacePath(), "memory");
const historyFile = path.join(memoryDir, "HISTORY.md");

export function appendHistory(entry) {
  fs.ensureDirSync(memoryDir);
  fs.appendFileSync(historyFile, entry.trimEnd() + "\n\n", "utf8");
}
