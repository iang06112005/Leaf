import { AlertTriangle, Bug, Info, ScrollText } from "lucide-react";
import { useEffect, useRef } from "react";
import { useWorkspace } from "../workspace/useWorkspace";

export function DiagnosticsPanel() {
  const { diagnostics, buildLog, buildState, bottomTab, setBottomTab, jumpToDiagnostic } =
    useWorkspace();
  const logRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (bottomTab !== "log") return;
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [buildLog, bottomTab]);

  return (
    <section
      aria-label="Diagnostics"
      className="flex min-h-40 flex-col border-t border-[var(--tf-border)] bg-[var(--tf-panel-2)] md:min-h-0"
    >
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-[var(--tf-border)] px-3 text-xs font-medium uppercase tracking-wide text-[var(--tf-muted)]">
        <Bug className="size-3.5" aria-hidden="true" />
        <button
          type="button"
          className={`rounded px-2 py-0.5 normal-case ${bottomTab === "problems" ? "bg-[var(--tf-accent)] text-[var(--tf-text)]" : ""}`}
          onClick={() => setBottomTab("problems")}
        >
          Problems ({diagnostics.length})
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 normal-case ${bottomTab === "log" ? "bg-[var(--tf-accent)] text-[var(--tf-text)]" : ""}`}
          onClick={() => setBottomTab("log")}
        >
          <ScrollText className="size-3.5" aria-hidden="true" />
          Log {buildState === "running" ? "(building…)" : ""}
        </button>
      </header>

      {bottomTab === "problems" ? (
        <ul className="min-h-0 flex-1 overflow-auto p-2">
          {diagnostics.length === 0 ? (
            <li className="px-2 py-1 text-sm text-[var(--tf-muted)]">
              No diagnostics yet. Compile to populate. Full stdout/stderr is in the Log tab.
            </li>
          ) : (
            diagnostics.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--tf-accent)]"
                  onClick={() => jumpToDiagnostic(item)}
                >
                  {item.severity === "error" ? (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                  ) : item.severity === "warning" ? (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                  ) : (
                    <Info className="mt-0.5 size-3.5 shrink-0 text-sky-400" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate">{item.message}</span>
                    <span className="block truncate text-xs text-[var(--tf-muted)]">
                      {item.file ?? "(unknown file)"}
                      {item.line ? `:${item.line}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <pre
          ref={logRef}
          className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[11px] leading-relaxed text-[var(--tf-muted)] whitespace-pre-wrap"
        >
          {buildLog || "Build log (stdout/stderr) will appear here."}
        </pre>
      )}
    </section>
  );
}
