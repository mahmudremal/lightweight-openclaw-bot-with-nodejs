---
name: customer-support
description: Customer support & Ticket Handling
metadata:
  emoji: "🎫"
---

# Customer Support Guidelines

This skill provides the ability to manage customer support tickets and handle basic CRUD operations on the designated site. Currently integrated as dummy endpoints for WordPress.

## Instructions for Agent
1. Observe the user's request related to customer support or ticketing.
2. Formulate the required command properties based on the action needed (create, update, read, delete).
3. Parameter Guidelines:
   - `--action`: Mandatory. Determines the API method to call. Options: `getTicket`, `createTicket`, `updateTicket`, `deleteTicket`.
   - `--id`: Required for `getTicket`, `updateTicket`, and `deleteTicket`. This is the unique identifier for the ticket.
   - `--data`: Required for `createTicket` and `updateTicket`. Must be a JSON string of properties to update or create.
4. Execute the command and interpret the output. Notify the user of the final result of the ticket operation.

## Examples
Get a ticket by ID:
`node scripts/site.js --action=getTicket --id=1`

Create a new ticket:
`node scripts/site.js --action=createTicket --data='{"title":"Login Issue","status":"open","priority":"high"}'`

Update an existing ticket:
`node scripts/site.js --action=updateTicket --id=1 --data='{"status":"closed"}'`
