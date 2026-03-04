import romiServer from "../../src/server.js";
import cron from "../../src/scheduler/cron.js";
import heartbeat from "../../src/scheduler/heartbeat.js";
import channels from "../../src/channels/index.js";
import {
  resolveWorkspace,
  getActiveWorkspaceId,
} from "../../src/core/workspace.js";
import logger from "../../src/utils/logger.js";
import { getActiveConfig } from "../../src/config/index.js";

const PORT = 8765;

export function registerStartCommand(program) {
  program
    .command("start")
    .description("Start server + scheduler + heartbeat + channels")
    .option("-p, --port <n>", "server port", PORT)
    .option("-w, --workspace <name>", "Specify the workspace to use")
    .action(async (opts) => {
      try {
        await resolveWorkspace(opts.workspace);
        const activeConfig = await getActiveConfig();
        const dashboardPort = activeConfig.dashboard?.port || 8765;

        await romiServer.start(Number(opts.port));
        await cron.init();
        await heartbeat.start();
        await channels.init();

        if (logger.logTerminal === false) {
          const workspaceName = getActiveWorkspaceId();
          const serverPort = opts.port;
          const dashboardUrl = `http://localhost:${dashboardPort}`;

          const boxen = (await import("boxen")).default;

          const message = [
            `🚀 \x1b[1mROMI BOT ENGINE STARTED SUCCESSFULLY\x1b[0m`,
            ``,
            `\x1b[36mWorkspace :\x1b[0m ${workspaceName}`,
            `\x1b[36mServer    :\x1b[0m http://localhost:${serverPort}`,
            `\x1b[36mDashboard :\x1b[0m ${dashboardUrl}`,
          ].join("\n");

          const boxed = boxen(message, {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "cyan",
            dimBorder: true,
          });

          console.log(boxed);
        } else {
          logger.info(
            "ROMI",
            `Starting services in workspace: '${getActiveWorkspaceId()}'`,
          );
        }
      } catch (error) {
        logger.error("ROMI", error.message);
      }
    });
}
