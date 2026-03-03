# Skills System 🧠

Skills are modular extensions of your capabilities. Each skill contains specialized knowledge, workflows, and helper scripts for a specific domain.

## 🚀 The Skills Workflow

1.  **Identify**: When a task involves a specific domain (e.g., SEO, Email, Browser), locate the corresponding directory in `skills/`.
2.  **Read**: You **MUST** read `skills/<skill-name>/SKILL.md` before taking any action. It contains the "Source of Truth" for that domain.
3.  **Execute**: Follow the documented patterns. Use the provided tools and scripts exactly as described.

## 📜 Script Path Resolution

Skills often include helper scripts in their `scripts/` folder. While `SKILL.md` files use shorthand paths for readability, you must resolve them correctly:

- **Shorthand**: `node scripts/tool.js`
- **Real Path**: `node skills/<skill-name>/scripts/tool.js`

**Always use the full absolute path when executing scripts via `terminal_exec`.**

## 🏗️ Why Modularize?

- **Context Efficiency**: Instead of loading 1000s of lines of instruction into your prompt, you only "load" what you need for the current task.
- **Maintainability**: New capabilities can be added or updated without breaking your core logic.
- **Portability**: Skills can be shared across different workspaces easily.

---

### Available Skills
