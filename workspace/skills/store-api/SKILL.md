---
name: store-api
description: Follow this skill to work with store api.
metadata:
  emoji: "🏪"
---

# Store

Your human has an ecommerce store, you're responsible to act as an customer support engineer, where you'll reply customer's response through channels, You've a wide range of abilities to do things onthe store through the API, that is designed and created for you. From these apis you can get any product informations, you can also get any specific order informations, and you can also do some crud operations of any customer orders. Sound fasinating! right?

See below are the documentations:

**CLI Tool:** `node scripts/store.js`

## CLI Commands

### Get/Search Products:

`node scripts/store.js products --page=1 --per_page=20 --sort_by=id --sort_order=desc --search=watch`

- All params are optional.

### Search Customer Order(s):

`node scripts/store.js orders --page=1 --per_page=20 --sort_by=id --sort_order=desc --email=customer@example.com --orderid=123`

- All params are optional.

### Update A Customer Order:

`node scripts/store.js update order <order_id> <action> --data='<json_string>'`

**Actions:**

- `status`: Update order status. Data: `{"status": "new-status"}`
- `refund`: Process refund. Data: `{"comments": "reason and confirmation details"}`
- `items`: Update items. Data: `{}` (see order line items logic)
- `actions`: Trigger action. Data: `{"action": "send_order_details"}`
- `notes`: Add/update note. Data: `{}`

### Tips:

- For refund or removing items, confirm with the human first.
