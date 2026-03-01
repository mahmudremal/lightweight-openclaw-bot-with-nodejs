---
name: browser
description: Control Chromium Browser using the `browser` tool. Navigate websites, click elements, type text, take screenshots, and execute JavaScript in the browser.
metadata:
  emoji: "🌐"
---

# Browser Control Skill

You can control a Chromium browser through the connected Romi browser extension.

## Setup

1. Install the Romi browser extension from `workspace/skills/browser/extension/`
   - Open Chrome/Edge and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` folder

2. The extension will automatically connect to Romi when Romi is running

## Available Actions

Use the `browser` tool with these actions:

### navigate
Navigate to a URL.
```
browser({ action: "navigate", url: "https://example.com" })
```

### click
Click an element using a CSS selector.
```
browser({ action: "click", selector: "button.submit" })
browser({ action: "click", selector: "#login-btn" })
```

### type
Type text into an input field.
```
browser({ action: "type", selector: "input[name='email']", text: "user@example.com" })
```

### getText
Get text content from the page or a specific element.
```
browser({ action: "getText" })  // Get all page text
browser({ action: "getText", selector: ".article-content" })  // Get specific element text
```

### screenshot
Take a screenshot of the current page.
```
browser({ action: "screenshot" })
```

### scroll
Scroll the page up or down.
```
browser({ action: "scroll", direction: "down", amount: 300 })
browser({ action: "scroll", direction: "up", amount: 500 })
```

### hover
Hover over an element.
```
browser({ action: "hover", selector: ".menu-item" })
```

### waitFor
Wait for an element to appear on the page.
```
browser({ action: "waitFor", selector: ".results", timeout: 5000 })
```

### evaluate
Execute JavaScript in the browser context.
```
browser({ action: "evaluate", script: "document.title" })
browser({ action: "evaluate", script: "Array.from(document.querySelectorAll('a')).map(a => a.href)" })
```

## Example Workflows

### Search Google
```
1. browser({ action: "navigate", url: "https://google.com" })
2. browser({ action: "type", selector: "input[name='q']", text: "search query" })
3. browser({ action: "click", selector: "input[type='submit']" })
4. browser({ action: "waitFor", selector: "#search" })
5. browser({ action: "getText", selector: "#search" })
```

### Fill a Form
```
1. browser({ action: "navigate", url: "https://example.com/login" })
2. browser({ action: "type", selector: "#email", text: "user@example.com" })
3. browser({ action: "type", selector: "#password", text: "password123" })
4. browser({ action: "click", selector: "button[type='submit']" })
```

## Important Notes

- Always use CSS selectors that are specific and unlikely to change
- Wait for elements to load before interacting with them
- Take screenshots to verify the current state of the page
- If an action fails, try using `waitFor` to ensure the element is ready