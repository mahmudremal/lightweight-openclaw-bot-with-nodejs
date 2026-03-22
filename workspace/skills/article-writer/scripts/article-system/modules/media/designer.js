import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import roles from "../../core/roles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class GraphicsDesigner {
  async generatePrompts(section, blueprint) {
    if (!section.mediaPlan || !section.mediaPlan.length) return [];

    const results = [];
    const nanobananaPath = path.resolve(__dirname, "../../../../../graphics-designer/scripts/nanobanana.js");

    for (const media of section.mediaPlan) {
      if (media.type === "image") {
        const promptInput = `Generate a professional, high-quality image prompt for the article section: "${section.title}".
        Media Purpose: ${media.purpose}
        Placement: ${media.placement}
        Article Tone: ${blueprint.tone}
        Narrative Style: ${blueprint.narrativeStyle}
        
        Provide a prompt that ensures aesthetic consistency across the article.
        Return strict JSON with fields: type, prompt, description, placement.`;

        if (fs.existsSync(nanobananaPath)) {
          try {
            const nanobanana = await import(`file://${nanobananaPath}`);
            const response = await nanobanana.default.run(promptInput, media.type);
            
            // Map nanobanana response to system contract
            results.push({
              type: "image",
              url: response.image[0],
              prompt: promptInput,
              description: media.purpose,
              placement: media.placement,
              isRealImage: true
            });
          } catch (err) {
            // Fallback to LLM if module import/execution fails
            const response = await roles.graphicsDesigner(promptInput, true);
            results.push(JSON.parse(response));
          }
        } else {
          const response = await roles.graphicsDesigner(promptInput, true);
          results.push(JSON.parse(response));
        }
      }
    }
    return results;
  }
}

export default new GraphicsDesigner();