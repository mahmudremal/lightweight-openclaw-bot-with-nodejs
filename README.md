# Tools

`src\core\dispatcher.js` add a tool for remote request support `request` which should be used like `axios`, so on request with args like url, method (get,post), it will replace usage of `curl` and replace curl with this tool `workspace\skills\weather\SKILL.md` like `you'll use request tool to fetch that`, like you know? So there woun't be any curl usages aroung. only request tool.

Secondly while we provide tools list and instrcution on text based system prompt, but if it's supported by openai api, can you also mention tools schema on requests like how LLm usualy get tools list and use them.

# Skills

- `workspace\skills\weather\SKILL.md` here in this skill, it's size is resonable, but see `workspace\skills\skill-creator\SKILL.md`, it looks like it's way too lengthy. no it's almost 19KB file size which needs to be shorten as possible. Make sure it's size be around 2/3KB possibly. SO you can better reduce explainig, keep main points, rules etc brighter, explain in less words but not less effectiveness. Avoid non necessery fillers, talking in it.

# Context

`src\core\workspace.js` in file the function `loadAgentContext()` here we might need to work with sorting so ordering files might improve LLM response relavance. Like when i put llm hi, it got Bootstrap file in context but it doesn't purely then ask hi whatis my name ....like this information. and when llm writes on files like user.md or soul.md, it looks like it remove all previous content and write 1/2 lines on new information which results removing instructions filewise, which is not right.
like on `workspace\SOUL.md`, when i gets information it writes like 'My name is ...' removing all things but there are a place to put that information and rest of text are important to act relavently. so removing those rules might cause LLM walkthrough later. right? so it should use those places where they shoud put informations, not removing all contents then write what is needed. So if you need to edit any .md file to put that instrcution, you're free to do so.
