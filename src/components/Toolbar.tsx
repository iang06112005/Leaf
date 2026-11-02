import {
  Command,
  FilePlus,
  FolderOpen,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Save,
  Settings as SettingsIcon,
  Square,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useWorkspace } from "../workspace/useWorkspace";

type ToolbarProps = {
  onOpenPalette?: () => void;
};

export function Toolbar({ onOpenPalette }: ToolbarProps) {
  const {
    companionOnline,
    projectName,
    projectPath,
    dirty,
    anyDirty,
    saving,
    buildState,
    buildStartedAt,
    buildResult,
    settings,
    texStatus,
    openProjectPicker,
    openRecent,
    newProjectFromTemplate,
    saveOpenFile,
    saveAll,
    compile,
    stopCompile,
    updateSettings,
    sidebarCollapsed,
    setSidebarCollapsed,
    setSettingsOpen,
    message,
  } = useWorkspace();

  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    if (buildState !== "running" || !buildStartedAt) {
      setElapsedMs(0);
      return;
    }
    const id = window.setInterval(() => setElapsedMs(Date.now() - buildStartedAt), 200);
    return () => window.clearInterval(id);
  }, [buildState, buildStartedAt]);

  const saveLabel = saving ? "Saving…" : anyDirty ? "Unsaved" : "Saved";
  const durationLabel =
    buildState === "running"
      ? `${(elapsedMs / 1000).toFixed(1)}s`
      : buildResult
        ? `${(buildResult.durationMs / 1000).toFixed(1)}s`
        : null;

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--tf-border)] bg-[var(--tf-panel)] px-2 text-xs text-[var(--tf-text)]">
      <button
        type="button"
        className="rounded p-1.5 hover:bg-[var(--tf-accent)]"
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
        className="inline-flex items-center gap-1.5 rounded border border-[var(--tf-border)] bg-[var(--tf-panel-2)] px-2 py-1 hover:bg-[var(--tf-accent)]"
        onClick={() => {
          void openProjectPicker();
        }}
      >
        <FolderOpen className="size-3.5" aria-hidden="true" />
        Open
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded border border-[var(--tf-border)] bg-[var(--tf-panel-2)] px-2 py-1 hover:bg-[var(--tf-accent)]"
        title="Create ordinary folder from Article template"
        onClick={() => {
          void newProjectFromTemplate();
        }}
      >
        <FilePlus className="size-3.5" aria-hidden="true" />
        New
      </button>

      {settings.recentProjects.length > 0 ? (
        <label className="flex items-center gap-1 text-[var(--tf-muted)]">
          Recent
          <select
            className="max-w-48 rounded border border-[var(--tf-border)] bg-[var(--tf-panel-2)] px-1.5 py-1 text-[var(--tf-text)]"
            value=""
            onChange={(event) => {
              const value = event.target.value;
              if (value) void openRecent(value);
              event.target.value = "";
            }}
          >
            <option value="">Select…</option>
            {settings.recentProjects.map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="min-w-0 flex-1 truncate font-medium">
        {projectName ?? "No project"}
        {projectPath ? (
          <span className="ml-2 font-normal text-[var(--tf-muted)]" title={projectPath}>
            {projectPath}
          </span>
        ) : null}
      </div>

      <span
        className={`rounded px-2 py-1 ${
          dirty || anyDirty
            ? "bg-amber-900/40 text-amber-100"
            : "bg-[var(--tf-accent)] text-[var(--tf-muted)]"
        }`}
      >
        {saveLabel}
      </span>

      <button
        type="button"
        className="inline-flex items-center gap-1 rounded border border-[var(--tf-border)] px-2 py-1 hover:bg-[var(--tf-accent)] disabled:opacity-40"
        disabled={!dirty && !saving}
        title="Save (Ctrl/Cmd+S)"
        onClick={() => {
          void saveOpenFile();
        }}
      >
        <Save className="size-3.5" aria-hidden="true" />
        Save
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded border border-[var(--tf-border)] px-2 py-1 hover:bg-[var(--tf-accent)] disabled:opacity-40"
        disabled={!anyDirty}
        onClick={() => {
          void saveAll();
        }}
      >
        Save all
      </button>

      <label className="flex items-center gap-1 text-[var(--tf-muted)]">
        Engine
        <select
          className="rounded border border-[var(--tf-border)] bg-[var(--tf-panel-2)] px-1.5 py-1 text-[var(--tf-text)]"
          value={settings.engine}
          onChange={(event) =>
            updateSettings({
              engine: event.target.value as "pdflatex" | "xelatex" | "lualatex",
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
          title="Compile (Ctrl/Cmd+Enter)"
          onClick={() => {
            void compile();
          }}
        >
          <Play className="size-3.5" aria-hidden="true" />
          Compile
        </button>
      )}

      <span className="rounded bg-[var(--tf-accent)] px-2 py-1 text-[var(--tf-muted)]">
        {buildState}
        {durationLabel ? ` · ${durationLabel}` : ""}
      </span>

      <span
        className={`rounded px-2 py-1 ${
          companionOnline
            ? texStatus?.ok
              ? "bg-[var(--tf-accent)] text-[var(--tf-muted)]"
              : "bg-amber-950 text-amber-100"
            : "bg-red-950 text-red-100"
        }`}
        title={texStatus?.installHint}
      >
        {!companionOnline ? "Companion offline" : texStatus?.ok ? "TeX ready" : "TeX missing"}
      </span>

      <button
        type="button"
        className="rounded p-1.5 hover:bg-[var(--tf-accent)]"
        title="Command palette (Ctrl/Cmd+K)"
        onClick={() => onOpenPalette?.()}
      >
        <Command className="size-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        className="rounded p-1.5 hover:bg-[var(--tf-accent)]"
        title="Toggle theme"
        onClick={() => updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
      >
        {settings.theme === "dark" ? (
          <Sun className="size-4" aria-hidden="true" />
        ) : (
          <Moon className="size-4" aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        className="rounded p-1.5 hover:bg-[var(--tf-accent)]"
        title="Settings"
        onClick={() => setSettingsOpen(true)}
      >
        <SettingsIcon className="size-4" aria-hidden="true" />
      </button>

      {message ? (
        <span className="max-w-56 truncate text-[var(--tf-muted)]" title={message}>
          {message}
        </span>
      ) : null}
    </header>
  );
}
