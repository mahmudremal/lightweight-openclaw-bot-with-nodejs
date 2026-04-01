export default {
  getLeads: (args) => ({
    method: "GET",
    path: "/lead",
    query: {
      status: args.status,
      limit: args.limit || 10,
      page: args.page || 1,
    },
    process: (res) => (res.leads ? res.leads.map(l => ({ id: l.id, domain: l.domain_url, email: l.contactEmail, status: l.status })) : res),
  }),
  addLead: (args) => ({
    method: "POST",
    path: "/lead",
    body: {
      domainId: args.domainId,
      contactEmail: args.email,
      contactName: args.name,
      status: args.status || "new",
    },
  }),
  updateLead: (args) => ({
    method: "PATCH",
    path: `/lead/${args.id}`,
    body: {
      status: args.status,
      notes: args.notes,
    },
  }),
  getLead: (args) => ({
    method: "GET",
    path: `/lead/${args.id}`,
    process: (res) => {
      const { tasks, ...rest } = res;
      return { ...rest, task_count: tasks?.length || 0 };
    },
  }),
};
