export default {
  getCalendar: (args) => ({
    method: "GET",
    path: "/calendar",
    query: {
      start: args.start,
      end: args.end,
    },
    process: (res) => (res.events ? res.events.map(e => ({ id: e.id, title: e.title, start: e.start, type: e.type, status: e.status })) : res),
  }),
  addEvent: (args) => ({
    method: "POST",
    path: "/calendar",
    body: {
      title: args.title,
      description: args.desc,
      startTime: args.startTime,
      endTime: args.endTime,
      type: args.type || "task",
      status: args.status || "pending",
    },
  }),
  updateEvent: (args) => ({
    method: "PUT",
    path: `/calendar/${args.id}`,
    body: args,
  }),
  deleteEvent: (args) => ({
    method: "DELETE",
    path: `/calendar/${args.id}`,
  }),
};
