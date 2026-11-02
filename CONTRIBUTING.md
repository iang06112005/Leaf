# Contributing

Read [AGENTS.md](AGENTS.md) before changing the repository. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing the shell or anything that will own files or processes.

## Setup

Follow [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Run `./scripts/check.sh` before considering a change done. That script is the local copy of CI.

## Scope

Implement the milestone you were asked for. Milestone 0 is the web foundation only. Do not add the editor, PDF viewer, compiler, or project file access ahead of [docs/ROADMAP.md](docs/ROADMAP.md).

## Changes

- Keep a behavior in one module. Do not copy it into a second one.
- Add a dependency only when current code needs it.
- Cover important behavior with a test, and run the tests.
- Update the docs when architecture, tooling, or workflow changes.
- Record a substantial decision in `docs/decisions/` before building on it.
- Never commit secrets. `.env` files are ignored.
- Never write into a user's project directory unless that write is the explicit action they took.

## Reports

Say which files changed, which decisions you made, which commands you ran and what they printed, what you could not prove, and what remains.

## License

Contributions are under the [MIT License](LICENSE).
