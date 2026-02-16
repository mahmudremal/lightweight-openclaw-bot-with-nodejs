import { loadAgentContext } from "./workspace.js";

export function buildSystemPrompt() {
  const workspaceContext = loadAgentContext();

  return `${workspaceContext}

---

You have the following tools available. When you need to use a tool, reply with ONLY a JSON object (no extra text):

1. **search** — Search the web
   {"tool": "search", "query": "your search query"}

2. **weather** — Get weather data
   {"tool": "weather", "lat": 23.8, "lon": 90.4}

3. **remember** — Save important information about the user to long-term memory
   {"tool": "remember", "content": "User's name is Remal Mahmud, a senior software engineer."}

4. **recall** — Read back everything stored in long-term memory
   {"tool": "recall"}

IMPORTANT RULES:
- When the user tells you personal info, preferences, or asks you to remember something, ALWAYS use the remember tool to save it.
- When the user asks if you remember them or their info, use the recall tool first.
- When you need factual info or current events, use search.
- When you need weather, use weather with coordinates.
- For normal conversation, reply with plain text (no JSON).
- NEVER respond with JSON unless you are calling a tool.`;
}
