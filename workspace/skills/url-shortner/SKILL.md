---
name: url-shortner
description: Quickly shorten long URLs using the Ulvis API.
metadata:
  emoji: "🔗"
---

# URL Shortener Skill

Shorten long URLs into manageable links.

## Workflow

Use the `terminal_exec` tool to run the `shorten.js` script.

### 🔗 Shorten URL

`node scripts/shorten.js "https://example.com/very-long-url"`

## Capabilities

- **Fast**: Zero-dependency script.
- **Anonymous**: No API key required.
- **Reliable**: Uses the Ulvis.net v1 API.

> [!NOTE]
> Rate limited to 100 requests per hour per IP.
