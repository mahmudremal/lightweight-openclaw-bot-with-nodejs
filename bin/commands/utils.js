import { initProject } from "../../src/init.js";
import { createWorkspace } from "../../src/core/workspace.js";
import logger from "../../src/utils/logger.js";

export function registerUtilCommands(program) {
  program
    .command("init [dir]")
    .description("Initialize a Romi project and workspace")
    .action(async (dir = "default") => {
      await initProject();
      if (dir !== "default") {
        try {
          await createWorkspace(dir);
          logger.log("ROMI", `Created new workspace: '${dir}'`);
        } catch (error) {
          if (error.message.includes("already exists")) {
            logger.warn("ROMI", `Workspace '${dir}' already exists.`);
          } else {
            logger.error(
              "ROMI",
              `Error creating workspace '${dir}': ${error.message}`,
            );
            process.exit(1);
          }
        }
      } else {
        logger.log("ROMI", `Ensured default workspace is initialized.`);
      }
      process.exit(0);
    });

  program
    .command("dashboard")
    .description("Open dashboard web interface")
    .action(async () => {
      logger.log("ROMI", "Dashboard feature coming soon!");
      process.exit(0);
    });
}
