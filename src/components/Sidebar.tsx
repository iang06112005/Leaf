import { Eraser, FilePlus2, FolderPlus, FolderTree, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useWorkspace } from "../workspace/useWorkspace";
import { FileTree } from "./FileTree";
import { OutlinePanel } from "./OutlinePanel";
import { Panel } from "./ui/Panel";

export function Sidebar() {
  const {
    companionOnline,
    status,
    projectName,
    tree,
    openPath,
    previewPath,
    openFile,
    refreshTree,
    createFile,
    createFolder,
    renameEntry,
    deleteEntry,
    cleanArtifacts,
  } = useWorkspace();

  return (
    <Panel
      title="Project"
      icon={FolderTree}
      className="min-h-40 border-b border-[var(--tf-border)] bg-[var(--tf-panel)] md:min-h-0 md:border-r md:border-b-0"
    >
      {!companionOnline ? (
        <p className="mb-3 text-sm text-amber-600">
          Companion offline. Run <code className="font-semibold">npm run dev</code> so Open / Save /
          Compile work.
        </p>
      ) : null}

      {status === "loading" ? (
        <p className="text-sm text-[var(--tf-muted)]">Reading folder…</p>
      ) : null}

      {projectName ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-[var(--tf-border)] px-2 py-1 text-xs hover:bg-[var(--tf-accent)]"
              onClick={() => {
                void refreshTree();
              }}
            >
              <RefreshCw className="size-3" aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-[var(--tf-border)] px-2 py-1 text-xs hover:bg-[var(--tf-accent)]"
              onClick={() => {
                const name = window.prompt("New file path (relative):", "notes.tex");
                if (name) void createFile(name);
              }}
            >
              <FilePlus2 className="size-3" aria-hidden="true" />
              File
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-[var(--tf-border)] px-2 py-1 text-xs hover:bg-[var(--tf-accent)]"
              onClick={() => {
                const name = window.prompt("New folder path (relative):", "chapters");
                if (name) void createFolder(name);
              }}
            >
              <FolderPlus className="size-3" aria-hidden="true" />
              Folder
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-[var(--tf-border)] px-2 py-1 text-xs hover:bg-[var(--tf-accent)] disabled:opacity-40"
              disabled={!openPath}
              onClick={() => {
                if (!openPath) return;
                const next = window.prompt("Rename to:", openPath);
                if (next && next !== openPath) void renameEntry(openPath, next);
              }}
            >
              <Pencil className="size-3" aria-hidden="true" />
              Rename
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-[var(--tf-border)] px-2 py-1 text-xs hover:bg-[var(--tf-accent)] disabled:opacity-40"
              disabled={!openPath}
              onClick={() => {
                if (openPath) void deleteEntry(openPath);
              }}
            >
              <Trash2 className="size-3" aria-hidden="true" />
              Delete
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-[var(--tf-border)] px-2 py-1 text-xs hover:bg-[var(--tf-accent)]"
              title="Delete TeX auxiliary files (keeps PDF)"
              onClick={() => {
                void cleanArtifacts();
              }}
            >
              <Eraser className="size-3" aria-hidden="true" />
              Clean
            </button>
          </div>
          <p className="truncate text-xs font-medium uppercase tracking-wide text-[var(--tf-muted)]">
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
          <OutlinePanel />
        </div>
      ) : (
        <p className="text-sm text-[var(--tf-muted)]">
          Use <strong>Open</strong> or <strong>New</strong> in the toolbar. Prefer an absolute path
          like <code className="text-[var(--tf-text)]">C:\Repo_me\Leaf\tests\fixtures\article</code>
          .
        </p>
      )}
    </Panel>
  );
}
