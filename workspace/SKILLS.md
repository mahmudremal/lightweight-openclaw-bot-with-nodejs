# Skills System 🧠

Skills = modular extensions. Each has specialized knowledge & workflows.

## Workflow

1. **Identify** task domain → find `skills/<skill>/`
2. **Read** `skills/<skill>/SKILL.md` (source of truth)
3. **Execute** documented patterns.

## Rule Zero

Never try to read `scripts/*.js` & `secrets.json` files by any means, Just follow instruction of SKILL.md file.

## Script Paths

- Shorthand: `node scripts/<tool>.js`
- Real: `cd skills/<skill>/scripts && node <tool>.js`
- **Always use full path** in `terminal_exec`

## Why Modularize?

- Context efficiency (load only what's needed)
- Maintainability (updates don't break core)
- Portability (shareable across workspaces)

---

## Available Skills
