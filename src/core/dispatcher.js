import { getWorkspacePath } from "./workspace.js";
import {
  executeTool,
  executeToolsParallel,
  getToolsSchema,
  getTool,
} from "../tools/index.js";

class Dispatcher {
  constructor() {}

  async dispatchToolCall(json) {
    if (!json?.tool) {
      return "❌ Invalid tool call: missing tool name";
    }

    const context = {
      workspacePath: getWorkspacePath(),
    };

    return executeTool(json.tool, json.args || {}, context);
  }

  async dispatchToolCalls(calls) {
    const context = {
      workspacePath: getWorkspacePath(),
    };

    const formattedCalls = calls.map((call) => ({
      name: call.tool,
      args: call.args || {},
    }));

    return executeToolsParallel(formattedCalls, context);
  }

  getToolsSchema() {
    return getToolsSchema();
  }

  hasTool(name) {
    return getTool(name) !== null;
  }
}

const dispatcher = new Dispatcher();
export default dispatcher;

export const dispatchToolCall = (j) => dispatcher.dispatchToolCall(j);
export const dispatchToolCalls = (c) => dispatcher.dispatchToolCalls(c);
export const getToolsSchemaExport = () => dispatcher.getToolsSchema();
export const hasTool = (n) => dispatcher.hasTool(n);
export { getToolsSchema };
