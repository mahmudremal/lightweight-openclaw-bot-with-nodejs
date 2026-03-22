import config from "../config/index.js";
import logger from "../utils/logger.js";

class OpenAIProvider {
  constructor() {}

  async createChatCompletion(args) {
    const activeConfig = await config.getActiveConfig();
    const defaults = activeConfig.agents?.defaults || {};

    // Use recursive fallback system if 'models' config exists and no explicit model is provided
    if (defaults.models && !args.model) {
      return this._executeWithFallback(args, defaults.models);
    }

    // Default legacy path
    return this._executeCompletion(args);
  }

  async _executeWithFallback(args, modelConfig) {
    try {
      logger.debug(
        `LLM Attempt: model=${modelConfig.model}, provider=${modelConfig.provider}`,
      );
      return await this._executeCompletion({
        ...args,
        model: modelConfig.model,
        providerName: modelConfig.provider,
      });
    } catch (err) {
      if (modelConfig.fallback) {
        logger.warn(
          "LLM_FALLBACK",
          `Model ${modelConfig.model} failed. Falling back to ${modelConfig.fallback.model}. Error: ${err.message}`,
        );
        return this._executeWithFallback(args, modelConfig.fallback);
      }
      logger.error("LLM_FATAL", "All model fallbacks failed.");
      throw err;
    }
  }

  async _executeCompletion({
    messages,
    model = null,
    temperature = null,
    max_tokens = null,
    tools = null,
    tool_choice = null,
    providerName = "openai",
  }) {
    const activeConfig = await config.getActiveConfig();

    // Use provider-specific settings based on modelConfig.provider
    const API_KEY = activeConfig.providers?.[providerName]?.api_key || "dummy";
    const API_BASE_URL =
      activeConfig.providers?.[providerName]?.api_base ||
      "http://localhost:11434/v1";

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
      // body.tool_choice = tool_choice || "auto";
      body.tools = tools;
    }

    logger.info("LLM_REQUEST", {
      provider: providerName,
      model: body.model,
      tools_count: body.tools?.length || 0,
    });

    // console.log(
    //   JSON.stringify(
    //     { ...body, tools: body?.tools.map((t) => t.function.name) },
    //     null,
    //     2,
    //   ),
    // );

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
      let errorDetail = text;
      try {
        const json = JSON.parse(text);
        errorDetail = json.error?.message || json.message || text;
      } catch (e) {}
      throw new Error(`OpenAI API error (${resp.status}): ${errorDetail}`);
    }

    const data = await resp.json();
    const message = data.choices?.[0]?.message;

    if (!message) {
      throw new Error("Invalid response from LLM (no message choice)");
    }

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
