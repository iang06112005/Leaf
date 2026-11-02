# Development

## Prerequisites

- Node.js 22+
- npm
- TeX Live with `latexmk` (and `pdflatex` / optionally `xelatex`, `lualatex`, `biber`, `synctex`)
- Chrome or Edge recommended for the UI

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

- UI: http://127.0.0.1:5173
- Companion: http://127.0.0.1:8787/api/health

Open a project with an **absolute path**, the toolbar **Open** button (native folder dialog when available), or **Recent**. If the native dialog is unavailable, paste an absolute path when prompted.

Shortcuts: `Ctrl/Cmd+K` (or `Ctrl/Cmd+Shift+P`) command palette, `Ctrl/Cmd+Shift+F` find in files, `Ctrl/Cmd+Enter` compile (or stop while running), `Ctrl/Cmd+S` save, `Ctrl/Cmd+Shift+S` save all. In `.tex` files: Monarch highlighting, snippet triggers `sec`/`fig`/`eq`/`itz`/`cite`, and `\cite{` completion from project `.bib` files. Aux files are hidden in the tree by default.

## Checks

```bash
./scripts/check.sh
```

`test:compile` runs when `latexmk` is on `PATH` (article + with-image pdflatex required; xelatex optional).

## Windows (Ian)

```bat
cd C:\Repo_me\Leaf
git pull
npm install
npm run dev
```

Install TeX Live from https://tug.org/texlive/ so `latexmk` works in a new terminal. In TexFlow → Settings, set **TeX bin directory** if needed (example: `C:\texlive\2024\bin\windows`). Open `C:\Repo_me\Leaf\tests\fixtures\article`, then **Compile**.
