# API Routes Documentation

## Agency Routes

- `GET /agency` - Fetch agency settings.
- `PUT /agency` - Update agency settings.
  - Body: `agency_logo` (optional), `seo_image` (optional), `signature` (optional).

## AI Routes

- `POST /ai/generate-email` - Generate professional email.
  - Body: `domain`, `auditData`, `mailbody` (optional: `subject`, `body`, `to`).
- `POST /ai/analyze-audit` - Analyze website audit data.
  - Body: `auditData`.
- `POST /ai/generate-proposal` - Generate a proposal.
  - Body: `auditData`, `leadData`.

## Audit Report Routes

- `GET /audit-report` - Get reports by user.
  - Query: `limit` (optional), `page` (optional).
- `POST /audit-report` - Create audit report.
  - Body: `domainId`, `reportData` (optional).
- `POST /audit-report/generate/:domainId` - Generate report from audit results.
- `GET /audit-report/:id` - Get report by ID.
- `GET /audit-report/domain/:domainId` - Get report by domain ID.
- `PATCH /audit-report/:id` - Update report.
  - Body: `reportData` (optional), `aiGeneratedContent` (optional), `status` (optional).
- `DELETE /audit-report/:id` - Delete report.

## Audit Routes

- `GET /audit` - Get all audit results.
  - Query: `domainId` (optional), `auditType` (optional), `minScore` (optional), `maxScore` (optional), `limit` (optional), `page` (optional), `status` (optional), `search` (optional).
- `GET /audit/stats` - Get audit stats.
- `GET /audit/types` - Get available audit types.
- `GET /audit/with-tasks` - Get audit results with task status.
  - Query: `domainId`.
- `GET /audit/:id` - Get audit result by ID.
- `PUT /audit/:id` - Update audit result.
  - Body: `score` (optional), `normalized_data` (optional).
- `PUT /audit/ux-review/:id` - Update UI/UX review.
  - Body: `comments` (optional), `status` (optional), `score` (optional).
- `POST /audit/generate-report` - Generate PDF report.
  - Body: `domainId`, `reportType` (optional), `regenerate` (optional).
- `DELETE /audit/:id` - Delete audit result.

## Auth Routes

- `POST /auth/register` - Register new user.
  - Body: `email`, `password`, `username` (optional), `role` (optional).
- `POST /auth/login` - User login.
  - Body: `email`, `password`.
- `POST /auth/extension` - Extension authentication.
  - Body: `apiKey`.
- `POST /auth/refresh` - Refresh token.

## Calendar Routes

- `GET /calendar` - Get calendar events.
  - Query: Parameters for filtering (optional).
- `POST /calendar` - Create calendar event.
  - Body: `title`, `description` (optional), `startTime`, `endTime` (optional), `type`, `status`.
- `PUT /calendar/:id` - Update calendar event.
  - Body: Event data (optional).
- `DELETE /calendar/:id` - Delete calendar event.

## Campaign Routes

- `POST /campaign` - Create campaign.
  - Body: `name`, `description` (optional), `templateId` (optional), `status` (optional), `scheduledAt` (optional), `followupStrategy` (optional).
- `GET /campaign` - Get all campaigns.
  - Query: `status` (optional), `limit` (optional).
- `GET /campaign/:id` - Get campaign by ID.
- `PUT /campaign/:id` - Update campaign.
  - Body: `name` (optional), `description` (optional), `status` (optional), `scheduledAt` (optional), `followupStrategy` (optional).
- `DELETE /campaign/:id` - Delete campaign.
- `POST /campaign/:id/recipients` - Add recipients to campaign.
  - Body: `recipients` (Array).
- `GET /campaign/:id/emails` - Get campaign emails.
  - Query: `status` (optional), `limit` (optional).
- `POST /campaign/:id/send` - Send campaign.
- `GET /campaign/:id/stats` - Get campaign stats.
- `GET /campaign/:id/tracking` - Get tracking logs for campaign.

## Conversation Routes

- `GET /conversation/:domainId/contacts` - Get contacts by domain.
- `POST /conversation/:domainId/contacts` - Create contact.
  - Body: Contact data.
- `DELETE /conversation/contacts/:id` - Delete contact.
- `PUT /conversation/contacts/:id` - Update contact.
  - Body: `id`, `type`, `value`, `is_primary`.
- `GET /conversation/:domainId/conversations` - Get conversations for domain.
  - Query: `limit` (optional), `offset` (optional).
- `POST /conversation/:domainId/sync` - Sync conversations.
- `POST /conversation/whatsapp/init` - Initialize WhatsApp.
- `GET /conversation/whatsapp/status` - Get WhatsApp status.
- `GET /conversation/whatsapp/chats` - Get WhatsApp chats.
- `GET /conversation/whatsapp/chats/:chatId/messages` - Get WhatsApp chat messages.
  - Query: `limit` (optional).
