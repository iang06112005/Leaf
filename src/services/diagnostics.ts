export type DiagnosticSeverity = "error" | "warning" | "info";

export type Diagnostic = {
  id: string;
  severity: DiagnosticSeverity;
  message: string;
  file: string | null;
  line: number | null;
  raw: string;
};

const FILE_LINE = /^(!\s*)?(.+?):(\d+):\s*(.*)$/;
const LATEX_ERROR = /^!\s+(.*)$/;
const OVERFULL = /^(Overfull \\[hv]box.*)$/;
const UNDERFULL = /^(Underfull \\[hv]box.*)$/;
const WARNING = /^LaTeX Warning:\s*(.*)$/i;
const PACKAGE_WARNING = /^Package (\S+) Warning:\s*(.*)$/i;
const UNDEFINED_REF = /Reference `([^']+)' on page/;
const UNDEFINED_CITE = /Citation `([^']+)' on page/;
const ON_INPUT_LINE = /on input line (\d+)/i;

/**
 * Parse latexmk / TeX log text into diagnostics.
 */
export function parseLatexLog(log: string): Diagnostic[] {
  const lines = log.split(/\r?\n/);
  const diagnostics: Diagnostic[] = [];
  let currentFile: string | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    const filePush = /^\(\s*([^()]+?\.(tex|sty|cls|bib))\s*$/i.exec(line);
    if (filePush) {
      currentFile = filePush[1]!.replace(/^\.\//, "");
    }

    const fileLine = FILE_LINE.exec(line);
    if (fileLine) {
      diagnostics.push({
        id: `d${diagnostics.length}`,
        severity: line.trimStart().startsWith("!") ? "error" : "warning",
        message: fileLine[4] || line,
        file: normalizeFile(fileLine[2]!),
        line: Number(fileLine[3]),
        raw: line,
      });
      i += 1;
      continue;
    }

    const latexError = LATEX_ERROR.exec(line);
    if (latexError) {
      const message = latexError[1] ?? line;
      let lineNo: number | null = null;
      const next = lines[i + 1] ?? "";
      const onLine = ON_INPUT_LINE.exec(next) || ON_INPUT_LINE.exec(line);
      if (onLine) lineNo = Number(onLine[1]);
      diagnostics.push({
        id: `d${diagnostics.length}`,
        severity: "error",
        message,
        file: currentFile,
        line: lineNo,
        raw: line,
      });
      i += 1;
      continue;
    }

    const warning = WARNING.exec(line) || PACKAGE_WARNING.exec(line);
    if (warning) {
      const message = warning.length === 3 ? `${warning[1]}: ${warning[2]}` : (warning[1] ?? line);
      const onLine = ON_INPUT_LINE.exec(line);
      let severity: DiagnosticSeverity = "warning";
      if (UNDEFINED_REF.test(message) || UNDEFINED_CITE.test(message)) {
        severity = "warning";
      }
      diagnostics.push({
        id: `d${diagnostics.length}`,
        severity,
        message,
        file: currentFile,
        line: onLine ? Number(onLine[1]) : null,
        raw: line,
      });
      i += 1;
      continue;
    }

    const overfull = OVERFULL.exec(line) || UNDERFULL.exec(line);
    if (overfull) {
      const onLine = ON_INPUT_LINE.exec(line);
      diagnostics.push({
        id: `d${diagnostics.length}`,
        severity: "info",
        message: overfull[1] ?? line,
        file: currentFile,
        line: onLine ? Number(onLine[1]) : null,
        raw: line,
      });
      i += 1;
      continue;
    }

    i += 1;
  }

  return diagnostics;
}

function normalizeFile(file: string): string {
  return file.replace(/^\.\//, "").replace(/\\/g, "/");
}
