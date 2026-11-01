# TexFlow agent guide

Read this file before any other work in the repository.

TexFlow is a local-first LaTeX IDE. A project is an ordinary directory of files. The app should eventually edit those files and compile them with the TeX distribution already installed on the machine. Milestone 0 only provides the repository, a browser shell, and the tooling around them.

The Git repository may be named Leaf. The product name is TexFlow. Do not rename either unless asked.

## Read before editing

| If you are about to…                                    | Read                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Change the shell or a core module                       | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                                                                 |
| Add a dependency or move a directory                    | [docs/TECH_STACK.md](docs/TECH_STACK.md) and [docs/decisions/](docs/decisions/0001-stack-and-repo-layout.md) |
| Decide whether a feature belongs in this change         | [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)                          |
| Touch paths, processes, or anything that runs a command | [docs/SECURITY.md](docs/SECURITY.md)                                                                         |
| Claim that tests pass                                   | [docs/TESTING.md](docs/TESTING.md), then run them                                                            |
| Set up a machine                                        | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)                                                                   |

## Layout

The repository root is the application. Do not create a nested `texflow/` project folder.

- `src/` — React UI. `src/components/` is the shell. `src/components/ui/Panel.tsx` is the shared region frame.
- `docs/` — product and engineering docs. `docs/decisions/` holds ADRs.
- `tests/fixtures/` — ordinary files for later tests. Not a project format.
- `scripts/check.sh` — local CI.
- `.github/workflows/ci.yml` — format, lint, typecheck, unit tests, and the production build.

Create a directory when it holds real code. Do not add empty modules for the compiler, filesystem, projects, processes, diagnostics, settings, Monaco, or PDF.js. Do not add a desktop host unless a later decision says so.

## Scope right now

Milestone 0 is the web foundation. The page is a placeholder: project sidebar, editor, preview, and a status strip. It does not open files.

Do not implement, in this milestone or "while you are here":

- opening, reading, or writing project files
- Monaco, PDF.js, or a diagnostics panel
- TeX detection, latexmk, log parsing, or SyncTeX
- settings, autosave, or file watching
- accounts, cloud sync, collaboration, sharing, subscriptions, or AI
- a desktop shell or a background service

Later milestones are specified in [docs/ROADMAP.md](docs/ROADMAP.md) so the boundaries stay stable. Implement only the milestone you were asked for.

## Commands

From the repository root, after `npm install`:

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Dev server at <http://127.0.0.1:5173> |
| `npm run build`        | Typecheck and write `dist/`           |
| `npm test`             | Vitest                                |
| `npm run lint`         | ESLint                                |
| `npm run typecheck`    | `tsc --noEmit`                        |
| `npm run format:check` | Prettier                              |
| `./scripts/check.sh`   | All of the above                      |

The version shown in the status strip comes from `package.json`.

## Principles

1. Read `AGENTS.md` before changing the repository.
2. Read the architecture docs before changing core modules.
3. Do not duplicate functionality. Extend the module that already owns the behavior.
4. Keep modules focused.
5. Do not add a dependency without a concrete current need.
6. Do not add speculative features, empty abstractions, or controls that pretend to work.
7. Add tests for important behavior changes.
8. Run the relevant tests before considering the work done.
9. Update the docs when architecture, tooling, or workflow changes.
10. Never overwrite user project files without an explicit user action.
11. Never commit secrets, credentials, or local environment files.
12. Do not claim a feature works unless you tested that feature.

## Decisions

A substantial technical decision goes in `docs/decisions/` as a numbered ADR before other work depends on it. Update the ADR if the decision changes. The accepted decisions so far are the web stack and repository layout, projects as ordinary directories, and the compiler invocation boundary for whenever a local process exists.

## Hard rules

- A project is the directory the user opened. Do not invent a project database or a proprietary format.
- Do not write into that directory except for an explicit user action. Autosave, when it exists, has to be that action and has to be visible.
- Paths may contain spaces and non-ASCII characters. Handle both.
- Compiler arguments, when they exist, are a structured list. Never send a shell command string from the page to a shell.
- shell-escape stays off unless the user turns it on, and the UI must warn when it is on.
- The app does not impose a compilation timeout.
- One build per project, and the user can cancel it. Compilation must not block the UI.
- Editing and compiling must not require a network connection. The dev server is only for development.
- Do not commit `node_modules/` or `dist/`.

## Report format

End each task with:

- **Files changed** — path and what changed.
- **Decisions** — include ADR links when the decision is substantial.
- **Tests and results** — the commands you ran and what actually happened.
- **Limitations** — what you did not run or could not prove.
- **Remaining tasks** — the next concrete work.
