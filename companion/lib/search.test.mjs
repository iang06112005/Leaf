import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { searchProject } from "./search.mjs";

test("searchProject finds line matches", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "texflow-search-"));
  try {
    await fs.mkdir(path.join(dir, "chapters"));
    await fs.writeFile(path.join(dir, "main.tex"), "hello\n\\input{chapters/body}\n");
    await fs.writeFile(path.join(dir, "chapters", "body.tex"), "alpha\nfindme here\nomega\n");
    const result = await searchProject(dir, "findme");
    assert.equal(result.matches.length, 1);
    assert.equal(result.matches[0].file, "chapters/body.tex");
    assert.equal(result.matches[0].line, 2);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
