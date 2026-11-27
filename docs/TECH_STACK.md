# Tech stack

| Piece             | Choice                                                             |
| ----------------- | ------------------------------------------------------------------ |
| UI                | React 19, TypeScript, Vite, Tailwind 4, Lucide                     |
| Editor            | Monaco (`@monaco-editor/react`)                                    |
| PDF               | `pdfjs-dist`                                                       |
| Desktop host      | Tauri 2 + Rust (`src-tauri/`) — primary for Windows                |
| Browser fallback  | Node companion (`companion/server.mjs`) on `127.0.0.1:8787`        |
| Compiler          | TeX Live `latexmk`                                                 |
| Tests             | Vitest + `node:test` + `cargo test --lib` + optional compile smoke |
| Lint/format       | ESLint 10, Prettier                                                |
| Dev orchestration | `concurrently` (browser mode); `tauri dev` (desktop)               |

No AI SDKs. Desktop host decision: [ADR 0006](decisions/0006-tauri-desktop-host.md).
