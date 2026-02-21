import axios from "axios";
import { getActiveConfig } from "../config/index.js";

export async function performSearch(query) {
  const config = await getActiveConfig();
  const maxResults = config.tools.duckduckgo?.max_results || 5;

  try {
    const res = await axios.get("https://api.duckduckgo.com/", {
      params: {
        q: query,
        format: "json",
        no_redirect: 1,
        no_html: 1,
        skip_disambig: 1,
      },
      timeout: 10000,
    });
    const data = res.data;
    const results = [];

    if (data.AbstractURL) {
      results.push({
        title: data.Heading || data.AbstractText || query,
        url: data.AbstractURL,
        snippet: data.AbstractText || "",
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, maxResults).forEach((t) => {
        if (t.FirstURL)
          results.push({
            title: t.Text || t.Name || query,
            url: t.FirstURL,
            snippet: t.Text || "",
          });
        else if (t.Topics) {
          t.Topics.slice(0, 3).forEach((sub) => {
            if (sub.FirstURL)
              results.push({
                title: sub.Text || query,
                url: sub.FirstURL,
                snippet: sub.Text || "",
              });
          });
        }
      });
    }

    if (results.length === 0) {
      results.push({
        title: `DuckDuckGo Search for "${query}"`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: "",
      });
    }
    return results;
  } catch (err) {
    return [
      {
        title: `DuckDuckGo Search for "${query}"`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: "",
      },
    ];
  }
}
