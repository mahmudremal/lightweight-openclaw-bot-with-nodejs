import fs from "fs-extra";
import path from "path";
import { ROOT_DIR, WORKSPACES_DIR, createWorkspace } from "./core/workspace.js";

export async function initProject() {
  await fs.ensureDir(ROOT_DIR);

  await fs.ensureDir(WORKSPACES_DIR);

  try {
    await createWorkspace("default");
    console.log(`Created default workspace.`);
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log(`Default workspace already exists.`);
    } else {
      console.error(`Error creating default workspace: ${error.message}`);
    }
  }
}
