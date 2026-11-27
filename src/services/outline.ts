export type OutlineEntry = {
  id: string;
  level: number;
  title: string;
  line: number;
  command: string;
  path: string;
};

const SECTION_RE =
  /^\\(part|chapter|section|subsection|subsubsection|paragraph|subparagraph)\*?\{([^{}]*)\}/;

const INPUT_RE = /^\\(input|include)\*?\{([^}]+)\}/;

const LEVELS: Record<string, number> = {
  part: 0,
  chapter: 1,
  section: 2,
  subsection: 3,
  subsubsection: 4,
  paragraph: 5,
  subparagraph: 6,
};

function normalizeTexPath(raw: string, fromFile: string): string {
  let relative = raw.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (!relative.toLowerCase().endsWith(".tex")) relative = `${relative}.tex`;
  const baseDir = fromFile.includes("/") ? fromFile.slice(0, fromFile.lastIndexOf("/")) : "";
  if (!baseDir || relative.startsWith("/")) return relative.replace(/^\//, "");
  const parts = [...baseDir.split("/"), ...relative.split("/")];
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

/**
 * Extract section outline from a single TeX buffer.
 */
export function parseTexOutline(source: string, filePath = "main.tex"): OutlineEntry[] {
  const lines = source.split(/\r?\n/);
  const entries: OutlineEntry[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("%")) continue;
    const match = SECTION_RE.exec(trimmed);
    if (!match) continue;
    const command = match[1]!;
    const title = (match[2] ?? "").trim() || "(untitled)";
    entries.push({
      id: `${filePath}:${i + 1}:${entries.length}`,
      level: LEVELS[command] ?? 2,
      title,
      line: i + 1,
      command,
      path: filePath,
    });
  }

  return entries;
}

export function listTexInputs(source: string, fromFile: string): string[] {
  const lines = source.split(/\r?\n/);
  const inputs: string[] = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("%")) continue;
    const match = INPUT_RE.exec(trimmed);
    if (!match) continue;
    inputs.push(normalizeTexPath(match[2]!, fromFile));
  }
  return inputs;
}

/**
 * Walk \\input / \\include from a root file and collect sections project-wide.
 */
export async function buildProjectOutline(
  rootFile: string,
  readFile: (path: string) => Promise<string>,
): Promise<OutlineEntry[]> {
  const root = rootFile.replace(/\\/g, "/");
  const visited = new Set<string>();
  const entries: OutlineEntry[] = [];

  async function walk(filePath: string) {
    const key = filePath.replace(/\\/g, "/");
    if (visited.has(key)) return;
    visited.add(key);
    let source: string;
    try {
      source = await readFile(key);
    } catch {
      return;
    }
    entries.push(...parseTexOutline(source, key));
    for (const next of listTexInputs(source, key)) {
      await walk(next);
    }
  }

  await walk(root);
  return entries;
}
