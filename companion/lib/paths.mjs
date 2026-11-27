import path from "node:path";

export function assertAbsolutePath(projectPath) {
  if (typeof projectPath !== "string" || projectPath.trim() === "") {
    throw new Error("projectPath is required.");
  }
  if (!path.isAbsolute(projectPath)) {
    throw new Error("projectPath must be an absolute filesystem path.");
  }
  return path.normalize(projectPath);
}

export function resolveProjectFile(projectPath, relativeFile) {
  const root = assertAbsolutePath(projectPath);
  if (typeof relativeFile !== "string" || relativeFile.trim() === "") {
    throw new Error("A relative file path is required.");
  }
  const normalized = relativeFile.replace(/\\/g, "/");
  if (normalized.split("/").some((part) => part === "..")) {
    throw new Error("Relative paths must stay inside the project.");
  }
  const absolute = path.normalize(path.join(root, normalized));
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw new Error("Relative paths must stay inside the project.");
  }
  return { root, absolute, relative: normalized };
}
