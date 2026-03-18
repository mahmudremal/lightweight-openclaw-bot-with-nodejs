import {
  openaiCreateChatCompletion,
  getMaxToolIterations,
} from "../providers/openai.js";
import workspace from "./workspace.js";
import {
  dispatchToolCall,
  dispatchToolCalls,
  getToolsSchema,
} from "./dispatcher.js";
import { appendHistory } from "./memory.js";
import logger from "../utils/logger.js";

class Agent {
  constructor() {
    this.conversationHistory = new Map();
    this.MAX_HISTORY = 20;
    this.DEFAULT_MAX_ITERATIONS = 10;
    this.MAX_CONTENT_LENGTH = 200;
  }

  _getSessionFilePath(sessionKey) {
    const safeKey = sessionKey.replace(/[^a-z0-9_-]/gi, "_");
    return `memory/sessions/${safeKey}.json`;
  }

  _trimMessage(message) {
    if (!message.content || typeof message.content !== "string") return message;
    if (message.content.length > this.MAX_CONTENT_LENGTH) {
      message.content =
        message.content.substring(0, this.MAX_CONTENT_LENGTH) + "...";
    }
    return message;
  }

  getHistory(sessionKey) {
    if (!this.conversationHistory.has(sessionKey)) {
      try {
        const filePath = this._getSessionFilePath(sessionKey);
        const data = workspace.readWorkspaceFile(filePath);
        if (data) {
          this.conversationHistory.set(sessionKey, JSON.parse(data));
        } else {
          this.conversationHistory.set(sessionKey, []);
        }
      } catch (err) {
        logger.error("AGENT", `Error loading history for ${sessionKey}:`, err);
        this.conversationHistory.set(sessionKey, []);
      }
    }
    return this.conversationHistory.get(sessionKey);
  }

  saveHistory(sessionKey) {
    try {
      const history = this.getHistory(sessionKey);
      const filePath = this._getSessionFilePath(sessionKey);
      workspace.writeWorkspaceFile(filePath, JSON.stringify(history, null, 2));
    } catch (err) {
      logger.error("AGENT", `Error saving history for ${sessionKey}:`, err);
    }
  }

  addToHistory(sessionKey, message) {
    const history = this.getHistory(sessionKey);
    const trimmed = this._trimMessage({ ...message });
    history.push(trimmed);
    if (history.length > this.MAX_HISTORY) {
      history.splice(0, history.length - this.MAX_HISTORY);
    }
    this.saveHistory(sessionKey);
  }

