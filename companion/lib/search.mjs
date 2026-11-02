import fs from "node:fs/promises";
import path from "node:path";
import { assertAbsolutePath } from "./paths.mjs";

const TEXT_EXT = new Set([
  ".tex",
  ".bib",
  ".cls",
  ".sty",
  ".bst",
  ".md",
  ".txt",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".csv",
]);

const SKIP_DIRS = new Set([".git", "node_modules", ".venv", "venv", "__pycache__", ".texflow"]);
const MAX_FILE_BYTES = 512_000;
const MAX_MATCHES = 200;

function isTextFile(name) {
  const lower = name.toLowerCase();
  const ext = path.extname(lower);
  return TEXT_EXT.has(ext);
}

/**
 * Case-insensitive substring search across project text files.
 */
export async function searchProject(projectPath, query, { maxMatches = MAX_MATCHES } = {}) {
  const root = assertAbsolutePath(projectPath);
  const needle = String(query || "").trim();
  if (!needle) return { matches: [], truncated: false };
  const needleLower = needle.toLowerCase();
  const matches = [];
  let truncated = false;

  async function walk(dir, prefix = "") {
    if (matches.length >= maxMatches) {
      truncated = true;
      return;
    }
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (matches.length >= maxMatches) {
        truncated = true;
        return;
      }
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(absolute, relative.replace(/\\/g, "/"));
        continue;
      }
      if (!entry.isFile() || !isTextFile(entry.name)) continue;
      let stat;
      try {
        stat = await fs.stat(absolute);
      } catch {
        continue;
      }
      if (stat.size > MAX_FILE_BYTES) continue;
      let text;
      try {
        text = await fs.readFile(absolute, "utf8");
      } catch {
        continue;
      }
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i] ?? "";
        const idx = line.toLowerCase().indexOf(needleLower);
        if (idx < 0) continue;
        matches.push({
          file: relative.replace(/\\/g, "/"),
          line: i + 1,
          column: idx + 1,
          preview: line.trim().slice(0, 200),
        });
        if (matches.length >= maxMatches) {
          truncated = true;
          return;
        }
      }
    }
  }

  await walk(root);
  return { matches, truncated, query: needle };
}
