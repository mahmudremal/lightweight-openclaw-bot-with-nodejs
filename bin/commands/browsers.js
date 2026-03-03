import Table from "cli-table3";
import axios from "axios";
import logger from "../../src/utils/logger.js";

const SERVER_URL = "http://localhost:8765";

export function registerBrowsersCommands(program) {
  const browsers = program
    .command("browsers")
    .alias("browser")
    .description("Manage and control connected browsers");

  browsers
    .command("list")
    .description("List all connected browser instances")
    .action(async () => {
      try {
        const response = await axios.get(`${SERVER_URL}/api/browsers`);
        const clients = response.data;

        if (!clients || clients.length === 0) {
          console.log("No browser extensions connected to the running server.");
          process.exit(0);
          return;
        }

        const table = new Table({ head: ["ID", "IP Address"] });
        clients.forEach((c) => table.push([c.id, c.ip || "unknown"]));
        console.log(table.toString());
      } catch (err) {
        logger.error(
          "CLI",
          "Failed to reach Romi server. Is 'romi start' running?",
        );
      }
      process.exit(0);
    });

  browsers
    .command("exec <id> <action> [params...]")
    .description(
      "Execute an action on a specific browser (e.g. exec browser-1 navigate https://google.com)",
    )
    .action(async (id, action, params) => {
      const parsedParams = {};

      // Simple parsing of key=value params
      if (params && params.length > 0) {
        params.forEach((p) => {
          const [key, val] = p.split("=");
          if (key && val) {
            parsedParams[key] = val;
          } else if (action === "navigate" && !p.includes("=")) {
            parsedParams.url = p;
          }
        });
      }

      try {
        logger.info("CLI", `Sending ${action} to server for ${id}...`);
        const response = await axios.post(`${SERVER_URL}/api/browsers/exec`, {
          id,
          action,
          params: parsedParams,
        });

        console.log(JSON.stringify(response.data, null, 2));
      } catch (err) {
        logger.error(
          "CLI",
          "Failed to execute command. Is 'romi start' running?",
        );
      }
      process.exit(0);
    });
}
