import { ListTree } from "lucide-react";
import { useEffect, useState } from "react";
import { readText } from "../services/companion";
import { buildProjectOutline, type OutlineEntry } from "../services/outline";
import { useWorkspace } from "../workspace/useWorkspace";

export function OutlinePanel() {
  const { projectPath, settings, tabs, jumpToLine, openPath } = useWorkspace();
  const [outline, setOutline] = useState<OutlineEntry[]>([]);
  const [busy, setBusy] = useState(false);

  const rootFile = settings.rootFile || openPath || "main.tex";

  useEffect(() => {
    if (!projectPath) {
      setOutline([]);
      return;
    }
    let cancelled = false;
    setBusy(true);
    const byPath = new Map(tabs.map((tab) => [tab.path, tab.content] as const));
    void (async () => {
      try {
        const entries = await buildProjectOutline(rootFile, async (path) => {
          const open = byPath.get(path);
          if (open != null) return open;
          const result = await readText(projectPath, path);
          return result.content;
        });
        if (!cancelled) setOutline(entries);
      } catch {
        if (!cancelled) setOutline([]);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openPath, projectPath, rootFile, tabs]);

  if (!projectPath) {
    return (
      <div className="border-t border-[var(--tf-border)] px-2 py-2 text-xs text-[var(--tf-muted)]">
        Open a project to see its section outline.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col border-t border-[var(--tf-border)]">
      <header className="flex h-8 shrink-0 items-center gap-1.5 px-2 text-[10px] font-medium uppercase tracking-wide text-[var(--tf-muted)]">
        <ListTree className="size-3" aria-hidden="true" />
        Outline
        <span className="normal-case opacity-70">({rootFile})</span>
      </header>
      {busy && outline.length === 0 ? (
        <p className="px-2 pb-2 text-xs text-[var(--tf-muted)]">Scanning…</p>
      ) : outline.length === 0 ? (
        <p className="px-2 pb-2 text-xs text-[var(--tf-muted)]">No sections found.</p>
      ) : (
        <ul className="max-h-48 min-h-0 overflow-auto pb-2">
          {outline.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="block w-full truncate rounded px-2 py-0.5 text-left text-xs text-[var(--tf-text)] hover:bg-[var(--tf-accent)]"
                style={{ paddingLeft: `${0.5 + Math.max(0, entry.level - 2) * 0.65}rem` }}
                title={`${entry.path}:${entry.line} · ${entry.command}`}
                onClick={() => jumpToLine(entry.line, entry.path)}
              >
                <span className="text-[var(--tf-muted)]">
                  {entry.path === rootFile ? "" : `${entry.path.split("/").pop()} · `}
                </span>
                {entry.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
