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
2. Toolbar **Open** → paste `C:\Repo_me\Leaf\tests\fixtures\article`
3. Edit, wait for autosave / **Save**, press **Compile**
4. PDF appears on success; diagnostics are at the bottom

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
