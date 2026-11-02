import type { editor as MonacoEditor } from "monaco-editor";
import { findSnippet } from "./snippets";

let activeEditor: MonacoEditor.IStandaloneCodeEditor | null = null;

export function setActiveEditor(editor: MonacoEditor.IStandaloneCodeEditor | null): void {
  activeEditor = editor;
}

export function getActiveEditor(): MonacoEditor.IStandaloneCodeEditor | null {
  return activeEditor;
}

/** Insert a LaTeX snippet at the cursor using Monaco's snippet controller when available. */
export function insertLatexSnippet(idOrTrigger: string): boolean {
  const snippet = findSnippet(idOrTrigger);
  const editor = activeEditor;
  if (!snippet || !editor) return false;
  editor.focus();
  const contribution = editor.getContribution("snippetController2") as {
    insert: (template: string) => void;
  } | null;
  if (contribution && typeof contribution.insert === "function") {
    contribution.insert(snippet.body);
    return true;
  }
  const plain = snippet.body
    .replace(/\$\{(\d+):([^}]*)\}/g, "$2")
    .replace(/\$\{(\d+)\}/g, "")
    .replace(/\$0/g, "");
  const selection = editor.getSelection();
  if (!selection) return false;
  editor.executeEdits("texflow-snippet", [
    { range: selection, text: plain, forceMoveMarkers: true },
  ]);
  return true;
}
