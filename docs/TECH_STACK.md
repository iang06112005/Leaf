# Tech stack

| Piece             | Choice                                                      |
| ----------------- | ----------------------------------------------------------- |
| UI                | React 19, TypeScript, Vite, Tailwind 4, Lucide              |
| Editor            | Monaco (`@monaco-editor/react`)                             |
| PDF               | `pdfjs-dist`                                                |
| Local host        | Node companion (`companion/server.mjs`) on `127.0.0.1:8787` |
| Compiler          | TeX Live `latexmk`                                          |
| Tests             | Vitest + `node:test` + optional compile smoke               |
| Lint/format       | ESLint 10, Prettier                                         |
| Dev orchestration | `concurrently`                                              |

No AI SDKs. No Tauri in this milestone ([ADR 0005](decisions/0005-local-node-companion.md)).
