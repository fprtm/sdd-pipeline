# TICKET-016 — WP-11 domain and organization packs

**Feature**: FSD-002
**Refs**: REQ-022, SEC-011, SEC-020; TEST-036
**Tier**: T2
**Status**: 🧪 testing/review
**Dependencies**: TICKET-007, TICKET-008, TICKET-009
**Files likely touched:** `skills/meta/quality-contract/rules/packs.mjs`, `skills/packs/developer-tooling/`, `skills/packs/high-risk-api/`, pack fixtures
goal: Context-specific controls compose monotonically without forking core workflow.
supports: REQ-022, SEC-011, SEC-020
success: Both reference packs load; tightening succeeds; weakening/conflict/untrusted input fails actionably.
implementer: root
independence: degraded independence

## Human Review

- Confirm the two reference packs reflect real domain floors before adoption.
- Confirm organization precedence and same-ID conflict behavior are acceptable.

## Algorithm / Flow

1. Parse strict data-only pack with version, scope, controls, evidence, privacy, and complete domain/organization context.
2. Normalize identifiers/paths and resolve deterministic precedence.
3. Prove monotonicity against global/assurance policy.
4. Return merged digest or exact conflict/weakening finding.

## Acceptance Criteria

- [x] Packs cannot delete/demote/broaden mandatory policy.
- [x] Stack/dependency/boundary/classification/retention/SLO/ownership/release-authority/assurance context is strict and preserved in the merged digest.
- [x] Unknown executable/link/path content rejects.
- [x] TEST-036 covers both reference packs and adversarial merges.

## Out of Scope

Downloadable marketplace and executing pack-authored code.
