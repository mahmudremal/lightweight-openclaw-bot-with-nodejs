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
    if (!jobs || jobs.length === 0) {
      return "No cron jobs found.";
    }
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `Here are your scheduled tasks:\n\n${jobs
      .map(
        (
          { name, id, enabled, createdAtMs, updatedAtMs, schedule, payload },
          i,
        ) => {
          const created = new Date(createdAtMs);
          const updated = new Date(updatedAtMs);
          return `${i + 1}. ${name}\n   - ID: ${id}\n   - Status: ${enabled ? "Active" : "Inactive"}\n   - Created: ${created.getDate() + " " + months[created.getMonth() - 1] + " " + created.getFullYear()}\n   - Updated: ${updated.getDate() + " " + months[updated.getMonth() - 1] + " " + updated.getFullYear()}\n   - Enabled: ${schedule.expr}, ${schedule.tz}, ${schedule.kind}\n\nPayload: \n\tKind: ${payload.kind}\n\tMessage: ${payload.message}`;
        },
      )
      .join("\n")}`;
  },
};

export const add_cron_job = {
  name: "add_cron_job",
  description: "Add a new scheduled cron job.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Name of the job" },
      expr: {
        type: "string",
        description: "Cron expression (e.g. '0 9 * * *')",
      },
      tz: {
        type: "string",
        description: "Timezone (e.g. 'Asia/Dhaka')",
        default: "Asia/Dhaka",
      },
      message: {
        type: "string",
        description: "Message to process when job runs",
      },
    },
    required: ["name", "expr", "message"],
  },
  handler: async ({ name, expr, tz = "Asia/Dhaka", message }) => {
    // Basic validation to prevent node-cron errors
    if (!expr || typeof expr !== "string") {
      return "❌ Error: 'expr' (cron expression) must be a valid string.";
    }

    const job = await cron.addJob({
      name,
      schedule: { expr, tz, kind: "cron" },
      payload: { kind: "agentTurn", message },
    });
    return `✅ Job added successfully with ID: ${job.id}`;
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
    return `✅ Job ${id} updated successfully.`;
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
    const wasRemoved = await cron.deleteJob(id);
    if (!wasRemoved) {
      return `❌ Job ${id} not found.`;
    }
    return `✅ Job ${id} deleted successfully.`;
  },
};
