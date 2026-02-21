export function extractIntent(text) {
  // We can add generic intent extraction here if needed.
  // Currently letting the LLM handle all tool decisions via TOOLS.md context.
  return null;
}

export function shouldInjectMemory(text) {
  // Redundant as loadAgentContext now includes MEMORY.md
  return false;
}
