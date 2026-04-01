export default {
  getContacts: (args) => ({
    method: "GET",
    path: `/conversation/${args.domainId}/contacts`,
  }),
  getConversations: (args) => ({
    method: "GET",
    path: `/conversation/${args.domainId}/conversations`,
    query: { limit: args.limit, offset: args.offset },
    process: (res) => (res.conversations ? res.conversations.map(c => ({ id: c.id, last_message: c.last_message?.substring(0, 100), updated_at: c.updated_at })) : res),
  }),
  sendWhatsApp: (args) => ({
    method: "POST",
    path: "/conversation/whatsapp/send",
    body: {
      to: args.to,
      message: args.message,
      domainId: args.domainId,
    },
  }),
  getEmails: (args) => ({
    method: "GET",
    path: "/webmail/emails",
    query: { mailbox: args.mailbox || "INBOX", limit: args.limit || 10 },
    process: (res) => (res.emails ? res.emails.map(e => ({ id: e.id, from: e.from, subject: e.subject, date: e.date })) : res),
  }),
  sendEmail: (args) => ({
    method: "POST",
    path: "/webmail/send",
    body: {
      to: args.to,
      subject: args.subject,
      body: args.body,
      domainId: args.domainId,
      leadId: args.leadId,
    },
  }),
  getEmailStats: () => ({ method: "GET", path: "/webmail/stats" }),
  getEmail: (args) => ({
    method: "GET",
    path: `/webmail/${args.id}`,
    process: (res) => {
      if (res.body) res.body = res.body.substring(0, 500) + (res.body.length > 500 ? "..." : "");
      if (res.html) delete res.html;
      return res;
    },
  }),
  getMailboxes: () => ({ method: "GET", path: "/webmail/mailboxes" }),
  getDbEmails: (args) => ({
    method: "GET",
    path: "/webmail",
    query: { status: args.status, limit: args.limit, offset: args.offset },
    process: (res) => (res.emails ? res.emails.map(e => ({ id: e.id, subject: e.subject, status: e.status })) : res),
  }),
  updateEmailStatus: (args) => ({
    method: "PATCH",
    path: `/webmail/${args.id}/status`,
    body: { status: args.status, metadata: args.metadata },
  }),
  updateEmail: (args) => ({
    method: "PUT",
    path: `/webmail/${args.id}`,
    body: args,
  }),
  deleteEmail: (args) => ({
    method: "DELETE",
    path: `/webmail/${args.id}`,
  }),
};
