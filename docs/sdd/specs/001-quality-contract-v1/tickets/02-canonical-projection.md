# TICKET-002 — Canonical contract and executable projection

**Feature**: Quality Contract v1  
**Refs**: FSD-001 REQ-001, REQ-006, REQ-009; SEC-002, SEC-007  
**Tier**: T2  
**Status**: 🔨 in progress  
**Dependencies**: TICKET-001  
**Files likely touched:** `skills/meta/quality-contract/rules/projection.mjs`, `skills/meta/quality-contract/fixtures/projection.json`, `skills/commands/spec/SKILL.md`, `skills/build/ticket-decomposition/SKILL.md`, `templates/changes.md`, `scripts/test-quality-contract.sh`
goal: One canonical contract can produce a drift-detectable executable projection.
supports: REQ-001, REQ-006, REQ-009, SEC-002, SEC-007
success: A ticket projection pins canonical truth and blocks stale or ambiguous scope/landmark/AC-map input.

## Bootstrap projection

**Canonical/projection digest:** `sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2`; **base subject:** `git:5d542a4a0a09e7e0746535e55a946e8c2cee3241`. **Risk / executor:** medium T2 / capable builder. **Allowed scope:** exactly the six files above; **forbidden:** evaluator predicate, gateway, event cryptography, public commands. **Landmarks:** `templates/changes.md` exists; every other listed target is declared new. **Baseline:** `scripts/test-checkers.sh` and TICKET-001 harness; **stop:** a value needs a second authoritative owner or a landmark is not uniquely resolvable. **Authority/review:** human authorization + independent reviews. **AC evidence subset digest:** `sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2` (TEST-002,007,012,019).

## What to Build

Make canonical requirements the sole authority and materialize digest-pinned ticket projections that carry exact landmarks, scope, stop conditions, executor fit, and frozen AC-to-evidence maps without becoming a second truth source.

## Algorithm / Flow

1. Read canonical contract and create/validate a projection pinned to its digest.
2. Reject independent projection edits or stale canonical/scope/AC-map bindings.
3. Validate existing landmarks uniquely and new landmarks as explicitly absent/new declarations.

## Acceptance Criteria

- [ ] Projection drift is detected and refreshed projection remains non-authoritative — TEST-012.
- [ ] Every AC has a non-circular observable map and missing/ambiguous landmarks block readiness — TEST-002, TEST-007.

## Out of Scope

- Event verification and post-build evidence sealing.
