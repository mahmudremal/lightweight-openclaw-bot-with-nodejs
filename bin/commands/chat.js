import { startChat } from "../../src/channels/terminal.js";
import { resolveWorkspace } from "../../src/core/workspace.js";
import logger from "../../src/utils/logger.js";
import { processMessage } from "../../src/core/agent.js";

export function registerChatCommands(program, rl, askQuestion) {
  program
    .command("chat")
    .description("Interactive terminal chat with Romi")
    .option("-w, --workspace <name>", "Specify the workspace to chat in")
    .action(async (opts) => {
      const workspaceName = await resolveWorkspace(opts.workspace, askQuestion);
      logger.info("ROMI", `Chatting in workspace: '${workspaceName}'`);
      startChat(rl);
    });

  program
    .command("ask <message...>")
    .description("Send a single message and get a reply")
    .option("-w, --workspace <name>", "Specify the workspace to use")
    .action(async (message, opts) => {
      const workspaceName = await resolveWorkspace(opts.workspace);
      logger.info(
        "ROMI",
        `Using workspace: '${workspaceName}' for ask command.`,
      );

      const text = Array.isArray(message) ? message.join(" ") : message;
      try {
        const reply = await processMessage(text, {
          channel: "cli",
          from: "cli:user",
          isOwner: true,
        });
        logger.log("ROMI", reply);
        process.exit(0);
      } catch (err) {
        logger.error("ROMI", err.message);
        process.exit(1);
      }
    });
}
