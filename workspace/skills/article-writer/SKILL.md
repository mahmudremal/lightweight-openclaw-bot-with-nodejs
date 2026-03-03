---
name: article-writer
description: High-performance SEO article writing skill. Optimized for search ranking and readability using structured workflows.
metadata:
  emoji: "✍️"
---

# Article Writer Skill

I produce high-ranking content using a structured, asset-rich workflow. Every article I create follows a strict organizational pattern to ensure all research and assets are preserved.

## 📁 Workspace Structure

For every new article, I create a dedicated directory:
`articles/[article-slug]/`

Inside this directory, I organize everything:

- `planning.md` - Keywords, search intent, and structural blueprint.
- `drafts/` - Individual sections and parts of the article.
- `assets/` - Generated images (🎨), music (🎧), or videos.
- `index.md` - The final, polished, and full article.

## 🚀 Workflow Phases

### Phase 1: Deep Research

- Create the article directory matching the slug.
- Use the **keyword-planner** skill to identify **Main Keywords**, **LSI keywords**, and **User Intent**.
- Document the blueprint in `planning.md`.

### Phase 2: Asset Procurement

- Use the **graphics-designer** skill to generate high-quality visual and audio assets.
- Store all generated media in the `assets/` folder within the article directory.

### Phase 3: Structured Drafting

- Write the article in modular parts (Intro, Body Sections, FAQ, CTA) inside `drafts/`.
- Maintain SEO excellence:
  - **H1 Header**: Catchy, contains Main Keyword.
  - **H2/H3 Layout**: Answer "People Also Ask" questions.
  - **Readability**: Max 3 sentences per paragraph, use lists and bolding.

### Phase 4: Final Assembly & Optimization

- Compile the final article into `index.md`.
- Use the **seo-helper.js** script to verify word counts and keyword density.
- Write the **Meta Description** (150-160 chars) and define the final URL slug.

> [!IMPORTANT]
> Never write a full article in a single step without research and planning. Always proceed through the article-slug directory workflow to ensure high-quality output.
