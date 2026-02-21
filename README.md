# File Systems & Tools

See these tools are actually same usage of crud functions like `read_file, write_file`. so what i want is to remove these funcitons, instead we better use file read write funcitons.

6. **update_soul** — Update your core identity/behavior in SOUL.md. Use sparingly and carefully.
   {"tool": "update_soul", "content": "New content for SOUL.md"}

7. **update_user_profile** — Update information about the user in USER.md.
   {"tool": "update_user_profile", "content": "New content for USER.md"}

8. **remember** — Save important information to MEMORY.md (Long-term Memory).
   {"tool": "remember", "content": "User's name is Remal Mahmud, a senior software engineer."}

9. **recall** — Read back everything stored in MEMORY.md (Long-term Memory).
   {"tool": "recall"}

on file `src\core\prompt.js` here it usage an inline prompt for tools which needs to be moved. actually this file needs to be removed and put `TOOLS.md` on workspace instead. see I created the file with current content there `workspace\TOOLS.md`. this file needs to be also load from `loadAgentContext()` function.

# Channels:

See currently i only have on tool `send_whatsapp_message` which is using for sending whastapp message but as an agentic model, it should have need configured for various channels like telegram, whastapp, slack, discord, messanger and so on. And if we use seperate funciton for each channel to get chat list, messages list, send message, get message info and so on, it will be lengthly list so instead what we can better do is,

5. **send_whatsapp_message** — Send a WhatsApp message to a specific recipient.
   {"tool": "send_whatsapp_message", "to": "whatsapp_number_or_chat_id", "message": "The message to send."}

   Instead we can give some tools like `send_message(channel_name, reciepients, message, ....etc.)`, `get_chats(channel_name)`, `get_messages(channel_name, conversionid, ...)`. these actually for giving you an idea how they should be. Not meant to create function on exact smae name or format. But better point is with these format, we can maintain miltiple channels. right?

See how skills been installed, same we we also can be able to install channels like telegram, discord, slack, whastapp etc. Look on the command add `romi providers` where i'll see list of providers (with active/inactive) and `romi providers add <provider_name>` to add a provider. when i mark a provider active that means it will create an objetc on global config file you know? this is how they will work.
Inactive providers remain untouched on all over application.

# Issues

1. When i type `romi skills install ...` it shows in `error: unknown command 'install'`. see the file `./bin/romi`. also on skills comamnd add a command `romi skills installed` to see installed skills. and `romi skills available` to see skills not installed yet. these will show on table strcucure.
