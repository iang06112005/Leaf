# Development

## Prerequisites

- Node.js 22 or newer
- npm
- A current browser

TeX Live is not required for Milestone 0. There is no Rust toolchain and no WebKitGTK dependency.

## Install

From the repository root:

```bash
npm install
```

## Run

```bash
npm run dev
```

Open <http://127.0.0.1:5173>. The dev server binds that address and port, and it fails if the port is already taken.

`npm run build` writes `dist/`. `npm run preview` serves that build.

## Checks

```bash
./scripts/check.sh
```

Or the individual commands in [../AGENTS.md](../AGENTS.md). On Windows, run those commands directly if bash is unavailable. `scripts/check.sh` is the bash form of `.github/workflows/ci.yml`.

## Version

The status strip reads `version` from `package.json`. The unit test expects `0.1.0` until that field changes.
