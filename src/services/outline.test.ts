import { describe, expect, it } from "vitest";
import { parseTexOutline } from "./outline";

describe("parseTexOutline", () => {
  it("finds nested sections with line numbers", () => {
    const source = `\\documentclass{article}
\\begin{document}
\\section{Intro}
Text
\\subsection{Details}
% \\section{Commented}
\\section*{Starred}
\\end{document}
`;
    const outline = parseTexOutline(source);
    expect(outline.map((item) => [item.command, item.title, item.line])).toEqual([
      ["section", "Intro", 3],
      ["subsection", "Details", 5],
      ["section", "Starred", 7],
    ]);
  });

  it("returns empty for no sections", () => {
    expect(parseTexOutline("hello\n")).toEqual([]);
  });
});
