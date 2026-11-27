# Changelog

## [Unreleased]

### Added

- Tauri 2 desktop host (Rust) wrapping the React UI — preferred Windows path (`npm run tauri:dev` / `tauri:build`).
- Local Node companion for project I/O and `latexmk` (localhost only; browser/dev fallback).
- Compile toolbar: engine select, Compile/Stop, TeX status, settings.
- Autosave, dirty indicator, create/rename/delete files and folders.
- Diagnostics panel with click-to-source and build log.
- PDF.js continuous preview with zoom, fit, page jump, search; refresh on successful compile.
- Settings for TeX bin, root file, output dir, autosave, font size, PDF scale, SyncTeX flag, shell-escape warning.
- Non-trivial fixture `tests/fixtures/article` and `npm run test:compile`.
- Milestone 1 workspace and Milestone 0 foundation.
