# TexFlow

Local-first LaTeX IDE (working name). Projects are ordinary folders. The preferred app is a **Tauri 2 desktop window** (Rust host + React UI). A Node companion remains for browser/dev. **No AI agent.**

License: [MIT](LICENSE).

## Quick start (Windows desktop)

```bat
cd C:\Repo_me\Leaf
git pull
npm install
npm run tauri:dev
```

1. TexFlow opens in its own window (no browser ports to remember)
2. Toolbar **Open** → pick a folder (or open `C:\Repo_me\Leaf\tests\fixtures\article`)
3. Edit in Monaco; autosave / **Save** (`Ctrl+S`); **Compile** (`Ctrl+Enter`); palette (`Ctrl+K`)
4. PDF preview refreshes on success; Log / Problems / History are at the bottom

Need TeX Live with `latexmk` on `PATH` (or set **TeX bin directory** in Settings). Also need Node 22+, Rust (`rustup`), and WebView2.

Packaged build: `npm run tauri:build` → artifacts under `src-tauri\target\release\bundle\`.

### Browser fallback (optional)

```bat
npm run dev
```

Then open http://127.0.0.1:5173 (companion on `:8787`).

## Docs

Start at [AGENTS.md](AGENTS.md). Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Desktop host: [docs/decisions/0006-tauri-desktop-host.md](docs/decisions/0006-tauri-desktop-host.md).

## Scripts

| Command                | Meaning                     |
| ---------------------- | --------------------------- |
| `npm run tauri:dev`    | Desktop app (preferred)     |
| `npm run tauri:build`  | Packaged desktop binary     |
| `npm run dev`          | Browser UI + Node companion |
| `npm test`             | JS/Node unit tests          |
| `npm run test:rust`    | Rust host unit tests        |
| `npm run test:compile` | Real latexmk smoke          |
| `./scripts/check.sh`   | Full gate                   |
