# ADR 0002: Projects are ordinary directories

## Status

Accepted

## Context

Overleaf stores a project in a service. TexFlow is the local alternative. The requirements forbid a proprietary format, accounts, and cloud storage. A document database would give the app a second copy of the user's source and a new way to lose or overwrite it.

Milestone 0 does not open projects. The decision still needs to be fixed before anyone adds a `.texflow` manifest or a SQLite file "for later".

## Decision

- A project is the directory the user opens. TexFlow does not define a project file format.
- There is no document database.
- Application preferences, when they exist, live outside the project and are not required to open it.
- The sample at `tests/fixtures/minimal/main.tex` is a normal LaTeX file. It is not a schema.
- Milestone 0 does not read or write project directories.

## Consequences

- File access has to tolerate spaces and non-ASCII paths, because real directories contain both.
- There is nothing to migrate.
- Do not add SQLite, IndexedDB, or a hidden project manifest as a convenience.
- Remembering the last opened path is an app preference, not a file inside the project. It is not implemented yet.
