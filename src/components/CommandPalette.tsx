import { useEffect, useMemo, useRef, useState } from "react";
import { insertLatexSnippet } from "../services/editorBridge";
import { isPdfProjectFile, isTextProjectFile } from "../services/fileKinds";
import { flattenFiles } from "../services/filesystem";
import { filterSnippets } from "../services/snippets";
import { useWorkspace } from "../workspace/useWorkspace";

type PaletteItem = {
  id: string;
  group: "action" | "snippet" | "file";
  label: string;
  hint?: string;
  run: () => void | Promise<void>;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const {
    tree,
    compile,
    saveOpenFile,
    saveAll,
    settings,
    updateSettings,
    setSettingsOpen,
    openFile,
    openProjectPicker,
    cleanArtifacts,
  } = useWorkspace();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const actions: PaletteItem[] = (
      [
        {
          id: "compile",
          group: "action" as const,
          label: "Compile",
          hint: "Ctrl/Cmd+Enter",
          run: () => {
            void compile();
          },
        },
        {
          id: "save",
          group: "action" as const,
          label: "Save file",
          hint: "Ctrl/Cmd+S",
          run: () => {
            void saveOpenFile();
          },
        },
        {
          id: "save-all",
          group: "action" as const,
          label: "Save all",
          hint: "Ctrl/Cmd+Shift+S",
          run: () => {
            void saveAll();
          },
        },
        {
          id: "theme",
          group: "action" as const,
          label: settings.theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
          run: () => updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" }),
        },
        {
          id: "compile-on-save",
          group: "action" as const,
          label: settings.compileOnSave ? "Disable compile on save" : "Enable compile on save",
          run: () => updateSettings({ compileOnSave: !settings.compileOnSave }),
        },
        {
          id: "settings",
          group: "action" as const,
          label: "Open settings",
          run: () => setSettingsOpen(true),
        },
        {
          id: "open-project",
          group: "action" as const,
          label: "Open project…",
          run: () => {
            void openProjectPicker();
          },
        },
        {
          id: "clean",
          group: "action" as const,
          label: "Clean auxiliary files",
          run: () => {
            void cleanArtifacts();
          },
        },
      ] satisfies PaletteItem[]
    ).filter((item) => !q || item.label.toLowerCase().includes(q) || item.id.includes(q));

    const snippets = filterSnippets(query).map((snippet) => ({
      id: `snippet:${snippet.id}`,
      group: "snippet" as const,
      label: `Insert ${snippet.label}`,
      hint: `trigger: ${snippet.trigger}`,
      run: () => {
        insertLatexSnippet(snippet.id);
      },
    }));

    const files = flattenFiles(tree)
      .filter((file) => isTextProjectFile(file.path) || isPdfProjectFile(file.path))
      .filter(
        (file) => !q || file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q),
      )
      .slice(0, 50)
      .map((file) => ({
        id: `file:${file.path}`,
        group: "file" as const,
        label: file.path,
        hint: "Jump to file",
        run: () => void openFile(file.path),
      }));

    return [...actions, ...snippets, ...files];
  }, [
    cleanArtifacts,
    compile,
    openFile,
    openProjectPicker,
    query,
    saveAll,
    saveOpenFile,
    setSettingsOpen,
    settings.compileOnSave,
    settings.theme,
    tree,
    updateSettings,
  ]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setIndex((current) => Math.min(Math.max(items.length - 1, 0), current + 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setIndex((current) => Math.max(0, current - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const item = items[index];
        if (!item) return;
        void Promise.resolve(item.run()).finally(onClose);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items, onClose, open]);

  if (!open) return null;

  const groups: { key: PaletteItem["group"]; title: string }[] = [
    { key: "action", title: "Actions" },
    { key: "snippet", title: "Snippets" },
    { key: "file", title: "Files" },
  ];

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 p-4 pt-[12vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded border border-[var(--tf-border)] bg-[var(--tf-panel)] shadow-2xl"
      >
        <input
          ref={inputRef}
          className="w-full border-b border-[var(--tf-border)] bg-transparent px-4 py-3 text-sm text-[var(--tf-text)] outline-none placeholder:text-[var(--tf-muted)]"
          placeholder="Type a command, snippet, or file name…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="max-h-[50vh] overflow-auto py-2">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--tf-muted)]">No matches.</p>
          ) : (
            groups.map((group) => {
              const groupItems = items.filter((item) => item.group === group.key);
              if (groupItems.length === 0) return null;
              return (
                <div key={group.key} className="mb-2">
                  <p className="px-4 py-1 text-[10px] font-medium tracking-wide text-[var(--tf-muted)] uppercase">
                    {group.title}
                  </p>
                  <ul>
                    {groupItems.map((item) => {
                      runningIndex += 1;
                      const itemIndex = runningIndex;
                      const active = itemIndex === index;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm ${
                              active
                                ? "bg-[var(--tf-accent)] text-[var(--tf-text)]"
                                : "text-[var(--tf-text)] hover:bg-[var(--tf-accent)]"
                            }`}
                            onMouseEnter={() => setIndex(itemIndex)}
                            onClick={() => {
                              void Promise.resolve(item.run()).finally(onClose);
                            }}
                          >
                            <span className="truncate">{item.label}</span>
                            {item.hint ? (
                              <span className="shrink-0 text-xs text-[var(--tf-muted)]">
                                {item.hint}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
        <p className="border-t border-[var(--tf-border)] px-4 py-2 text-[11px] text-[var(--tf-muted)]">
          Ctrl/Cmd+K · ↑↓ · Enter · Esc — editor triggers: sec, fig, eq, itz, cite
        </p>
      </div>
    </div>
  );
}
