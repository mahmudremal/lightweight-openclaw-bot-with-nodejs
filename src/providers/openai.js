import { getActiveConfig } from "../config/index.js";

export async function openaiCreateChatCompletion({
  messages,
  model,
  temperature,
  max_tokens,
}) {
  const config = await getActiveConfig();

  const API_KEY = config.providers.openai.api_key;
  const API_BASE_URL = config.providers.openai.api_base;

  const defaultModel = config.agents.defaults?.model || "gpt-3.5-turbo";
  const defaultTemperature = config.agents.defaults?.temperature || 0.2;
  const defaultMaxTokens = config.agents.defaults?.max_tokens || 500;

  const finalModel = model || defaultModel;
  const finalTemperature = temperature || defaultTemperature;
  const finalMaxTokens = max_tokens || defaultMaxTokens;

  if (!API_KEY && API_BASE_URL.includes("api.openai.com")) {
    console.warn("Warning: OpenAI API key not set in config.");
  }

  console.log(messages.map(({ content }) => content).join("\n\n"));

  const resp = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY || "dummy"}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: finalModel,
      messages,
      temperature: finalTemperature,
      max_tokens: finalMaxTokens,
    }),
    timeout: 120000,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content;
}
