/** Split a project-relative path into segments. Empty segments are dropped. */
export function splitRelativePath(path: string): string[] {
  return path.split(/[/\\]/).filter((part) => part.length > 0);
}

/** Join segments with `/`. Does not resolve `..`. */
export function joinRelativePath(...parts: string[]): string {
  return parts
    .flatMap((part) => splitRelativePath(part))
    .filter((part) => part !== ".")
    .join("/");
}

export function basename(path: string): string {
  const parts = splitRelativePath(path);
  return parts[parts.length - 1] ?? path;
}

export function extensionOf(path: string): string {
  const name = basename(path);
  const index = name.lastIndexOf(".");
  if (index <= 0) return "";
  return name.slice(index + 1).toLowerCase();
}
