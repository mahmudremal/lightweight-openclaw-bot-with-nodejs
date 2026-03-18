# Article Generation System (v1.0)

## Overview
A modular, OOP-based article generation system designed to produce high-quality, SEO-optimized, and human-like content using a multi-agent pipeline. It focuses on strategic planning, SERP gap analysis, and iterative quality refinement.

## Architecture
The system follows a **Research -> Strategy -> Execution -> Validation** lifecycle.

- **Core Layer:** Provides the foundation (LLM communication, role management, state/memory, and utilities).
- **Module Layer:** Isolated, specialized agents that handle specific parts of the article lifecycle.
- **Pipeline Layer:** Orchestrates the flow between modules, ensuring strict contracts and data integrity.

## Directory Structure
- `/article-system`
  - `article.js`: Entry point for CLI commands.
  - `config.js`: Role-specific configuration (model, apiKey, baseUrl, temperature). Supports using different providers (OpenAI, Anthropic via proxy, etc.) for different tasks.
  - `package.json`: ES Module configuration.
  - `/core`
    - `llm.js`: OpenAI wrapper with markdown-to-JSON cleaning logic.
    - `roles.js`: Agent definitions (Planner, Researcher, Writer, Editor, GraphicsDesigner).
    - `memory.js`: Global state tracking (keywords, key points).
    - `utils.js`: JSON I/O and sync/async helpers.
  - `/modules`
    - `/serp`: Scraper (placeholder) and Analyzer (extracts gaps/patterns).
    - `/keyword`: Seed generation, expansion, and multi-factor scoring.
    - `/blueprint`: Strategic direction (audience, intent, differentiation).
    - `/outline`: Structured JSON sections with goals and media plans.
    - `/writer`: Block-based section writing and meta data generation.
    - `/data`: Statistics and authority signal injection (placeholder).
    - `/media`: Professional image prompt engineering for assets.
    - `/critic`: Evaluation loop; triggers rewrites for quality scores < 85.
    - `/humanizer`: Sentence variation and AI pattern removal pass.
    - `/assembler`: Final HTML/JSON construction.
  - `/pipelines`
    - `article.pipeline.js`: The central orchestration logic.
  - `/schemas`: JSON schemas for blueprint, outline, and blocks.
  - `/outputs/articles`: Storage for final generated JSON/HTML.

## Core Mandates
1. **Surgical Updates:** Only modify code directly related to the task.
2. **Clean Code:** OOP-based, no internal comments, export default new Class().
3. **Validation:** Every section must pass the Critic loop.
4. **Modularity:** No module talks to another; all communication goes through the Pipeline.

## Usage
Run the pipeline from the scripts root:
```bash
node article-system/article.js "Your Topic"
```