# Roadmap

Implement only the milestone you were asked for. Later sections exist so the boundaries stay stable.

## Milestone 0 — Foundation

This repository.

- React, TypeScript, and Vite at the repository root.
- A page: project sidebar, editor, preview, and a status strip. Placeholders only.
- Formatter, linter, unit tests, and CI.
- Docs, license, and ADRs.

No project open, no editor engine, no PDF, no compiler, no desktop shell.

## Milestone 1 — Workspace

- Shell behavior beyond the placeholder.
- Project explorer.
- Open a local project directory from the browser. Choose the mechanism in an ADR first.
- Monaco editor.
- PDF.js viewer.

Still no compilation.

## Milestone 2 — Compiler

- Detect TeX Live.
- A compiler interface that follows [decisions/0003-compiler-invocation.md](decisions/0003-compiler-invocation.md).
- The process host is a separate decision. A static page cannot spawn `latexmk`.
- `latexmk`, with `pdflatex`, `xelatex`, and `lualatex`.
- Captured logs, build status, and diagnostics.
- Show the PDF that the build produced.
- Run against real projects, including images, bibliographies, and multi-pass builds. The trivial fixture in `tests/fixtures/` is not enough for this milestone.

## Milestone 3 — Stabilize

- Autosave that is an explicit, visible write.
- File watching.
- Navigation from a diagnostic to the source.
- Settings, including shell-escape defaulting off and warned when enabled.
- Packaging or hosting for the web app.
- Regression coverage against non-trivial documents.
- Docs that match the finished loop.

## Out of the MVP

Real-time collaboration, cloud storage, accounts, sharing, subscriptions, AI, bibliography search, mobile, a proprietary project format, and a custom TeX engine. SyncTeX is after compilation is stable. A desktop wrapper is not required unless a later decision says the browser cannot reach local TeX.
