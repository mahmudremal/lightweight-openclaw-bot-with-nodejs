/**
 * Tool Registry - Dynamic tool registration system
 * Each tool is a module with: name, description, parameters, handler
 */

import logger from "../utils/logger.js";

const tools = new Map();

/**
 * Register a tool
 * @param {Object} tool - Tool definition
 * @param {string} tool.name - Tool name
 * @param {string} tool.description - Tool description
 * @param {Object} tool.parameters - JSON Schema for parameters
 * @param {Function} tool.handler - Async function to execute the tool
 */
export function registerTool(tool) {
  if (!tool.name || !tool.handler) {
    throw new Error("Tool must have name and handler");
  }

  tools.set(tool.name, {
    name: tool.name,
    description: tool.description || tool.name,
    parameters: tool.parameters || { type: "object", properties: {} },
    handler: tool.handler,
  });

  logger.debug(`Registered tool: ${tool.name}`);
}

/**
 * Unregister a tool
 * @param {string} name - Tool name to remove
 */
export function unregisterTool(name) {
  tools.delete(name);
}

/**
 * Get a tool by name
 * @param {string} name - Tool name
 * @returns {Object|null} Tool definition
 */
export function getTool(name) {
  return tools.get(name) || null;
}

/**
 * Get all registered tools
 * @returns {Array} Array of tool definitions
 */
export function getAllTools() {
  return Array.from(tools.values());
}

/**
 * Get tools in OpenAI function schema format
 * @returns {Array} Array of tool schemas for LLM
 */
export function getToolsSchema() {
  return getAllTools().map(tool => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

/**
 * Execute a tool by name
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context (workspacePath, etc.)
 * @returns {Promise<string>} Tool result
 */
export async function executeTool(name, args, context = {}) {
  const tool = getTool(name);

  if (!tool) {
    return `❌ Unknown tool: ${name}`;
  }

  try {
    const result = await tool.handler(args, context);
    return result;
  } catch (error) {
    logger.error(`Tool execution error [${name}]:`, error);
    return `❌ Tool '${name}' failed: ${error.message}`;
  }
}

/**
 * Execute multiple tool calls in parallel
 * @param {Array} calls - Array of {name, args} objects
 * @param {Object} context - Execution context
 * @returns {Promise<Array>} Array of results
 */
export async function executeToolsParallel(calls, context = {}) {
  return Promise.all(
    calls.map(async (call) => ({
      tool: call.name,
      args: call.args,
      result: await executeTool(call.name, call.args, context),
    }))
  );
}

// Initialize with empty registry - tools are loaded dynamically
export default {
  register: registerTool,
  unregister: unregisterTool,
  get: getTool,
  getAll: getAllTools,
  getSchema: getToolsSchema,
  execute: executeTool,
  executeParallel: executeToolsParallel,
};