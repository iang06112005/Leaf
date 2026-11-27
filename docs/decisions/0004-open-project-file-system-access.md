# ADR 0004: Open a project with the File System Access API

## Status

Accepted

## Context

Milestone 1 needs to open a local directory from the browser. A project is an ordinary folder. The page must read files for the explorer, Monaco, and PDF.js, and write only when the user saves.

Options considered:

1. **File System Access API** (`showDirectoryPicker`) — Chromium and Edge. Grants a directory handle for recursive listing, reading, and writing with permission.
2. **`<input type="file" webkitdirectory>`** — works in more browsers, but only gives a one-shot file list. No write-back to the original path. Not enough for Save.
3. **Upload to a server** — violates local-first. Rejected.
4. **Desktop host (Tauri)** — deferred. Milestone 0 is a web app. Revisit only if the browser cannot meet a later milestone.

## Decision

- Open a project with `window.showDirectoryPicker()`.
- Keep the `FileSystemDirectoryHandle` in memory for the session. Do not persist it yet.
- Read and write through that handle only. Relative paths use `/` separators and keep the user's Unicode names.
- Write only from an explicit Save action. No autosave in this milestone.
- If the API is missing (Firefox, Safari today), show a clear message and do not fake a broken open flow.
- PDF preview reads `.pdf` files from the same project handle via PDF.js. Compilation still does not exist.

## Consequences

- Chrome and Edge are the supported browsers for opening a project in Milestone 1.
- Closing the tab drops the handle. The user opens the folder again.
- Spaces and non-ASCII path segments are preserved by the browser APIs; do not invent a second encoding.
- A later desktop host, if added, must still treat the project as the same ordinary directory.
