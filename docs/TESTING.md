# Testing

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:compile   # needs latexmk
./scripts/check.sh
```

## Fixtures

| Path                     | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `tests/fixtures/minimal` | Tiny single-file document                        |
| `tests/fixtures/article` | Multi-file + bibliography (`refs.bib`, `\input`) |

## Manual UI

1. `npm run dev`
2. Open absolute path to `tests/fixtures/article`
3. Confirm Monaco loads `main.tex`, autosave dirty→saved
4. Compile → PDF preview refreshes on success
5. Click a diagnostic (if any) → editor jumps

## Companion unit tests

`node --test companion/lib/tex.test.mjs` covers structured latexmk argv (including shell-escape and path rejection).
