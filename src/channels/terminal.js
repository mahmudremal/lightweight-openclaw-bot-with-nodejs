import { processMessage } from "../core/agent.js";
import fs from "fs-extra";
import path from "path";
import { getActiveWorkspaceId, getWorkspacePath } from "../core/workspace.js";
import preprocessor from "../utils/preprocessor.js";
import inquirer from "inquirer";
import autocomplete from "inquirer-autocomplete-prompt";
import chalk from "chalk";
import fuzzy from "fuzzy";
import skillManager from "../core/skillManager.js";

inquirer.registerPrompt("autocomplete", autocomplete);

class Terminal {
  constructor() {
    this.needConnection = false;
    this.EXIT_COMMANDS = new Set(["exit", "quit", "/exit", "/quit", ":q"]);
  }

  async init() {}

  async preProcessInput(text) {
    return preprocessor.expandMentions(text);
  }

  formatMarkdown(text) {
    if (!text) return "";

    let formatted = text;

    // Bold - Cyan
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, chalk.bold.cyan("$1"));

    // Italic - Magenta
    formatted = formatted.replace(/\*(.*?)\*/g, chalk.italic.magenta("$1"));

    // Inline code - Gray background
    formatted = formatted.replace(/`(.*?)`/g, chalk.bgGray.white(" $1 "));

    // Code blocks - Glassmorphism style border
    formatted = formatted.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, lang, code) => {
        const border = chalk
          .dim("─")
          .repeat(Math.min(process.stdout.columns || 40, 60));
        return `\n${chalk.blue("┌")}${border}${chalk.blue("┐")}\n${chalk.green(code.trim())}\n${chalk.blue("└")}${border}${chalk.blue("┘")}\n`;
      },
    );

    // Headings - Gradient like colors
    formatted = formatted.replace(/^# (.*$)/gm, chalk.bold.magentaBright("$1"));
    formatted = formatted.replace(/^## (.*$)/gm, chalk.bold.blueBright("$1"));
    formatted = formatted.replace(/^### (.*$)/gm, chalk.bold.cyanBright("$1"));

    // Lists
    formatted = formatted.replace(
      /^\s*[-*]\s+(.*$)/gm,
      ` ${chalk.yellow("•")} $1`,
    );

    return formatted;
  }

  async startChat(oldRl) {
    // If there's an old readline passed in, we must close it to free stdin
    if (oldRl && typeof oldRl.close === "function") {
      try {
        oldRl.close();
      } catch (e) {}
    }

    process.stdout.write(
      `\n${chalk.bold.cyan("🐪 Romi")} — ${chalk.dim("Interactive Chat")}\n`,
    );
    process.stdout.write(
      `${chalk.dim("Workspace:")} ${chalk.magenta(getActiveWorkspaceId())}\n`,
    );
    process.stdout.write(
      `${chalk.dim("Commands :")} ${chalk.yellow("/")}skills, ${chalk.yellow("@")}files, ${chalk.red("exit")}\n\n`,
    );

    const workspaceId = getActiveWorkspaceId();
    const workspacePath = getWorkspacePath(workspaceId);

    // Explicit exit handler for terminal stability
    const exitHandler = () => {
      console.log(chalk.red("\nGoodbye!"));
      process.exit(0);
    };

    process.once("SIGINT", exitHandler);

    while (true) {
      try {
        const { message } = await inquirer.prompt([
          {
            type: "autocomplete",
            name: "message",
            message: chalk.cyan("You:"),
            prefix: "",
            suffix: "",
            pageSize: 8,
            suggestOnly: true,
            searchText: chalk.dim("Searching..."),
            emptyText: chalk.dim(""),
            source: async (answers, input) => {
              const currentInput = input || "";
              const words = currentInput.split(/\s+/);
              const lastWord = words[words.length - 1] || "";

              if (lastWord.startsWith("@")) {
                const search = lastWord.slice(1);
                if (!fs.existsSync(workspacePath)) return [];
                const files = fs
                  .readdirSync(workspacePath, { withFileTypes: true })
                  .filter((f) => !f.isDirectory())
                  .map((f) => f.name);

                const matches = fuzzy
                  .filter(search, files)
                  .map((m) => m.string);
                const prefix = currentInput.substring(
                  0,
                  currentInput.lastIndexOf("@") + 1,
                );
                return matches.map((m) => prefix + m);
              }

              if (lastWord.startsWith("/")) {
                const search = lastWord.slice(1);
                const skills =
                  await skillManager.getWorkspaceSkills(workspaceId);
                const skillNames = skills.map((s) => s.name);

                const matches = fuzzy
                  .filter(search, skillNames)
                  .map((m) => m.string);
                const prefix = currentInput.substring(
                  0,
                  currentInput.lastIndexOf("/") + 1,
                );
                return matches.map((m) => prefix + m);
              }

              return [];
            },
          },
        ]);

        const text = message?.trim();
        if (!text) continue;

        if (this.EXIT_COMMANDS.has(text.toLowerCase())) {
          exitHandler();
          break;
        }

        const expandedText = await this.preProcessInput(text);

        try {
          process.stdout.write(chalk.dim("Thinking..."));
          const reply = await processMessage(expandedText, {
            channel: "web",
            from: "web:user",
            isOwner: true,
            onEvent: (event) => {
              if (event.type === "tool_start") {
                // here i think i should also be able to see what's going on like a trimmed like thing like which tool is calling is showing but not showing argulements and their values (trimmed).
                // so there should be a thing like i can be able to toggle detail view of funciton calling and minimized view like how it is now.so how can i open detail view? a nice way would be like `CTRL + e`, it will toggle (on/off) tool view mode, on on tools will show on card view where i'll be able to see detailed tools those are calling/called with arguments (a max length then trimmed). so again ctrl +e will turn off detailed mode and it will show minimal view of tools. right?
                event.toolCalls.forEach((call) => {
                  process.stdout.write(
                    `\r\x1b[K${chalk.cyan(" • ")}${chalk.dim("Invoking tool:")} ${chalk.bold.blue(call.tool)}...  \n`,
                  );
                  process.stdout.write(chalk.dim("Thinking..."));
                });
              }
            },
          });
          process.stdout.write("\r\x1b[K"); // Clear Thinking...
          console.log(
            `${chalk.bold.yellow("Romi:")}\n${this.formatMarkdown(reply)}\n`,
          );
        } catch (err) {
          process.stdout.write("\r\x1b[K");
          console.error(`${chalk.red.bold("Error:")} ${err.message}\n`);
        }
      } catch (err) {
        if (
          err.message.includes("force closed") ||
          err.message.includes("interrupted")
        )
          break;
        console.error(chalk.red("\nTerminal Session Error:"), err.message);
        break;
      }
    }

    process.removeListener("SIGINT", exitHandler);
    process.exit(0);
  }
}

const terminal = new Terminal();
export default terminal;

export const startChat = (rl) => terminal.startChat(rl);
