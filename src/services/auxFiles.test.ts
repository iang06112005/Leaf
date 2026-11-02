import { describe, expect, it } from "vitest";
import { filterTreeHideAux, isAuxFileName } from "./auxFiles";

describe("auxFiles", () => {
  it("detects common aux names", () => {
    expect(isAuxFileName("main.aux")).toBe(true);
    expect(isAuxFileName("main.synctex.gz")).toBe(true);
    expect(isAuxFileName("main.tex")).toBe(false);
    expect(isAuxFileName("main.pdf")).toBe(false);
  });

  it("filters tree nodes but keeps directories with remaining files", () => {
    const filtered = filterTreeHideAux([
      { kind: "file", name: "main.tex", path: "main.tex" },
      { kind: "file", name: "main.aux", path: "main.aux" },
      {
        kind: "directory",
        name: "build",
        path: "build",
        children: [{ kind: "file", name: "out.log", path: "build/out.log" }],
      },
      {
        kind: "directory",
        name: "chapters",
        path: "chapters",
        children: [{ kind: "file", name: "body.tex", path: "chapters/body.tex" }],
      },
    ]);
    expect(filtered.map((n) => n.path)).toEqual(["main.tex", "chapters"]);
  });
});
