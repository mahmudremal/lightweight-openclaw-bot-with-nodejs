---
name: article-writer
description: High-performance, multi-agent SEO article generation system.
metadata:
  emoji: "✍️"
---

# ✍️ Article Writer Skill

I am a high-performance content generation system that uses a multi-agent pipeline (Planner, Researcher, Writer, Editor, Critic, and Graphics Designer) to produce editorial-grade, SEO-optimized articles.

## 🚀 One-Command Generation

I automate the entire research, planning, writing, and asset generation process. You only need to provide a **specific and detailed topic**.

### 🛠️ Execution

Run the following command from the project root to generate a complete article:

```bash
node scripts/article.js "Your Specific and Information-Rich Topic"
```

## 🧠 Strategic Guidelines

### 1. Topic Specificity (Critical)

For the best results, provide a topic that is:

- **Specific:** Avoid broad terms like "Figma." Instead, use "How Figma's 2024 UI Update Revolutionized Collaborative Design Systems."
- **Detailed:** Include specific angles or constraints (e.g., "for enterprise teams," "on a budget," "comparative analysis").
- **Information-Rich:** Mention specific technologies, trends, or data points you want the research agent to prioritize.

### 2. Multi-Agent Pipeline Flow

My internal process follows a strict 7-layer architecture:

- **SERP Intelligence:** Analyzes top-ranking content for gaps and patterns.
- **Keyword Scoring:** Identifies primary and secondary keywords based on intent and difficulty.
- **Blueprint & Outline:** Establishes a narrative style and differentiation strategy.
- **Block-Based Writing:** Generates content in logical blocks (hooks, paragraphs, examples).
- **Critic Loop:** Every section is evaluated; if the quality score is below 85, it is automatically rewritten.
- **Graphics Designing:** An expert art director agent generates highly detailed DALL-E/Midjourney prompts for every section.
- **Humanizer:** Final pass to vary sentence structures and remove AI-typical symmetry.

## 📁 Output Management

All generated articles, including metadata, HTML, and image prompts, are stored as structured JSON/HTML in:
`scripts/outputs/articles/[article-slug].json`

> [!TIP]
> **The more detailed your prompt, the deeper my research.** I don't just write; I engineer content that beats the competition on the SERP.
