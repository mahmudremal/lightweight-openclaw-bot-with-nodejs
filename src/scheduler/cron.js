import node_cron from "node-cron";
import logger from "../utils/logger.js";
import { getActiveConfig } from "../config/index.js";

let tasks = [];

export async function startCron() {
  const config = await getActiveConfig();

  stopCron();

  if (!config.cron || config.cron.length === 0) {
    logger.info("CRON", "No cron jobs defined in the active workspace config.");
    return;
  }

  logger.info("CRON", "Scheduling cron jobs...");

  for (const job of config.cron) {
    if (job.schedule && job.name) {
      const task = node_cron.schedule(job.schedule, () => {
        logger.info("CRON", `Executing cron job: ${job.name}`);
        if (job.message) {
            logger.info("CRON", `Cron job message: ${job.message}`);
        }
      }, {
        scheduled: true,
        timezone: config.timezone || "America/New_York"
      });
      tasks.push(task);
      logger.info("CRON", `Scheduled cron job: '${job.name}' with schedule '${job.schedule}'`);
    } else {
      logger.warn("CRON", `Invalid cron job configuration: Missing schedule or name.`, job);
    }
  }
}

export function stopCron() {
  tasks.forEach(task => task.stop());
  tasks = [];
  logger.info("CRON", "All cron jobs stopped.");
}
