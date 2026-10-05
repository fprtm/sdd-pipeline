#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

first="$(mktemp)"
second="$(mktemp)"
trap 'rm -f "$first" "$second"' EXIT

node scripts/test-vnext-benchmark.mjs >"$first"
node scripts/test-vnext-benchmark.mjs >"$second"
cmp -s "$first" "$second" || {
  echo "vNext normalized synthetic benchmark output is not reproducible" >&2
  exit 1
}
./scripts/test-quality-contract.sh >/dev/null
node scripts/test-vnext-docs.mjs >/dev/null
echo "TEST-039 local synthetic lifecycle: PASS; normalized rerun: byte-identical"
