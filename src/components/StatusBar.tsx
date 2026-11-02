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

  return (
    <footer
      aria-label="Status"
      className="flex h-full items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-400"
    >
      <span className="truncate">{message ?? readyLabel}</span>
      <span className="truncate">{projectLabel}</span>
      <span className="truncate">{buildLabel}</span>
      <span className="truncate">{appLabel()}</span>
    </footer>
  );
}
