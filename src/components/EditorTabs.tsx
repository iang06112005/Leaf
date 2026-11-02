import { X } from "lucide-react";
import { useWorkspace } from "../workspace/useWorkspace";

export function EditorTabs() {
  const { tabs, openPath, setActiveTab, closeTab } = useWorkspace();
  if (tabs.length === 0) return null;

  return (
    <div className="flex min-h-9 shrink-0 items-end gap-1 overflow-x-auto border-b border-[var(--tf-border)] bg-[var(--tf-panel)] px-1">
      {tabs.map((tab) => {
        const dirty = tab.content !== tab.savedContent;
        const active = tab.path === openPath;
        return (
          <div
            key={tab.path}
            className={`group flex max-w-56 items-center gap-1 rounded-t border border-b-0 px-2 py-1.5 text-xs ${
              active
                ? "border-[var(--tf-border)] bg-[var(--tf-panel-2)] text-[var(--tf-text)]"
                : "border-transparent text-[var(--tf-muted)] hover:bg-[var(--tf-accent)]"
            }`}
          >
            <button
              type="button"
              className="truncate"
              title={tab.path}
              onClick={() => setActiveTab(tab.path)}
            >
              {tab.path.split("/").pop()}
              {dirty ? " •" : ""}
            </button>
            <button
              type="button"
              className="rounded p-0.5 opacity-60 hover:bg-[var(--tf-accent)] hover:opacity-100"
              title={`Close ${tab.path}`}
              onClick={() => {
                void closeTab(tab.path);
              }}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
