import { describe, expect, it } from "vitest";
import { basename, extensionOf, joinRelativePath, splitRelativePath } from "./paths";

describe("paths", () => {
  it("keeps Unicode and spaces in segments", () => {
    expect(splitRelativePath("capítulo 1/main.tex")).toEqual(["capítulo 1", "main.tex"]);
    expect(joinRelativePath("capítulo 1", "main.tex")).toBe("capítulo 1/main.tex");
  });

  it("normalizes mixed separators without inventing dots", () => {
    expect(splitRelativePath("src\\a/b.tex")).toEqual(["src", "a", "b.tex"]);
    expect(joinRelativePath("src/", "/a/", "b.tex")).toBe("src/a/b.tex");
  });

  it("reads basename and extension", () => {
    expect(basename("docs/main.tex")).toBe("main.tex");
    expect(extensionOf("docs/Figure 1.PDF")).toBe("pdf");
    expect(extensionOf(".gitignore")).toBe("");
  });
});
