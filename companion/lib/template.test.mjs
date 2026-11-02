import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createProjectFromTemplate, getTemplate } from "./template.mjs";
import { cleanProjectArtifacts } from "./clean.mjs";

test("article template includes main.tex", () => {
  const template = getTemplate("article");
  assert.ok(template.files["main.tex"].includes("\\documentclass"));
});

test("createProjectFromTemplate writes ordinary files", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "texflow-tpl-"));
  try {
    const created = await createProjectFromTemplate({ projectPath: dir, templateId: "article" });
    assert.equal(created.templateId, "article");
    const tex = await fs.readFile(path.join(dir, "main.tex"), "utf8");
    assert.match(tex, /\\begin\{document\}/);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("cleanProjectArtifacts removes aux but keeps tex", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "texflow-clean-"));
  try {
    await fs.writeFile(path.join(dir, "main.tex"), "% keep\n");
    await fs.writeFile(path.join(dir, "main.aux"), "aux");
    await fs.writeFile(path.join(dir, "main.log"), "log");
    await fs.writeFile(path.join(dir, "main.pdf"), "%pdf");
    const result = await cleanProjectArtifacts(dir);
    assert.equal(result.count, 2);
    await fs.access(path.join(dir, "main.tex"));
    await fs.access(path.join(dir, "main.pdf"));
    await assert.rejects(() => fs.access(path.join(dir, "main.aux")));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
