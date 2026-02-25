import { processMessage } from "../core/agent.js";
import fs from "fs";
import path from "path";

class Terminal {
  constructor() {
    this.EXIT_COMMANDS = new Set(["exit", "quit", "/exit", "/quit", ":q"]);
  }

  async preProcessInput(text) {
    const fileMatches = text.match(/@(\S+)/g) || [];
    const skillMatches = text.match(/\/(\S+)/g) || [];

    let expandedText = text;

    for (const match of fileMatches) {
      const fileName = match.slice(1);
      try {
        if (fs.existsSync(fileName)) {
          const content = fs.readFileSync(fileName, "utf8");
          expandedText = expandedText.replace(
            match,
            `[File: ${fileName}]\n${content}\n`,
          );
        }
      } catch (e) {}
    }

    for (const match of skillMatches) {
      const skillName = match.slice(1);
      if (this.EXIT_COMMANDS.has(match.toLowerCase())) continue;

      try {
        const skillPath = path.join(
          process.cwd(),
          "workspace",
          "skills",
          skillName,
          "SKILL.md",
        );
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, "utf8");
          expandedText = expandedText.replace(
            match,
            `[Skill: ${skillName}]\n${content}\n`,
          );
        }
      } catch (e) {}
    }

    return expandedText;
  }

  startChat(rl) {
    console.log("\n🐪 Romi — Interactive Chat");
    console.log("Type your message. Type 'exit' to quit.");
    console.log(
      "Use @filename to include file, /skillname to include skill.\n",
    );

    const prompt = () => {
      rl.question("\x1b[36mYou:\x1b[0m ", async (input) => {
        const text = input.trim();
        if (!text) return prompt();

        if (this.EXIT_COMMANDS.has(text.toLowerCase())) {
          console.log("\nGoodbye!");
          rl.close();
          process.exit(0);
          return;
        }

        const expandedText = await this.preProcessInput(text);

        try {
          process.stdout.write("\x1b[90mThinking...\x1b[0m\r");
          const reply = await processMessage(expandedText, {
            channel: "cli",
            from: "cli:user",
            onEvent: (event) => {
              if (event.type === "tool_start") {
                event.toolCalls.forEach((call) => {
                  console.log(
                    `\x1b[90m[Tool] Calling ${call.tool}(${JSON.stringify(call.args)})\x1b[0m`,
                  );
                });
              } else if (event.type === "tool_end") {
                console.log(
                  `\x1b[90m[Tool] ${event.tool} result: ${String(event.result).substring(0, 100)}${String(event.result).length > 100 ? "..." : ""}\x1b[0m`,
                );
              }
            },
          });
          console.log(`\r\x1b[K\n\x1b[33mRomi:\x1b[0m ${reply}\n`);
        } catch (err) {
          console.error(`\x1b[31mError:\x1b[0m ${err.message}\n`);
        }

        prompt();
      });
    };

    prompt();
  }
}

const terminal = new Terminal();
export default terminal;

export const startChat = (rl) => terminal.startChat(rl);
