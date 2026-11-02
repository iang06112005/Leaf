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
5. `Ctrl/Cmd+K` palette: SyncTeX, Open PDF in OS, find, jump to file, snippets
6. `Ctrl/Cmd+Shift+F` find-in-files → click jumps to line; tree hides aux by default (Show aux)
7. In `\cite{` use bib completion from project `.bib`; snippet triggers `sec`/`fig`/…
8. Status `Ln/Col`; Clean; compile-on-save; `with-image` (xelatex if installed)

## Companion unit tests

`node --test companion/lib/tex.test.mjs companion/lib/synctex.test.mjs` covers structured latexmk argv and SyncTeX output parsing.
