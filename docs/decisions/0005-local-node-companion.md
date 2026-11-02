# ADR 0005: Local Node companion for filesystem and latexmk

## Status

Accepted

## Context

Milestone 1 opened projects with the File System Access API. That works for reading and writing in Chrome/Edge, but:

1. The browser cannot spawn `latexmk`.
2. A `FileSystemDirectoryHandle` does not expose an absolute OS path, which `latexmk` needs as its working directory.
3. Ian runs Windows from `C:\Repo_me\Leaf` with TeX Live. The setup must stay `npm install` + local processes, not a cloud service.

Options:

| Option                             | Pros                                                                    | Cons                                          |
| ---------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| Revive Tauri                       | Full path + process control in one binary                               | Heavier; ADR 0001 preferred web unless forced |
| Browser-only + paste absolute path | No new process                                                          | Fragile UX; still cannot spawn TeX            |
| Small Node companion on 127.0.0.1  | Same Node toolchain; structured spawn; absolute paths; works on Windows | Extra process to run                          |

## Decision

- Add a **local Node companion** (`companion/`) bound to `127.0.0.1` only.
- The companion owns:
  - opening a project by absolute path (native folder dialog when available, or an explicit path)
  - directory listing, read/write, create/rename/delete
  - detecting TeX Live / `latexmk`
  - spawning `latexmk` with a **structured argument list** (never a shell string from the UI)
  - canceling the one in-flight build per project
  - returning stdout/stderr, exit code, and duration (no app-imposed timeout)
- The Vite UI talks to the companion over HTTP/SSE on localhost. If the companion is down, the UI explains how to start it and does not pretend compile works.
- File System Access remains an optional fallback for browse/edit when the companion is unavailable, but **compile requires the companion**.
- Do not revive Tauri for this milestone.
- shell-escape stays off by default; enabling it is a setting with a visible warning.

## Consequences

- Dev workflow is `npm run dev` (Vite + companion) or `npm run companion` alone.
- Windows users need Node 22+, TeX Live with `latexmk`, and Chrome/Edge for the UI.
- CORS is limited to local Vite origins.
- The companion must reject shell command strings and only allow known engines (`pdflatex`, `xelatex`, `lualatex`) plus `latexmk` / `biber` as latexmk chooses.
- SyncTeX may be requested via latexmk flags when stable; compile must still succeed if SyncTeX data is missing.
