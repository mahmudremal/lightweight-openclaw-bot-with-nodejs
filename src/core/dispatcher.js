import { performSearch } from "../tools/duckduckgo.js";
import { readLongTermMemory, writeLongTermMemory } from "./memory.js";
import { getWorkspacePath } from "./workspace.js";
import fs from "fs-extra";
import path from "path";
import logger from "../utils/logger.js";
import { sendWhatsApp } from "../channels/whatsapp.js";

export async function dispatchToolCall(json) {
  // Search tool
  if (json.tool === "search" && json.args?.query) {
    const items = await performSearch(json.args.query);
    return items.slice(0, 5).map((r, i) => `${i+1}. ${r.title}\n${r.url}`).join("\n\n");
  }

  // Remember tool (writes to MEMORY.md)
  if (json.tool === "remember" && json.args?.content) {
    const existing = readLongTermMemory();
    const timestamp = new Date().toISOString().split("T")[0];
    const newEntry = `\n- [${timestamp}] ${json.args.content}`;
    const updated = existing.trimEnd() + newEntry + "\n";
    writeLongTermMemory(updated);
    return `✅ Saved to MEMORY.md: ${json.args.content}`;
  }

  // Recall tool
  if (json.tool === "recall") {
    const memory = readLongTermMemory();
    return memory && memory.trim() !== "# Long-term Memory"
      ? `Here's what I remember:\n\n${memory}`
      : "No memories stored yet.";
  }

  // Update SOUL.md via write_file
  if (json.tool === "update_soul" && json.args?.content) {
    const filePath = path.join(getWorkspacePath(), "SOUL.md");
    await fs.writeFile(filePath, json.args.content, "utf8");
    return `✅ Updated SOUL.md`;
  }

  // Update USER.md via write_file
  if (json.tool === "update_user_profile" && json.args?.content) {
    const filePath = path.join(getWorkspacePath(), "USER.md");
    await fs.writeFile(filePath, json.args.content, "utf8");
    return `✅ Updated USER.md`;
  }

  // Read file directly
  if (json.tool === "read_file" && json.args?.path) {
    const filePath = path.join(getWorkspacePath(), json.args.path);
    if (!filePath.startsWith(getWorkspacePath())) return "❌ Access denied";
    const content = await fs.readFile(filePath, "utf8");
    return `📄 Content of '${json.args.path}':\n${content}`;
  }

  // Write file directly
  if (json.tool === "write_file" && json.args?.path && json.args?.content !== undefined) {
    const filePath = path.join(getWorkspacePath(), json.args.path);
    if (!filePath.startsWith(getWorkspacePath())) return "❌ Access denied";
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, json.args.content, "utf8");
    return `✅ Wrote to '${json.args.path}'`;
  }

  // Append to file directly
  if (json.tool === "append_file" && json.args?.path && json.args?.content !== undefined) {
    const filePath = path.join(getWorkspacePath(), json.args.path);
    if (!filePath.startsWith(getWorkspacePath())) return "❌ Access denied";
    await fs.ensureDir(path.dirname(filePath));
    await fs.appendFile(filePath, json.args.content, "utf8");
    return `✅ Appended to '${json.args.path}'`;
  }

  // Send WhatsApp message
  if (json.tool === "send_whatsapp_message" && json.args?.to && json.args?.message) {
    await sendWhatsApp(json.args.to, json.args.message);
    return `✅ Sent WhatsApp to ${json.args.to}`;
  }

  return `❌ Unknown tool: ${json.tool}`;
}