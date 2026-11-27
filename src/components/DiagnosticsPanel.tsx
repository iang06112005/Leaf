import { AlertTriangle, Bug, History, Info, ScrollText } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useWorkspace } from "../workspace/useWorkspace";
import type { DiagnosticFilter } from "../workspace/workspace-context";

export function DiagnosticsPanel() {
  const {
    diagnostics,
    diagnosticFilter,
    setDiagnosticFilter,
    buildLog,
    buildState,
    buildHistory,
    bottomTab,
    setBottomTab,
    jumpToDiagnostic,
    clearBuildHistory,
  } = useWorkspace();
  const logRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (bottomTab !== "log") return;
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [buildLog, bottomTab]);

  const filtered = useMemo(() => {
    if (diagnosticFilter === "errors") {
      return diagnostics.filter((item) => item.severity === "error");
    }
    if (diagnosticFilter === "warnings") {
      return diagnostics.filter((item) => item.severity === "warning" || item.severity === "info");
    }
    return diagnostics;
  }, [diagnosticFilter, diagnostics]);

  const errorCount = diagnostics.filter((item) => item.severity === "error").length;
  const warningCount = diagnostics.length - errorCount;

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
        <button
          type="button"
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 normal-case ${bottomTab === "history" ? "bg-[var(--tf-accent)] text-[var(--tf-text)]" : ""}`}
          onClick={() => setBottomTab("history")}
        >
          <History className="size-3.5" aria-hidden="true" />
          History ({buildHistory.length})
        </button>

        {bottomTab === "problems" ? (
          <div className="ml-auto flex items-center gap-1 normal-case">
            {(
              [
                ["all", `All (${diagnostics.length})`],
                ["errors", `Errors (${errorCount})`],
                ["warnings", `Warnings (${warningCount})`],
              ] as [DiagnosticFilter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`rounded px-2 py-0.5 ${diagnosticFilter === value ? "bg-[var(--tf-accent)] text-[var(--tf-text)]" : ""}`}
                onClick={() => setDiagnosticFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {bottomTab === "problems" ? (
        <ul className="min-h-0 flex-1 overflow-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-2 py-1 text-sm text-[var(--tf-muted)]">
              No diagnostics for this filter. Compile to populate. Full stdout/stderr is in the Log
              tab.
            </li>
          ) : (
            filtered.map((item) => (
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
      ) : bottomTab === "log" ? (
        <pre
          ref={logRef}
          className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[11px] leading-relaxed text-[var(--tf-muted)] whitespace-pre-wrap"
        >
          {buildLog || "Build log (stdout/stderr) will appear here."}
        </pre>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-2">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              className="rounded border border-[var(--tf-border)] px-2 py-0.5 text-xs hover:bg-[var(--tf-accent)] disabled:opacity-40"
              disabled={buildHistory.length === 0}
              onClick={() => clearBuildHistory()}
            >
              Clear history
            </button>
          </div>
          {buildHistory.length === 0 ? (
            <p className="px-2 text-sm text-[var(--tf-muted)]">
              No builds in this session yet. History is kept in sessionStorage for this browser tab.
            </p>
          ) : (
            <ul className="space-y-1">
              {buildHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[var(--tf-accent)]"
                >
                  <span
                    className={
                      entry.ok
                        ? "text-emerald-500"
                        : entry.cancelled
                          ? "text-amber-500"
                          : "text-red-400"
                    }
                  >
                    {entry.ok ? "ok" : entry.cancelled ? "cancelled" : "fail"}
                  </span>
                  <span className="text-[var(--tf-muted)]">
                    {new Date(entry.at).toLocaleTimeString()}
                  </span>
                  <span>{entry.engine}</span>
                  <span className="truncate text-[var(--tf-muted)]">{entry.rootFile}</span>
                  <span className="ml-auto text-[var(--tf-muted)]">
                    {(entry.durationMs / 1000).toFixed(1)}s
                    {entry.code != null ? ` · exit ${entry.code}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
