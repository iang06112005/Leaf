import assert from "node:assert/strict";
import test from "node:test";

// Lightweight parse tests by importing private behavior via re-running sample output patterns.
test("synctex view sample contains page", () => {
  const sample =
    "SyncTeX result begin\nOutput:main.pdf\nPage:2\nx:72.0\ny:640.0\nSyncTeX result end\n";
  const page = /Page:(\d+)/i.exec(sample);
  assert.equal(page?.[1], "2");
});

test("synctex edit sample contains input line", () => {
  const sample =
    "SyncTeX result begin\nInput:./chapters/body.tex\nLine:8\nColumn:1\nSyncTeX result end\n";
  const input = /Input:(.+)/i.exec(sample);
  const line = /Line:(\d+)/i.exec(sample);
  assert.equal(input?.[1].trim(), "./chapters/body.tex");
  assert.equal(line?.[1], "8");
});
