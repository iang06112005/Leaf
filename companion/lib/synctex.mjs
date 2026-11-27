import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { assertAbsolutePath, resolveProjectFile } from "./paths.mjs";
import { buildPathEnv } from "./tex.mjs";

function run(command, args, cwd, envPath) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      env: { ...process.env, PATH: envPath },
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => {
      stdout += c.toString();
    });
    child.stderr.on("data", (c) => {
      stderr += c.toString();
    });
    child.on("error", (error) => {
      resolve({ code: 1, stdout, stderr: error.message });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

function parseSynctexView(stdout) {
  const page = /Page:(\d+)/i.exec(stdout);
  const x = /x:([0-9.]+)/i.exec(stdout);
  const y = /y:([0-9.]+)/i.exec(stdout);
  const h = /h:([0-9.]+)/i.exec(stdout);
  const v = /v:([0-9.]+)/i.exec(stdout);
  const width = /W:([0-9.]+)/i.exec(stdout);
  const height = /H:([0-9.]+)/i.exec(stdout);
  if (!page) return null;
  return {
    page: Number(page[1]),
    x: x ? Number(x[1]) : null,
    y: y ? Number(y[1]) : null,
    h: h ? Number(h[1]) : null,
    v: v ? Number(v[1]) : null,
    width: width ? Number(width[1]) : null,
    height: height ? Number(height[1]) : null,
    raw: stdout,
  };
}

function parseSynctexEdit(stdout) {
  const input = /Input:(.+)/i.exec(stdout);
  const line = /Line:(\d+)/i.exec(stdout);
  const column = /Column:(\d+)/i.exec(stdout);
  if (!input || !line) return null;
  return {
    file: input[1].trim().replace(/\\/g, "/"),
    line: Number(line[1]),
    column: column ? Number(column[1]) : 1,
    raw: stdout,
  };
}

function synctexAvailable(envPath) {
  const parts = envPath.split(path.delimiter);
  const names = process.platform === "win32" ? ["synctex.exe", "synctex"] : ["synctex"];
  for (const dir of parts) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return "synctex";
}

/**
 * Forward SyncTeX: editor line → PDF page/position.
 */
export async function synctexForward({
  projectPath,
  texRelative,
  pdfRelative,
  line,
  column = 1,
  texBinDir = null,
}) {
  const root = assertAbsolutePath(projectPath);
  resolveProjectFile(projectPath, texRelative);
  const pdfAbs = path.isAbsolute(pdfRelative) ? pdfRelative : path.join(root, pdfRelative);
  const envPath = buildPathEnv(texBinDir);
  const bin = synctexAvailable(envPath);
  const args = ["view", "-i", `${line}:${column}:${texRelative.replace(/\\/g, "/")}`, "-o", pdfAbs];
  const result = await run(bin, args, root, envPath);
  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || "synctex view failed");
  }
  const parsed = parseSynctexView(result.stdout);
  if (!parsed) {
    throw new Error("synctex view returned no page mapping");
  }
  return parsed;
}

/**
 * Inverse SyncTeX: PDF click → source line.
 */
export async function synctexInverse({ projectPath, pdfRelative, page, x, y, texBinDir = null }) {
  const root = assertAbsolutePath(projectPath);
  const pdfAbs = path.isAbsolute(pdfRelative) ? pdfRelative : path.join(root, pdfRelative);
  const envPath = buildPathEnv(texBinDir);
  const bin = synctexAvailable(envPath);
  const args = ["edit", "-o", `${page}:${x}:${y}:${pdfAbs}`];
  const result = await run(bin, args, root, envPath);
  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || "synctex edit failed");
  }
  const parsed = parseSynctexEdit(result.stdout);
  if (!parsed) {
    throw new Error("synctex edit returned no input mapping");
  }
  // Prefer project-relative path when possible.
  let file = parsed.file;
  if (file.startsWith(root)) {
    file = path.relative(root, file).replace(/\\/g, "/");
  } else {
    file = path.basename(file);
  }
  return { ...parsed, file };
}
