import type * as Monaco from "monaco-editor";
import { LATEX_SNIPPETS } from "./snippets";

let registered = false;

/** Register a lightweight `latex` language + snippet completions once. */
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
        sortText: snippet.trigger,
      }));
      return { suggestions };
    },
  });
}
