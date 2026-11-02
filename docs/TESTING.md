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

`test:compile` always runs article + with-image under pdflatex. The xelatex case runs only when `xelatex` is on `PATH` (skipped cleanly on GitHub CI).

## Manual UI

1. `npm run dev`
2. Open absolute path to `tests/fixtures/article` (or use **Open** / **New** / Recent)
3. Confirm Monaco loads `main.tex`, tabs work, outline jumps, autosave dirty→saved
4. Compile (`Ctrl/Cmd+Enter`) → Log / History tabs; filter Problems by errors/warnings
5. Toggle theme; SyncTeX; **Open in OS**; **Clean** aux; optional compile-on-save in Settings
6. Status bar shows `Ln/Col`; try `with-image` (pdflatex always; xelatex if installed)

## Companion unit tests

`node --test companion/lib/tex.test.mjs companion/lib/synctex.test.mjs` covers structured latexmk argv and SyncTeX output parsing.
