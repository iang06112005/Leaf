import { AlertTriangle, Bug, Info } from "lucide-react";
import { useWorkspace } from "../workspace/useWorkspace";

export function DiagnosticsPanel() {
  const { diagnostics, buildLog, buildState, jumpToDiagnostic } = useWorkspace();

  return (
    <section
      aria-label="Diagnostics"
      className="flex min-h-40 flex-col border-t border-zinc-800 bg-zinc-950 md:min-h-0"
    >
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-zinc-800 px-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
        <Bug className="size-3.5" aria-hidden="true" />
        Diagnostics
        <span className="normal-case text-zinc-500">
          {buildState === "running" ? "building…" : `${diagnostics.length} items`}
        </span>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        <ul className="min-h-0 overflow-auto border-b border-zinc-800 p-2 md:border-r md:border-b-0">
          {diagnostics.length === 0 ? (
            <li className="px-2 py-1 text-sm text-zinc-500">
              No diagnostics yet. Compile to populate.
            </li>
          ) : (
            diagnostics.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-900"
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
                    <span className="block truncate text-zinc-200">{item.message}</span>
                    <span className="block truncate text-xs text-zinc-500">
                      {item.file ?? "(unknown file)"}
                      {item.line ? `:${item.line}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <pre className="min-h-0 overflow-auto p-2 font-mono text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap">
          {buildLog || "Build log will appear here."}
        </pre>
      </div>
    </section>
  );
}
