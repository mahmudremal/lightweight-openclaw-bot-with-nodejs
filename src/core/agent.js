import { openaiCreateChatCompletion } from "../providers/openai.js";
import { buildSystemPrompt } from "./prompt.js";
import { dispatchToolCall } from "./dispatcher.js";
import { appendHistory, readLongTermMemory } from "./memory.js";
import { extractIntent, shouldInjectMemory } from "./intent.js";
import { performSearch } from "../tools/duckduckgo.js";
import { handleWeatherSkill } from "../skills/weather.js";

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

async function routeSimple(text) {
  if (/^weather\b/i.test(text) || /^weather:/i.test(text)) {
    const parts = text.replace(/^weather[:\s]*/i, "").trim();
    const coordMatch = parts.match(/(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)/);
    let lat, lon, place;
    if (coordMatch) {
      lat = Number(coordMatch[1]);
      lon = Number(coordMatch[3]);
    } else {
      place = parts || "current location";
    }
    return await handleWeatherSkill({ lat, lon, place });
  }

  if (/^search[:\s]+/i.test(text) || /^search\b/i.test(text)) {
    const query = text.replace(/^search[:\s]*/i, "");
    const items = await performSearch(query);
    return (
      `Results for "${query}":\n` +
      items
        .slice(0, 5)
        .map((r, i) => `${i + 1}. ${r.title}\n${r.url}`)
        .join("\n\n")
    );
  }

  return null;
}

export async function processMessage(
  text,
  { channel = "cli", from = "user" } = {},
) {
  const timestamp = new Date().toISOString();
  const sessionKey = `${channel}:${from}`;
  appendHistory(`[${timestamp}] [${channel}] ${from}: ${text}`);

  const simpleReply = await routeSimple(text);
  if (simpleReply) {
    appendHistory(
      `[${timestamp}] [romi] -> ${from}: ${simpleReply.substring(0, 200)}`,
    );
    return simpleReply;
  }

  const intent = extractIntent(text);
  if (intent) {
    const toolResult = await dispatchToolCall(intent);
    if (toolResult) {
      addToHistory(sessionKey, { role: "user", content: text });

      const systemPrompt = buildSystemPrompt();
      const memory = readLongTermMemory();
      const memoryContext = memory
        ? `\n\nCurrent memory contents:\n${memory}`
        : "";

      const messages = [
        { role: "system", content: systemPrompt + memoryContext },
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

  const systemPrompt = buildSystemPrompt();
  const memory = shouldInjectMemory(text) ? readLongTermMemory() : "";
  const memoryContext = memory ? `\n\nCurrent memory contents:\n${memory}` : "";

  addToHistory(sessionKey, { role: "user", content: text });

  const messages = [
    { role: "system", content: systemPrompt + memoryContext },
    ...getHistory(sessionKey),
  ];

  const content =
    (await openaiCreateChatCompletion({ messages })) || "No response.";

  let toolResult = null;
  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const maybeJSON = JSON.parse(cleaned);
    if (maybeJSON.tool) {
      toolResult = await dispatchToolCall(maybeJSON);
    }
  } catch (err) {
    // not JSON — normal text response
  }

  if (toolResult) {
    addToHistory(sessionKey, {
      role: "assistant",
      content: `[used ${content}]`,
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
      (await openaiCreateChatCompletion({ messages: followUp })) || toolResult;
    addToHistory(sessionKey, { role: "assistant", content: finalReply });
    appendHistory(
      `[${timestamp}] [romi] -> ${from}: ${finalReply.substring(0, 200)}`,
    );
    return finalReply;
  }

  addToHistory(sessionKey, { role: "assistant", content });
  appendHistory(
    `[${timestamp}] [romi] -> ${from}: ${content.substring(0, 200)}`,
  );
  return content;
}
