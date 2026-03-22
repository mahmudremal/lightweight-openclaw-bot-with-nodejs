import config from "../config.js";

class LLM {
  async run({ role, system, user, json = false }) {
    const roleConfig = config.roles[role];
    const baseUrl = roleConfig.baseUrl ? roleConfig.baseUrl.replace(/\/$/, '') : 'https://api.openai.com/v1';
    const endpoint = `${baseUrl}/chat/completions`;

    const body = {
      model: roleConfig.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: roleConfig.temperature,
    };

    if (json) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${roleConfig.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    if (json && content.startsWith("```")) {
      content = content.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return content;
  }
}

export default new LLM();