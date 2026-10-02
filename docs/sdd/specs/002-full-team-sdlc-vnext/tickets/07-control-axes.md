# TICKET-007 — WP-02 independent control axes

**Feature**: FSD-002
**Refs**: REQ-013, REQ-NF-006..008, SEC-011; TEST-027
**Tier**: T3
**Status**: 🧪 testing/review
**Dependencies**: WP-00, WP-01
**Files likely touched:** `skills/meta/quality-contract/rules/axes.mjs`, `skills/meta/quality-contract/fixtures/vnext/axes.json`, `scripts/test-quality-contract.sh`, `skills/orchestrator/SKILL.md`
goal: Four axes produce one deterministic shadow result without ceremony lowering safety.
supports: REQ-013, SEC-011
success: TEST-027 proves micro-critical, large-low-risk, prototype, emergency, elevation, demotion, unknown, and malformed cases.
implementer: root
independence: degraded independence

## Human Review

- Confirm the unknown-risk A2 shadow floor is conservative without implying acceptance.
- Confirm size and ceremony have no code path that can lower risk/assurance.
- Confirm the module remains report-only until explicit WP-12 migration.

## Algorithm / Flow

1. Strictly validate the bound axis document.
2. Compute risk floor from dimensions, then assurance floor and upward overrides.
3. Attach complexity and ceremony without mutating safety results.
4. Emit registered findings and false authority predicates in shadow mode.

## Acceptance Criteria

- [x] All fixture rows assert exact status/code/effective axes.
- [x] Same subject under every ceremony produces the same safety floor.
- [x] Runtime remains zero-dependency and coverage gate passes.

## Out of Scope

Role assignment, lifecycle transitions, and enforcement activation.
