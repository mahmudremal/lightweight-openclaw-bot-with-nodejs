import { performSearch } from "../tools/duckduckgo.js";
import { handleWeatherSkill } from "../skills/weather.js";
import { readLongTermMemory, writeLongTermMemory } from "./memory.js";

export async function dispatchToolCall(json) {
  if (json.tool === "search" && json.query) {
    const items = await performSearch(json.query);
    return (
      `Search results for "${json.query}":\n` +
      items
        .slice(0, 5)
        .map((r, i) => `${i + 1}. ${r.title}\n${r.url}`)
        .join("\n\n")
    );
  }

  if (json.tool === "weather" && (json.lat || json.place)) {
    return await handleWeatherSkill({
      lat: json.lat,
      lon: json.lon,
      place: json.place,
    });
  }

  if (json.tool === "remember" && json.content) {
    const existing = readLongTermMemory();
    const timestamp = new Date().toISOString().split("T")[0];
    const newEntry = `\n- [${timestamp}] ${json.content}`;
    const updated = existing.trimEnd() + newEntry + "\n";
    writeLongTermMemory(updated);
    return `✅ Saved to memory: ${json.content}`;
  }

  if (json.tool === "recall") {
    const memory = readLongTermMemory();
    if (!memory || memory.trim() === "# Long-term Memory") {
      return "No memories stored yet.";
    }
    return `Here's what I remember:\n\n${memory}`;
  }

  return null;
}
