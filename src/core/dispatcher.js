import { performSearch } from "../tools/duckduckgo.js";
import { getWorkspacePath } from "./workspace.js";
import fs from "fs-extra";
import path from "path";
import logger from "../utils/logger.js";
import { sendWhatsApp } from "../channels/whatsapp.js";
import axios from "axios";

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

  // HTTP Request tool
  if (json.tool === "request" && json.args?.url) {
    const { url, method = "get", data, headers } = json.args;
    try {
      const response = await axios({
        url,
        method,
        data,
        headers,
        timeout: 10000,
      });
      if (typeof response.data === "object") {
        return JSON.stringify(response.data, null, 2);
      }
      return String(response.data);
    } catch (error) {
      return `❌ Request failed: ${error.message}${error.response ? `\nResponse: ${JSON.stringify(error.response.data)}` : ""}`;
    }
  }

  return `❌ Unknown tool: ${json.tool}`;
}

export function getToolsSchema() {
  return [
    {
      type: "function",
      function: {
        name: "search",
        description: "Search the web using DuckDuckGo",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "read_file",
        description: "Read the content of a file from the workspace",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path relative to the workspace",
            },
          },
          required: ["path"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "write_file",
        description:
          "Write content to a file in the workspace (overwrites existing)",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" },
          },
          required: ["path", "content"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "append_file",
        description: "Append content to a file in the workspace",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" },
          },
          required: ["path", "content"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "read_dir",
        description: "List files in a directory",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Directory path relative to workspace",
            },
          },
          required: ["path"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "send_message",
        description: "Send a message via a communication channel",
        parameters: {
          type: "object",
          properties: {
            channel: { type: "string", enum: ["whatsapp"] },
            to: { type: "string", description: "Recipient identifier" },
            message: { type: "string" },
          },
          required: ["channel", "to", "message"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "request",
        description: "Make an HTTP request (replaces curl)",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string" },
            method: {
              type: "string",
              enum: ["get", "post", "put", "delete"],
              default: "get",
            },
            data: { type: "object", description: "Request payload" },
            headers: { type: "object", description: "HTTP headers" },
          },
          required: ["url"],
        },
      },
    },
  ];
}
