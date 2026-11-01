# Testing

## What runs today

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run format:check
```

Vitest covers:

- `src/appLabel.test.ts`
- `src/services/paths.test.ts` — spaces and non-ASCII segments
- `src/services/fileKinds.test.ts`
- `src/services/filesystem.test.ts` — preferred `main.tex` / `main.pdf`

`./scripts/check.sh` matches `.github/workflows/ci.yml`.

## Manual checks for the workspace

In Chrome or Edge:

1. `npm run dev` → http://127.0.0.1:5173
2. Open folder → pick `tests/fixtures/minimal` (or any folder with `.tex` / `.pdf`)
3. Confirm the tree lists files, Monaco shows `main.tex`, Save writes only after you click Save
4. If a PDF is present, the preview renders page 1; otherwise click a `.pdf` in the tree

Firefox and Safari should show that Open folder is unsupported. That is expected.

## Fixture

`tests/fixtures/minimal/main.tex` is a normal one-file LaTeX document. It is not a TexFlow project format. Milestone 2 still needs real multi-file documents for compilation tests.

## Not running yet

Playwright is not installed. Add it when the open/edit/preview loop needs regression coverage in CI. Do not claim compilation works — it does not exist yet.
