import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { assertAbsolutePath, resolveProjectFile } from "./paths.mjs";

export async function openPathInOs(targetPath) {
  const absolute = assertAbsolutePath(targetPath);
  await fs.access(absolute);

  if (process.platform === "win32") {
    await runDetached("cmd.exe", ["/c", "start", "", absolute]);
  } else if (process.platform === "darwin") {
    await runDetached("open", [absolute]);
  } else {
    await runDetached("xdg-open", [absolute]);
  }
  return { ok: true, path: absolute };
}

export async function openProjectFileInOs(projectPath, relativeFile) {
  const { absolute } = resolveProjectFile(projectPath, relativeFile);
  return openPathInOs(absolute);
}

function runDetached(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("error", reject);
    child.unref();
    resolve();
  });
}

export function pdfAbsolutePath(projectPath, pdfRelative, outputDir) {
  const root = assertAbsolutePath(projectPath);
  if (outputDir) {
    return path.join(root, outputDir, path.basename(pdfRelative));
  }
  return path.join(root, pdfRelative);
}
