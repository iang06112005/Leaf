import { describe, expect, it } from "vitest";
import {
  findPreferredPdf,
  findPreferredTex,
  flattenFiles,
  type ProjectTreeNode,
} from "./filesystem";

const sampleTree: ProjectTreeNode[] = [
  {
    kind: "directory",
    name: "chapters",
    path: "chapters",
    children: [
      { kind: "file", name: "intro.tex", path: "chapters/intro.tex" },
      { kind: "file", name: "intro.pdf", path: "chapters/intro.pdf" },
    ],
  },
  { kind: "file", name: "main.tex", path: "main.tex" },
  { kind: "file", name: "notes.txt", path: "notes.txt" },
];

describe("filesystem helpers", () => {
  it("flattens nested files", () => {
    expect(flattenFiles(sampleTree).map((file) => file.path)).toEqual([
      "chapters/intro.tex",
      "chapters/intro.pdf",
      "main.tex",
      "notes.txt",
    ]);
  });

  it("prefers main.tex and main.pdf when present", () => {
    expect(findPreferredTex(sampleTree)).toBe("main.tex");
    expect(findPreferredPdf(sampleTree)).toBe("chapters/intro.pdf");

    const withMainPdf: ProjectTreeNode[] = [
      ...sampleTree,
      { kind: "file", name: "main.pdf", path: "main.pdf" },
    ];
    expect(findPreferredPdf(withMainPdf)).toBe("main.pdf");
  });
});