  parseToolCalls(response) {
    const toolCalls = [];

    if (response?.tool_calls && response.tool_calls.length > 0) {
      for (const call of response.tool_calls) {
        try {
          toolCalls.push({
            id: call.id,
            tool: call.function.name,
            args: JSON.parse(call.function.arguments),
          });
        } catch (e) {
          logger.error("AGENT", "Failed to parse native tool arguments", e);
        }
      }
      return toolCalls;
    }

    const content = response?.content || "";
    try {
      const cleaned = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      const maybeJSON = JSON.parse(cleaned);
      const calls = Array.isArray(maybeJSON)
        ? maybeJSON[0]?.tool
          ? maybeJSON
          : []
        : maybeJSON.tool
          ? [maybeJSON]
          : [];

      for (const call of calls) {
        toolCalls.push({
          id: "call_" + Math.random().toString(36).substring(2, 10),
          tool: call.tool,
          args: call.args || call.arguments || {},
        });
      }
    } catch (err) {}

    return toolCalls;
  }
  async processMessage(text, options = {}) {
    const { channel = "cli", from = "user", senderName, onEvent } = options;
    const timestamp = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString();
    const sessionKey = `${channel}:${from}`;
    const logText = `${senderName || "user"}: ${text}`;
    
    appendHistory(
      `[${timestamp}] [${channel}] ${from} (${senderName || "user"}): ${text}`,
    );

    let systemPrompt = await workspace.loadAgentContext();

    const isBackground = ["cron", "heartbeat", "system"].includes(channel);

    // Context additions based on channel and user
    let contextAdditions = `\n\n### Current Execution Environment\n- Channel: ${channel}\n- Mode: ${isBackground ? "BACKGROUND (AGENTIC)" : "INTERACTIVE (CONVERSATIONAL)"}\n- Conversation ID: ${from}\n- Current Time: ${new Date().toLocaleString()}\n`;

    if (senderName) contextAdditions += `- Current User: ${senderName}\n`;

    if (options.isGroup) {
      contextAdditions += `- Type: Group Chat\n`;
    } else {
      contextAdditions += `- Type: Private Chat\n`;
    }

    if (options.isOwner) {
      contextAdditions += `- User Status: OWNER (Creator/Master)\n`;
    } else {
      contextAdditions += `- User Status: EXTERNAL USER\n`;
    }

    if (isBackground) {
      contextAdditions += `\n> [!IMPORTANT]\n> **YOU ARE IN BACKGROUND MODE.** Your standard text responses are NOT visible to any human. They are only logged for debug purposes.\n> - If you need to alert the owner, request information, or report progress, you MUST use the \`send_message\` tool.\n> - **TARGET**: Refer to \`USER.md\` for the owner's contact information (WhatsApp/Telegram).\n> - DO NOT just write text and expect a reply. Use tools to reach out first.`;
    } else {
      contextAdditions += `\n> [!IMPORTANT]\n> **YOU ARE IN INTERACTIVE MODE.** When replying to the user on this same channel (${channel}), simply respond with your message directly. Do NOT use the \`send_message\` tool for the current conversation. The \`send_message\` tool is only for secondary notifications or cross-channel messaging.`;
    }

    systemPrompt += contextAdditions;

    this.addToHistory(sessionKey, { 
      role: "user", 
      content: `[${timeStr}] ${logText}` 
    });

    const tools = getToolsSchema();
    const maxIterations = await getMaxToolIterations().catch(
      () => this.DEFAULT_MAX_ITERATIONS,
    );
    let iterations = 0;
    let lastContent = "";

    const turnToolsResult = [];

    while (iterations < maxIterations) {
      iterations++;

      const messages = [
        { role: "system", content: systemPrompt },
        ...this.getHistory(sessionKey),
      ];

      logger.debug("AGENT", `Iteration ${iterations}`);
      const response = await openaiCreateChatCompletion({ messages, tools });
      if (!response) break;

      // Add timestamp to assistant response for history
      const assistantMsg = { ...response };
      if (assistantMsg.content) {
        assistantMsg.content = `[${new Date().toLocaleTimeString()}] ${assistantMsg.content}`;
      }
      this.addToHistory(sessionKey, assistantMsg);
      
      if (response.content) {
        lastContent = response.content;
      }

      const toolCalls = this.parseToolCalls(response);

      if (toolCalls.length === 0) {
        break;
      }

      if (onEvent) {
        onEvent({ type: "tool_start", toolCalls });
      }

      logger.info(
        "AGENT",
        `Romi is using ${toolCalls.length} internal tool(s)...`,
      );

      let results;
      if (toolCalls.length === 1) {
        const result = await dispatchToolCall(toolCalls[0]);
        results = [{ ...toolCalls[0], result }];
      } else {
        results = await dispatchToolCalls(toolCalls);
      }

      for (const r of results) {
        logger.info(`TOOL_USE: ${r.tool}`, { args: r.args, result: r.result });
        if (onEvent) {
          onEvent({
            type: "tool_end",
            tool: r.tool,
            args: r.args,
            result: r.result,
          });
        }
        const toolMsg = {
          role: "tool",
          tool_call_id: r.id,
          content:
            typeof r.result === "string"
              ? r.result
              : JSON.stringify(r.result, null, 2),
        };
        // Add timestamp to tool result content
        toolMsg.content = `[${new Date().toLocaleTimeString()}] Result from ${r.tool}: ${toolMsg.content}`;
        
        this.addToHistory(sessionKey, toolMsg);
        turnToolsResult.push(toolMsg);
      }
    }

    if (iterations >= maxIterations) {
      logger.warn("AGENT", `Max iterationsReached.`);
      lastContent += "\n\n[Reached maximum reasoning steps.]";
    }

    appendHistory(
      `[${timestamp}] [romi] -> ${from}: ${lastContent?.substring(0, 200)}`,
    );

    return lastContent;
  }

  clearHistory(sessionKey) {
    if (sessionKey) {
      this.conversationHistory.delete(sessionKey);
    } else {
      this.conversationHistory.clear();
    }
  }
}

const agent = new Agent();
export default agent;

export const processMessage = (t, o) => agent.processMessage(t, o);
export const clearHistory = (s) => agent.clearHistory(s);
