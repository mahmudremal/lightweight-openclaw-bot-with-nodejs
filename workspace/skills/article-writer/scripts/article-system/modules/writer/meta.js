import roles from "../../core/roles.js";

class Meta {
  async generate(topic, keywords) {
    const prompt = `Generate title, meta description, and slug for "${topic}".
    Keywords: ${JSON.stringify(keywords)}
    Return strict JSON with fields: title, description, slug.`;
    
    const response = await roles.writer(prompt, true);
    return JSON.parse(response);
  }
}

export default new Meta();