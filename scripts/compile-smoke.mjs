#!/usr/bin/env node
/**
 * Smoke-test the companion compile path against fixtures.
 * Requires latexmk + pdflatex on PATH.
 * xelatex is optional: skipped cleanly when the binary is missing (CI has no XeTeX).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startCompile, getJob } from "../companion/lib/compile.mjs";
import { detectTeX } from "../companion/lib/tex.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function runOne({ label, projectDir, engine }) {
  const projectPath = path.join(root, "tests", "fixtures", projectDir);
  const started = await startCompile({
    projectPath,
    rootFile: "main.tex",
    engine,
    shellEscape: false,
    synctex: true,
    outputDir: null,
    texBinDir: null,
  });

  const job = getJob(started.jobId);
  await new Promise((resolve, reject) => {
    if (!job) {
      reject(new Error(`${label}: job missing`));
      return;
    }
    if (job.result) {
      resolve(job.result);
      return;
    }
    job.emitter.on("done", resolve);
  });

  const result = getJob(started.jobId)?.result;
  if (!result?.ok) {
    console.error(`[${label}]`, result?.log ?? "compile failed");
    process.exit(result?.code ?? 1);
  }
  return {
    label,
    ok: true,
    engine,
    durationMs: result.durationMs,
    pdfRelative: result.pdfRelative,
    args: result.args,
  };
}

const tex = await detectTeX({});
if (!tex.ok || !tex.engines.pdflatex) {
  console.error("pdflatex/latexmk required for compile smoke.");
  process.exit(1);
}

const results = [];
results.push(
  await runOne({ label: "article-pdflatex", projectDir: "article", engine: "pdflatex" }),
);
results.push(
  await runOne({ label: "with-image-pdflatex", projectDir: "with-image", engine: "pdflatex" }),
);

if (tex.engines.xelatex) {
  results.push(
    await runOne({ label: "with-image-xelatex", projectDir: "with-image", engine: "xelatex" }),
  );
} else {
  results.push({
    label: "with-image-xelatex",
    ok: true,
    skipped: true,
    reason: "xelatex not found on PATH",
  });
  console.warn("Skipping with-image-xelatex: xelatex not found on PATH");
}

console.log(JSON.stringify({ ok: true, results }, null, 2));
