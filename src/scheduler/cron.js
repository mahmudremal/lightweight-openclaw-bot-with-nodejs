import node_cron from "node-cron";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { ROOT_DIR } from "../core/workspace.js";
import logger from "../utils/logger.js";
import { processMessage } from "../core/agent.js";
import eventService from "../utils/events.js";

class Cron {
  constructor() {
    this.tasks = new Map();
    this.jobsFilePath = path.resolve(ROOT_DIR, "corn", "jobs.json");
    if (!fs.existsSync(this.jobsFilePath)) {
      this.jobsFilePath = path.resolve(ROOT_DIR, "cron", "jobs.json");
    }
  }

  async init() {
    await this.start();
    eventService.on("config:invalidated", () => this.start());
  }

  async start() {
    this.stop();

    if (!fs.existsSync(this.jobsFilePath)) {
      await fs.ensureDir(path.dirname(this.jobsFilePath));
      await fs.writeJson(
        this.jobsFilePath,
        { version: 1, jobs: [] },
        { spaces: 2 },
      );
    }

    const data = await fs.readJson(this.jobsFilePath);
    const jobs = data.jobs || [];

    if (jobs.length === 0) {
      logger.info("CRON", "No cron jobs found in " + this.jobsFilePath);
      return;
    }

    logger.info("CRON", `Scheduling ${jobs.length} jobs...`);

    for (const job of jobs) {
      if (job.enabled && job.schedule?.expr) {
        this.scheduleJob(job);
      }
    }
  }

  scheduleJob(job) {
    const task = node_cron.schedule(
      job.schedule.expr,
      async () => {
        logger.info("CRON", `Executing job: ${job.name} (${job.id})`);
        try {
          if (job.payload?.kind === "agentTurn" && job.payload?.message) {
            await processMessage(job.payload.message, {
              channel: "cron",
              from: "system",
              jobId: job.id,
            });
          }
          this.updateJobState(job.id, {
            lastStatus: "ok",
            lastRunAtMs: Date.now(),
          });
        } catch (err) {
          logger.error("CRON", `Job ${job.name} failed: ${err.message}`);
          this.updateJobState(job.id, {
            lastStatus: "error",
            lastError: err.message,
            lastRunAtMs: Date.now(),
          });
        }
      },
      {
        scheduled: true,
        timezone: job.schedule.tz || "UTC",
      },
    );
    this.tasks.set(job.id, task);
    logger.info("CRON", `Scheduled: '${job.name}' [${job.schedule.expr}]`);
  }

  async updateJobState(jobId, stateUpdates) {
    try {
      const data = await fs.readJson(this.jobsFilePath);
      const jobIndex = data.jobs.findIndex((j) => j.id === jobId);
      if (jobIndex !== -1) {
        data.jobs[jobIndex].state = {
          ...(data.jobs[jobIndex].state || {}),
          ...stateUpdates,
        };
        await fs.writeJson(this.jobsFilePath, data, { spaces: 2 });
      }
    } catch (err) {
      logger.error("CRON", `Failed to update job state: ${err.message}`);
    }
  }

  stop() {
    this.tasks.forEach((task) => task.stop());
    this.tasks.clear();
    logger.info("CRON", "All cron jobs stopped.");
  }

  async getJobs() {
    const data = await fs.readJson(this.jobsFilePath);
    return data.jobs || [];
  }

  async addJob(job) {
    const data = await fs.readJson(this.jobsFilePath);
    const newJob = {
      id: crypto.randomUUID(),
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      enabled: true,
      ...job,
    };
    data.jobs.push(newJob);
    await fs.writeJson(this.jobsFilePath, data, { spaces: 2 });
    if (newJob.enabled) this.scheduleJob(newJob);
    return newJob;
  }

  async updateJob(jobId, updates) {
    const data = await fs.readJson(this.jobsFilePath);
    const jobIndex = data.jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) throw new Error("Job not found");

    data.jobs[jobIndex] = {
      ...data.jobs[jobIndex],
      ...updates,
      updatedAtMs: Date.now(),
    };

    await fs.writeJson(this.jobsFilePath, data, { spaces: 2 });

    if (this.tasks.has(jobId)) {
      this.tasks.get(jobId).stop();
      this.tasks.delete(jobId);
    }

    if (data.jobs[jobIndex].enabled) {
      this.scheduleJob(data.jobs[jobIndex]);
    }

    return data.jobs[jobIndex];
  }

  async deleteJob(jobId) {
    const data = await fs.readJson(this.jobsFilePath);
    data.jobs = data.jobs.filter((j) => j.id !== jobId);
    await fs.writeJson(this.jobsFilePath, data, { spaces: 2 });
    if (this.tasks.has(jobId)) {
      this.tasks.get(jobId).stop();
      this.tasks.delete(jobId);
    }
  }
}

const cron = new Cron();
export default cron;

export const startCron = () => cron.start();
export const stopCron = () => cron.stop();
