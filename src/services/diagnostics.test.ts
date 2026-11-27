import { describe, expect, it } from "vitest";
import { parseLatexLog } from "./diagnostics";

describe("parseLatexLog", () => {
  it("extracts file:line errors and warnings", () => {
    const log = `
(./main.tex
./chapters/intro.tex:12: Undefined control sequence.
! Undefined control sequence.
l.12 \\foo
LaTeX Warning: Reference \`sec:later' on page 1 undefined on input line 20.
Overfull \\hbox (12.0pt too wide) in paragraph at lines 8--10
);
`;
    const diagnostics = parseLatexLog(log);
    expect(diagnostics.some((d) => d.file?.includes("intro.tex") && d.line === 12)).toBe(true);
    expect(diagnostics.some((d) => /Reference/.test(d.message))).toBe(true);
    expect(diagnostics.some((d) => /Overfull/.test(d.message))).toBe(true);
  });
});
