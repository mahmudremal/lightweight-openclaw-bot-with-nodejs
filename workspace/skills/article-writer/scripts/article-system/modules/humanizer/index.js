import roles from "../../core/roles.js";

class Humanizer {
  async run(sections) {
    const processed = [];
    for (const section of sections) {
      const prompt = `Humanize this section to sound more natural and less AI-generated.
      Vary sentence length, add rhetorical questions, and remove symmetry.
      Content Blocks: ${JSON.stringify(section.blocks)}
      
      Return strict JSON array of blocks with keys: type, content.`;
      
      const response = await roles.editor(prompt, true);
      processed.push({ ...section, blocks: JSON.parse(response) });
    }
    return processed;
  }
}

export default new Humanizer();