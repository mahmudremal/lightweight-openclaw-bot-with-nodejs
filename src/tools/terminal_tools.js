/**
 * I want here all necessery terminal control tools to execute for LLM.
 *
 * Need to make it safer for use.
 */

import { exec } from "child_process";
import { promisify } from "util";
import logger from "../utils/logger.js";
import { getActiveWorkspaceId } from "../core/workspace.js";
import { getWorkspacePath } from "../core/paths.js";

const execAsync = promisify(exec);

const RISKY_COMMANDS = [
  "rm -rf",
  "format",
  ":(){ :|:& };:",
  "mkfs",
  "dd if=",
  "> /dev/",
  "chmod -R 777 /",
  "chown -R",
];

export const terminal_exec = {
  name: "terminal_exec",
  description:
    "This tool is useful when you need to execute terminal commands.",
  // Use this to run scripts, check system status, or perform CLI tasks. Never execute risky commands.
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to execute",
      },
      cwd: {
        type: "string",
        description:
          "The working directory to execute the command in (optional)",
      },
    },
    required: ["command"],
  },
  handler: async ({ command, cwd }) => {
    const isRisky = RISKY_COMMANDS.some((risky) => command.includes(risky));
    if (isRisky) {
      return `Error: Command contains restricted/risky patterns.`;
    }

    try {
      logger.info("TERMINAL", `Executing: ${command}`);
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || getWorkspacePath(getActiveWorkspaceId()) || process.cwd(),
      });
      return stdout || stderr || "Command executed successfully (no output)";
    } catch (error) {
      return `Error executing command: ${error.message}\n${error.stderr || ""}`;
    }
  },
};
