import { readLongTermMemory } from "./memory.js";

const REMEMBER_PATTERNS = [
  /(?:remember|save|store|write|note|keep)\s+(?:that|this|me|down|it)?[:\s]*(.+)/i,
  /(?:my name is|i am|i'm|call me)\s+(.+)/i,
  /(?:i work|i do|i build|i develop|i'm a|i am a|my job|my role)\s+(.+)/i,
  /(?:i like|i prefer|i love|i hate|i use|my favorite)\s+(.+)/i,
  /(?:i live in|i'm from|my location|my city|my country)\s+(.+)/i,
  /(?:my email|my phone|my age|my birthday)\s+(?:is)?\s*(.+)/i,
];

const RECALL_PATTERNS = [
  /(?:do you (?:remember|know)|what do you know|what did i tell|recall)\s*(?:about)?\s*(?:me|my|anything)?\s*\??/i,
  /(?:what's|what is)\s+(?:in )?(?:your |the )?(?:memory|stored)/i,
  /(?:have i told you|did i mention)/i,
];

const SEARCH_PATTERNS = [
  /(?:search|look up|find|google|what is|who is|tell me about)\s+(.+)/i,
];

const WEATHER_PATTERNS = [
  /(?:weather|temperature|forecast)\s+(?:in|at|for|of)?\s*(.+)/i,
];

export function extractIntent(text) {
  const trimmed = text.trim();

  for (const pattern of RECALL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { tool: "recall" };
    }
  }

  for (const pattern of REMEMBER_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return { tool: "remember", content: trimmed };
    }
  }

  return null;
}

export function shouldInjectMemory(text) {
  const lower = text.toLowerCase();
  const triggers = [
    "remember",
    "know about me",
    "told you",
    "my name",
    "who am i",
    "recall",
    "memory",
  ];
  return triggers.some((t) => lower.includes(t));
}
