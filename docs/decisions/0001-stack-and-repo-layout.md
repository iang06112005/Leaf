# ADR 0001: Web app at the repository root

## Status

Accepted

## Context

The original foundation request specified Tauri 2, a Rust host, and a desktop window. A browser page cannot spawn TeX or freely rewrite an arbitrary folder, so a desktop host matched the later compiler requirements.

While that shell was being set up, the user said a desktop app was unnecessary and a web app was acceptable. Milestone 0 does not compile or open projects, so the desktop host was not earning its weight. The repository root is the application. A nested `frontend/` or `texflow/` directory would exist only to satisfy Tauri.

## Decision

- Milestone 0 is a web application: React, TypeScript, Vite, Tailwind CSS, and lucide-react.
- The Vite project lives at the repository root (`index.html`, `src/`, `vite.config.ts`). There is one frontend root.
- Do not add Tauri, Rust, or a desktop shell in this milestone.
- Do not add Monaco, PDF.js, a database, or a compiler service until the milestone that needs them.
- Keep the product rules for projects and for compiler invocation. They apply when those features are built. They do not force a desktop wrapper today.
- If a later milestone cannot reach local files or local TeX from the browser, decide the host in a new ADR. Do not revive Tauri by default.

## Consequences

- `npm install` and `npm run dev` at the repository root are the whole setup. The dev server is <http://127.0.0.1:5173>.
- CI is a Node job. It does not install WebKitGTK or Rust.
- Agents must not reintroduce `src-tauri/` as an empty placeholder.
- Compilation remains impossible from this page alone. That gap is explicit in [../ROADMAP.md](../ROADMAP.md) and [0003-compiler-invocation.md](0003-compiler-invocation.md).
