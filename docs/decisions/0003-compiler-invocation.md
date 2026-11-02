# ADR 0003: Compiler invocation boundary

## Status

Accepted. Implemented by the local Node companion ([0005-local-node-companion.md](0005-local-node-companion.md)).

## Context

The compiler has to drive a local TeX Live install without becoming a shell. A frontend that sends a command string, or a host that interpolates UI input into `sh -c`, will mishandle spaces, non-ASCII paths, and quotes, and it will make shell-escape hard to reason about.

Compilation also has to stay out of the UI thread, remain cancelable, and avoid an artificial timeout.

## Decision

- The companion spawns TeX Live tools with a structured argument list (`spawn(file, args, { shell: false })`).
- The frontend never sends a shell command line.
- `latexmk` is the driver. The engines are `pdflatex`, `xelatex`, and `lualatex`.
- The app does not impose a timeout.
- At most one build runs per project. The user can cancel it.
- The process working directory is the absolute project directory.
- shell-escape defaults off. Enabling it is explicit, and the UI warns.
- stdout and stderr are retained so the log can be parsed into diagnostics.
- SyncTeX is requested via latexmk (`-synctex=1`) when enabled in settings. Fancy editor↔PDF sync may be incomplete; it must not break compile.
- Output directory is configurable; default is the project root (latexmk default) unless the user sets one.

## Consequences

- Missing TeX is a settings/detection problem, not a silent failure.
- BibTeX/Biber and multi-pass are latexmk's job when the document needs them.