- `POST /conversation/whatsapp/logout` - Logout WhatsApp.
- `POST /conversation/whatsapp/send` - Send WhatsApp message.
  - Body: `to`, `message`, `domainId`, `attachment` (optional).

## Dashboard Routes

- `GET /dashboard/stats` - Fetch dashboard statistics.

## Domain Routes

- `GET /domain/check` - Check domain status.
  - Query: `url`.
- `GET /domain/my` - Get domains for authenticated user.
  - Query: `status` (optional), `source` (optional), `limit` (optional), `page` (optional).
- `POST /domain` - Create domain and optional analysis tasks.
  - Body: `url`, `analysisTypes` (optional), `selectedTypes` (optional), `priority` (optional), `source` (optional).
- `GET /domain` - Get all domains.
  - Query: `status` (optional), `source` (optional), `search` (optional), `limit` (optional), `page` (optional).
- `GET /domain/stats` - Get domain stats.
- `GET /domain/needs-processing` - Get domains needing processing.
  - Query: `page` (optional), `limit` (optional).
- `GET /domain/:id` - Get domain by ID.
- `PATCH /domain/:id/status` - Update domain status.
  - Body: `status`.
- `POST /domain/bulk-delete` - Bulk delete domains.
  - Body: `domainIds` (Array).
- `POST /domain/:id/analyze` - Create analysis tasks for existing domain.
  - Body: `analysisTypes`, `priority` (optional).
- `DELETE /domain/:id` - Delete domain.

## Email Template Routes

- `GET /email-template` - Get all email templates.
- `POST /email-template` - Create email template.
  - Body: `name`, `subject`, `body`, `category`.
- `PUT /email-template/:id` - Update email template.
  - Body: `id`, `name`, `subject`, `body`, `category`.
- `DELETE /email-template/:id` - Delete email template.
  - Body: `id`.

## Lead Routes

- `POST /lead` - Create lead.
  - Body: `domainId`, `companyName` (optional), `contactEmail` (optional), `contactName` (optional), `phoneNumber` (optional), `status` (optional), `source` (optional), `notes` (optional).
- `GET /lead` - Get all leads.
  - Query: `status` (optional), `source` (optional), `limit` (optional), `sortBy` (optional), `sortOrder` (optional), `page` (optional).
- `GET /lead/stats` - Get lead stats.
- `GET /lead/:id` - Get lead by ID.
- `PATCH /lead/:id` - Update lead.
  - Body: `companyName` (optional), `contactEmail` (optional), `contactName` (optional), `phoneNumber` (optional), `status` (optional), `source` (optional), `notes` (optional), `tasks` (optional).
- `POST /lead/:id/recalculate-score` - Recalculate lead score.
- `DELETE /lead/:id` - Delete lead.

## Notification Routes

- `GET /notification` - Get notifications.
  - Query: `limit` (optional), `page` (optional), `unread` (optional), `type` (optional).
- `GET /notification/unread-count` - Get unread count.
- `POST /notification/read/all` - Mark all as read.
- `POST /notification/:id/read` - Mark specific notification as read.

## Offload Routes

- `GET /offload/users` - Get list of users.
- `GET /offload/export/:userId` - Export bundle for user.
- `POST /offload/import/:userId` - Import bundle for user.
  - Body: `bundle` (File).
- `GET /offload/uploads/onetime/:filename` - One-time download for file.

## Proposal Routes

- `POST /proposal` - Create proposal.
  - Body: Proposal data.
- `GET /proposal` - Get all proposals.
- `GET /proposal/stats` - Get proposal stats.
- `GET /proposal/:id` - Get proposal by ID.
- `PATCH /proposal/:id` - Update proposal.
  - Body: Update data.
- `DELETE /proposal/:id` - Delete proposal.
- `POST /proposal/:id/review` - Review proposal.
- `POST /proposal/:id/approve` - Approve proposal.
- `POST /proposal/:id/reject` - Reject proposal.
- `POST /proposal/:id/send` - Send proposal.
- `POST /proposal/bulk/send` - Bulk send proposals.
- `GET /proposal/pending/review` - Get proposals pending review.

## Reports Routes

- `GET /reports/report-:domain_id-current.pdf` - Download current report.
  - Query: `regenerate` (optional), `type` (optional).

## Session Routes

- `GET /session` - Get all sessions.
  - Query: `status` (optional), `userId` (optional), `page` (optional), `limit` (optional).
- `GET /session/stats` - Get session stats.
- `GET /session/:id` - Get session by ID.
- `DELETE /session/:id` - Terminate session.
- `POST /session/cleanup` - Cleanup inactive sessions.

## Settings Routes

- `GET /settings/lead-scoring-rules` - Get lead scoring rules.
- `POST /settings/lead-scoring-rules` - Update lead scoring rules.
  - Body: `rules` (Array).
