import { appLabel } from "../appLabel";
import { useWorkspace } from "../workspace/useWorkspace";

export function StatusBar() {
  const { status, projectName, openPath, dirty, message } = useWorkspace();

  const readyLabel =
    status === "loading" ? "Opening…" : status === "unsupported" ? "Unsupported browser" : "Ready";

  const projectLabel = projectName
    ? dirty && openPath
      ? `${projectName} · ${openPath} (unsaved)`
      : openPath
        ? `${projectName} · ${openPath}`
        : projectName
    : "No project";

  return (
    <footer
      aria-label="Status"
      className="flex h-full items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-400"
    >
      <span className="truncate">{message ?? readyLabel}</span>
      <span className="truncate">{projectLabel}</span>
      <span className="truncate">{appLabel()}</span>
    </footer>
  );
}
