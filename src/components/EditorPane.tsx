import Editor, { type OnMount } from "@monaco-editor/react";
import { FileCode2, Save } from "lucide-react";
import { useEffect, useRef } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import { monacoLanguageFor } from "../services/fileKinds";
import { useWorkspace } from "../workspace/useWorkspace";
import { EditorTabs } from "./EditorTabs";
import { Panel } from "./ui/Panel";

export function EditorPane() {
  const {
    openPath,
    openContent,
    dirty,
    setOpenContent,
    saveOpenFile,
    settings,
    jumpRequest,
    openFile,
    clearJumpRequest,
    syncTexForward,
  } = useWorkspace();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!jumpRequest) return;
    void (async () => {
      if (openPath !== jumpRequest.path) {
        await openFile(jumpRequest.path);
      }
      window.setTimeout(() => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.revealLineInCenter(jumpRequest.line);
        editor.setPosition({ lineNumber: jumpRequest.line, column: 1 });
        editor.focus();
        clearJumpRequest();
      }, 50);
    })();
  }, [clearJumpRequest, jumpRequest, openFile, openPath]);

  return (
    <Panel
      title="Editor"
      icon={FileCode2}
      className="min-h-64 border-b border-[var(--tf-border)] bg-[var(--tf-panel-2)] md:min-h-0 md:border-r md:border-b-0"
    >
      <EditorTabs />
      {openPath ? (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-xs text-[var(--tf-muted)]" title={openPath}>
              {openPath}
              {dirty ? " •" : ""}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  const editor = editorRef.current;
                  const line = editor?.getPosition()?.lineNumber ?? 1;
                  const column = editor?.getPosition()?.column ?? 1;
                  void syncTexForward(line, column);
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded border border-[var(--tf-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--tf-accent)]"
                title="Forward SyncTeX (editor → PDF)"
              >
                SyncTeX
              </button>
              <button
                type="button"
                onClick={() => {
                  void saveOpenFile();
                }}
                disabled={!dirty}
                className="inline-flex shrink-0 items-center gap-1.5 rounded border border-[var(--tf-border)] bg-[var(--tf-panel)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--tf-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="size-3.5" aria-hidden="true" />
                Save
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded border border-[var(--tf-border)]">
            <Editor
              height="100%"
              theme={settings.theme === "light" ? "vs" : "vs-dark"}
              path={openPath}
              language={monacoLanguageFor(openPath)}
              value={openContent}
              onMount={onMount}
              onChange={(value) => setOpenContent(value ?? "")}
              options={{
                automaticLayout: true,
                fontSize: settings.editorFontSize,
                fontFamily: settings.editorFontFamily,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 2,
              }}
            />
          </div>
        </div>
      ) : (
        <p className="font-mono text-[var(--tf-muted)]">No file open.</p>
      )}
    </Panel>
  );
}
