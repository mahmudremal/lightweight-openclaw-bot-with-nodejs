import cron from "../scheduler/cron.js";

export const get_cron_jobs = {
  name: "get_cron_jobs",
  description: "List all scheduled cron jobs.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    const jobs = await cron.getJobs();
    return JSON.stringify(jobs, null, 2);
  },
};

export const add_cron_job = {
  name: "add_cron_job",
  description: "Add a new scheduled cron job.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Name of the job" },
      schedule: {
        type: "object",
        properties: {
          expr: {
            type: "string",
            description: "Cron expression (e.g. '0 9 * * *')",
          },
          tz: { type: "string", description: "Timezone (e.g. 'Asia/Dhaka')" },
        },
        required: ["expr"],
      },
      message: {
        type: "string",
        description: "Message to process when job runs",
      },
    },
    required: ["name", "schedule", "message"],
  },
  handler: async ({ name, schedule, message }) => {
    const job = await cron.addJob({
      name,
      schedule: { ...schedule, kind: "cron" },
      payload: { kind: "agentTurn", message },
    });
    return `Job added successfully with ID: ${job.id}`;
  },
};

export const delete_cron_job = {
  name: "delete_cron_job",
  description: "Delete a scheduled cron job by ID.",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "The ID of the job to delete" },
    },
    required: ["id"],
  },
  handler: async ({ id }) => {
    await cron.deleteJob(id);
    return `Job ${id} deleted successfully.`;
  },
};
