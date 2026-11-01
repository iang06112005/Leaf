# TexFlow

Local-first LaTeX IDE. A project is an ordinary directory. TexFlow does not require an account, a cloud service, or a custom TeX engine.

The Git repository may be named Leaf. The application name is TexFlow.

Milestone 0 is a web application: a browser shell, documentation, and development tooling. Opening a project, editing, compiling, and PDF preview are later milestones. See [docs/ROADMAP.md](docs/ROADMAP.md).

## License

[MIT](LICENSE).

## Documentation

Agents start at [AGENTS.md](AGENTS.md).

- [Vision](docs/VISION.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Tech stack](docs/TECH_STACK.md)
- [Roadmap](docs/ROADMAP.md)
- [Development](docs/DEVELOPMENT.md)
- [Testing](docs/TESTING.md)
- [Security](docs/SECURITY.md)
- [Decisions](docs/decisions/0001-stack-and-repo-layout.md)

## Requirements

- Node.js 22 or newer
- A current browser
- TeX Live is not required yet

## Commands

From the repository root, after `npm install`:

| Command                | What it does                             |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the app at <http://127.0.0.1:5173> |
| `npm test`             | Unit tests                               |
| `npm run lint`         | ESLint                                   |
| `npm run typecheck`    | TypeScript                               |
| `npm run format:check` | Prettier                                 |
| `npm run build`        | Production build in `dist/`              |
| `./scripts/check.sh`   | The same checks CI runs                  |

## Layout

The repository root is the Vite application. Source lives in `src/`. There is no nested project directory and no desktop host in this milestone.
