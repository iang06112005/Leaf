# Architecture

TexFlow is a **React UI** plus a **local host** that can open absolute project paths and spawn `latexmk`. The preferred host is **Tauri 2 (Rust)**. A Node companion on `127.0.0.1:8787` remains as a browser/dev fallback ([ADR 0005](decisions/0005-local-node-companion.md), [ADR 0006](decisions/0006-tauri-desktop-host.md)).

```text
React UI (Monaco / PDF.js / Diagnostics / Settings / Palette)
        |
   +----+--------------------+
   | Tauri invoke/events     | HTTP + SSE (optional)
   v                         v
Rust host (src-tauri)     Node companion (companion/)
  FS · TeX detect · latexmk · SyncTeX · search · clean
        |
TeX Live on the machine (latexmk, pdflatex/xelatex/lualatex, biber, synctex)
```

## Runtime pieces

| Piece                       | Role                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `npm run tauri:dev`         | Desktop app (Vite UI + Rust host)                                     |
| `npm run tauri:build`       | Packaged desktop binary / installer                                   |
| `npm run dev`               | Browser UI + Node companion (fallback)                                |
| `src-tauri/`                | Tauri 2 + Rust FS/compile host                                        |
| `companion/server.mjs`      | Localhost-only Node API (browser/CI)                                  |
| `src/workspace/`            | React state for project, tabs, build, theme, recent projects          |
| `src/services/companion.ts` | Host bridge: Tauri invoke when desktop, else HTTP                     |
| Settings in `localStorage`  | TeX bin, engine, autosave, theme, SyncTeX, shell-escape, recent paths |

## Compile contract

Follows [decisions/0003-compiler-invocation.md](decisions/0003-compiler-invocation.md):

- Structured process args (never a shell string from the UI)
- `cwd` = project directory
- One build per project; cancelable; no app timeout
- shell-escape off by default; UI warns when enabled
- PDF preview refreshes only after a successful build (or when the user opens a PDF)

## Persistence

Projects remain ordinary directories. No document database. Autosave writes only the open file the user is editing, into that directory, after they opened the project and (by default) left autosave on.
