import { performSearch } from "../tools/duckduckgo.js";
import { getWorkspacePath } from "./workspace.js";
import fs from "fs-extra";
import path from "path";
import logger from "../utils/logger.js";
import { sendWhatsApp } from "../channels/whatsapp.js";

export async function dispatchToolCall(json) {
  const workspacePath = getWorkspacePath();

  // Search tool
  if (json.tool === "search" && json.args?.query) {
    const items = await performSearch(json.args.query);
    return items
      .slice(0, 5)
      .map((r, i) => `${i + 1}. ${r.title}\n${r.url}`)
      .join("\n\n");
  }

  // Read file directly
  if (json.tool === "read_file" && json.args?.path) {
    const filePath = path.resolve(workspacePath, json.args.path);
    if (!filePath.startsWith(workspacePath)) return "❌ Access denied";
    if (!fs.existsSync(filePath)) return "❌ File does not exist";
    const content = await fs.readFile(filePath, "utf8");
    return `📄 Content of '${json.args.path}':\n${content}`;
  }

  // Write file directly
  if (
    json.tool === "write_file" &&
    json.args?.path &&
    json.args?.content !== undefined
  ) {
    const filePath = path.resolve(workspacePath, json.args.path);
    if (!filePath.startsWith(workspacePath)) return "❌ Access denied";
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, json.args.content, "utf8");
    return `✅ Wrote to '${json.args.path}'`;
  }

  // Append to file directly
  if (
    json.tool === "append_file" &&
    json.args?.path &&
    json.args?.content !== undefined
  ) {
    const filePath = path.resolve(workspacePath, json.args.path);
    if (!filePath.startsWith(workspacePath)) return "❌ Access denied";
    await fs.ensureDir(path.dirname(filePath));
    await fs.appendFile(filePath, json.args.content, "utf8");
    return `✅ Appended to '${json.args.path}'`;
  }

  // Read directory
  if (json.tool === "read_dir") {
    const dirPath = path.resolve(workspacePath, json.args?.path || ".");
    if (!dirPath.startsWith(workspacePath)) return "❌ Access denied";
    if (!fs.existsSync(dirPath)) return "❌ Directory does not exist";
    const files = await fs.readdir(dirPath);
    return `📁 Content of '${json.args?.path || "."}':\n${files.join("\n")}`;
  }

  // Generic send_message
  if (
    json.tool === "send_message" &&
    json.args?.channel &&
    json.args?.to &&
    json.args?.message
  ) {
    const { channel, to, message } = json.args;
    if (channel === "whatsapp") {
      await sendWhatsApp(to, message);
      return `✅ Sent WhatsApp message to ${to}`;
    }
    // Add other channels here (telegram, etc.)
    return `❌ Channel ${channel} not supported or implemented yet.`;
  }

  // Generic get_chats
  if (json.tool === "get_chats" && json.args?.channel) {
    const { channel } = json.args;
    if (channel === "whatsapp") {
      // return a placeholder for now or implement if whatsapp.js supports it
      return "✅ Requested chat list for WhatsApp. (Functionality coming soon)";
    }
    return `❌ Channel ${channel} not supported or implemented yet.`;
  }

  // Generic get_messages
  if (json.tool === "get_messages" && json.args?.channel && json.args?.chatId) {
    const { channel, chatId } = json.args;
    if (channel === "whatsapp") {
      return `✅ Requested messages for chat ${chatId} on WhatsApp. (Functionality coming soon)`;
    }
    return `❌ Channel ${channel} not supported or implemented yet.`;
  }

  return `❌ Unknown tool: ${json.tool}`;
}
