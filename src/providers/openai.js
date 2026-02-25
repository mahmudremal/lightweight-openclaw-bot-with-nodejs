import config from "../config/index.js";
import logger from "../utils/logger.js";

class OpenAIProvider {
  constructor() {}

  async createChatCompletion({
    messages,
    model = null,
    temperature = null,
    max_tokens = null,
    tools = null,
    tool_choice = null,
  }) {
    const activeConfig = await config.getActiveConfig();

    const API_KEY = activeConfig.providers?.openai?.api_key || "dummy";
    const API_BASE_URL =
      activeConfig.providers?.openai?.api_base || "http://localhost:11434/v1";

    const defaultModel = activeConfig.agents?.defaults?.model || "qwen3:0.6b";
    const defaultTemperature =
      activeConfig.agents?.defaults?.temperature ?? 0.7;
    const defaultMaxTokens = activeConfig.agents?.defaults?.max_tokens || 2048;

    const finalModel = model || defaultModel;
    const finalTemperature = temperature ?? defaultTemperature;
    const finalMaxTokens = max_tokens || defaultMaxTokens;

    const body = {
      model: finalModel,
      messages,
      temperature: finalTemperature,
      max_tokens: finalMaxTokens,
    };

    if (tools && tools.length > 0) {
      body.tool_choice = tool_choice || "auto";
      body.tools = tools;
    }

    logger.debug(
      `LLM Request: model=${finalModel}, tokens=${finalMaxTokens}, temp=${finalTemperature}`,
    );

    logger.info("LLM_REQUEST", {
      model: body.model,
      messages: body.messages.map((m) => ({
        role: m.role,
        content: m.content
          ? m.content.length > 500
            ? m.content.substring(0, 500) + "..."
            : m.content
          : null,
        tool_calls: m.tool_calls,
        tool_call_id: m.tool_call_id,
      })),
      tools_count: body.tools?.length || 0,
    });

    // console.info(body.messages.find(({ role }) => role == "system").content);

    const resp = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      timeout: 180000,
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenAI API error: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    const message = data.choices?.[0]?.message;

    logger.warn("LLM_RESPONSE", data);

    return message;
  }

  async getMaxToolIterations() {
    const agentConfig = await config.getActiveAgentConfig();
    return agentConfig?.max_tool_iterations || 10;
  }
}

const openaiProvider = new OpenAIProvider();
export default openaiProvider;

export const openaiCreateChatCompletion = (args) =>
  openaiProvider.createChatCompletion(args);
export const getMaxToolIterations = () => openaiProvider.getMaxToolIterations();
