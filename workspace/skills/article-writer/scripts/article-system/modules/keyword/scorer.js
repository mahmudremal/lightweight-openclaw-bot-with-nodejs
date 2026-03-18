import roles from "../../core/roles.js";

class Scorer {
  async score(keywords, serpAnalysis) {
    const prompt = `Rank these keywords based on potential traffic and low difficulty, considering SERP gaps: ${JSON.stringify(serpAnalysis)}.
    Keywords: ${JSON.stringify(keywords)}.
    Return strict JSON with fields: primaryKeywords (array), secondaryKeywords (array), longTailClusters (array).`;
    
    const response = await roles.researcher(prompt, true);
    return JSON.parse(response);
  }
}

export default new Scorer();