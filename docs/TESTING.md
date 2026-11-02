# Testing

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:compile   # needs latexmk (+ xelatex for engine proof)
./scripts/check.sh
```

## Fixtures

| Path                        | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `tests/fixtures/minimal`    | Tiny single-file document                        |
| `tests/fixtures/article`    | Multi-file + bibliography (`refs.bib`, `\input`) |
| `tests/fixtures/with-image` | PNG via `graphicx` (also used for xelatex smoke) |

## Manual UI

1. `npm run dev`
2. Open absolute path to `tests/fixtures/article` (or use **Open** / Recent)
3. Confirm Monaco loads `main.tex`, tabs work, autosave dirty→saved
4. Compile (`Ctrl/Cmd+Enter`) → Log tab streams, PDF preview refreshes
5. Toggle theme; click PDF for inverse SyncTeX; editor SyncTeX for forward
6. **Open in OS** on the PDF; change engine to xelatex and recompile `with-image`

## Companion unit tests

`node --test companion/lib/tex.test.mjs companion/lib/synctex.test.mjs` covers structured latexmk argv and SyncTeX output parsing.
