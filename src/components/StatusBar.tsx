import { appLabel } from "../appLabel";
import { useWorkspace } from "../workspace/useWorkspace";

export function StatusBar() {
  const {
    companionOnline,
    status,
    projectName,
    openPath,
    dirty,
    message,
    buildState,
    buildResult,
    settings,
    cursorPosition,
  } = useWorkspace();

  const readyLabel = !companionOnline
    ? "Companion offline"
    : status === "loading"
      ? "Opening…"
      : buildState === "running"
        ? "Building…"
        : "Ready";

  const projectLabel = projectName
    ? dirty && openPath
      ? `${projectName} · ${openPath} (dirty)`
      : openPath
        ? `${projectName} · ${openPath}`
        : projectName
    : "No project";

  const buildLabel = buildResult
    ? `last build ${buildResult.ok ? "ok" : "fail"} ${(buildResult.durationMs / 1000).toFixed(1)}s exit ${buildResult.code ?? "?"}`
    : settings.engine;

  const cursorLabel = cursorPosition
    ? `Ln ${cursorPosition.line}, Col ${cursorPosition.column}`
    : "Ln —, Col —";

  return (
    <footer
      aria-label="Status"
      className="flex h-full items-center justify-between gap-3 border-t border-[var(--tf-border)] bg-[var(--tf-panel)] px-3 text-xs text-[var(--tf-muted)]"
    >
      <span className="truncate">{message ?? readyLabel}</span>
      <span className="truncate">{projectLabel}</span>
      <span className="shrink-0 font-mono">{cursorLabel}</span>
      <span className="truncate">{buildLabel}</span>
      <span className="truncate">{appLabel()}</span>
    </footer>
  );
}
