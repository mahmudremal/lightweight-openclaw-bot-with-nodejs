import roles from "../../core/roles.js";

class Outline {
  async generate(topic, blueprint, keywords, serpAnalysis) {
    const prompt = `Create a professional SEO article outline for "${topic}".
    Blueprint: ${JSON.stringify(blueprint)}
    Keywords: ${JSON.stringify(keywords)}
    SERP Gaps: ${JSON.stringify(serpAnalysis.gaps)}
    
    Return strict JSON with 'sections' array. Each section object must have:
    - id
    - title
    - goal
    - angle
    - wordTarget
    - contentType
    - requiredElements (array of strings like "example", "data", "opinion")
    - mediaPlan (array of objects { type: "image|table|chart|quote", placement, purpose })`;

    const response = await roles.planner(prompt);
    return JSON.parse(response);
  }
}

export default new Outline();