import { openaiCreateChatCompletion } from "../providers/openai.js";
import { loadAgentContext } from "./workspace.js";
import { dispatchToolCall } from "./dispatcher.js";
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

  // No direct intent extraction, let the model handle tool calls via TOOLS.md prompt
  const systemPrompt = loadAgentContext();
  addToHistory(sessionKey, { role: "user", content: text });

  const messages = [
    { role: "system", content: systemPrompt },
    ...getHistory(sessionKey),
  ];

  const content =
    (await openaiCreateChatCompletion({ messages })) || "No response.";

  let toolCall = null;
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

  if (toolCall) {
    const toolResult = await dispatchToolCall(toolCall);
    if (toolResult) {
      addToHistory(sessionKey, {
        role: "assistant",
        content: `[used tool: ${toolCall.tool}]`,
      });
      addToHistory(sessionKey, {
        role: "system",
        content: `Tool result: ${toolResult}. Respond naturally.`,
      });

      const followUp = [
        { role: "system", content: systemPrompt },
        ...getHistory(sessionKey),
      ];

      const finalReply =
        (await openaiCreateChatCompletion({ messages: followUp })) ||
        toolResult;
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
