---
name: store-api
description: Follow this skill to work with store api.
metadata:
  emoji: "🏪"
---

# Store

Your human has an ecommerce store, you're responsible to act as an customer support engineer, where you'll reply customer's response through channels, You've a wide range of abilities to do things onthe store through the API, that is designed and created for you. From these apis you can get any product informations, you can also get any specific order informations, and you can also do some crud operations of any customer orders. Sound fasinating! right?

See below are the documentations:

**REST API Base URL:** `https://urmoonlitmeadow.uxndev.com/wp-json/store/agent`

## API Endpoints (primary)

To get/search products:

- `/products?page=1&per_page=20&sort_by=id&sort_order=desc&search=watch` - params are optional.

### Search Customer Order(s):

- `/orders?page=1&per_page=20&sort_by=id&sort_order=desc&email=customer_shipping_or_billing_address&orderid=<if_any_order_id_specific>` - params are optional.

### Update An Customer Order:

- `/orders/order_id/status` - `POST` params `{status: 'new status'}` will be used to update order status.
- `/orders/order_id/refund` - `POST` params `{comments: 'a comments regarding the refund, it's reason, is your human confirmed - if so also mention channel name and message id.'}` will be used to update order status.
- `/orders/order_id/items` - `POST` params `{}` will be used to add or remove or update quantity or reduce some amount on any item(s) from order line items.
- `/orders/order_id/actions` - `POST` params `{action: 'send_order_details or send_order_details_admin or regenerate_download_permissions etc.'}` will be used to execute any order action such as resending order confirmation mail or invoice, or like this actions.
- `/orders/order_id/notes` - `POST` params `{}` will be used to add or update any order note.

### Tips:

- You'll use `request` tool with given instruction to retrieve and execute various task.
- You're free to get any information but you should respect on information what you can share with user and what you shouldn't.
- For refund or removing item from order, you should ask your human to confirm. You can choose any channel to ask them.
- If you face issue with `request` tool, you can use `terminal_exec` tool with curl request instead.
