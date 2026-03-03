import logger from "../utils/logger.js";
import { browserController } from "../utils/browser.js";

export const browser_tool = {
  name: "browser",
  description:
    "Control a Chromium browser through a connected browser extension. Actions: navigate, click, type, screenshot, getText, scroll, hover, waitFor, evaluate. Requires the browser skill to be read first, and the Romi browser extension to be installed and connected.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "navigate",
          "click",
          "write",
          "screenshot",
          "getText",
          "scroll",
          "hover",
          "waitFor",
          "getElements",
          "evaluate",
        ],
        description: "The browser action to perform",
      },
      selector: {
        type: "string",
        description:
          "CSS selector for click, type, hover, waitFor actions (e.g., 'button.submit', '#login-form')",
      },
      url: {
        type: "string",
        description: "URL to navigate to (for navigate action)",
      },
      text: {
        type: "string",
        description: "Text to type (for write action)",
      },
      editor: {
        type: "string",
        enum: ["quill", "textarea", "input"],
        description: "Editor type (for write action)",
      },
      keyPress: {
        type: "string",
        description: "Key and keyCode to press after typing (e.g., 'Enter,13')",
      },
      direction: {
        type: "string",
        enum: ["up", "down"],
        description: "Scroll direction (for scroll action)",
      },
      amount: {
        type: "number",
        description: "Scroll amount in pixels (for scroll action)",
      },
      timeout: {
        type: "number",
        description:
          "Timeout in milliseconds for waitFor action (default: 5000)",
      },
      state: {
        type: "string",
        enum: ["visible", "hidden"],
        description: "State to wait for (for waitFor action)",
      },
      attribute: {
        type: "string",
        description:
          "Attribute to extract (for getElements action, e.g., 'src', 'href')",
      },
      script: {
        type: "string",
        description:
          "JavaScript code to execute in the browser (for evaluate action)",
      },
    },
    required: ["action"],
  },
  handler: async (args) => {
    const { action, selector, url, text, direction, amount, timeout, script } =
      args;

    // Helper to delegate to running server if local controller has no clients
    const delegateToServer = async () => {
      try {
        const axios = (await import("axios")).default;
        const response = await axios.post(
          "http://localhost:8765/api/browsers/exec",
          {
            action,
            params: args,
          },
        );
        return response.data;
      } catch (err) {
        return null;
      }
    };

    if (!browserController.hasConnectedClient()) {
      const remoteResult = await delegateToServer();
      if (remoteResult) {
        if (remoteResult.error) return `Error: ${remoteResult.error}`;
        if (action === "getText" && remoteResult.text) return remoteResult.text;
        if (action === "screenshot" && remoteResult.screenshot)
          return "Screenshot captured successfully (Base64 data removed for brevity).";
        if (remoteResult.success)
          return `Action '${action}' completed successfully via remote Romi server.`;
        return JSON.stringify(remoteResult);
      }
      return "No browser extension connected. Please install and enable the Romi browser extension, and ensure 'romi start' is running.";
    }

    let result;
    switch (action) {
      case "navigate":
        if (!url) return "Error: 'url' is required for navigate action";
        result = await browserController.navigate(url);
        break;

      case "click":
        if (!selector) return "Error: 'selector' is required for click action";
        result = await browserController.click(selector);
        break;

      case "type":
        if (!selector) return "Error: 'selector' is required for type action";
        if (text === undefined)
          return "Error: 'text' is required for type action";
        result = await browserController.type(selector, text);
        break;

      case "write":
        if (!selector) return "Error: 'selector' is required for write action";
        if (text === undefined)
          return "Error: 'text' is required for write action";
        result = await browserController.sendCommand("write", args);
        break;

      case "screenshot":
        result = await browserController.screenshot();
        if (result.success && result.screenshot) {
          return "Screenshot captured successfully (Base64 data removed for brevity).";
        }
        break;

      case "getText":
        result = await browserController.getText(selector);
        if (result.success && result.text) {
          return result.text;
        }
        break;

      case "scroll":
        result = await browserController.scroll(direction, amount);
        break;

      case "hover":
        if (!selector) return "Error: 'selector' is required for hover action";
        result = await browserController.hover(selector);
        break;

      case "waitFor":
        if (!selector)
          return "Error: 'selector' is required for waitFor action";
        result = await browserController.sendCommand("waitFor", args);
        break;

      case "getElements":
        if (!selector)
          return "Error: 'selector' is required for getElements action";
        result = await browserController.sendCommand("getElements", args);
        break;

      case "evaluate":
        if (!script) return "Error: 'script' is required for evaluate action";
        result = await browserController.evaluate(script);
        break;

      default:
        return `Unknown action: ${action}`;
    }

    if (!result) return "No result from browser.";
    if (result.error) return `Error: ${result.error}`;
    if (result.success) {
      if (action === "navigate") return `Successfully navigated to ${url}`;
      return `Action '${action}' completed successfully.`;
    }

    return JSON.stringify(result);
  },
};
