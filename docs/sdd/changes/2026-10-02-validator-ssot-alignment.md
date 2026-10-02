---
description: Align structural validation with the orchestrator-owned unified mode matrix.
status: active
lifecycle: active
goal: The validator reports actionable structural defects without requiring retired mode-local behavior tables.
updated: 2026-10-02
---

# Change: Validator SSOT alignment

**Date**: 2026-10-02
**Mode**: standard
**Size**: medium
security-sensitive: false

## Success

- `validate-skills.sh` validates the orchestrator's unified THINK/BUILD/PROVE/META mode matrix and all five mode delegation markers.
- The current valid tree produces no stale mode-table, written-record, stats, or critical-phase warnings.
- A regression test proves the validator remains warning-free for the canonical tree.

## Actors

- implementer: root
- security_reviewer: none
- independence: degraded independence

## Human Review

- Confirm that the validator markers protect semantic ownership without coupling validation to incidental prose.
- Confirm that removing mode-local table expectations does not weaken the orchestrator matrix coverage check.

## What Changed

- Replace retired mode-local table checks with orchestrator unified-matrix and delegation checks.
- Add an executable regression assertion to the existing repository behavior suite.

## Gate List

- [x] Structural validator exits 0 with no stale mode warnings.
- [x] Negative marker checks remain blocking errors.
- [x] Checker and Quality Contract suites remain green.
- [x] File hygiene, traceability, and shell syntax checks pass.

## IDs

None — internal validator alignment derived from WP-00 finding ALN-008.

## Inline Decisions

- Canonical behavior owner: `skills/orchestrator/references/behavior.md`; the root orchestrator is a context-bounded router and mode files retain process-only additions plus a delegation marker.
- Regression location: existing `install/install.test.mjs`, because `scripts/test-checkers.sh` already runs it in repository CI.

## What Was Tested

- `bash -n scripts/validate-skills.sh` — pass.
- `./scripts/validate-skills.sh` — exit 0; 65 skills; stale mode warnings reduced from 20 to zero; three advisory size warnings remain.
- `node --test install/install.test.mjs` — passes, including canonical-tree and negative delegation fixtures.
- `./scripts/test-checkers.sh` — 136/136 pass after the complete WP-00 remediation set.
- `./scripts/test-quality-contract.sh` — 3/3 pass; lines 94.99%, branches 80.98%, functions 93.98%.
- `node skills/meta/health-check/check-file-hygiene.mjs docs/sdd` — pass after correcting degraded actor metadata.
- `node skills/meta/traceability/check-traceability.mjs docs/sdd` — pass; 21 docs, 61 definitions, 58 matrix refs.
- `find skills scripts install -name '*.mjs' -type f -exec node --check {} \;` — pass.
- `git diff --check` — pass.
