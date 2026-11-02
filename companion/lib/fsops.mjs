import fs from "node:fs/promises";
import path from "node:path";
import { assertAbsolutePath, resolveProjectFile } from "./paths.mjs";

const SKIP = new Set([".git", "node_modules", ".venv", "venv", "__pycache__", ".texflow"]);

function compareEntries(a, b) {
  if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

export async function buildTree(projectPath, prefix = "") {
  const root = assertAbsolutePath(projectPath);
  const absolute = prefix ? path.join(root, ...prefix.split("/")) : root;
  const dirents = await fs.readdir(absolute, { withFileTypes: true });
  const children = [];

  for (const dirent of dirents) {
    const name = dirent.name;
    const relative = prefix ? `${prefix}/${name}` : name;
    if (dirent.isDirectory()) {
      if (SKIP.has(name)) continue;
      children.push({
        kind: "directory",
        name,
        path: relative.replace(/\\/g, "/"),
        children: await buildTree(root, relative.replace(/\\/g, "/")),
      });
    } else if (dirent.isFile()) {
      children.push({
        kind: "file",
        name,
        path: relative.replace(/\\/g, "/"),
      });
    }
  }

  return children.sort(compareEntries);
}

export async function readTextFile(projectPath, relativeFile) {
  const { absolute } = resolveProjectFile(projectPath, relativeFile);
  return fs.readFile(absolute, "utf8");
}

export async function readBinaryFile(projectPath, relativeFile) {
  const { absolute } = resolveProjectFile(projectPath, relativeFile);
  return fs.readFile(absolute);
}

export async function writeTextFile(projectPath, relativeFile, content) {
  const { absolute } = resolveProjectFile(projectPath, relativeFile);
  await fs.writeFile(absolute, content, "utf8");
}

export async function createFile(projectPath, relativeFile, content = "") {
  const { absolute, root } = resolveProjectFile(projectPath, relativeFile);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  try {
    await fs.writeFile(absolute, content, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error && error.code === "EEXIST") {
      throw new Error("That file already exists.");
    }
    throw error;
  }
  return path.relative(root, absolute).replace(/\\/g, "/");
}

export async function createDirectory(projectPath, relativeDir) {
  const { absolute, root } = resolveProjectFile(projectPath, relativeDir);
  await fs.mkdir(absolute, { recursive: true });
  return path.relative(root, absolute).replace(/\\/g, "/");
}

export async function renameEntry(projectPath, fromRelative, toRelative) {
  const from = resolveProjectFile(projectPath, fromRelative);
  const to = resolveProjectFile(projectPath, toRelative);
  await fs.mkdir(path.dirname(to.absolute), { recursive: true });
  await fs.rename(from.absolute, to.absolute);
  return to.relative;
}

export async function deleteEntry(projectPath, relativeTarget) {
  const { absolute } = resolveProjectFile(projectPath, relativeTarget);
  await fs.rm(absolute, { recursive: true, force: false });
}

export async function pathExists(projectPath) {
  try {
    const root = assertAbsolutePath(projectPath);
    const stat = await fs.stat(root);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
