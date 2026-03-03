import romiServer from "../../src/server.js";
import cron from "../../src/scheduler/cron.js";
import heartbeat from "../../src/scheduler/heartbeat.js";
import channels from "../../src/channels/index.js";
import {
  resolveWorkspace,
  getActiveWorkspaceId,
} from "../../src/core/workspace.js";
import logger from "../../src/utils/logger.js";

const PORT = 8765;

export function registerStartCommand(program) {
  program
    .command("start")
    .description("Start server + scheduler + heartbeat + channels")
    .option("-p, --port <n>", "server port", PORT)
    .option("-w, --workspace <name>", "Specify the workspace to use")
    .action(async (opts) => {
      await resolveWorkspace(opts.workspace);
      logger.info(
        "ROMI",
        `Starting services in workspace: '${getActiveWorkspaceId()}'`,
      );

      await romiServer.start(Number(opts.port));
      await cron.init();
      await heartbeat.start();
      await channels.init();
    });
}
