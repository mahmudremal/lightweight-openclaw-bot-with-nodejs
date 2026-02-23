/**
 * Web Search Tool
 * Search the web using DuckDuckGo
 */

import { performSearch } from "./duckduckgo.js";

export default {
  name: "search",
  description: "Search the web using DuckDuckGo. Use this to find information, answer questions about current events, or research topics.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query"
      },
    },
    required: ["query"],
  },
  handler: async (args) => {
    const { query } = args;
    if (!query) {
      return "❌ Search query is required";
    }

    const items = await performSearch(query);
    if (!items || items.length === 0) {
      return "No results found";
    }

    return items
      .slice(0, 5)
      .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}`)
      .join("\n\n");
  },
};