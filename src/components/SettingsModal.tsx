import { useWorkspace } from "../workspace/useWorkspace";

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, settings, updateSettings, texStatus, refreshTexStatus } =
    useWorkspace();

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-label="Settings"
        className="max-h-[90vh] w-full max-w-xl overflow-auto rounded border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-100 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            type="button"
            className="rounded px-2 py-1 text-zinc-400 hover:bg-zinc-800"
            onClick={() => setSettingsOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-zinc-400">TeX bin directory (optional)</span>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5"
              value={settings.texBinDir}
              placeholder="e.g. C:\\texlive\\2024\\bin\\windows"
              onChange={(event) => updateSettings({ texBinDir: event.target.value })}
              onBlur={() => {
                void refreshTexStatus();
              }}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-400">Default root file</span>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5"
              value={settings.rootFile}
              onChange={(event) => updateSettings({ rootFile: event.target.value })}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-400">Output directory (optional)</span>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5"
              value={settings.outputDir}
              placeholder="build"
              onChange={(event) => updateSettings({ outputDir: event.target.value })}
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.autosave}
              onChange={(event) => updateSettings({ autosave: event.target.checked })}
            />
            Autosave open files
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-400">Autosave delay (ms)</span>
            <input
              type="number"
              min={200}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5"
              value={settings.autosaveDelayMs}
              onChange={(event) =>
                updateSettings({ autosaveDelayMs: Number(event.target.value) || 800 })
              }
            />
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-400">Editor font size</span>
            <input
              type="number"
              min={10}
              max={28}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5"
              value={settings.editorFontSize}
              onChange={(event) =>
                updateSettings({ editorFontSize: Number(event.target.value) || 14 })
              }
            />
          </label>

          <label className="block space-y-1">
            <span className="text-zinc-400">PDF scale</span>
            <input
              type="number"
              min={0.5}
              max={3}
              step={0.1}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5"
              value={settings.pdfScale}
              onChange={(event) => updateSettings({ pdfScale: Number(event.target.value) || 1.25 })}
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.synctex}
              onChange={(event) => updateSettings({ synctex: event.target.checked })}
            />
            Request SyncTeX from latexmk (-synctex=1)
          </label>

          <label className="flex items-start gap-2 rounded border border-amber-900/60 bg-amber-950/30 p-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={settings.shellEscape}
              onChange={(event) => updateSettings({ shellEscape: event.target.checked })}
            />
            <span>
              Enable shell-escape
              <span className="mt-1 block text-amber-100/90">
                Warning: TeX may run external programs. Leave this off unless a package requires it.
              </span>
            </span>
          </label>

          <div className="rounded border border-zinc-800 bg-zinc-950 p-2 text-zinc-400">
            <p className="font-medium text-zinc-300">TeX detection</p>
            {texStatus?.ok ? (
              <p>
                Found latexmk: <code className="text-zinc-200">{texStatus.latexmk}</code>
                {texStatus.version ? ` (${texStatus.version})` : ""}
              </p>
            ) : (
              <p>{texStatus?.installHint ?? "Start the companion to detect TeX Live."}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
