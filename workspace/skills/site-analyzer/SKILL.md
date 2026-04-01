---
name: site-analyzer
description: SEO, Performance, CRM, and Communication agent for site analysis.
metadata:
  emoji: "🔍"
---

# Site Analyzer Skill

Professional tool for automated site audits, lead management, and customer CRM. Optimized for customer support agents.

## Core Directives

1. **Analysis Workflow**: Add site (`addSite`) -> Check status (`getSite`) -> Fetch report (`getReport`) -> Provide PDF (`getPdf`).
2. **CRM Workflow**: Manage leads (`getLeads`, `addLead`), schedule events (`addEvent`, `getCalendar`), and track conversations (`getContacts`, `getConversations`).
3. **Communication**: Fetch/Send emails (`getEmails`, `sendEmail`) and WhatsApp (`sendWhatsApp`).
4. **Time Formats**: Input human-readable dates (e.g., "2026-03-30 14:00"). The script handles timestamp conversion.
5. **Advanced Documentation**: If you need an API endpoint or parameter NOT listed here, you **MUST** read `ROUTES.md` to find the correct implementation. The script `scripts/analyzer.js` supports all routes via the `--action` parameter.

## Primary CLI Commands

### Domain & Audit
- `addSite`: `--site=[url] --types=[seo,performance,uiux]`
- `getSite`: `--site=[url]` or `--id=[id]`
- `getReport`: `--domainId=[id]`
- `getPdf`: `--domainId=[id] --regenerate=true`

### Leads & CRM
- `getLeads`: `--status=[new,contacted] --limit=10`
- `addLead`: `--domainId=[id] --email=[email] --name=[name]`
- `getContacts`: `--domainId=[id]`
- `getConversations`: `--domainId=[id]`

### Calendar
- `getCalendar`: `--start="today" --end="next week"`
- `addEvent`: `--title=[text] --startTime=[date] --type=[task,meeting]`
- `deleteEvent`: `--id=[id]`

### Email & WhatsApp
- `getEmails`: `--mailbox=[INBOX] --limit=10`
- `sendEmail`: `--to=[email] --subject=[text] --body=[text] --domainId=[id]`
- `sendWhatsApp`: `--to=[phone] --message=[text] --domainId=[id]`

## Example
`node scripts/analyzer.js --action=addEvent --title="Audit Review" --startTime="tomorrow 10am" --type=task`

See `ROUTES.md` for uncommon API endpoints.
