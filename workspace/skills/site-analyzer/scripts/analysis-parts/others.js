export default {
  getUsers: (args) => ({
    method: "GET",
    path: "/user",
    query: { page: args.page, limit: args.limit },
    process: (res) => (res.users ? res.users.map(u => ({ id: u.id, email: u.email, role: u.role })) : res),
  }),
  getUser: (args) => ({ method: "GET", path: `/user/${args.id}` }),
  generateEmail: (args) => ({
    method: "POST",
    path: "/ai/generate-email",
    body: {
      domain: args.domain,
      auditData: args.auditData,
      mailbody: {
        subject: args.subject,
        body: args.body,
        to: args.to,
      },
    },
  }),
  analyzeAudit: (args) => ({
    method: "POST",
    path: "/ai/analyze-audit",
    body: { auditData: args.auditData },
  }),
  generateProposal: (args) => ({
    method: "POST",
    path: "/ai/generate-proposal",
    body: { auditData: args.auditData, leadData: args.leadData },
  }),
  getTaskStatus: () => ({ method: "GET", path: "/task/status" }),
  getTasks: (args) => ({
    method: "GET",
    path: "/task",
    query: { limit: args.limit, status: args.status },
    process: (res) => (res.tasks ? res.tasks.map(t => ({ id: t.id, status: t.status, type: t.type })) : res),
  }),
  getAgency: () => ({ method: "GET", path: "/agency" }),
  updateAgency: (args) => ({ method: "PUT", path: "/agency", body: args }),
  getStats: () => ({ method: "GET", path: "/dashboard/stats" }),
  getNotifications: (args) => ({
    method: "GET",
    path: "/notification",
    query: { limit: args.limit, unread: args.unread },
    process: (res) => (res.notifications ? res.notifications.map(n => ({ id: n.id, title: n.title, message: n.message?.substring(0, 100) })) : res),
  }),
  getSettings: () => ({ method: "GET", path: "/settings" }),
  updateSettings: (args) => ({ method: "POST", path: "/settings/update_list", body: args }),
};
