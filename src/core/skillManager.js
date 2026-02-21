import fs from "fs-extra";
import path from "path";
import { ROOT_DIR, WORKSPACES_DIR, getWorkspacePath } from "./workspace.js";

// Skills repository - where installable skills are stored
// Check for project-level skills directory first, then fallback to workspace/memory
const PROJECT_SKILLS_DIR = path.resolve(process.cwd(), "workspace", "skills");
const PROJECT_MEMORY_DIR = path.resolve(process.cwd(), "workspace", "memory");

/**
 * Parse YAML frontmatter from SKILL.md content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = match[1];
  const result = {};

  // Simple YAML parsing for key: value pairs
  for (const line of frontmatter.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    }
  }

  return result;
}

/**
 * Read a skill's metadata from its SKILL.md file
 */
async function readSkillMetadata(skillPath) {
  const skillFile = path.join(skillPath, "SKILL.md");
  if (!(await fs.pathExists(skillFile))) {
    return null;
  }

  const content = await fs.readFile(skillFile, "utf8");
  const frontmatter = parseFrontmatter(content);

  // Extract emoji from metadata if present
  let emoji = "";
  if (frontmatter.metadata) {
    // Try to parse metadata JSON or extract emoji
    try {
      const metadata =
        typeof frontmatter.metadata === "string"
          ? JSON.parse(frontmatter.metadata)
          : frontmatter.metadata;
      emoji = metadata?.emoji || metadata?.nanobot?.emoji || "";
    } catch {
      // Try to extract emoji from string format like: { "emoji": "🌤️" }
      const emojiMatch = frontmatter.metadata.match(/emoji["\s:]+["']([^"']+)["']/);
      if (emojiMatch) {
        emoji = emojiMatch[1];
      }
    }
  }

  return {
    name: frontmatter.name || path.basename(skillPath),
    description: frontmatter.description || "",
    emoji: emoji || frontmatter.emoji || "",
    path: skillPath,
  };
}

/**
 * Get list of skills installed in a specific workspace
 */
export async function getWorkspaceSkills(workspaceId) {
  const workspaceSkillsDir = path.join(getWorkspacePath(workspaceId), "skills");
  const skills = [];

  if (!(await fs.pathExists(workspaceSkillsDir))) {
    return skills;
  }

  const entries = await fs.readdir(workspaceSkillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = path.join(workspaceSkillsDir, entry.name);
      const metadata = await readSkillMetadata(skillPath);
      if (metadata) {
        skills.push(metadata);
      }
    }
  }

  return skills;
}

/**
 * Get list of all installable skills from the repository
 */
export async function getInstallableSkills() {
  const skills = [];
  const seenNames = new Set();

  // Helper to add skills from a directory
  async function addSkillsFromDir(dir, source) {
    if (!(await fs.pathExists(dir))) return;

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !seenNames.has(entry.name)) {
        const skillPath = path.join(dir, entry.name);
        const metadata = await readSkillMetadata(skillPath);
        if (metadata) {
          seenNames.add(entry.name);
          skills.push({ ...metadata, source });
        }
      }
    }
  }

  // Check project workspace/skills directory first
  await addSkillsFromDir(PROJECT_SKILLS_DIR, "project-skills");

  // Also check workspace/memory for skills (some skills may be there)
  await addSkillsFromDir(PROJECT_MEMORY_DIR, "project-memory");

  return skills;
}

/**
 * Find a skill in the repository by name
 */
async function findInstallableSkill(skillName) {
  // Check project workspace/skills first
  const projectSkillPath = path.join(PROJECT_SKILLS_DIR, skillName);
  if (await fs.pathExists(path.join(projectSkillPath, "SKILL.md"))) {
    return projectSkillPath;
  }

  // Check workspace/memory
  const memorySkillPath = path.join(PROJECT_MEMORY_DIR, skillName);
  if (await fs.pathExists(path.join(memorySkillPath, "SKILL.md"))) {
    return memorySkillPath;
  }

  return null;
}

/**
 * Install a skill to a workspace
 */
export async function installSkill(skillName, workspaceId) {
  const sourcePath = await findInstallableSkill(skillName);

  if (!sourcePath) {
    throw new Error(`Skill '${skillName}' not found in the repository.`);
  }

  const workspaceSkillsDir = path.join(getWorkspacePath(workspaceId), "skills");
  const destPath = path.join(workspaceSkillsDir, skillName);

  // Check if already installed
  if (await fs.pathExists(destPath)) {
    throw new Error(`Skill '${skillName}' is already installed in workspace '${workspaceId}'.`);
  }

  // Ensure skills directory exists
  await fs.ensureDir(workspaceSkillsDir);

  // Copy skill to workspace
  await fs.copy(sourcePath, destPath);

  return `Skill '${skillName}' installed successfully.`;
}

/**
 * Remove a skill from a workspace
 */
export async function removeSkill(skillName, workspaceId) {
  const workspaceSkillsDir = path.join(getWorkspacePath(workspaceId), "skills");
  const skillPath = path.join(workspaceSkillsDir, skillName);

  // Check if skill exists
  if (!(await fs.pathExists(skillPath))) {
    throw new Error(`Skill '${skillName}' is not installed in workspace '${workspaceId}'.`);
  }

  // Remove the skill directory
  await fs.remove(skillPath);

  return `Skill '${skillName}' removed from workspace '${workspaceId}'.`;
}