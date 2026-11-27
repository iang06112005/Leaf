# Development

## Prerequisites

- Node.js 22+
- npm
- Rust stable (for desktop; `rustup` recommended)
- TeX Live with `latexmk` (and `pdflatex` / optionally `xelatex`, `lualatex`, `biber`, `synctex`)
- **Windows desktop:** WebView2 (usually already present on Windows 10/11)
- **Linux desktop build:** WebKitGTK 4.1 + related GTK deps

## Install

```bash
npm install
```

## Run (preferred — desktop)

```bash
npm run tauri:dev
```

Opens the TexFlow window. No browser tab and no companion port to remember. Use **Open** to pick a real folder.

## Run (browser + Node companion fallback)

```bash
npm run dev
```

- UI: http://127.0.0.1:5173
- Companion: http://127.0.0.1:8787/api/health

## Checks

```bash
./scripts/check.sh
```

Includes Prettier, ESLint, TypeScript, Vitest, companion `node:test`, Rust host unit tests (when `cargo` is available), production UI build, and latexmk smoke when installed.

## Windows (Ian — `C:\Repo_me\Leaf`)

### One-time setup

1. Install [Node.js 22+](https://nodejs.org/).
2. Install [Rust](https://rustup.rs/) (`rustup` → stable).
3. Install [TeX Live](https://tug.org/texlive/) so `latexmk` works in a new terminal.
4. WebView2 is normally already installed on Windows 10/11.

### Every session (dev)

```bat
cd C:\Repo_me\Leaf
git checkout cursor/texflow-tauri-desktop-b9fd
git pull
npm install
npm run tauri:dev
```

In TexFlow → Settings, set **TeX bin directory** if needed (example: `C:\texlive\2024\bin\windows`). Open `C:\Repo_me\Leaf\tests\fixtures\article`, then **Compile**.

### Packaged build (optional)

```bat
cd C:\Repo_me\Leaf
npm install
npm run tauri:build
```

Installer / exe land under `src-tauri\target\release\bundle\` (NSIS / MSI / exe depending on targets).

Shortcuts in the app: `Ctrl+K` command palette, `Ctrl+Shift+F` find in files, `Ctrl+Enter` compile, `Ctrl+S` save. Monaco owns `Ctrl+F` / `Ctrl+H`.
