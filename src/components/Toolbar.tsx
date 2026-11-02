import {
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Save,
  Settings as SettingsIcon,
  Square,
} from "lucide-react";
import { useWorkspace } from "../workspace/useWorkspace";

export function Toolbar() {
  const {
    companionOnline,
    projectName,
    projectPath,
    dirty,
    saving,
    buildState,
    settings,
    texStatus,
    openProject,
    saveOpenFile,
    compile,
    stopCompile,
    updateSettings,
    sidebarCollapsed,
    setSidebarCollapsed,
    setSettingsOpen,
    message,
  } = useWorkspace();

  const saveLabel = saving ? "Saving…" : dirty ? "Unsaved" : "Saved";

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-200">
      <button
        type="button"
        className="rounded p-1.5 hover:bg-zinc-800"
        title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="size-4" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="size-4" aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 hover:bg-zinc-700"
        onClick={() => {
          const path = window.prompt(
            "Absolute project path (leave empty to use the OS folder dialog when available):",
            settings.lastProjectPath || projectPath || "",
          );
          if (path === null) return;
          void openProject(path.trim() || undefined);
        }}
      >
        <FolderOpen className="size-3.5" aria-hidden="true" />
        Open
      </button>

      <div className="min-w-0 flex-1 truncate font-medium">
        {projectName ?? "No project"}
        {projectPath ? (
          <span className="ml-2 font-normal text-zinc-500" title={projectPath}>
            {projectPath}
          </span>
        ) : null}
      </div>

      <span
        className={`rounded px-2 py-1 ${dirty ? "bg-amber-900/50 text-amber-100" : "bg-zinc-800 text-zinc-400"}`}
      >
        {saveLabel}
      </span>

      <button
        type="button"
        className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 hover:bg-zinc-800 disabled:opacity-40"
        disabled={!dirty && !saving}
        onClick={() => {
          void saveOpenFile();
        }}
      >
        <Save className="size-3.5" aria-hidden="true" />
        Save
      </button>

      <label className="flex items-center gap-1 text-zinc-400">
        Engine
        <select
          className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-zinc-100"
          value={settings.engine}
          onChange={(event) =>
            updateSettings({
              engine: event.target.value as AppSettingsEngine,
            })
          }
        >
          <option value="pdflatex">pdflatex</option>
          <option value="xelatex">xelatex</option>
          <option value="lualatex">lualatex</option>
        </select>
      </label>

      {buildState === "running" ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-red-800 bg-red-950 px-2 py-1 text-red-100 hover:bg-red-900"
          onClick={() => {
            void stopCompile();
          }}
        >
          <Square className="size-3.5" aria-hidden="true" />
          Stop
        </button>
      ) : (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-emerald-800 bg-emerald-950 px-2 py-1 text-emerald-100 hover:bg-emerald-900 disabled:opacity-40"
          disabled={!projectPath || !companionOnline}
          onClick={() => {
            void compile();
          }}
        >
          <Play className="size-3.5" aria-hidden="true" />
          Compile
        </button>
      )}

      <span
        className={`rounded px-2 py-1 ${
          companionOnline
            ? texStatus?.ok
              ? "bg-zinc-800 text-zinc-300"
              : "bg-amber-950 text-amber-100"
            : "bg-red-950 text-red-100"
        }`}
        title={texStatus?.installHint}
      >
        {!companionOnline ? "Companion offline" : texStatus?.ok ? "TeX ready" : "TeX missing"}
      </span>

      <button
        type="button"
        className="rounded p-1.5 hover:bg-zinc-800"
        title="Settings"
        onClick={() => setSettingsOpen(true)}
      >
        <SettingsIcon className="size-4" aria-hidden="true" />
      </button>

      {message ? (
        <span className="max-w-56 truncate text-zinc-400" title={message}>
          {message}
        </span>
      ) : null}
    </header>
  );
}

type AppSettingsEngine = "pdflatex" | "xelatex" | "lualatex";
