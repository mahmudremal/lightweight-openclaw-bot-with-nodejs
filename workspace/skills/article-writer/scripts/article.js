import pipeline from "./article-system/pipelines/article.pipeline.js";

const topic = process.argv.slice(2).join(" ");
if (!topic) {
  console.error("Please provide a topic.");
  process.exit(1);
}

pipeline
  .run(topic)
  .then(() => {
    console.log("Done.");
  })
  .catch((err) => {
    console.error("Error:", err);
  });
