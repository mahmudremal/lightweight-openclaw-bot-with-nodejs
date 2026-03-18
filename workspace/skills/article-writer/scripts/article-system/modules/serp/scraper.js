class SerpScraper {
  async scrape(keywords) {
    return {
      keywords,
      results: [
        {
          title: "The Ultimate Guide to " + (keywords[0] || "Topic"),
          headings: ["Introduction", "What is " + (keywords[0] || "Topic"), "Benefits", "How to use", "Conclusion"],
          wordCount: 1500,
          structure: "Introduction -> Definition -> Benefits -> Steps -> Conclusion"
        },
        {
          title: "Top 10 Tips for " + (keywords[0] || "Topic"),
          headings: ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],
          wordCount: 1200,
          structure: "Listicle"
        }
      ]
    };
  }
}

export default new SerpScraper();