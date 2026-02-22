---
name: skill-creator
description: Framework for creating or updating AgentSkills. Use to structure specialized knowledge, workflows, and tools.
metadata:
  emoji: "🐣"
---

# Skill Creator

Skills are modular packages that extend capabilities with specialized knowledge and tools.

## Skill Structure

```
skill-name/
├── SKILL.md (required) - Frontmatter + Instructions
├── scripts/    - Executable code for deterministic reliability
├── references/ - Docs loaded into context as needed (schemas, APIs)
└── assets/     - Static resources for output (templates, images)
```

## SKILL.md Requirements

### 1. Frontmatter (YAML)

- `name`: Lowercase, digits, hyphens only.
- `description`: PRIMARY TRIGGER. Must explain WHAT it does and WHEN to use it.
- **Rules**: ONLY `name` and `description` are read for triggering.

### 2. Body (Markdown)

- Use imperative, concise instructions.
- Prefer examples over verbose explanations.
- Keep body under 500 lines to minimize context bloat.

## Core Design Principles

### Progressive Disclosure

Manage context efficiency by splitting content:

1. **Metadata**: Always in context (Triggers usage).
2. **SKILL.md Body**: Loaded when triggered.
3. **References/Scripts**: Loaded/executed only when explicitly needed.

### Tool/Reference Organization

- Move large schemas or documentation to `references/*.md`.
- Reference them in `SKILL.md` with: "See [FILE.md](FILE.md) for details".
- Keep `SKILL.md` one level deep from references (avoid nesting).

## Creation Process

1. **Understand**: Identify use cases and triggers.
2. **Plan**: Define necessary scripts, references, and assets.
3. **Initialize**: Create directory and `SKILL.md`.
4. **Implement**: Add resources and write concise instructions.
5. **Iterate**: Refine based on performance and token cost.

## Naming Conventions

- Skill names: `lowercase-hyphen-case` (max 64 chars).
- Folder name must match skill name.
- Prefer verb-led phrases (e.g., `pdf-rotation`, `gh-address-comments`).

## Pro-Tips

- **Concise is Key**: Codex is smart. Challenge every word.
- **Avoid Clutter**: Do NOT include README, CHANGELOG, etc. Only AI-relevant files.
- **Output Standards**: Move template patterns to `references/output-patterns.md`.
