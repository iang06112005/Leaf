import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ENGINES = new Set(["pdflatex", "xelatex", "lualatex"]);

export function allowedEngines() {
  return [...ENGINES];
}

function commandExists(command, envPath) {
  const extensions = process.platform === "win32" ? [".exe", ".bat", ".cmd", ""] : [""];
  const parts = envPath.split(path.delimiter).filter(Boolean);
  for (const dir of parts) {
    for (const ext of extensions) {
      const candidate = path.join(dir, command + ext);
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      } catch {
        // ignore unreadable PATH entries
      }
    }
  }
  return null;
}

export function buildPathEnv(texBinDir) {
  const current = process.env.PATH ?? "";
  if (!texBinDir) return current;
  return `${texBinDir}${path.delimiter}${current}`;
}

export async function detectTeX({ texBinDir } = {}) {
  const envPath = buildPathEnv(texBinDir);
  const latexmk = commandExists("latexmk", envPath);
  const engines = {};
  for (const engine of ENGINES) {
    engines[engine] = commandExists(engine, envPath);
  }

  let version = null;
  if (latexmk) {
    version = await runCapture(latexmk, ["-v"], envPath);
  }

  return {
    ok: Boolean(latexmk),
    latexmk,
    engines,
    version: version?.stdout?.split("\n")[0] ?? null,
    path: envPath,
    installHint:
      process.platform === "win32"
        ? "Install TeX Live from https://tug.org/texlive/ and ensure latexmk is on PATH, or set the TeX bin directory in Settings."
        : "Install TeX Live (e.g. apt install latexmk texlive) or set the TeX bin directory in Settings.",
  };
}

function runCapture(command, args, envPath) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: false,
      env: { ...process.env, PATH: envPath },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ code: 1, stdout, stderr: error.message });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

/**
 * Build latexmk argv. Never joins a shell string.
 */
export function buildLatexmkArgs({
  engine = "pdflatex",
  rootFile,
  shellEscape = false,
  synctex = true,
  outputDir = null,
}) {
  if (!ENGINES.has(engine)) {
    throw new Error(`Unsupported engine: ${engine}`);
  }
  if (typeof rootFile !== "string" || rootFile.trim() === "") {
    throw new Error("rootFile is required.");
  }
  if (rootFile.includes("\0") || rootFile.split(/[/\\]/).includes("..")) {
    throw new Error("Invalid rootFile.");
  }

  const args = [];
  if (engine === "pdflatex") args.push("-pdf");
  if (engine === "xelatex") args.push("-xelatex");
  if (engine === "lualatex") args.push("-lualatex");

  args.push("-interaction=nonstopmode", "-file-line-error");
  if (synctex) args.push("-synctex=1");
  if (outputDir) {
    if (outputDir.split(/[/\\]/).includes("..")) {
      throw new Error("Invalid outputDir.");
    }
    args.push(`-outdir=${outputDir}`);
  }
  if (shellEscape) {
    // Single latexmk flag; not passed through a shell.
    args.push("-latexoption=-shell-escape");
  }
  args.push(rootFile);
  return args;
}
