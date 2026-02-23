/**
 * HTTP Request Tool
 * Make HTTP requests to external APIs
 */

import axios from "axios";

export default {
  name: "request",
  description: "Make an HTTP request to fetch data from external APIs or websites. Use for API calls, webhooks, or fetching remote data.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to request"
      },
      method: {
        type: "string",
        enum: ["get", "post", "put", "delete", "patch"],
        description: "HTTP method (default: get)"
      },
      data: {
        type: "object",
        description: "Request body data (for POST/PUT/PATCH)"
      },
      headers: {
        type: "object",
        description: "HTTP headers to send"
      },
    },
    required: ["url"],
  },
  handler: async (args) => {
    const { url, method = "get", data, headers } = args;

    if (!url) {
      return "❌ URL is required";
    }

    try {
      const response = await axios({
        url,
        method,
        data,
        headers,
        timeout: 15000,
      });

      // Truncate large responses
      let result;
      if (typeof response.data === "object") {
        result = JSON.stringify(response.data, null, 2);
      } else {
        result = String(response.data);
      }

      // Limit response size
      if (result.length > 5000) {
        result = result.substring(0, 5000) + "\n... (truncated)";
      }

      return result;
    } catch (error) {
      const errorMsg = error.response
        ? `Status ${error.response.status}: ${JSON.stringify(error.response.data).substring(0, 200)}`
        : error.message;
      return `❌ Request failed: ${errorMsg}`;
    }
  },
};