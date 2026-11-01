import Editor from "@monaco-editor/react";
import { FileCode2, Save } from "lucide-react";
import { monacoLanguageFor } from "../services/fileKinds";
import { useWorkspace } from "../workspace/useWorkspace";
import { Panel } from "./ui/Panel";

export function EditorPane() {
  const { openPath, openContent, dirty, setOpenContent, saveOpenFile } = useWorkspace();

  return (
    <Panel
      title="Editor"
      icon={FileCode2}
      className="min-h-64 border-b border-zinc-800 bg-zinc-950 md:min-h-0 md:border-r md:border-b-0"
    >
      {openPath ? (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-xs text-zinc-400" title={openPath}>
              {openPath}
              {dirty ? " •" : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                void saveOpenFile();
              }}
              disabled={!dirty}
              className="inline-flex shrink-0 items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-100 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="size-3.5" aria-hidden="true" />
              Save
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded border border-zinc-800">
            <Editor
              height="100%"
              theme="vs-dark"
              path={openPath}
              language={monacoLanguageFor(openPath)}
              value={openContent}
              onChange={(value) => setOpenContent(value ?? "")}
              options={{
                automaticLayout: true,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 2,
              }}
            />
          </div>
        </div>
      ) : (
        <p className="font-mono text-zinc-500">No file open.</p>
      )}
    </Panel>
  );
}
