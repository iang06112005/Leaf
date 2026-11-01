#!/usr/bin/env bash
# Local equivalent of .github/workflows/ci.yml. Keep the two in sync.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

echo "== prettier =="
npm run format:check

echo "== eslint =="
npm run lint

echo "== typecheck =="
npm run typecheck

echo "== unit tests =="
npm test

echo "== production build =="
npm run build
