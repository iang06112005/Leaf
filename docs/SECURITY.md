# Security

TexFlow will edit local files and, later, start local TeX processes. The threat that matters is damaging or leaking the user's project, or turning the page into a shell.

## Current posture

- The Milestone 0 app is a static shell. It has no server, no accounts, no tokens, no telemetry, and no network calls of its own.
- No secret store. Do not commit credentials. `.env` and `.env.*` are gitignored.
- The dev server exists only for development. The production build is static files.
- Nothing reads or writes the user's disk.

## Projects and writes

A project is a directory the user chose. Future file access must:

- accept paths with spaces and non-ASCII characters
- stay inside that directory unless the user explicitly picks another path
- refuse to overwrite source unless the user action is explicit

Autosave counts as a write. It has to be specified, visible, and recoverable. Milestone 0 performs no project writes.

Do not store app preferences by modifying the project. Do not introduce a database of document contents.

## Processes

When the compiler exists, follow [decisions/0003-compiler-invocation.md](decisions/0003-compiler-invocation.md):

- The host spawns TeX tools with a structured argument list.
- The page never sends a shell command line, and the host never joins UI strings into `sh -c`.
- The working directory is the project directory.
- shell-escape defaults off. Turning it on is explicit, and the UI warns.
- The app sets no timeout of its own.
- One build runs per project. The user can cancel it.
- stdout and stderr are captured for diagnostics. Do not log secrets. The app has none.

Do not add a request that runs an arbitrary program or an arbitrary string. A browser page cannot be given a shell to paper over this.

## Dependencies

Add a dependency only for a behavior that exists in the same change. Remove unused ones.

## Network

Editing and compiling must work offline once they exist. Do not add a required network call to either path. Do not add analytics.
