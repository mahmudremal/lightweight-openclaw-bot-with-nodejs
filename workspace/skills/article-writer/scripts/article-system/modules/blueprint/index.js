import roles from "../../core/roles.js";

class Blueprint {
  async create(topic, keywords, serpAnalysis) {
    const prompt = `Create an article blueprint for "${topic}".
    Keywords: ${JSON.stringify(keywords)}
    SERP Analysis: ${JSON.stringify(serpAnalysis)}
    Return strict JSON with fields:
    - audience
    - searchIntent
    - tone
    - narrativeStyle
    - differentiationStrategy
    - contentDepth
    - uniqueAngles (array)
    - mustIncludeTopics (array)
    - avoidPatterns (array)`;
    
    const response = await roles.planner(prompt);
    return JSON.parse(response);
  }
}

export default new Blueprint();