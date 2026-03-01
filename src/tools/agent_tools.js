import fs from "fs-extra";
import path from "path";
import logger from "../utils/logger.js";
import { getWorkspacePath } from "../core/workspace.js";

const getTodoPath = (workspacePath) =>
  path.join(workspacePath, "memory", "todo.json");

async function loadTodos(workspacePath) {
  const filePath = getTodoPath(workspacePath);
  if (await fs.pathExists(filePath)) {
    return fs.readJson(filePath);
  }
  return [];
}

async function saveTodos(workspacePath, todos) {
  const filePath = getTodoPath(workspacePath);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, todos, { spaces: 2 });
}

export const todo_tool = {
  name: "todo",
  description:
    "Manage a todo list for breaking down and tracking lengthy tasks.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["add", "list", "complete", "remove", "clear"],
        description: "Action to perform on the todo list",
      },
      task: {
        type: "string",
        description: "The task description (required for 'add')",
      },
      id: {
        type: "number",
        description: "The task ID (required for 'complete' and 'remove')",
      },
    },
    required: ["action"],
  },
  handler: async (args, context) => {
    const { action, task, id } = args;
    const { workspacePath } = context;
    let todos = await loadTodos(workspacePath);

    switch (action) {
      case "add":
        if (!task) return "Error: 'task' is required for add action";
        const newTodo = {
          id: Date.now(),
          task,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        todos.push(newTodo);
        await saveTodos(workspacePath, todos);
        return `Added todo: [${newTodo.id}] ${task}`;

      case "list":
        if (todos.length === 0) return "Todo list is empty.";
        return todos
          .map((t) => `${t.completed ? "✅" : "☐"} [${t.id}] ${t.task}`)
          .join("\n");

      case "complete":
        if (id === undefined)
          return "Error: 'id' is required for complete action";
        const todoToComplete = todos.find((t) => t.id === id);
        if (!todoToComplete) return `Error: Todo with ID ${id} not found.`;
        todoToComplete.completed = true;
        todoToComplete.completedAt = new Date().toISOString();
        await saveTodos(workspacePath, todos);
        return `Completed todo: [${id}] ${todoToComplete.task}`;

      case "remove":
        if (id === undefined)
          return "Error: 'id' is required for remove action";
        const filteredTodos = todos.filter((t) => t.id !== id);
        if (filteredTodos.length === todos.length)
          return `Error: Todo with ID ${id} not found.`;
        await saveTodos(workspacePath, filteredTodos);
        return `Removed todo with ID ${id}`;

      case "clear":
        await saveTodos(workspacePath, []);
        return "Cleared all todos.";

      default:
        return `Unknown action: ${action}`;
    }
  },
};

export const spawn_subagent = {
  name: "spawn_subagent",
  description:
    "Spawn a sub-agent to perform a specific task in the background.",
  parameters: {
    type: "object",
    properties: {
      task: {
        type: "string",
        description: "The task description for the sub-agent to perform",
      },
    },
    required: ["task"],
  },
  handler: async (args, context) => {
    const { task } = args;
    const { workspacePath } = context;

    logger.info("AGENT", `Spawning sub-agent for task: ${task}`);

    // We run this in the background by not awaiting the promise
    // and sending it to a separate session to avoid context pollution
    const subAgentSession = `subagent:${Date.now()}`;

    const { default: agent } = await import("../core/agent.js");

    agent
      .processMessage(task, {
        channel: "subagent",
        from: subAgentSession,
      })
      .then((result) => {
        logger.info("AGENT", `Sub-agent task completed: ${task}`);
        // In a real system, we might want to notify the main agent or log the result
        // For now, we just log it.
      })
      .catch((err) => {
        logger.error("AGENT", `Sub-agent task failed: ${task}`, err);
      });

    return `Sub-agent spawned for task: "${task}". It will run in the background.`;
  },
};
