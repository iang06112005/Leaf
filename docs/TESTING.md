# Testing

## What runs today

From the repository root:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run format:check
```

Vitest (`vitest run`, node environment) covers `src/appLabel.test.ts`: the status label is the product name plus the `package.json` version.

`./scripts/check.sh` runs the same list as `.github/workflows/ci.yml`.

## Fixture

`tests/fixtures/minimal/main.tex` is a normal one-file LaTeX document in a normal directory. It is not a TexFlow project format. Nothing in Milestone 0 reads it. Milestone 2 needs real documents (images, bibliographies, multi-pass); this file is only a placeholder path so that later tests have an obvious starting point.

## Not running yet

Playwright is not installed, and there is no Playwright config. Browser downloads are large and are not required to prove this foundation. Add Playwright when the workspace can be driven for real, and cover:

- the page renders the project, editor, preview, and status regions
- opening a temporary project directory once that exists
- jumping from a diagnostic to source once compilation exists

Until then, keep Vitest on pure behavior. Opening the dev server and reading the four regions is a manual check, not a substitute for a regression suite.

Do not claim the page loads, or that a document compiles, unless that run happened.
