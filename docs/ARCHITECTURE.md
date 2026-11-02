# Architecture

TexFlow is a browser UI plus a **local Node companion** on `127.0.0.1:8787`. The page cannot spawn `latexmk` or learn an absolute folder path from the File System Access API alone. The companion owns project I/O and compilation. See [decisions/0005-local-node-companion.md](decisions/0005-local-node-companion.md).

```text
Vite UI (127.0.0.1:5173)
  Toolbar / Sidebar / Monaco / PDF.js / Diagnostics / Settings
        |  HTTP + SSE
Node companion (127.0.0.1:8787)
  filesystem CRUD · TeX detect · latexmk spawn · cancel · logs
  OS PDF open · SyncTeX forward/inverse · folder pick
        |
TeX Live on the machine (latexmk, pdflatex/xelatex/lualatex, biber, synctex)
```

## Runtime pieces

| Piece                         | Role                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                 | Starts Vite and the companion together                                |
| `companion/server.mjs`        | Localhost-only API                                                    |
| `src/workspace/`              | React state for project, tabs, build, theme, recent projects          |
| `src/services/diagnostics.ts` | Parse latexmk/TeX logs into clickable items                           |
| Settings in `localStorage`    | TeX bin, engine, autosave, theme, SyncTeX, shell-escape, recent paths |

## Compile contract

Follows [decisions/0003-compiler-invocation.md](decisions/0003-compiler-invocation.md):

- Structured `spawn(latexmk, args, { shell: false, cwd: projectPath })`
- One build per project; cancelable; no app timeout
- shell-escape off by default; UI warns when enabled
- PDF preview refreshes only after a successful build (or when the user opens a PDF)

## Persistence

Projects remain ordinary directories. No document database. Autosave writes only the open file the user is editing, into that directory, after they opened the project and (by default) left autosave on.
