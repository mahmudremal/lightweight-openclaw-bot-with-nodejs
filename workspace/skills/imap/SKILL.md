---
name: imap
description: Email management via IMAP. Supports preconfigured accounts or inline credentials.
metadata:
  emoji: "📧"
---

# IMAP Email Skill

This skill allows you to interact with email accounts using the IMAP protocol.

## Usage Methods

### 1. Preconfigured Mail

Use a mail address already stored in the script's `emailConfigs`.
`node scripts/imap.js --mail info@abc.com list --limit 10`

### 2. Inline Configuration

Provide all connection details directly in the command.
`node scripts/imap.js --host imap.gmail.com --port 993 --username user@gmail.com --password "your_pass" --action list`

## Workflow

Use the `terminal_exec` tool to run the `imap.js` script.

### 📋 List Emails

`node scripts/imap.js --mail user@example.com list`

### 📖 Read Email

`node scripts/imap.js --mail user@example.com read --id <UID>`

### 🗑️ Delete Email

`node scripts/imap.js --mail user@example.com delete --id <UID>`

> [!TIP]
> For accounts with 2FA (like Gmail), always use an **App Password**.
