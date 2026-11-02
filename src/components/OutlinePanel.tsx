import { ListTree } from "lucide-react";
import { useMemo } from "react";
import { parseTexOutline } from "../services/outline";
import { useWorkspace } from "../workspace/useWorkspace";

export function OutlinePanel() {
  const { openPath, openContent, jumpToLine } = useWorkspace();
  const outline = useMemo(() => {
    if (!openPath || !/\.tex$/i.test(openPath)) return [];
    return parseTexOutline(openContent);
  }, [openContent, openPath]);

  if (!openPath || !/\.tex$/i.test(openPath)) {
    return (
      <div className="border-t border-[var(--tf-border)] px-2 py-2 text-xs text-[var(--tf-muted)]">
        Open a `.tex` file to see its section outline.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col border-t border-[var(--tf-border)]">
      <header className="flex h-8 shrink-0 items-center gap-1.5 px-2 text-[10px] font-medium uppercase tracking-wide text-[var(--tf-muted)]">
        <ListTree className="size-3" aria-hidden="true" />
        Outline
      </header>
      {outline.length === 0 ? (
        <p className="px-2 pb-2 text-xs text-[var(--tf-muted)]">No sections found.</p>
      ) : (
        <ul className="max-h-40 min-h-0 overflow-auto pb-2">
          {outline.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="block w-full truncate rounded px-2 py-0.5 text-left text-xs text-[var(--tf-text)] hover:bg-[var(--tf-accent)]"
                style={{ paddingLeft: `${0.5 + Math.max(0, entry.level - 2) * 0.65}rem` }}
                title={`${entry.command}: ${entry.title} (L${entry.line})`}
                onClick={() => jumpToLine(entry.line)}
              >
                {entry.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
