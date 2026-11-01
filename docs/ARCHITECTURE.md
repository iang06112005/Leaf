# Architecture

TexFlow Milestone 1 is a single-page web application. Vite serves React during development and builds static files for production. There is no server and no desktop host. Project files are opened through the browser File System Access API.

```text
index.html
src/main.tsx → App → WorkspaceProvider → AppShell
  Sidebar (Open folder, FileTree)
  EditorPane (Monaco + Save)
  PreviewPane (PDF.js)
  StatusBar
src/services/filesystem.ts   directory tree, read, write
src/services/fileKinds.ts    text vs pdf vs monaco language
src/services/paths.ts        relative path helpers
```

## What exists now

From the `md` breakpoint upward the shell is three columns plus a status strip. Below that the regions stack.

| Region          | Role                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Project sidebar | Open a local folder, list its tree, refresh. Click a text file or a PDF.                                      |
| Editor          | Monaco. Loads text files (`.tex`, `.bib`, `.cls`, …). Save is an explicit button.                             |
| Preview         | PDF.js. Renders page 1 of a project `.pdf` the user opened or that was auto-picked (`main.pdf` when present). |
| Status strip    | Ready / messages, project and open path, app version.                                                         |

Writes go only through Save. Autosave is Milestone 3. Compilation does not exist yet.

Opening a project uses `showDirectoryPicker()` with `readwrite` mode. The directory handle stays in memory for the session. See [decisions/0004-open-project-file-system-access.md](decisions/0004-open-project-file-system-access.md).

## What is not a module yet

| Future owner           | Responsibility                                                                |
| ---------------------- | ----------------------------------------------------------------------------- |
| Compiler and processes | Spawn `latexmk` with a structured argument list. A page cannot do this alone. |
| Diagnostics            | Parse the TeX log into locations the editor can use.                          |
| Settings               | Local config outside the project. shell-escape lives here.                    |
| Autosave / watch       | Explicit, visible write and file watching. Milestone 3.                       |
| SyncTeX                | After compilation is stable.                                                  |

The compiler boundary is [decisions/0003-compiler-invocation.md](decisions/0003-compiler-invocation.md).

## Persistence

No database. A project is the directory the user opened. See [decisions/0002-projects-are-directories.md](decisions/0002-projects-are-directories.md).

## UI boundary

The page never builds shell command strings. A control that writes a file must be an explicit user action. Save is that action today.
