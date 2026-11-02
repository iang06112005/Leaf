# Development

## Prerequisites

- Node.js 22+
- npm
- TeX Live with `latexmk` (and `pdflatex` / optionally `xelatex`, `lualatex`, `biber`)
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

Open a project with an **absolute path** (Windows example: `C:\Repo_me\Leaf\tests\fixtures\article`). The toolbar **Open** prompt accepts a path; empty uses a native folder dialog when the OS allows it.

## Checks

```bash
./scripts/check.sh
```

`test:compile` runs when `latexmk` is on `PATH`.

## Windows (Ian)

```bat
cd C:\Repo_me\Leaf
git pull
npm install
npm run dev
```

Install TeX Live from https://tug.org/texlive/ so `latexmk` works in a new terminal. In TexFlow → Settings, set **TeX bin directory** if needed (example: `C:\texlive\2024\bin\windows`). Open `C:\Repo_me\Leaf\tests\fixtures\article`, then **Compile**.
