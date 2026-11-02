#!/usr/bin/env node
/**
 * Smoke-test the companion compile path against fixtures.
 * Requires latexmk on PATH. Proves pdflatex (article), graphicx (with-image),
 * and xelatex (with-image).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startCompile, getJob } from "../companion/lib/compile.mjs";

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

const results = [];
results.push(
  await runOne({ label: "article-pdflatex", projectDir: "article", engine: "pdflatex" }),
);
results.push(
  await runOne({ label: "with-image-pdflatex", projectDir: "with-image", engine: "pdflatex" }),
);
results.push(
  await runOne({ label: "with-image-xelatex", projectDir: "with-image", engine: "xelatex" }),
);

console.log(JSON.stringify({ ok: true, results }, null, 2));
