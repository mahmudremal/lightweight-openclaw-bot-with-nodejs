export default {
  roles: {
    planner: {
      model: process.env.PLANNER_MODEL || "gpt-4o",
      apiKey: process.env.PLANNER_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: process.env.PLANNER_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.4
    },
    researcher: {
      model: process.env.RESEARCHER_MODEL || "gpt-4o-mini",
      apiKey: process.env.RESEARCHER_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: process.env.RESEARCHER_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.3
    },
    writer: {
      model: process.env.WRITER_MODEL || "claude-3-5-sonnet-20240620",
      apiKey: process.env.WRITER_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: process.env.WRITER_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.8
    },
    editor: {
      model: process.env.EDITOR_MODEL || "gpt-4o",
      apiKey: process.env.EDITOR_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: process.env.EDITOR_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.6
    },
    graphicsDesigner: {
      model: process.env.DESIGNER_MODEL || "gpt-4o",
      apiKey: process.env.DESIGNER_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: process.env.DESIGNER_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.7
    }
  }
};