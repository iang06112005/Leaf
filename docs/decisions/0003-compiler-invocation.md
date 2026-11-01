# ADR 0003: Compiler invocation boundary

## Status

Accepted. Not implemented. Milestone 2 owns the implementation.

The page built in Milestone 0 cannot spawn a process. This ADR constrains the host when one exists. It does not choose that host, and it does not require a desktop shell. See [0001-stack-and-repo-layout.md](0001-stack-and-repo-layout.md).

## Context

The compiler has to drive a local TeX Live install without becoming a shell. A frontend that sends a command string, or a host that interpolates UI input into `sh -c`, will mishandle spaces, non-ASCII paths, and quotes, and it will make shell-escape hard to reason about.

Compilation also has to stay out of the UI thread, remain cancelable, and avoid an artificial timeout. SyncTeX is useful and easy to let destabilize the build. It waits.

## Decision

- The host spawns TeX Live tools with a structured argument list.
- The frontend never sends a shell command line.
- `latexmk` is the driver. The engines are `pdflatex`, `xelatex`, and `lualatex`.
- The app does not impose a timeout.
- At most one build runs per project. The user can cancel it.
- The process working directory is the project directory.
- shell-escape defaults off. Enabling it is explicit, and the UI warns.
- stdout and stderr are retained so the log can be parsed into diagnostics.
- SyncTeX is out of scope until a normal multi-pass build is reliable. Adding it must not weaken that path.
- No compiler module is added before there is a real implementation to put in it.

## Consequences

- Milestone 2 starts from this boundary instead of choosing a shell.
- Detecting TeX Live, parsing logs, and showing the PDF are still Milestone 2 work. This ADR does not implement them.
- A setting surface for shell-escape belongs with Milestone 3 settings, and it has to ship with the warning.
