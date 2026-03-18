import roles from "../../core/roles.js";

class Expand {
  async run(seeds) {
    const prompt = `Expand and cluster these keywords into search intent groups: ${seeds.join(", ")}. Return strict JSON with clusters.`;
    const response = await roles.researcher(prompt, true);
    return JSON.parse(response);
  }
}

export default new Expand();