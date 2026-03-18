import roles from "../../core/roles.js";

class Critic {
  async evaluate(sectionTitle, blocks, blueprint) {
    const text = blocks.map(b => b.content).join("\n\n");
    const prompt = `Critique this section: "${sectionTitle}".
    Content: ${text}
    Blueprint: ${JSON.stringify(blueprint)}
    
    Evaluate for: repetition, fluff, weak arguments, generic phrasing, AI tone.
    Return strict JSON:
    - score (number 0-100)
    - issues (array of strings)
    - rewrite (boolean, true if score < 85)`;
    
    const response = await roles.editor(prompt, true);
    return JSON.parse(response);
  }
}

export default new Critic();