#!/usr/bin/env node
/**
 * Smoke-test the companion compile path against tests/fixtures/article.
 * Requires latexmk on PATH.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startCompile, getJob } from "../companion/lib/compile.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectPath = path.join(root, "tests", "fixtures", "article");

const started = await startCompile({
  projectPath,
  rootFile: "main.tex",
  engine: "pdflatex",
  shellEscape: false,
  synctex: true,
  outputDir: null,
  texBinDir: null,
});

const job = getJob(started.jobId);
await new Promise((resolve, reject) => {
  if (!job) {
    reject(new Error("job missing"));
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
  console.error(result?.log ?? "compile failed");
  process.exit(result?.code ?? 1);
}
console.log(
  JSON.stringify(
    {
      ok: true,
      durationMs: result.durationMs,
      pdfRelative: result.pdfRelative,
      args: result.args,
    },
    null,
    2,
  ),
);
