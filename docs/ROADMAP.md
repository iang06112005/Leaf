# Roadmap

## Milestone 0 — Foundation

Done: Vite/React shell, docs, CI.

## Milestone 1 — Workspace

Done: open project, Monaco, PDF.js preview.

## Milestone 2 / Prism-like loop

Done on the foundation PR:

- Node companion compile host (browser/dev)
- latexmk engines, cancel, streaming log, diagnostics
- Autosave, CRUD files/folders, tree refresh polling
- Settings, toolbar, resizable panels, dark/light themes
- Multi editor tabs, unsaved guards, recent projects
- PDF zoom/fit/pages/search, OS open, SyncTeX forward/inverse
- Image fixture + xelatex compile smoke (skipped in CI when XeTeX missing)
- New project from Article template, compile-on-save, section outline
- Clean aux, build history, cursor Ln/Col, diagnostic filters
- Command palette + LaTeX snippets + jump-to-file
- Hide aux in tree, find-in-files, local bib cite completion, Monarch LaTeX highlighting
- Project-wide outline via \\input/\\include, inverse SyncTeX palette, clean-before-compile
- Reopen last project on boot when the path still exists

## Milestone 3 — Desktop host

- Tauri 2 wraps the React UI; Rust owns FS + latexmk (preferred Windows UX)
- Node companion kept as HTTP fallback for `npm run dev` / CI

## Out of scope

Integrated AI agent, cloud sync, accounts, collab, mobile, proprietary format, custom TeX engine.
