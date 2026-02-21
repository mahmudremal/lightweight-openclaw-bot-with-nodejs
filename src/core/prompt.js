import { loadAgentContext } from "./workspace.js";

export async function buildSystemPrompt() {
  return loadAgentContext();
}
