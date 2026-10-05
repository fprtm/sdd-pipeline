# TICKET-010 — WP-05 product loop

**Feature**: FSD-002
**Refs**: REQ-016, SEC-014; TEST-030
**Tier**: T2
**Status**: 🧪 testing/review
**Dependencies**: TICKET-008, TICKET-009
**Files likely touched:** `skills/commands/discover/SKILL.md`, `skills/build/doc-generator/formats.md`, `skills/meta/quality-contract/rules/{intake,product}.mjs`, benchmark product fixtures
goal: Weak or unsupported ideas can be rejected/revised before BUILD.
supports: REQ-016, SEC-014
success: Complete problem context, opportunity cost, kill criteria, and alternatives drive frozen reject/revise/proceed transitions.
implementer: root
independence: degraded independence

## Human Review

- Confirm the frozen thresholds represent the intended product decision rule.
- Confirm rejection/revision preservation is sufficient for unbiased pilot accounting.

## Algorithm / Flow

1. Normalize intake, problem context, evidence, assumptions, outcome, alternatives, non-goals, and authority.
2. Freeze hypothesis, success/failure/kill thresholds, sample, and decision rule.
3. Evaluate evidence and emit proceed/revise/reject through role-authorized event.
4. Preserve rejected/revised attempts for unbiased benchmark accounting.

## Acceptance Criteria

- [x] Intake, assumption, and experiment schemas validate.
- [x] Product record binds workaround, frequency/severity, costs, kill threshold, and rejected alternatives.
- [x] TEST-030 prevents forced BUILD and silent threshold rewrites.
- [x] Existing discover five-seat coverage remains intact.

## Out of Scope

Market forecasting and automatic product-owner authority.
