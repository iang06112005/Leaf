import assert from "node:assert/strict";
import test from "node:test";
import { buildLatexmkArgs } from "./tex.mjs";

test("buildLatexmkArgs uses structured engine flags", () => {
  assert.deepEqual(buildLatexmkArgs({ engine: "pdflatex", rootFile: "main.tex" }), [
    "-pdf",
    "-interaction=nonstopmode",
    "-file-line-error",
    "-synctex=1",
    "main.tex",
  ]);
});

test("buildLatexmkArgs adds shell-escape as latexmk option", () => {
  const args = buildLatexmkArgs({
    engine: "xelatex",
    rootFile: "cap 1/main.tex",
    shellEscape: true,
    synctex: false,
    outputDir: "build",
  });
  assert.deepEqual(args, [
    "-xelatex",
    "-interaction=nonstopmode",
    "-file-line-error",
    "-outdir=build",
    "-latexoption=-shell-escape",
    "cap 1/main.tex",
  ]);
});

test("buildLatexmkArgs rejects path traversal", () => {
  assert.throws(() => buildLatexmkArgs({ rootFile: "../evil.tex" }));
});
