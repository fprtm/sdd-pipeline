#!/usr/bin/env bash
set -euo pipefail

# Runs the behavioral test suites for the 3 mechanical checker scripts
# (check-file-hygiene.mjs, check-traceability.mjs, check-parallel-safety.mjs).
# Zero dependencies — uses Node's built-in test runner (node:test), matching
# the checkers' own zero-dependency design. Requires Node >= 18.
#
# These test the SCRIPTS this repo ships and expects downstream projects to
# rely on for CI gates — validate-skills.sh checks that skill files exist and
# are structurally valid, but never previously exercised what the checkers
# actually DO against real input. This is that missing layer.
#
#   ./scripts/test-checkers.sh

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

node --test \
  "$SCRIPT_DIR/skills/meta/health-check/check-file-hygiene.test.mjs" \
  "$SCRIPT_DIR/skills/meta/traceability/check-traceability.test.mjs" \
  "$SCRIPT_DIR/skills/agents/parallel-work/check-parallel-safety.test.mjs"
