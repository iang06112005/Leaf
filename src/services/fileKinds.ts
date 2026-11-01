import { extensionOf } from "./paths";

const TEXT_EXTENSIONS = new Set([
  "tex",
  "bib",
  "cls",
  "sty",
  "bst",
  "md",
  "txt",
  "json",
  "yml",
  "yaml",
  "toml",
  "csv",
  "log",
  "out",
  "aux",
  "toc",
  "lof",
  "lot",
]);

export function isTextProjectFile(path: string): boolean {
  return TEXT_EXTENSIONS.has(extensionOf(path));
}

export function isPdfProjectFile(path: string): boolean {
  return extensionOf(path) === "pdf";
}

export function monacoLanguageFor(path: string): string {
  switch (extensionOf(path)) {
    case "tex":
    case "cls":
    case "sty":
    case "bst":
    case "bib":
      // Monaco has no built-in LaTeX grammar in this milestone.
      return "plaintext";
    case "md":
      return "markdown";
    case "json":
      return "json";
    case "yml":
    case "yaml":
      return "yaml";
    case "toml":
      return "ini";
    case "log":
    case "out":
    case "aux":
    case "toc":
    case "lof":
    case "lot":
    case "txt":
    case "csv":
      return "plaintext";
    default:
      return "plaintext";
  }
}
