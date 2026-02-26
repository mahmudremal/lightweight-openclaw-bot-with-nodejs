---
name: romi-cli
description: Manage Romi's own settings, skills, and providers using the terminal.
metadata:
  emoji: "👩‍🚀"
---

# Romi CLI Skill

This skill allows Romi to manage itself by executing `romi` commands via the terminal.

## Capabilities

- Install/Remove skills: `romi skills install <name>`, `romi skills remove <name>`
- List skills: `romi skills list`, `romi skills installed`, `romi skills available`
- Manage providers: `romi providers list`, `romi providers add <name>`
- Initialize workspaces: `romi init <name>`
- Run other cli tasks via `terminal_exec`.

## Instructions

When the user asks to change settings, install skills, or manage the bot, use the `terminal_exec` tool to run the appropriate `romi` commands.
Always verify the command output to ensure the action was successful.
