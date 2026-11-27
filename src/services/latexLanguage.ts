import type * as Monaco from "monaco-editor";
import { filterBibEntries, type BibEntry } from "./bib";
import { getBibEntries } from "./bibCache";
import { LATEX_SNIPPETS } from "./snippets";

let registered = false;

/** Register a lightweight `latex` language, Monarch highlighting, snippets, and cite completion. */
export function ensureLatexLanguage(monaco: typeof Monaco): void {
  if (registered) return;
  registered = true;

  monaco.languages.register({ id: "latex" });
  monaco.languages.setLanguageConfiguration("latex", {
    comments: { lineComment: "%" },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "`", close: "'" },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
    ],
  });

  monaco.languages.setMonarchTokensProvider("latex", {
    defaultToken: "",
    tokenizer: {
      root: [
        [/%.*/, "comment"],
        [/\\begin\{[^}]*\}/, "keyword"],
        [/\\end\{[^}]*\}/, "keyword"],
        [/\\(section|subsection|subsubsection|chapter|part|paragraph|subparagraph)\*?/, "keyword"],
        [
          /\\(cite|ref|label|includegraphics|input|include|bibliography|usepackage)(\*?)/,
          "keyword",
        ],
        [/\\[a-zA-Z@]+/, "keyword"],
        [/\$\$/, "string", "@mathDisplay"],
        [/\$/, "string", "@mathInline"],
        [/[{}]/, "delimiter.bracket"],
        [/[[\]]/, "delimiter.square"],
        [/[0-9]+/, "number"],
        [/[{}]/, "@brackets"],
      ],
      mathInline: [
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^$\\]+/, "string"],
        [/\$/, "string", "@pop"],
        [/./, "string"],
      ],
      mathDisplay: [
        [/\\[a-zA-Z]+/, "keyword"],
        [/[^$\\]+/, "string"],
        [/\$\$/, "string", "@pop"],
        [/./, "string"],
      ],
    },
  });

  monaco.languages.registerCompletionItemProvider("latex", {
    triggerCharacters: ["\\"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const prefix = word.word.toLowerCase();
      const suggestions = LATEX_SNIPPETS.filter(
        (snippet) =>
          !prefix ||
          snippet.trigger.startsWith(prefix) ||
          snippet.id.startsWith(prefix) ||
          snippet.label.toLowerCase().startsWith(prefix),
      ).map((snippet) => ({
        label: `${snippet.trigger} → ${snippet.label}`,
        kind: monaco.languages.CompletionItemKind.Snippet,
        detail: snippet.detail,
        insertText: snippet.body,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
        sortText: `0-${snippet.trigger}`,
      }));
      return { suggestions };
    },
  });

  monaco.languages.registerCompletionItemProvider("latex", {
    triggerCharacters: ["{", ",", " "],
    provideCompletionItems(model, position) {
      const line = model.getLineContent(position.lineNumber);
      const before = line.slice(0, position.column - 1);
      const cite = /\\cite(?:\[[^\]]*\])?\{([^}]*)$/.exec(before);
      if (!cite) return { suggestions: [] };
      const typed = (cite[1] ?? "").split(",").pop()?.trim() ?? "";
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - typed.length,
        endColumn: position.column,
      };
      const entries: BibEntry[] = filterBibEntries(getBibEntries(), typed);
      return {
        suggestions: entries.slice(0, 80).map((entry) => ({
          label: entry.key,
          kind: monaco.languages.CompletionItemKind.Reference,
          detail: [entry.type, entry.author, entry.year].filter(Boolean).join(" · "),
          documentation: entry.title ? `${entry.title} (${entry.source})` : entry.source,
          insertText: entry.key,
          range,
          sortText: entry.key.toLowerCase(),
        })),
      };
    },
  });
}
