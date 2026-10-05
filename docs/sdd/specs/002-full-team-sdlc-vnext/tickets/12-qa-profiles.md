# TICKET-012 — WP-07 QA profiles

**Feature**: FSD-002
**Refs**: REQ-018, SEC-016; TEST-032
**Tier**: T3
**Status**: 🧪 testing/review
**Dependencies**: TICKET-011
**Files likely touched:** `skills/build/test-plan/SKILL.md`, `skills/prove/adversarial/SKILL.md`, `skills/prove/coverage-check/SKILL.md`, `skills/meta/quality-contract/rules/qa.mjs`, QA fixtures
goal: Verification measures behavioral/oracle strength rather than coverage alone.
supports: REQ-018, SEC-016
success: Seeded faulty implementations are caught and unavailable required techniques never report pass.
implementer: root
independence: degraded independence

## Human Review

- Confirm the seven-technique vocabulary is sufficient for the pilot domains.
- Confirm each fixture's seeded fault is representative, not merely easy to detect.

## Algorithm / Flow

1. Map product/technical risks to condition matrix and applicable techniques.
2. Validate positive, negative, oracle, mutation/property/state/contract/differential/fault/concurrency evidence.
3. Distinguish not-required, skipped, blocked, fail, and pass.
4. Emit residual risk and exact missing capability/remediation.

## Acceptance Criteria

- [x] Seeded-fault corpus exercises every supported technique.
- [x] Tool absence semantics are exact and tested.
- [x] Coverage remains a gate but not a correctness claim.

## Out of Scope

Bundling third-party mutation/property tools.
