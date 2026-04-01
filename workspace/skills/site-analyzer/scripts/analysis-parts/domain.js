import fs from "fs";
import path from "path";
import os from "os";

export default {
  addSite: (args) => ({
    method: "POST",
    path: "/domains",
    body: {
      url: args.site,
      analysisTypes: args.types?.split(",") || ["seo"],
      priority: args.priority || 5,
    },
  }),
  getSite: (args) => {
    if (args.id) {
      return {
        method: "GET",
        path: `/domains/${args.id}`,
        process: ({
          domain: { submitted_by, normalized_url, ...domain },
          tasks,
        }) => ({
          domain: {
            ...domain,
            created_at: new Date(domain.created_at * 1000).toLocaleString(),
            updated_at: new Date(domain.updated_at * 1000).toLocaleString(),
          },
          tasks: tasks.map(
            ({
              created_at,
              updated_at,
              scheduled_at,
              started_at,
              completed_at,
              domain_id,
              retry_count,
              max_retries,
              ...t
            }) => ({
              ...t,
              retry: retry_count + "/" + max_retries,
              created_at: new Date(created_at * 1000).toLocaleString(),
              updated_at: new Date(updated_at * 1000).toLocaleString(),
              scheduled_at: new Date(scheduled_at * 1000).toLocaleString(),
              started_at: new Date(started_at * 1000).toLocaleString(),
              completed_at: new Date(completed_at * 1000).toLocaleString(),
            }),
          ),
        }),
      };
    }
    return {
      method: "GET",
      path: "/domains",
      query: { search: new URL(args.site).hostname, limit: 1 },
      process: (res) =>
        res.domains?.length
          ? res.domains.map(({ created_at, updated_at, ...d }) => ({
              ...d,
              created_at: new Date(created_at * 1000).toLocaleString(),
              updated_at: new Date(updated_at * 1000).toLocaleString(),
            }))
          : res,
    };
  },
  checkDomain: (args) => ({
    method: "GET",
    path: "/domains/check",
    query: { url: args.site },
    process: (res) =>
      res?.status == "completed"
        ? "Site has been analyzed"
        : res?.status
          ? res
          : "Site has not been analyzed",
  }),
  getReport: (args) => ({
    method: "GET",
    path: `/audit-report/domains/${args.domainId}`,
    process: (res) => {
      if (res.reportData) {
        const { reportData, ...rest } = res;
        return {
          ...rest,
          summary: reportData.summary || "No summary available",
        };
      }
      return res;
    },
  }),
  getReportById: (args) => ({
    method: "GET",
    path: `/audit-report/${args.id}`,
    process: (res) => {
      if (res.reportData) {
        const { reportData, ...rest } = res;
        return {
          ...rest,
          summary: reportData.summary || "No summary available",
        };
      }
      return res;
    },
  }),
  getPdf: (args) => ({
    method: "GET",
    path: `/reports/report-${args.domainId}-current.pdf`,
    query: {
      regenerate: args?.regenerate === false ? "false" : "true",
      type: args?.type ?? "",
    },
    process: async (res) => {
      const tempDir = os.tmpdir();
      const fileName = `report-${args.domainId}-${Date.now()}.pdf`;
      const filePath = path.join(tempDir, fileName);
      await fs.promises.writeFile(filePath, Buffer.from(res));
      return {
        success: true,
        filePath,
        fileName,
        size: res.length,
      };
    },
  }),
  getAudit: (args) => ({
    method: "GET",
    path: `/audits/${args.id}`,
    process: ({ result: { raw_data = "{}", ...res } = {} }) => ({
      ...res,
      // raw_data: JSON.parse(raw_data),
    }),
  }),
};
