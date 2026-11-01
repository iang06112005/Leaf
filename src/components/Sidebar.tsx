import { FolderOpen, FolderTree, RefreshCw } from "lucide-react";
import { useWorkspace } from "../workspace/useWorkspace";
import { FileTree } from "./FileTree";
import { Panel } from "./ui/Panel";

export function Sidebar() {
  const {
    status,
    projectName,
    tree,
    openPath,
    previewPath,
    canOpen,
    openProject,
    openFile,
    refreshTree,
  } = useWorkspace();

  return (
    <Panel
      title="Project"
      icon={FolderTree}
      className="min-h-40 border-b border-zinc-800 bg-zinc-900 md:min-h-0 md:border-r md:border-b-0"
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void openProject();
          }}
          disabled={!canOpen || status === "loading"}
          className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FolderOpen className="size-3.5" aria-hidden="true" />
          Open folder
        </button>
        {projectName ? (
          <button
            type="button"
            onClick={() => {
              void refreshTree();
            }}
            className="inline-flex items-center gap-1.5 rounded border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Refresh
          </button>
        ) : null}
      </div>

      {!canOpen ? (
        <p className="text-sm text-amber-200/90">
          Open folder needs Chrome or Edge. This browser does not expose the File System Access API.
        </p>
      ) : null}

      {status === "idle" && canOpen ? (
        <p className="text-sm text-zinc-400">
          Open a local project directory. TexFlow does not copy it and does not invent a project
          format.
        </p>
      ) : null}

      {status === "loading" ? <p className="text-sm text-zinc-400">Reading folder…</p> : null}

      {projectName ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-zinc-500">
            {projectName}
          </p>
          <div className="min-h-0 flex-1 overflow-auto">
            <FileTree
              nodes={tree}
              activePath={openPath}
              previewPath={previewPath}
              onOpen={(path) => {
                void openFile(path);
              }}
            />
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
