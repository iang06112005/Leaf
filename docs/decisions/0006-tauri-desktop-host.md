# ADR 0006: Tauri 2 desktop host

## Status

Accepted (supersedes the “do not revive Tauri” clause of [ADR 0005](0005-local-node-companion.md) for the primary Windows UX)

## Context

Ian cannot comfortably run the browser UI + Node companion on two ports from `C:\Repo_me\Leaf`. He needs a normal desktop app that opens a real folder, edits in Monaco, previews PDF, and runs `latexmk` without remembering `5173` / `8787`.

ADR 0005 chose a Node companion for speed. That remains useful for web/CI, but the primary product path should be a single desktop process.

## Decision

- Ship **Tauri 2** wrapping the existing React UI.
- Rust owns filesystem CRUD, TeX detection, structured `latexmk` spawn (`cwd` = project, no app-imposed timeout), SyncTeX, search, clean, templates, and OS open.
- The UI calls Tauri `invoke` / events when `__TAURI_INTERNALS__` is present; otherwise it keeps talking to the Node companion over HTTP (dev/browser fallback).
- Projects stay ordinary directories. No AI agent. shell-escape stays off by default.
- Prefer Rust spawn; do not shell out through Node inside the desktop binary.

## Consequences

- Windows workflow: install Node + Rust + WebView2 + TeX Live, then `npm run tauri:dev` (or install the built `.exe` / NSIS installer).
- `npm run dev` still starts Vite + companion for browser debugging.
- Docs and `AGENTS.md` describe both hosts; desktop is the recommended end-user path.
