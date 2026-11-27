import { describe, expect, it } from "vitest";
import { isPdfProjectFile, isTextProjectFile, monacoLanguageFor } from "./fileKinds";

describe("fileKinds", () => {
  it("classifies editable text and pdfs", () => {
    expect(isTextProjectFile("main.tex")).toBe(true);
    expect(isTextProjectFile("refs.bib")).toBe(true);
    expect(isTextProjectFile("fig.png")).toBe(false);
    expect(isPdfProjectFile("build/Main.PDF")).toBe(true);
  });

  it("picks a monaco language for tex sources", () => {
    expect(monacoLanguageFor("cap 1/main.tex")).toBe("latex");
    expect(monacoLanguageFor("README.md")).toBe("markdown");
  });
});
