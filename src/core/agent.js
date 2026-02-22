import { openaiCreateChatCompletion } from "../providers/openai.js";
import { loadAgentContext } from "./workspace.js";
import { dispatchToolCall, getToolsSchema } from "./dispatcher.js";
import { appendHistory } from "./memory.js";

const conversationHistory = new Map();
const MAX_HISTORY = 20;

function getHistory(sessionKey) {
  if (!conversationHistory.has(sessionKey)) {
    conversationHistory.set(sessionKey, []);
  }
  return conversationHistory.get(sessionKey);
}

function addToHistory(sessionKey, message) {
  const history = getHistory(sessionKey);
  history.push(message);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

export async function processMessage(
  text,
  { channel = "cli", from = "user" } = {},
) {
  const timestamp = new Date().toISOString();
  const sessionKey = `${channel}:${from}`;
  appendHistory(`[${timestamp}] [${channel}] ${from}: ${text}`);

  const systemPrompt = loadAgentContext();
  addToHistory(sessionKey, { role: "user", content: text });

  const messages = [
    { role: "system", content: systemPrompt },
    ...getHistory(sessionKey),
  ];

  const tools = getToolsSchema();
  const response = await openaiCreateChatCompletion({ messages, tools });
  const content = response?.content || "";

  let toolCall = null;

  // 1. Check for native tool calls
  if (response?.tool_calls && response.tool_calls.length > 0) {
    const call = response.tool_calls[0].function;
    try {
      toolCall = {
        tool: call.name,
        args: JSON.parse(call.arguments),
      };
    } catch (e) {
      console.error("Failed to parse native tool arguments", e);
    }
  }

  // 2. Fallback to text-based JSON parsing (as per original logic)
  if (!toolCall && content) {
    try {
      const cleaned = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const maybeJSON = JSON.parse(cleaned);
      if (maybeJSON.tool) {
        toolCall = maybeJSON;
      }
    } catch (err) {
      // not JSON — normal text response
    }
  }

  if (toolCall) {
    const toolResult = await dispatchToolCall(toolCall);
    console.log(`[Tool Call: ${toolCall.tool}]`, toolCall.args);

    if (toolResult) {
      addToHistory(sessionKey, {
        role: "assistant",
        content: content || `[used tool: ${toolCall.tool}]`,
      });
      addToHistory(sessionKey, {
        role: "system",
        content: `Tool result: ${toolResult}. Respond naturally.`,
      });

      const followUp = [
        { role: "system", content: systemPrompt },
        ...getHistory(sessionKey),
      ];

      const finalResponse = await openaiCreateChatCompletion({
        messages: followUp,
        tools,
      });
      const finalReply = finalResponse?.content || toolResult;

      addToHistory(sessionKey, { role: "assistant", content: finalReply });
      appendHistory(
        `[${timestamp}] [romi] -> ${from}: ${finalReply.substring(0, 200)}`,
      );
      return finalReply;
    }
  }

  addToHistory(sessionKey, { role: "assistant", content });
  appendHistory(
    `[${timestamp}] [romi] -> ${from}: ${content.substring(0, 200)}`,
  );
  return content;
}
