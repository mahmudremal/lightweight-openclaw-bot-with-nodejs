import roles from "../../core/roles.js";

class SerpAnalyzer {
  async analyze(serpData) {
    const prompt = `Analyze these SERP results: ${JSON.stringify(serpData)}.
    Summarize common patterns, detect content gaps, detect overused angles, extract "what is missing".
    Return strict JSON with fields: patterns, gaps, weaknesses, opportunities.`;

    const response = await roles.researcher(prompt, true);
    return JSON.parse(response);
  }
}

export default new SerpAnalyzer();
