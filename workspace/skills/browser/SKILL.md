---
name: browser
description: Control User Browser to do work on internet.
metadata:
  emoji: "🌐"
---

# Browser CLI & Action Reference 🌐

## CLI Usage (via `terminal_exec`)

| Command  | Description                     | Syntax                                        |
| :------- | :------------------------------ | :-------------------------------------------- |
| **List** | Show all connected browser IDs  | `romi browsers list`                          |
| **Exec** | Send direct action to a browser | `romi browser exec <id> <action> [key=value]` |

### CLI Example:

`terminal_exec({ command: "romi browser exec browser-1 navigate url=https://google.com" })`

---

## Action Reference (Parameters & Usage)

These actions apply to both the `browser` tool and `romi browser exec`.

### 0. `create`

Create a new tab as active tab.

- **Param:** `url` (String, Required)
- **Usage:** `create url=https://aljazeera.com`

### 1. `navigate`

Loads a new URL in the active tab.

- **Param:** `url` (String, Required)
- **Usage:** `navigate url=https://aljazeera.com`

### 2. `click`

Simulates a mouse click on an element.

- **Param:** `selector` (String, Required)
- **Usage:** `click selector="#login-button"`

### 3. `write`

Enters text into an input field.

- **Params:** `selector` (Required), `text` (Required), editor (quill|textarea|input) (Optional), keyPress (key,keyCode) (Optional)
- **Usage:** `write selector="input[name='q']" text="news today" editor=quill keyPress="Enter,13"`

### 4. `getText`

Extracts text content. Limited to 20,000 characters.

- **Param:** `selector` (Optional)
- **Usage:** `getText selector=".article-body"` (Omit selector for full page text)

### 5. `screenshot`

Captures current page view.

- **Returns:** Confirmation message.

### 6. `waitFor`

Pauses execution until a specific element exists in the DOM.

- **Param:** `selector` (String, Required), `timeout` (Number, default 5000ms)
- **Usage:** `waitFor selector=".results-loaded" timeout=10000`

### 7. `scroll`

Scrolls the active tab.

- **Params:** `direction` ("up"|"down"), `amount` (Pixels)
- **Usage:** `scroll direction=down amount=500`

### 8. `evaluate`

Executes raw JavaScript and returns the result.

- **Param:** `script` (String, Required)
- **Usage:** `evaluate script="document.title"`

---

## Technical Notes

- **Bridge**: If using `browser` tool from CLI, it automatically bridges to the process running `romi start`.
- **Selectors**: Supports all standard CSS3 selectors.
- **Latency**: Heavy SPAs (React/Vue) require `waitFor` before interaction.
