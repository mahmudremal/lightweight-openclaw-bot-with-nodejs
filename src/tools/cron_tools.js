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

export const update_cron_job = {
  name: "update_cron_job",
  description: "Update an existing scheduled cron job.",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "The ID of the job to update" },
      name: { type: "string", description: "New name of the job" },
      enabled: { type: "boolean", description: "Enable or disable the job" },
      schedule: {
        type: "object",
        properties: {
          expr: { type: "string", description: "New cron expression" },
          tz: { type: "string", description: "New timezone" },
        },
      },
      message: {
        type: "string",
        description: "New message to process when job runs",
      },
    },
    required: ["id"],
  },
  handler: async ({ id, ...updates }) => {
    if (updates.message) {
      updates.payload = { kind: "agentTurn", message: updates.message };
      delete updates.message;
    }
    await cron.updateJob(id, updates);
    return `Job ${id} updated successfully.`;
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
