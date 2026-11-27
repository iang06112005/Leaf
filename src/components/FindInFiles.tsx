import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchProjectFiles, type SearchMatch } from "../services/companion";
import { useWorkspace } from "../workspace/useWorkspace";

type FindInFilesProps = {
  open: boolean;
  onClose: () => void;
};

export function FindInFiles({ open, onClose }: FindInFilesProps) {
  const { projectPath, jumpToLine } = useWorkspace();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setMatches([]);
    setTruncated(false);
    setError(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open) return null;

  const runSearch = async () => {
    if (!projectPath) {
      setError("Open a project first.");
      return;
    }
    const q = query.trim();
    if (!q) {
      setMatches([]);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await searchProjectFiles({ path: projectPath, query: q });
      setMatches(result.matches);
      setTruncated(result.truncated);
    } catch (err) {
      setMatches([]);
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 p-4 pt-[10vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Find in files"
        className="flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded border border-[var(--tf-border)] bg-[var(--tf-panel)] shadow-2xl"
      >
        <form
          className="flex items-center gap-2 border-b border-[var(--tf-border)] px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            void runSearch();
          }}
        >
          <Search className="size-4 shrink-0 text-[var(--tf-muted)]" aria-hidden="true" />
          <input
            ref={inputRef}
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--tf-text)] outline-none placeholder:text-[var(--tf-muted)]"
            placeholder="Find in project files…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="submit"
            className="rounded border border-[var(--tf-border)] px-2 py-1 text-xs hover:bg-[var(--tf-accent)] disabled:opacity-40"
            disabled={busy}
          >
            {busy ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            className="rounded px-2 py-1 text-xs text-[var(--tf-muted)] hover:bg-[var(--tf-accent)]"
            onClick={onClose}
          >
            Esc
          </button>
        </form>

        <div className="min-h-0 flex-1 overflow-auto p-2">
          {error ? <p className="px-2 py-1 text-sm text-red-400">{error}</p> : null}
          {!error && matches.length === 0 ? (
            <p className="px-2 py-1 text-sm text-[var(--tf-muted)]">
              {query.trim()
                ? busy
                  ? "Searching…"
                  : "No matches."
                : "Enter a query and press Search (Ctrl/Cmd+Shift+F)."}
            </p>
          ) : null}
          <ul>
            {matches.map((match, i) => (
              <li key={`${match.file}:${match.line}:${i}`}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--tf-accent)]"
                  onClick={() => {
                    jumpToLine(match.line, match.file);
                    onClose();
                  }}
                >
                  <span className="truncate font-mono text-xs text-[var(--tf-muted)]">
                    {match.file}:{match.line}
                  </span>
                  <span className="truncate text-[var(--tf-text)]">{match.preview}</span>
                </button>
              </li>
            ))}
          </ul>
          {truncated ? (
            <p className="px-2 py-1 text-xs text-amber-500">Results truncated at 200 matches.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
