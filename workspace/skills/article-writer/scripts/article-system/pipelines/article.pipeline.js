import seed from "../modules/keyword/seed.js";
import expand from "../modules/keyword/expand.js";
import serpScraper from "../modules/serp/scraper.js";
import serpAnalyzer from "../modules/serp/analyzer.js";
import scorer from "../modules/keyword/scorer.js";
import blueprint from "../modules/blueprint/index.js";
import outline from "../modules/outline/index.js";
import meta from "../modules/writer/meta.js";
import sectionWriter from "../modules/writer/section.js";
import dataInjector from "../modules/data/injector.js";
import critic from "../modules/critic/index.js";
import humanizer from "../modules/humanizer/index.js";
import assembler from "../modules/assembler/index.js";
import graphicsDesigner from "../modules/media/designer.js";
import memory from "../core/memory.js";
import utils from "../core/utils.js";

class ArticlePipeline {
  async run(topic) {
    console.log("Starting pipeline for:", topic);
    
    // 1. Keywords & SERP
    const seeds = await seed.generate(topic);
    console.log("Seeds generated:", seeds.length);
    
    const serpData = await serpScraper.scrape(seeds);
    const serpAnalysis = await serpAnalyzer.analyze(serpData);
    console.log("SERP Analysis done");
    
    const scoredKeywords = await scorer.score(seeds, serpAnalysis);
    console.log("Keywords Scored");
    
    // 2. Planning
    const bp = await blueprint.create(topic, scoredKeywords.primaryKeywords, serpAnalysis);
    const ol = await outline.generate(topic, bp, scoredKeywords.primaryKeywords, serpAnalysis);
    const metaData = await meta.generate(topic, scoredKeywords.primaryKeywords);
    
    console.log("Blueprint & Outline created");
    
    // 3. Writing Loop
    const sections = [];
    let context = "";
    
    for (const section of ol.sections) {
      console.log("Writing section:", section.title);
      let blocks = await sectionWriter.write(section, bp, context);
      
      blocks = await dataInjector.inject(blocks);
      
      // Graphics Designer
      const assets = await graphicsDesigner.generatePrompts(section, bp);
      if (assets.length) {
        console.log(`Generated ${assets.length} image prompts for section: ${section.title}`);
        assets.forEach(asset => {
          blocks.push({
            type: "image",
            content: asset.prompt,
            alt: asset.description,
            placement: asset.placement
          });
        });
      }
      
      // Critic Loop
      let critique = await critic.evaluate(section.title, blocks, bp);
      let attempts = 0;
      while (critique.score < 85 && critique.rewrite && attempts < 2) {
         console.log(`Rewriting section ${section.title} (Score: ${critique.score})...`);
         blocks = await sectionWriter.write(section, bp, context + `\nPrevious critique: ${JSON.stringify(critique.issues)}`);
         blocks = await dataInjector.inject(blocks);
         // Redo Graphics Designer on rewrite if needed
         critique = await critic.evaluate(section.title, blocks, bp);
         attempts++;
      }
      
      sections.push({ ...section, blocks });
      context += blocks.map(b => b.content).join(" ").slice(0, 500); 
    }
    
    // 4. Humanize
    console.log("Humanizing...");
    const humanizedSections = await humanizer.run(sections);
    
    // 5. Assemble
    const finalOutput = assembler.assemble(metaData, ol, humanizedSections);
    
    // Save
    const outputPath = `article-system/outputs/articles/${metaData.slug || 'output'}.json`;
    utils.writeJson(outputPath, finalOutput);
    console.log("Saved to:", outputPath);
    
    return finalOutput;
  }
}

export default new ArticlePipeline();