import fs from "fs-extra";
import path from "path";
import { getWorkspacePath, getActiveWorkspaceId } from "../core/workspace.js";

class MessagePreprocessor {
  async expandMentions(text) {
    if (!text) return "";

    const fileMatches = text.match(/@(\S+)/g) || [];
    const skillMatches = text.match(/\/(\S+)/g) || [];

    let expandedText = text;
    const workspaceId = getActiveWorkspaceId();
    const workspacePath = getWorkspacePath(workspaceId);

    // Expand File Mentions (@filename)
    for (const match of fileMatches) {
      const fileName = match.slice(1);
      const filePath = path.resolve(workspacePath, fileName);
      try {
        if (await fs.pathExists(filePath)) {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            const content = await fs.readFile(filePath, "utf8");
            expandedText = expandedText.replace(
              match,
              `\n[File: ${fileName}]\n${content}\n`,
            );
          }
        }
      } catch (e) {
        // Ignore errors for individual files
      }
    }

    // Expand Skill Mentions (/skillname)
    const EXIT_COMMANDS = new Set(["/exit", "/quit", "/start"]);
    for (const match of skillMatches) {
      const skillName = match.slice(1);
      if (EXIT_COMMANDS.has(match.toLowerCase())) continue;

      const skillPath = path.resolve(
        workspacePath,
        "skills",
        skillName,
        "SKILL.md",
      );
      try {
        if (await fs.pathExists(skillPath)) {
          const content = await fs.readFile(skillPath, "utf8");
          expandedText = expandedText.replace(
            match,
            `\n\n[Skill: ${skillName}]\n${content}\n\n`,
          );
        }
      } catch (e) {
        // Ignore errors
      }
    }

    return expandedText;
  }
}

export default new MessagePreprocessor();
