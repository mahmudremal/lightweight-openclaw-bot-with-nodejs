import Table from "cli-table3";
import {
  listProviders,
  toggleProvider,
  setChannelConfig,
} from "../../src/core/providerManager.js";
import channels from "../../src/channels/index.js";
import logger from "../../src/utils/logger.js";
import { resolveWorkspace } from "../../src/core/workspace.js";

export function registerChannelsCommands(program) {
  const channelsCmd = program
    .command("channel")
    .alias("channels")
    .description("Manage communication channels (whatsapp, telegram, etc.)");

  channelsCmd
    .command("list")
    .description("List all available and configured channels")
    .action(async () => {
      const list = await listProviders();
      const table = new Table({ head: ["Name", "Status"] });
      list.forEach((p) =>
        table.push([p.name, p.active ? "Enabled ✅" : "Disabled ❌"]),
      );
      console.log(table.toString());
      process.exit(0);
    });

  channelsCmd
    .command("enable <name>")
    .description("Enable a channel")
    .action(async (name) => {
      const result = await toggleProvider(name, true);
      logger.info("ROMI", result);
      process.exit(0);
    });

  channelsCmd
    .command("disable <name>")
    .description("Disable a channel")
    .action(async (name) => {
      const result = await toggleProvider(name, false);
      logger.info("ROMI", result);
      process.exit(0);
    });

  channelsCmd
    .command("set <channel> <key> <value>")
    .description("Set channel configuration (e.g., set telegram token <token>)")
    .action(async (channel, key, value) => {
      const result = await setChannelConfig(channel, key, value);
      logger.info("ROMI", result);
      process.exit(0);
    });

  channelsCmd
    .command("login <channel>")
    .description("Authenticate/Initialize a channel (e.g., WhatsApp QR)")
    .action(async (channel) => {
      const chan = channels.getChannel(channel);
      if (!chan) {
        logger.error("ROMI", `Channel '${channel}' not found.`);
        process.exit(1);
      }
      logger.info("ROMI", `Initializing ${channel}...`);
      await chan.init();
    });

  program
    .command("send <to> <message...>")
    .description(
      "Send a message via a specific channel (e.g. send whatsapp:12345 hello)",
    )
    .option("-w, --workspace <name>", "Specify the workspace to use")
    .action(async (to, message, opts) => {
      await resolveWorkspace(opts.workspace);
      try {
        let channelName = "whatsapp";
        let target = to;
        if (to.includes(":")) {
          [channelName, target] = to.split(":");
        }

        const chan = channels.getChannel(channelName);
        if (!chan) throw new Error(`Channel ${channelName} not found`);

        await chan.sendMessage(
          target,
          Array.isArray(message) ? message.join(" ") : message,
        );
        logger.log("ROMI", "Message sent.");
        process.exit(0);
      } catch (err) {
        logger.error("ROMI", err.message);
        process.exit(1);
      }
    });
}
