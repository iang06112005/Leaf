# TexFlow

Local-first LaTeX IDE (working name). Projects are ordinary folders. The UI is a web app; a small Node companion on your machine runs `latexmk`. **No AI agent.**

License: [MIT](LICENSE).

## Quick start (Windows)

```bat
cd C:\Repo_me\Leaf
git pull
npm install
npm run dev
```

1. Open http://127.0.0.1:5173
2. Toolbar **Open** → paste `C:\Repo_me\Leaf\tests\fixtures\article` (or pick a folder / use Recent)
3. Edit across tabs; autosave / **Save** (`Ctrl+S`); **Compile** (`Ctrl+Enter`); palette (`Ctrl+K`)
4. PDF preview refreshes on success; Log / Problems / History are at the bottom
5. Optional: snippets (`sec`/`fig`/…), theme, SyncTeX, **Open in OS**, engine → xelatex

Need TeX Live with `latexmk` on `PATH` (or set **TeX bin directory** in Settings).

## Docs

Start at [AGENTS.md](AGENTS.md). Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Companion decision: [docs/decisions/0005-local-node-companion.md](docs/decisions/0005-local-node-companion.md).

## Scripts

| Command                | Meaning            |
| ---------------------- | ------------------ |
| `npm run dev`          | UI + companion     |
| `npm test`             | Unit tests         |
| `npm run test:compile` | Real latexmk smoke |
| `./scripts/check.sh`   | Full gate          |
