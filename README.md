# 🐪 Romi — Lightweight AI Personal Assistant

**Romi** is a powerful, lightweight AI agent designed to run everywhere. It excels at local execution using **Ollama** or **LM Studio**, but fits perfectly with any OpenAI-compatible API.

Designed for developers and power users who want a personal AI that can control their terminal, manage WhatsApp/Telegram, and browse the web—without the bloat.

[![npm version](https://img.shields.io/npm/v/romi-bot.svg)](https://www.npmjs.com/package/romi-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Key Features

- **Local-First**: Specifically optimized for **Ollama** (GGUF) and **LM Studio**.
- **Multi-Channel**: Native support for **WhatsApp**, **Telegram**, and interactive **Terminal Chat**.
- **Smart Formatting**: Automatically converts AI Markdown to beautiful, platform-native formatting (WhatsApp bold/italics, Telegram HTML).
- **Workspace-Based**: Isolated environments for different personas or projects.
- **Tools & Skills**: Easily extensible with terminal execution, web browsing, and custom skills.
- **Identity Aware**: Distinguishes between the "Owner" (you) and external users in group chats.

## 📦 Installation

Install globally via npm:

```bash
npm install -g romi-bot
```

## 🛠️ Getting Started

### 1. Initialize Project

Create a new Romi project in your current directory:

```bash
romi init
```

### 2. Configure Your LLM

Edit your configuration at `~/.romi/config.json`. By default, it points to Ollama:

```json
{
  "providers": {
    "openai": {
      "api_key": "YOUR_KEY_OR_DUMMY",
      "api_base": "http://localhost:11434/v1"
    }
  }
}
```

### 3. Start Chatting

Launch the interactive terminal:

```bash
romi chat
```

## 📡 Channel Management

Enable and configure your communication channels directly from the CLI.

### WhatsApp

```bash
romi channel enable whatsapp
romi channel login whatsapp  # Scan QR code
```

### Telegram

```bash
romi channel set telegram token YOUR_BOT_TOKEN
romi channel enable telegram
```

### Security (Owner Identification)

Tell Romi who is the boss so it follows your commands explicitly:

```bash
romi channel set whatsapp allow_from ["+880123456789"]
romi channel set telegram allow_from ["@yourusername"]
```

## 🖥️ Commands Overview

| Command   | Description                                        |
| :-------- | :------------------------------------------------- |
| `start`   | Start all services (API, WhatsApp, Telegram, etc.) |
| `chat`    | Start interactive CLI chat session                 |
| `channel` | Manage communication providers                     |
| `skills`  | Install/Remove agent capabilities                  |
| `init`    | Initialize default configuration                   |

## 🌟 Why Romi?

Most AI agents are heavy and require complex setups. Romi is built on a single source of truth: **The Workspace**. Your personality (`SOUL.md`), your facts (`USER.md`), and your rules (`AGENT.md`) are simple markdown files that you can edit anytime.

---

## 🧔 Developed By

**Remal Mahmud**
A passionate developer focused on making AI accessible and lightweight.

- 🌐 [Personal Website](https://www.mahmudremal.com/)
- 🐙 [GitHub Profile](https://github.com/mahmudremal)
- 📱 [Contact on WhatsApp](http://wa.me/8801814118328)
- 📧 [Email Me](mailto:mahmudremal@yahoo.com)

---

_License: MIT_
