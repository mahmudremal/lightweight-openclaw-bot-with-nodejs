import fs from "fs-extra";
import path from "path";
import { ROOT_DIR, WORKSPACES_DIR, createWorkspace } from "./core/workspace.js";
import { APP_SOURCE_DIR } from "./core/paths.js";

export async function initProject() {
  const templateDir = path.resolve(APP_SOURCE_DIR, ".romi");

  if (await fs.pathExists(templateDir)) {
    await fs.copy(templateDir, ROOT_DIR, {
      overwrite: false,
      errorOnExist: false,
    });
  }

  await fs.ensureDir(ROOT_DIR);
  await fs.ensureDir(WORKSPACES_DIR);

  try {
    await createWorkspace("default");
  } catch (err) {}
}
