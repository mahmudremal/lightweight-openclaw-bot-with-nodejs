import roles from "../../core/roles.js";

class Seed {
  async generate(topic) {
    const prompt = `Generate 20 SEO seed keywords for: ${topic}. Return comma separated.`;
    const response = await roles.researcher(prompt);
    return response.split(",").map(k => k.trim());
  }
}

export default new Seed();