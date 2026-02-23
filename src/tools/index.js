import {
  registerTool,
  unregisterTool,
  getTool,
  getAllTools,
  getToolsSchema,
  executeTool,
  executeToolsParallel,
} from "./registry.js";

import searchTool from "./search.js";
import requestTool from "./request.js";
import {
  read_file,
  write_file,
  append_file,
  read_dir,
} from "./filesystem_tools.js";
import {
  send_message,
  get_chats_list,
  get_chat_messages,
} from "./channels_tools.js";
import { get_cron_jobs, add_cron_job, delete_cron_job } from "./cron_tools.js";

const coreTools = [
  searchTool,
  requestTool,
  read_file,
  write_file,
  append_file,
  read_dir,
  send_message,
  get_chats_list,
  get_chat_messages,
  get_cron_jobs,
  add_cron_job,
  delete_cron_job,
];

export function initializeTools() {
  for (const tool of coreTools) {
    registerTool(tool);
  }
}

export {
  registerTool,
  unregisterTool,
  getTool,
  getAllTools,
  getToolsSchema,
  executeTool,
  executeToolsParallel,
};
