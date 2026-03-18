import OpenAI from "openai";
import config from "../config.js";

class LLM {
  constructor() {
    this.clients = {};
  }

  getClient(role) {
    if (this.clients[role]) return this.clients[role];
    const roleConfig = config.roles[role];
    this.clients[role] = new OpenAI({
      apiKey: roleConfig.apiKey,
      baseURL: roleConfig.baseUrl
    });
    return this.clients[role];
  }

  async run({ role, system, user, json = false }) {
    const roleConfig = config.roles[role];
    const client = this.getClient(role);

    const response = await client.chat.completions.create({
      model: roleConfig.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: roleConfig.temperature,
      response_format: json ? { type: "json_object" } : undefined
    });
    
    let content = response.choices[0].message.content.trim();
    if (json && content.startsWith("```")) {
      content = content.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return content;
  }
}

export default new LLM();