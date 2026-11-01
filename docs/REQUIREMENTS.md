# Requirements

Milestone 0 does not implement the product requirements below. They are here so later work does not invent a different product. The milestone that implements each item is in [ROADMAP.md](ROADMAP.md).

## Product

A person can:

- open a real local project directory
- edit more than one `.tex` file
- compile with the local TeX installation, including images, bibliographies, and multi-pass builds
- view the PDF
- jump from a diagnostic to the source location
- compile with no time limit imposed by the app
- close the app and reopen the project without losing source

That is the product definition of done. Test it against non-trivial documents when the milestone that owns compilation and preview starts. A one-line fixture is not that test.

The original request described a Windows desktop app. The user accepted a web application instead. The outcomes above still stand. How a browser reaches a local directory and a local TeX process is not decided in Milestone 0.

## Compiler

- Driver: TeX Live's `latexmk`.
- Engines: `pdflatex`, `xelatex`, `lualatex`.
- No custom TeX engine and no app-imposed timeout.
- Arguments are structured values. The page never supplies a shell string.
- The process working directory is the project directory.
- shell-escape is a setting, default off, and the UI warns when it is enabled.
- At most one build per project at a time. The user can cancel it.
- The build captures stdout and stderr, and the log is parsed into diagnostics.
- The build does not block the UI and does not require a network connection.
- SyncTeX comes after compilation is stable, and must not make compilation less reliable.

## Editor and preview

- Editor: Monaco.
- PDF: PDF.js.
- Diagnostics, settings, autosave, and file watching are part of stabilization, not the foundation.

## Quality

- Never overwrite user source without an explicit user action.
- Paths may contain spaces and non-ASCII characters.
- No secrets in the repo, the app, or logs.
- No network is required to edit or compile, once those features exist. Loading the dev server during development is not that network.

## Persistence

Projects stay ordinary directories. TexFlow does not define a project file format and does not use a document database. See [decisions/0002-projects-are-directories.md](decisions/0002-projects-are-directories.md).

## Non-goals

Real-time collaboration, cloud storage, accounts, sharing, subscriptions, AI, bibliography search services, mobile, a proprietary format, a custom TeX engine, and a full explorer, compiler, PDF viewer, SyncTeX, or settings screen in Milestone 0. A desktop shell is not part of Milestone 0.

## Milestone 0

The repository builds, the page is a three-region shell plus a status strip, tooling and CI exist, and these docs match the code. The shell does not open projects or compile documents.
