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

  async processMessage(text, { channel = "cli", from = "user" } = {}) {
    const timestamp = new Date().toISOString();
    const sessionKey = `${channel}:${from}`;
    appendHistory(`[${timestamp}] [${channel}] ${from}: ${text}`);

    const systemPrompt = workspace.loadAgentContext();
    this.addToHistory(sessionKey, { role: "user", content: text });

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
      logger.warn("AGENT", `Max iterations reached.`);
      lastContent += "\n\n[Reached maximum reasoning steps.]";
    }

    appendHistory(
      `[${timestamp}] [romi] -> ${from}: ${lastContent?.substring(0, 200)}`,
    );

    // Token optimization: Compact tool results after the turn is complete
    // We keep the last assistant message but can prune the intermediate tool outputs
    // to keep the history clean for future turns while maintaining context relevance.
    const history = this.getHistory(sessionKey);
    // Optional: Prune tool messages if history is getting long.
    // For now, the existing MAX_HISTORY will handle overflow.

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
