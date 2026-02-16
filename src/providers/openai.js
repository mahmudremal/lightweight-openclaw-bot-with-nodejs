import dotenv from "dotenv";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_BASE_URL =
  process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1";

if (!OPENAI_API_KEY && OPENAI_API_BASE_URL.includes("api.openai.com")) {
  console.warn("Warning: OPENAI_API_KEY not set.");
}

export async function openaiCreateChatCompletion({
  messages,
  model = process.env.LLM_MODEL_NAME || "romi",
  temperature = 0.2,
  max_tokens = 500,
}) {
  if (!OPENAI_API_KEY && OPENAI_API_BASE_URL.includes("api.openai.com"))
    throw new Error("OPENAI_API_KEY is required for official OpenAI API");

  const resp = await fetch(`${OPENAI_API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY || "dummy"}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
    timeout: 120000,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content;
}