- `GET /settings/get_list` - Get specified settings.
  - Query: `fields` (Comma separated).
- `POST /settings/update_list` - Update multiple settings.
  - Body: Key-value pairs of settings.
- `GET /settings/whitelabel` - Get whitelabel settings.
- `POST /settings/whitelabel` - Update whitelabel settings.
  - Body: `primaryColor` (optional), `secondaryColor` (optional), `logo` (File, optional).
- `GET /settings/webmail` - Get webmail config.
- `POST /settings/webmail` - Save webmail config.
  - Body: Config data.
- `GET /settings` - Get all settings.
- `GET /settings/api-keys` - Get all API keys.
- `POST /settings/api-keys` - Create API key.
  - Body: `service`, `apiKey`, `monthlyLimit`.
- `PUT /settings/api-keys/:id` - Update API key.
  - Body: `apiKey` (optional), `monthlyLimit` (optional), `isActive` (optional).
- `DELETE /settings/api-keys/:id` - Delete API key.
- `GET /settings/:key` - Get setting by key.
- `PUT /settings/:key` - Update setting by key.
  - Body: `value`.
- `DELETE /settings/:key` - Delete setting by key.

## Task Routes

- `POST /task/start` - Start background processing.
- `POST /task/stop` - Stop background processing.
- `GET /task/status` - Get background processing status.
- `GET /task` - Get all tasks.
  - Query: `limit` (optional), `page` (optional), `status` (optional).
- `GET /task/stats` - Get task stats.
- `GET /task/pending` - Get pending tasks.
  - Query: `limit` (optional).
- `GET /task/:id` - Get task by ID.
- `PUT /task/restart-all` - Restart all failed tasks.
- `PUT /task/:id/queue` - Re-queue specific task.
- `GET /task/jobs/counts` - Get job counts.
- `GET /task/jobs/live` - Get live jobs.
- `GET /task/jobs/all` - Get all jobs.
  - Query: `types` (optional), `page` (optional), `limit` (optional).
- `DELETE /task/jobs/:jobId` - Delete specific job.
- `DELETE /task/status/:status` - Delete tasks by status.
- `DELETE /task/:id` - Delete task.
- `POST /task/jobs/:jobId/retry` - Retry failed job.
- `POST /task/queue/clean` - Clean queue for specific states.
  - Body: `states` (Array).
- `POST /task/queue/clean/all` - Clean all queues.
- `POST /task/queue/clean/completed` - Clean completed jobs.
- `POST /task/queue/clean/failed` - Clean failed jobs.
- `POST /task/queue/empty` - Empty queue.
- `POST /task/queue/obliterate` - Obliterate queue.

## Upload Routes

- `POST /upload` - Upload multiple attachments.
  - Body: `attachments` (File Array).

## User Routes

- `GET /user` - Get all users.
  - Query: `page` (optional), `limit` (optional).
- `POST /user` - Create user.
  - Body: User data.
- `GET /user/:id` - Get user by ID.
- `PUT /user/:id` - Update user.
  - Body: User data.
- `DELETE /user/:id` - Delete user.
- `GET /user/:id/sessions` - Get sessions for user.
- `DELETE /user/:id/sessions/:sessionId` - Terminate specific user session.
- `GET /user/stats` - Get user stats.
- `GET /user/:id/permissions` - Get user permissions.

## Webmail Routes

- `GET /webmail/emails` - Fetch emails from mail server.
  - Query: `mailbox` (optional), `page` (optional), `limit` (optional).
- `POST /webmail/send` - Send email.
  - Body: `to`, `subject`, `html` (optional), `body` (optional), `scheduleDate` (optional), `domainId`, `leadId` (optional), `proposalId` (optional), `reportPath` (optional), `reportName` (optional), `attachments` (File Array, optional).
- `GET /webmail/mailboxes` - Get mailboxes from server.
- `GET /webmail` - Get emails from database.
  - Query: `status` (optional), `limit` (optional), `offset` (optional).
- `GET /webmail/stats` - Get email stats.
- `GET /webmail/:id` - Get email by ID.
- `PATCH /webmail/:id/status` - Update email status.
  - Body: `status`, `metadata` (optional).
- `PUT /webmail/:id` - Update email content.
  - Body: `toMail`, `subject`, `html`, `attachments` (File Array, optional).
- `DELETE /webmail/:id` - Delete email.

## WhatsApp Template Routes

- `GET /whatsapp-template` - Get all WhatsApp templates.
- `POST /whatsapp-template` - Create WhatsApp template.
  - Body: `name`, `body`.
- `PUT /whatsapp-template/:id` - Update WhatsApp template.
  - Body: `name` (optional), `body` (optional).
- `DELETE /whatsapp-template/:id` - Delete WhatsApp template.
