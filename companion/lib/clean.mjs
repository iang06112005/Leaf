import fs from "node:fs/promises";
import path from "node:path";
import { assertAbsolutePath } from "./paths.mjs";

/** Extensions latexmk / TeX typically leave behind (keep .tex/.bib/.png/etc.). */
export const AUX_EXTENSIONS = new Set([
  ".aux",
  ".bbl",
  ".bcf",
  ".blg",
  ".fdb_latexmk",
  ".fls",
  ".lof",
  ".log",
  ".lot",
  ".nav",
  ".out",
  ".run.xml",
  ".snm",
  ".synctex.gz",
  ".toc",
  ".vrb",
  ".xdv",
  ".idx",
  ".ilg",
  ".ind",
  ".glo",
  ".gls",
  ".acn",
  ".acr",
  ".alg",
]);

const SKIP_DIRS = new Set([".git", "node_modules", ".venv", "venv", "__pycache__", ".texflow"]);

function matchesAux(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".synctex.gz")) return true;
  if (lower.endsWith(".run.xml")) return true;
  const ext = path.extname(lower);
  return AUX_EXTENSIONS.has(ext);
}

/**
 * Recursively delete TeX auxiliary files under a project.
 * Never deletes .tex/.bib/images/pdf by default (pdf kept for preview).
 */
export async function cleanProjectArtifacts(projectPath, { outputDir = null } = {}) {
  const root = assertAbsolutePath(projectPath);
  const removed = [];

  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(absolute);
        continue;
      }
      if (entry.isFile() && matchesAux(entry.name)) {
        await fs.rm(absolute, { force: true });
        removed.push(path.relative(root, absolute).replace(/\\/g, "/"));
      }
    }
  }

  await walk(root);

  if (outputDir) {
    const outAbs = path.join(root, outputDir);
    try {
      const stat = await fs.stat(outAbs);
      if (stat.isDirectory()) {
        await walk(outAbs);
      }
    } catch {
      // no output dir
    }
  }

  return { ok: true, removed, count: removed.length };
}
