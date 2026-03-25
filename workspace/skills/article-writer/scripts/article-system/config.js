const PROCESSENV = {
  PLANNER_MODEL: "jewelzufo/unsloth_granite-4.0-h-350m-GGUF",
  PLANNER_API_KEY: "ollama",
  PLANNER_BASE_URL: "http://localhost:11434/v1",
  RESEARCHER_MODEL: "jewelzufo/unsloth_granite-4.0-h-350m-GGUF",
  RESEARCHER_API_KEY: "ollama",
  RESEARCHER_BASE_URL: "http://localhost:11434/v1",
  WRITER_MODEL: "jewelzufo/unsloth_granite-4.0-h-350m-GGUF",
  WRITER_API_KEY: "ollama",
  WRITER_BASE_URL: "http://localhost:11434/v1",
  EDITOR_MODEL: "jewelzufo/unsloth_granite-4.0-h-350m-GGUF",
  EDITOR_API_KEY: "ollama",
  EDITOR_BASE_URL: "http://localhost:11434/v1",
  DESIGNER_MODEL: "jewelzufo/unsloth_granite-4.0-h-350m-GGUF",
  DESIGNER_API_KEY: "ollama",
  DESIGNER_BASE_URL: "http://localhost:11434/v1",
};

export default {
  roles: {
    planner: {
      model: PROCESSENV.PLANNER_MODEL || "gpt-4o",
      apiKey: PROCESSENV.PLANNER_API_KEY || PROCESSENV.OPENAI_API_KEY,
      baseUrl: PROCESSENV.PLANNER_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.4,
    },
    researcher: {
      model: PROCESSENV.RESEARCHER_MODEL || "gpt-4o-mini",
      apiKey: PROCESSENV.RESEARCHER_API_KEY || PROCESSENV.OPENAI_API_KEY,
      baseUrl: PROCESSENV.RESEARCHER_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.3,
    },
    writer: {
      model: PROCESSENV.WRITER_MODEL || "claude-3-5-sonnet-20240620",
      apiKey: PROCESSENV.WRITER_API_KEY || PROCESSENV.OPENAI_API_KEY,
      baseUrl: PROCESSENV.WRITER_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.8,
    },
    editor: {
      model: PROCESSENV.EDITOR_MODEL || "gpt-4o",
      apiKey: PROCESSENV.EDITOR_API_KEY || PROCESSENV.OPENAI_API_KEY,
      baseUrl: PROCESSENV.EDITOR_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.6,
    },
    graphicsDesigner: {
      model: PROCESSENV.DESIGNER_MODEL || "gpt-4o",
      apiKey: PROCESSENV.DESIGNER_API_KEY || PROCESSENV.OPENAI_API_KEY,
      baseUrl: PROCESSENV.DESIGNER_BASE_URL || "https://api.openai.com/v1",
      temperature: 0.7,
    },
  },
};
