---
name: keyword-planner
description: Keyword research and analysis expert.
metadata:
  emoji: "🕷️"
---

# Keyword Planner Skill

I perform deep analysis on various keywords to help write highly optimized content. I use browser automation to gather data from multiple SEO tools.

## Workflow

To perform keyword research, use the `terminal_exec` tool (or `spawn_subagent`) to run the appropriate script.

### 🧠 AnswerSocrates Research

Uses AI-driven analysis to find questions and semantic keywords.

`node scripts/answersocrates.js "wordpress hosting"`

### 🏄 Keyword Surfer Analysis

Extracts search volume and related keywords directly from Google Search results.

`node scripts/keyword-surfer.js "best gaming laptop"`

## Capabilities

- **AI Keyword Discovery**: Leverages AnswerSocrates for long-tail and question-based keywords.
- **Search Volume Insights**: Uses Keyword Surfer to extract real-time Google search data.
- **Automated Extraction**: Handles navigation, waiting for dynamic content, and multi-page data collection.

> [!NOTE]
> Ensure the Romi Browser extension is connected and (for Keyword Surfer) the extension is properly installed in the browser.
