import fs from "fs-extra";
import path from "path";
import { rootify } from "../core/paths.js";

export const read_file = {
  name: "read_file",
  description: "Read the content of a file from the workspace.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path relative to the workspace root",
      },
    },
    required: ["path"],
  },
  handler: async ({ path: fPath }, context) => {
    const filePath = rootify(fPath);
    const workspacePath = context.workspacePath;
    const fullPath = path.resolve(workspacePath, filePath);
    if (!fullPath.startsWith(workspacePath))
      return "❌ Access denied" + " " + fullPath;
    if (!fs.existsSync(fullPath)) return `❌ File does not exist: ${filePath}`;
    const content = await fs.readFile(fullPath, "utf8");
    return `📄 Content of '${filePath}':\n${content}`;
  },
};

export const write_file = {
  name: "write_file",
  description:
    "Write content to a file in the workspace. Overwrites existing file.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path relative to the workspace root",
      },
      content: { type: "string", description: "The content to write" },
    },
    required: ["path", "content"],
  },
  handler: async ({ path: fPath, content }, context) => {
    const filePath = rootify(fPath);
    const workspacePath = context.workspacePath;
    const fullPath = path.resolve(workspacePath, filePath);

    if (!fullPath.startsWith(workspacePath)) return "❌ Access denied";

    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, "utf8");
    return `✅ Wrote to '${filePath}'`;
  },
};

export const append_file = {
  name: "append_file",
  description: "Append content to a file in the workspace.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path relative to the workspace root",
      },
      content: { type: "string", description: "The content to append" },
    },
    required: ["path", "content"],
  },
  handler: async ({ path: fPath, content }, context) => {
    const filePath = rootify(fPath);
    const workspacePath = context.workspacePath;
    const fullPath = path.resolve(workspacePath, filePath);
    if (!fullPath.startsWith(workspacePath)) return "❌ Access denied";
    await fs.ensureDir(path.dirname(fullPath));
    await fs.appendFile(fullPath, content, "utf8");
    return `✅ Appended to '${filePath}'`;
  },
};

export const delete_file = {
  name: "delete_file",
  description: "Delete a file from the workspace.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path relative to the workspace root",
      },
    },
    required: ["path"],
  },
  handler: async ({ path: fPath }, context) => {
    const filePath = rootify(fPath);
    const workspacePath = context.workspacePath;
    const fullPath = path.resolve(workspacePath, filePath);
    if (!fullPath.startsWith(workspacePath)) return "❌ Access denied";
    if (!fs.existsSync(fullPath)) return `❌ File does not exist: ${filePath}`;
    await fs.remove(fullPath);
    return `✅ Deleted file '${filePath}'`;
  },
};

export const read_dir = {
  name: "read_dir",
  description: "List files and folders in a directory.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Directory path relative to workspace",
      },
    },
  },
  handler: async ({ path: fPath = "." }, context) => {
    const dirPath = rootify(fPath);
    const workspacePath = context.workspacePath;
    const fullPath = path.resolve(workspacePath, dirPath);
    if (!fullPath.startsWith(workspacePath)) return "❌ Access denied";
    if (!fs.existsSync(fullPath))
      return `❌ Directory does not exist: ${dirPath}`;
    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) return `❌ Not a directory: ${dirPath}`;
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const listing = entries
      .map((e) => `${e.isDirectory() ? "📁" : "📄"} ${e.name}`)
      .join("\n");
    return `📁 Contents of '${dirPath}':\n${listing}`;
  },
};

export const mkdir = {
  name: "mkdir",
  description:
    "Create a directory (and parent directories if they don't exist).",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path relative to the workspace root",
      },
    },
    required: ["path"],
  },
  handler: async ({ path: fPath }, context) => {
    const dirPath = rootify(fPath);
    const workspacePath = context.workspacePath;
    const fullPath = path.resolve(workspacePath, dirPath);
    if (!fullPath.startsWith(workspacePath)) return "❌ Access denied";
    await fs.ensureDir(fullPath);
    return `✅ Created directory '${dirPath}'`;
  },
};

export const move_file = {
  name: "move_file",
  description: "Move or rename a file or directory.",
  parameters: {
    type: "object",
    properties: {
      src: { type: "string", description: "Source path relative to workspace" },
      dest: {
        type: "string",
        description: "Destination path relative to workspace",
      },
    },
    required: ["src", "dest"],
  },
  handler: async ({ src: sPath, dest: dPath }, context) => {
    const srcPath = rootify(sPath);
    const destPath = rootify(dPath);
    const workspacePath = context.workspacePath;
    const fullSrcPath = path.resolve(workspacePath, srcPath);
    const fullDestPath = path.resolve(workspacePath, destPath);

    if (
      !fullSrcPath.startsWith(workspacePath) ||
      !fullDestPath.startsWith(workspacePath)
    ) {
      return "❌ Access denied";
    }

    if (!fs.existsSync(fullSrcPath))
      return `❌ Source does not exist: ${srcPath}`;

    await fs.move(fullSrcPath, fullDestPath, { overwrite: true });
    return `✅ Moved '${srcPath}' to '${destPath}'`;
  },
};

export const copy_file = {
  name: "copy_file",
  description: "Copy a file or directory.",
  parameters: {
    type: "object",
    properties: {
      src: { type: "string", description: "Source path relative to workspace" },
      dest: {
        type: "string",
        description: "Destination path relative to workspace",
      },
    },
    required: ["src", "dest"],
  },
  handler: async ({ src: sPath, dest: dPath }, context) => {
    const srcPath = rootify(sPath);
    const destPath = rootify(dPath);
    const workspacePath = context.workspacePath;
    const fullSrcPath = path.resolve(workspacePath, srcPath);
    const fullDestPath = path.resolve(workspacePath, destPath);

    if (
      !fullSrcPath.startsWith(workspacePath) ||
      !fullDestPath.startsWith(workspacePath)
    ) {
      return "❌ Access denied";
    }

    if (!fs.existsSync(fullSrcPath))
      return `❌ Source does not exist: ${srcPath}`;

    await fs.copy(fullSrcPath, fullDestPath);
    return `✅ Copied '${srcPath}' to '${destPath}'`;
  },
};
