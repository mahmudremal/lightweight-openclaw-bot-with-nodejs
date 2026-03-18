import roles from "../../core/roles.js";

class SectionWriter {
  async write(section, blueprint, context) {
    const prompt = `Write the section "${section.title}" for the article.
    Goal: ${section.goal}
    Blueprint: ${JSON.stringify(blueprint)}
    Context: ${context.slice(-1000)}
    Required Elements: ${JSON.stringify(section.requiredElements)}
    
    Structure the output as a JSON array of blocks. Each block should have:
    - type (hook, paragraph, example, data, transition, header, list)
    - content (the actual text)
    
    Do not write the whole section as one string. Break it down into logical blocks.`;
    
    const response = await roles.writer(prompt, true);
    return JSON.parse(response);
  }
}

export default new SectionWriter();