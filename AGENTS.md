# TexFlow agent guide

Read this file before any other work in the repository.

TexFlow is a local-first LaTeX IDE. A project is an ordinary directory. The **Tauri 2 desktop host (Rust)** owns filesystem I/O and `latexmk`. A Node companion remains for browser/dev fallback. There is no integrated AI agent.

The Git repository may be named Leaf. The product name is TexFlow.

## Read before editing

| If you are about to…                    | Read                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| Change the shell, host, or core modules | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                                        |
| Add a dependency or move a directory    | [docs/TECH_STACK.md](docs/TECH_STACK.md) and [docs/decisions/](docs/decisions/)     |
| Decide whether a feature belongs        | [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) |
| Touch paths, processes, or spawn        | [docs/SECURITY.md](docs/SECURITY.md)                                                |
| Claim tests pass                        | [docs/TESTING.md](docs/TESTING.md), then run them                                   |
| Set up a machine                        | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)                                          |

## Layout

- `src/` — React UI
- `src-tauri/` — Tauri 2 + Rust host (primary)
- `companion/` — localhost Node host (browser/CI fallback)
- `docs/` — product docs and ADRs
- `tests/fixtures/` — ordinary LaTeX folders (`minimal`, `article`)
- `scripts/check.sh` — local CI

## Commands

| Command                | Purpose                          |
| ---------------------- | -------------------------------- |
| `npm run tauri:dev`    | Desktop app (preferred)          |
| `npm run tauri:build`  | Packaged desktop binary          |
| `npm run dev`          | Vite + Node companion (fallback) |
| `npm run companion`    | Node companion only              |
| `npm run build`        | Production UI build              |
| `npm test`             | Vitest + companion unit tests    |
| `npm run test:rust`    | Rust host unit tests             |
| `npm run test:compile` | latexmk smoke on fixtures        |
| `./scripts/check.sh`   | Full local gate                  |

## Principles

1. Read `AGENTS.md` before changing the repository.
2. Read the architecture docs before changing core modules.
3. Do not duplicate functionality. Extend the module that already owns the behavior.
4. Keep modules focused.
5. Do not add a dependency without a concrete current need.
6. Do not add speculative features, empty abstractions, or AI chat/agent features.
7. Add tests for important behavior changes.
8. Run the relevant tests before considering the work done.
9. Update the docs when architecture, tooling, or workflow changes.
10. Never overwrite user project files without an explicit user action (opening a project + Save/autosave the user enabled counts).
11. Never commit secrets, credentials, or local environment files.
12. Do not claim a feature works unless you tested that feature.

## Hard rules

- Frontend never sends shell command strings. Hosts use structured process args.
- One build per project; cancelable; no app-imposed compile timeout.
- shell-escape defaults off and must warn when enabled.
- Node companion (when used) binds `127.0.0.1` only.
- Do not add cloud sync, accounts, collab, or proprietary project formats.

## Report format

End each task with: files changed, decisions, tests and results, limitations, remaining tasks.
