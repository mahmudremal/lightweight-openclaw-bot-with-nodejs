import roles from "../../core/roles.js";

class GraphicsDesigner {
  async generatePrompts(section, blueprint) {
    if (!section.mediaPlan || !section.mediaPlan.length) return [];
    
    const results = [];
    for (const media of section.mediaPlan) {
      if (media.type === 'image') {
        const promptInput = `Generate a professional, high-quality image prompt for the article section: "${section.title}".
        Media Purpose: ${media.purpose}
        Placement: ${media.placement}
        Article Tone: ${blueprint.tone}
        Narrative Style: ${blueprint.narrativeStyle}
        
        Provide a prompt that ensures aesthetic consistency across the article.
        Return strict JSON with fields: type, prompt, description, placement.`;
        
        const response = await roles.graphicsDesigner(promptInput, true);
        const asset = JSON.parse(response);
        results.push(asset);
      }
    }
    return results;
  }
}

export default new GraphicsDesigner();