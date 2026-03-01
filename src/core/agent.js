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
  }

  getHistory(sessionKey) {
    if (!this.conversationHistory.has(sessionKey)) {
      this.conversationHistory.set(sessionKey, []);
    }
    return this.conversationHistory.get(sessionKey);
  }

  addToHistory(sessionKey, message) {
    const history = this.getHistory(sessionKey);
    history.push(message);
    if (history.length > this.MAX_HISTORY) {
      history.splice(0, history.length - this.MAX_HISTORY);
    }
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
    const sessionKey = `${channel}:${from}`;
    const logText = senderName ? `${senderName}: ${text}` : text;
    appendHistory(
      `[${timestamp}] [${channel}] ${from} (${senderName || "user"}): ${text}`,
    );

    let systemPrompt = await workspace.loadAgentContext();

    // Context additions based on channel and user
    let contextAdditions = `\n\n### Current Context\n- Channel: ${channel}\n- Conversation ID: ${from}\n`;
    if (senderName) contextAdditions += `- Current Speaker: ${senderName}\n`;

    if (options.isGroup) {
      contextAdditions += `- Type: Group Chat\n`;
    } else {
      contextAdditions += `- Type: Private Chat\n`;
    }

    if (options.isOwner) {
      contextAdditions += `- User Status: OWNER (This is your creator/master. You must follow their commands explicitly.)\n`;
    } else {
      contextAdditions += `- User Status: EXTERNAL USER (You are an AI assistant acting on behalf of your owner. Be helpful but polite.)\n`;
    }

    contextAdditions += `\nWhen replying to the user on this same channel, simply respond with your message directly - do NOT use the send_message tool. The send_message tool is only for sending messages to OTHER channels or users.`;

    systemPrompt += contextAdditions;

    this.addToHistory(sessionKey, { role: "user", content: logText });

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

      this.addToHistory(sessionKey, response);
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
          content: String(r.result),
        };
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
