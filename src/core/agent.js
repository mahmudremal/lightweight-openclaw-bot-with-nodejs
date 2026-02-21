import { openaiCreateChatCompletion } from "../providers/openai.js";
import { buildSystemPrompt } from "./prompt.js";
import { dispatchToolCall } from "./dispatcher.js";
import { appendHistory, readLongTermMemory } from "./memory.js";
import { extractIntent, shouldInjectMemory } from "./intent.js";
import { performSearch } from "../tools/duckduckgo.js";

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

  // Extract intent from user's raw text for direct tool calls (e.g., from UI buttons)
  const intent = extractIntent(text);
  if (intent) {
    const toolResult = await dispatchToolCall(intent);
    if (toolResult) {
      addToHistory(sessionKey, { role: "user", content: text });

      const systemPrompt = await buildSystemPrompt();

      const messages = [
        { role: "system", content: systemPrompt },
        ...getHistory(sessionKey),
        {
          role: "system",
          content: `Tool "${intent.tool}" was executed. Result: ${toolResult}\nNow respond naturally to the user. Do not mention JSON or tools.`,
        },
      ];

      const reply =
        (await openaiCreateChatCompletion({ messages })) || toolResult;
      addToHistory(sessionKey, { role: "assistant", content: reply });
      appendHistory(
        `[${timestamp}] [romi] -> ${from}: ${reply.substring(0, 200)}`,
      );
      return reply;
    }
  }

  const systemPrompt = await buildSystemPrompt();
  const memory = shouldInjectMemory(text) ? readLongTermMemory() : "";
  const memoryContext = memory ? `\n\nCurrent memory contents:\n${memory}` : "";

  addToHistory(sessionKey, { role: "user", content: text });

  const messages = [
    { role: "system", content: systemPrompt + memoryContext },
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
