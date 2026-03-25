---
name: mail-client
description: Email management via IMAP/SMTP. Supports reading, sending, and managing emails.
metadata:
  emoji: "📧"
---

# Mail Client Skill

This skill allows you to interact with email accounts via IMAP for reading and SMTP for sending. 

## Usage Methods

### 1. Preconfigured Mail

Use a mail address already stored in the script configuration.
`node scripts/imap.js --mail [EMAIL_ADDRESS] list --limit 10`

- Mails configured:
  - bdcodehaxor@gmail.com
  - info@abc.com

### 2. Inline Configuration

You can also use custom email configuration to connect.
`node scripts/imap.js --host imap.gmail.com --username user@gmail.com --password "app_pass" --action list`

---

## Supported Actions

All commands return standard JSON output.

- **list**: List emails (default). `--limit 10`
- **read**: Read an email. `--id <UID>`
- **delete**: Delete an email. `--id <UID>`
- **markSpam**: Mark an email as spam. `--id <UID>`
- **markRead**: Mark as read. `--id <UID>`
- **markUnread**: Mark as unread. `--id <UID>`
- **draft**: Save a draft. `--data '{"to":"...","subject":"...","body":"..."}'`
- **send**: Send an email. `--data '{"to":"...","subject":"...","body":"..."}'`
- **reply**: Reply to an email. `--id <UID> --data '{"body":"Reply text..."}'`
- **forward**: Forward an email. `--id <UID> --data '{"to":"...","body":"Fwd text..."}'`

> [!TIP]
> For accounts with 2FA (like Gmail), always use an **App Password**.
