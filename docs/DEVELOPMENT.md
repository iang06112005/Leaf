# Development

## Prerequisites

- Node.js 22 or newer
- npm
- Chrome or Edge to open a local project folder (File System Access API)
- TeX Live is not required until Milestone 2

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open http://127.0.0.1:5173. The server binds that address and fails if the port is taken.

`npm run build` writes `dist/`. `npm run preview` serves that build.

## Checks

```bash
./scripts/check.sh
```

## Open a project

Use **Open folder** and choose any ordinary directory. The sample at `tests/fixtures/minimal` is enough to see the editor. Add a PDF to that folder if you want the preview without compiling.

Writes only happen when you click **Save**.
