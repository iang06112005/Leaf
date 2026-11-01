# Architecture

Milestone 0 is a single-page web application. Vite serves React during development and builds static files for production. There is no server, no desktop host, and no project I/O.

```text
index.html
src/main.tsx → App → AppShell
  Sidebar, EditorPane, PreviewPane  (each uses components/ui/Panel)
  StatusBar                         (label from appLabel)
```

## What exists now

The page is four regions and nothing else. From the `md` breakpoint upward they sit in three columns. Below that they stack, and the status strip stays at the bottom of the viewport.

| Region          | Role today                                                                               |
| --------------- | ---------------------------------------------------------------------------------------- |
| Project sidebar | Placeholder. Does not list files.                                                        |
| Editor          | Placeholder. Does not load a document.                                                   |
| Preview         | Placeholder. Does not load a PDF.                                                        |
| Status strip    | Shows a static ready state, "No project", and `TexFlow` plus the `package.json` version. |

The regions share `src/components/ui/Panel.tsx`. There is no editor component, no file tree, and no store. Add a feature directory or a state library when a real feature needs them.

`src/appLabel.ts` is the only shared helper. It reads `package.json` so the status strip does not hard-code a second version.

## What is not a module yet

Do not add these as empty files. Add them when the milestone that needs them starts, with a real interface and tests:

| Future owner           | Responsibility                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open project           | Let the user choose a directory. Remember that choice outside the project tree. The browser mechanism is not chosen yet.                                                                     |
| Filesystem             | Read and write paths inside the opened project. Spaces and non-ASCII must work. Writes only follow an explicit user action.                                                                  |
| Compiler and processes | Spawn `latexmk` with a structured argument list. A page cannot do this alone. One cancelable build per project. Working directory is the project. Capture stdout and stderr. No app timeout. |
| Diagnostics            | Parse the TeX log into locations the editor can use.                                                                                                                                         |
| Settings               | A small local config, separate from project source. shell-escape lives here, default off, and the UI warns.                                                                                  |
| Monaco, PDF.js         | Milestone 1. SyncTeX waits until compilation is stable.                                                                                                                                      |

The compiler boundary is accepted in [decisions/0003-compiler-invocation.md](decisions/0003-compiler-invocation.md) even though no process is spawned yet. That ADR does not choose the process host.

## Persistence

No database. A project is the directory the user opened. App preferences, when they exist, must not be required to open a project and must not be stored by rewriting the user's sources. See [decisions/0002-projects-are-directories.md](decisions/0002-projects-are-directories.md).

## UI boundary

The page exchanges structured data with whatever later owns files and processes. It does not assemble shell command strings. A control that writes a file has to correspond to an explicit user action. Nothing in Milestone 0 touches the filesystem.
