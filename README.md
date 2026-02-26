# TODO

- `workspace\skills\browser\SKILL.md` do this skill to browser extension completely. add browser() tool to the tools directory.
- Need to add `todo` for agent. so if i asked to do any lengthy task which needs to break into smaller parts, then should be done one by one, which means the necessity of `todo`. this todo could be an toto class instance or something better.
- Need to add ability for agent to spawn sub agent so that the agent will be able to spawn a subagent for a particular task which will be then done one by one in background. what do you think?
- When i just say hi, the agent executes this tool which is not very ideal.

```
You: hi
[Tool] Calling send_message({"channel":"whatsapp","message":"hi"})
```

This makes sense like LLM don't know from where i'm chatting with him. like if i chat from terminal, it should resnd response, if i chat from any channel, it will response on that channel. doens't it right?

.
