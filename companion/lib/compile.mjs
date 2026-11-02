import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import path from "node:path";
import { assertAbsolutePath } from "./paths.mjs";
import { buildLatexmkArgs, buildPathEnv, detectTeX } from "./tex.mjs";

/** @typedef {{ jobId: string, projectPath: string, child: import('node:child_process').ChildProcess | null, emitter: EventEmitter, result: object | null, log: string, startedAt: number }} Job */

/** @type {Map<string, Job>} */
const jobsById = new Map();
/** @type {Map<string, string>} */
const activeByProject = new Map();

function newJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getJob(jobId) {
  return jobsById.get(jobId) ?? null;
}

export function getActiveJobForProject(projectPath) {
  const id = activeByProject.get(path.normalize(projectPath));
  return id ? (jobsById.get(id) ?? null) : null;
}

export async function startCompile(options) {
  const projectPath = assertAbsolutePath(options.projectPath);
  const normalized = path.normalize(projectPath);

  if (activeByProject.has(normalized)) {
    throw new Error("A build is already running for this project. Stop it first.");
  }

  const tex = await detectTeX({ texBinDir: options.texBinDir ?? null });
  if (!tex.ok || !tex.latexmk) {
    throw new Error(`latexmk was not found. ${tex.installHint}`);
  }

  const args = buildLatexmkArgs({
    engine: options.engine ?? "pdflatex",
    rootFile: options.rootFile,
    shellEscape: Boolean(options.shellEscape),
    synctex: options.synctex !== false,
    outputDir: options.outputDir || null,
  });

  const jobId = newJobId();
  const emitter = new EventEmitter();
  /** @type {Job} */
  const job = {
    jobId,
    projectPath: normalized,
    child: null,
    emitter,
    result: null,
    log: "",
    startedAt: Date.now(),
  };
  jobsById.set(jobId, job);
  activeByProject.set(normalized, jobId);

  const child = spawn(tex.latexmk, args, {
    cwd: normalized,
    shell: false,
    env: { ...process.env, PATH: buildPathEnv(options.texBinDir ?? null) },
    windowsHide: true,
  });
  job.child = child;

  const append = (chunk, stream) => {
    const text = chunk.toString();
    job.log += text;
    emitter.emit("log", { stream, text });
  };

  child.stdout.on("data", (chunk) => append(chunk, "stdout"));
  child.stderr.on("data", (chunk) => append(chunk, "stderr"));

  child.on("error", (error) => {
    finish(job, {
      ok: false,
      code: 1,
      signal: null,
      durationMs: Date.now() - job.startedAt,
      log: job.log,
      error: error.message,
      args,
      latexmk: tex.latexmk,
      pdfPath: null,
    });
  });

  child.on("close", (code, signal) => {
    const pdfName = options.rootFile.replace(/\.tex$/i, ".pdf");
    const pdfPath = options.outputDir
      ? path.join(normalized, options.outputDir, path.basename(pdfName))
      : path.join(normalized, pdfName);

    finish(job, {
      ok: code === 0,
      code,
      signal,
      durationMs: Date.now() - job.startedAt,
      log: job.log,
      error: null,
      args,
      latexmk: tex.latexmk,
      pdfPath,
      pdfRelative: options.outputDir
        ? path.join(options.outputDir, path.basename(pdfName)).replace(/\\/g, "/")
        : path.basename(pdfName),
    });
  });

  return {
    jobId,
    projectPath: normalized,
    args,
    latexmk: tex.latexmk,
  };
}

function finish(job, result) {
  if (job.result) return;
  job.result = result;
  job.child = null;
  activeByProject.delete(job.projectPath);
  job.emitter.emit("done", result);
}

export function cancelCompile({ jobId, projectPath }) {
  let job = null;
  if (jobId) job = jobsById.get(jobId) ?? null;
  else if (projectPath) job = getActiveJobForProject(projectPath);

  if (!job) {
    throw new Error("No running build matched that request.");
  }
  if (!job.child) {
    return { ok: true, jobId: job.jobId, alreadyFinished: true };
  }

  const child = job.child;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      shell: false,
      windowsHide: true,
    });
  } else {
    child.kill("SIGTERM");
    setTimeout(() => {
      if (!job.result && job.child) job.child.kill("SIGKILL");
    }, 2000);
  }

  return { ok: true, jobId: job.jobId, alreadyFinished: false };
}
