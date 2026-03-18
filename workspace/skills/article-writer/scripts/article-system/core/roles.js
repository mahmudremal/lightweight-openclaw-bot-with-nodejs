import llm from "./llm.js";

class Roles {
  async planner(user) {
    return llm.run({
      role: "planner",
      system: "You are a senior content strategist. You plan high-performing articles based on SEO, audience intent, and differentiation. Return strict JSON format.",
      user,
      json: true
    });
  }

  async researcher(user, json = false) {
    return llm.run({
      role: "researcher",
      system: "You are a research analyst. You extract structured insights, trends, and gaps from data. Return strict JSON format if requested.",
      user,
      json
    });
  }

  async writer(user, json = false) {
    return llm.run({
      role: "writer",
      system: "You are a professional journalist and writer. You write engaging, human-like, opinionated content with varied structure.",
      user,
      json
    });
  }

  async editor(user, json = false) {
    return llm.run({
      role: "editor",
      system: "You are a strict editor. You improve clarity, remove fluff, fix tone, and ensure the text feels natural and human.",
      user,
      json
    });
  }

  async graphicsDesigner(user, json = false) {
    return llm.run({
      role: "graphicsDesigner",
      system: "You are an expert AI art director and prompt engineer. You create highly detailed, professional, and aesthetically consistent image prompts for DALL-E 3, Midjourney, and Stable Diffusion. Focus on composition, lighting, style, and technical details. Return strict JSON if requested.",
      user,
      json
    });
  }
}

export default new Roles();