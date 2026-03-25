import Table from "cli-table3";
import {
  getWorkspaceSkills,
  getInstallableSkills,
  installSkill,
  removeSkill,
} from "../../src/core/skillManager.js";
import { resolveWorkspace } from "../../src/core/workspace.js";
import logger from "../../src/utils/logger.js";

export function registerSkillsCommands(program) {
  const skills = program
    .command("skills")
    .description("Manage skills in the current workspace");

  skills
    .command("list")
    .description("List all skills")
    .action(async () => {
      const installable = await getInstallableSkills();
      const table = new Table({ head: ["Name", "Emoji", "Description"] });
      installable.forEach((s) =>
        table.push([s.name, s.emoji || "", s.description]),
      );
      console.log(table.toString());
      process.exit(0);
    });

  skills
    .command("installed")
    .description("List installed skills")
    .option("-w, --workspace <name>", "Specify the workspace to use")
    .action(async (opts) => {
      const activeWorkspaceId = await resolveWorkspace(opts.workspace);
      const installed = await getWorkspaceSkills(activeWorkspaceId);
      if (installed.length === 0) {
        logger.info(
          "ROMI",
          `No skills installed in workspace '${activeWorkspaceId}'.`,
        );
      } else {
        const table = new Table({ head: ["Name", "Emoji", "Description"] });
        installed.forEach((s) =>
          table.push([s.name, s.emoji || "", s.description]),
        );
        console.log(table.toString());
      }
      process.exit(0);
    });

  skills
    .command("available")
    .description("List available skills not yet installed")
    .option("-w, --workspace <name>", "Specify the workspace to use")
    .action(async (opts) => {
      const activeWorkspaceId = await resolveWorkspace(opts.workspace);
      const installed = await getWorkspaceSkills(activeWorkspaceId);
      const all = await getInstallableSkills();
      const installedNames = installed.map((s) => s.name);
      const available = all.filter((s) => !installedNames.includes(s.name));

      const table = new Table({ head: ["Name", "Emoji", "Description"] });
      available.forEach((s) =>
        table.push([s.name, s.emoji || "", s.description]),
      );
      console.log(table.toString());
      process.exit(0);
    });

  skills
    .command("install <skillNames...>")
    .description("Install one or more skills")
    .option("-w, --workspace <name>", "Specify the workspace to use")
    .action(async (skillNames, opts) => {
      const activeWorkspaceId = await resolveWorkspace(opts.workspace);
      for (const skillName of skillNames) {
        try {
          const result = await installSkill(skillName, activeWorkspaceId);
          console.log(result);
          logger.log("ROMI", result);
        } catch (error) {
          logger.error("ROMI", `Failed to install '${skillName}': ${error.message}`);
        }
      }
      process.exit(0);
    });

  skills
    .command("remove <skillNames...>")
    .description("Remove one or more skills")
    .option("-w, --workspace <name>", "Specify the workspace to use")
    .action(async (skillNames, opts) => {
      const activeWorkspaceId = await resolveWorkspace(opts.workspace);
      for (const skillName of skillNames) {
        try {
          const result = await removeSkill(skillName, activeWorkspaceId);
          console.log(result);
          logger.log("ROMI", result);
        } catch (error) {
          logger.error("ROMI", `Failed to remove '${skillName}': ${error.message}`);
        }
      }
      process.exit(0);
    });
}
