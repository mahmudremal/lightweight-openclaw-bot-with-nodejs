import { getActiveConfig } from "../config/index.js";
import logger from "../utils/logger.js";

export async function openaiCreateChatCompletion({
  messages,
  model,
  temperature,
  max_tokens,
  tools,
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

  const body = {
    temperature: finalTemperature,
    max_tokens: finalMaxTokens,
    model: finalModel,
    messages,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const resp = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY || "dummy"}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    timeout: 120000,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  const message = data.choices?.[0]?.message;
  logger.info("LLM", JSON.stringify(data));
  return message;
}
