import { describe, expect, it } from "vitest";
import { buildProjectOutline, listTexInputs, parseTexOutline } from "./outline";

describe("parseTexOutline", () => {
  it("finds nested sections with line numbers and path", () => {
    const source = `\\documentclass{article}
\\begin{document}
\\section{Intro}
Text
\\subsection{Details}
% \\section{Commented}
\\section*{Starred}
\\end{document}
`;
    const outline = parseTexOutline(source, "main.tex");
    expect(outline.map((item) => [item.command, item.title, item.line, item.path])).toEqual([
      ["section", "Intro", 3, "main.tex"],
      ["subsection", "Details", 5, "main.tex"],
      ["section", "Starred", 7, "main.tex"],
    ]);
  });

  it("returns empty for no sections", () => {
    expect(parseTexOutline("hello\n")).toEqual([]);
  });
});

describe("project outline", () => {
  it("lists input targets with .tex", () => {
    expect(listTexInputs("\\input{chapters/body}\n\\include{app}\n", "main.tex")).toEqual([
      "chapters/body.tex",
      "app.tex",
    ]);
  });

  it("follows input files for sections", async () => {
    const files: Record<string, string> = {
      "main.tex": "\\section{Root}\n\\input{chapters/body}\n",
      "chapters/body.tex": "\\section{Chapter}\n\\subsection{More}\n",
    };
    const outline = await buildProjectOutline("main.tex", async (path) => {
      const text = files[path];
      if (!text) throw new Error("missing");
      return text;
    });
    expect(outline.map((item) => `${item.path}:${item.title}`)).toEqual([
      "main.tex:Root",
      "chapters/body.tex:Chapter",
      "chapters/body.tex:More",
    ]);
  });
});
