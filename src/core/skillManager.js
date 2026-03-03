import fs from "fs-extra";
import path from "path";
import { getWorkspacePath, APP_SOURCE_DIR } from "./paths.js";
import matter from "gray-matter";

class SkillManager {
  constructor() {
    this.PROJECT_SKILLS_DIR = path.resolve(
      APP_SOURCE_DIR,
      "workspace",
      "skills",
    );
    this.PROJECT_MEMORY_DIR = path.resolve(
      APP_SOURCE_DIR,
      "workspace",
      "memory",
    );
  }

  parseFrontmatter(content) {
    try {
      return matter(content).data;
    } catch {
      return {};
    }
  }

  async readSkillMetadata(skillPath) {
    const skillFile = path.join(skillPath, "SKILL.md");
    if (!(await fs.pathExists(skillFile))) return null;

    const content = await fs.readFile(skillFile, "utf8");
    const frontmatter = this.parseFrontmatter(content);

    let emoji = frontmatter.emoji || "";
    if (frontmatter.metadata && typeof frontmatter.metadata === "object") {
      emoji = frontmatter.metadata.emoji || emoji;
    }

    return {
      name: frontmatter.name || path.basename(skillPath),
      description: frontmatter.description || "",
      emoji: emoji || "",
      path: skillPath,
    };
  }

  async getWorkspaceSkills(workspaceId) {
    const workspaceSkillsDir = path.join(
      getWorkspacePath(workspaceId),
      "skills",
    );
    const skills = [];
    if (!(await fs.pathExists(workspaceSkillsDir))) return skills;

    const entries = await fs.readdir(workspaceSkillsDir, {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metadata = await this.readSkillMetadata(
          path.join(workspaceSkillsDir, entry.name),
        );
        if (metadata) skills.push(metadata);
      }
    }
    return skills;
  }

  async getInstallableSkills() {
    const skills = [];
    const seenNames = new Set();
    const addSkillsFromDir = async (dir, source) => {
      if (!(await fs.pathExists(dir))) return;
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !seenNames.has(entry.name)) {
          const metadata = await this.readSkillMetadata(
            path.join(dir, entry.name),
          );
          if (metadata) {
            seenNames.add(entry.name);
            skills.push({ ...metadata, source });
          }
        }
      }
    };
    await addSkillsFromDir(this.PROJECT_SKILLS_DIR, "project-skills");
    await addSkillsFromDir(this.PROJECT_MEMORY_DIR, "project-memory");
    return skills;
  }

  async findInstallableSkill(skillName) {
    const projectSkillPath = path.join(this.PROJECT_SKILLS_DIR, skillName);
    if (await fs.pathExists(path.join(projectSkillPath, "SKILL.md")))
      return projectSkillPath;
    const memorySkillPath = path.join(this.PROJECT_MEMORY_DIR, skillName);
    if (await fs.pathExists(path.join(memorySkillPath, "SKILL.md")))
      return memorySkillPath;
    return null;
  }

  async installSkill(skillName, workspaceId) {
    const sourcePath = await this.findInstallableSkill(skillName);
    if (!sourcePath) throw new Error(`Skill '${skillName}' not found.`);
    const destPath = path.join(
      getWorkspacePath(workspaceId),
      "skills",
      skillName,
    );
    if (await fs.pathExists(destPath))
      throw new Error(`Skill '${skillName}' already installed.`);
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(sourcePath, destPath);
    return `Skill '${skillName}' installed successfully.`;
  }

  async removeSkill(skillName, workspaceId) {
    const skillPath = path.join(
      getWorkspacePath(workspaceId),
      "skills",
      skillName,
    );
    if (!(await fs.pathExists(skillPath)))
      throw new Error(`Skill '${skillName}' not installed.`);
    await fs.remove(skillPath);
    return `Skill '${skillName}' removed.`;
  }
}

const skillManager = new SkillManager();
export default skillManager;

export const getWorkspaceSkills = (w) => skillManager.getWorkspaceSkills(w);
export const getInstallableSkills = () => skillManager.getInstallableSkills();
export const installSkill = (s, w) => skillManager.installSkill(s, w);
export const removeSkill = (s, w) => skillManager.removeSkill(s, w);
