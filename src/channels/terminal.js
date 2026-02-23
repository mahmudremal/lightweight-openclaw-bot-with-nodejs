import { processMessage } from "../core/agent.js";

class Terminal {
  constructor() {
    this.EXIT_COMMANDS = new Set(["exit", "quit", "/exit", "/quit", ":q"]);
  }

  startChat(rl) {
    console.log("\n🐪 Romi — Interactive Chat");
    console.log("Type your message. Type 'exit' to quit.\n");

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

        try {
          console.log("\x1b[90mThinking...\x1b[0m");
          const reply = await processMessage(text, {
            channel: "cli",
            from: "cli:user",
          });
          console.log(`\n\x1b[33mRomi:\x1b[0m ${reply}\n`);
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
