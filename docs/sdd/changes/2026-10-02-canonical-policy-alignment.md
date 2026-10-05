---
description: Reconcile contradictory hard-stop, coverage, SDLC, documentation-floor, and abstraction policies with their canonical owners.
status: active
lifecycle: active
goal: Every policy consumer reaches one unambiguous rule for safety floors, evidence gates, process detection, and abstraction thresholds.
updated: 2026-10-02
---

# Change: Canonical policy alignment

**Date**: 2026-10-02
**Mode**: standard
**Size**: medium
security-sensitive: false

## Success

- `OVERRIDE: none` rules cannot be read as user-overridable guidelines.
- Coverage runs for every applicable small+ task; emergency may defer the gate during mitigation but not erase it before acceptance.
- SDLC is always identified; emergency defers process adaptations rather than leaving the model undeclared.
- Generic abstraction and two-real-adapter thresholds have explicit, non-overlapping scopes.
- Rapid iteration cannot silently close an unresolved discovery seat.
- Prototype retains its DoD floor and emergency receives a post-fix retrospective record.
- Constraint definitions have one canonical owner and the engine no longer carries a weaker copy.

## Actors

- implementer: root
- independence: degraded independence

## Human Review

- Verify that the immediate emergency path remains fast while deferred coverage and retrospective work stay mandatory before normal acceptance.
- Verify that the two-adapter exception is limited to real external/boundary adapters and does not weaken the generic anti-abstraction rule.
- Verify that removing duplicated constraint text does not remove any existing override mechanism.

## What Changed

- Made `OVERRIDE: None` an explicit non-overridable hard stop and removed weaker duplicate universal rules from the constraint engine.
- Aligned coverage, emergency follow-up, SDLC detection, rapid iteration, abstraction thresholds, prototype DoD, and emergency retrospective language with their canonical owners.
- Replaced stale internal command and ticket-path examples, removed the duplicated architecture mode matrix, and corrected skill/runtime/CI documentation.
- Added executable policy and public-document drift assertions to the repository behavior suite.

## Gate List

- [x] Cross-source policy search has no contradictory owner text.
- [x] Structural validator and all behavioral suites pass.
- [x] File hygiene, traceability, syntax, and whitespace checks pass.
- [x] Security hard-stop language remains non-negotiable.

## IDs

None — internal policy reconciliation from WP-00 findings ALN-001 through ALN-007.

## Inline Decisions

- Safety and evidence precedence follows `hard stop > assurance > risk > complexity > ceremony`.
- Emergency is a temporary mitigation state, not an acceptance profile; deferred evidence must still run before ordinary completion.
- `skills/constraints/universal/SKILL.md` owns universal rule definitions; `skills/build/constraints/SKILL.md` owns loading, precedence, and overrides.

## What Was Tested

- `./scripts/validate-skills.sh` — exit 0; 65 skills; only three advisory size warnings.
- `./scripts/test-checkers.sh` — 136/136 pass, including canonical policy, public-doc drift, and negative mode-delegation coverage.
- `./scripts/test-quality-contract.sh` — 3/3 pass; aggregate lines 94.99%, branches 80.98%, functions 93.98%.
- `find skills install scripts -name '*.mjs' -type f -exec node --check {} \;` — pass.
- `node skills/meta/health-check/check-file-hygiene.mjs docs/sdd` — pass.
- `node skills/meta/traceability/check-traceability.mjs docs/sdd` — pass; 21 docs, 61 definitions, 58 matrix refs.
- `git diff --check` — pass.
