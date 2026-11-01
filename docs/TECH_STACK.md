# Tech stack

Exact versions are in `package-lock.json`.

| Piece           | Choice                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| UI              | React 19, TypeScript, Vite                                                                                              |
| Styling         | Tailwind CSS 4, via `@tailwindcss/vite`                                                                                 |
| Icons           | `lucide-react`                                                                                                          |
| Editor          | Monaco via `@monaco-editor/react` and `monaco-editor`                                                                   |
| PDF             | `pdfjs-dist`                                                                                                            |
| Local folders   | File System Access API (`showDirectoryPicker`)                                                                          |
| Tests           | Vitest                                                                                                                  |
| Lint and format | ESLint 10 (flat config) and Prettier                                                                                    |
| Node            | 22 or newer. `.npmrc` sets `legacy-peer-deps` because npm 10 (Node 22) crashes while resolving Vitest's optional peers. |
| License         | MIT                                                                                                                     |

## Left out on purpose

| Omitted                   | Why                                                                    |
| ------------------------- | ---------------------------------------------------------------------- |
| Tauri / Rust desktop host | Web app. Revisit only if the browser cannot reach local TeX later.     |
| LaTeX grammar for Monaco  | No built-in Monaco LaTeX mode here. Sources open as plaintext for now. |
| A document database       | Projects are directories.                                              |
| A local compiler service  | Milestone 2.                                                           |
| Playwright browsers       | Plan in [TESTING.md](TESTING.md).                                      |
| Autosave                  | Milestone 3. Writes are Save only.                                     |

## Version

`package.json` version `0.1.0` is what the status strip shows.
