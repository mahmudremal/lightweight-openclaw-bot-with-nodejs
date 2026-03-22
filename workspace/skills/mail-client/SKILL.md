---
name: mail-client
description: Email management via IMAP. Supports preconfigured accounts or inline credentials.
metadata:
  emoji: "📧"
---

# IMAP Email Skill

This skill allows you to interact with email accounts using the IMAP protocol.

## Usage Methods

### 1. Preconfigured Mail

Use a mail address already stored in the script's `emailConfigs`.
`node scripts/imap.js --mail bdcodehaxor@gmail.com list --limit 10`

### 2. Inline Configuration

You can also use custom email configuration to connect.
`node scripts/imap.js --host imap.gmail.com --port 993 --username example@example.com --password "your_pass" --action list`

---

### 📋 List Emails

`node scripts/imap.js --mail bdcodehaxor@gmail.com list`

### 📖 Read Email

`node scripts/imap.js --mail bdcodehaxor@gmail.com read --id <UID>`

### 🗑️ Delete Email

`node scripts/imap.js --mail bdcodehaxor@gmail.com delete --id <UID>`

> [!TIP]
> For accounts with 2FA (like Gmail), always use an **App Password**.
