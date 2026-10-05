# TICKET-009 — WP-04 lifecycle engine

**Feature**: FSD-002
**Refs**: REQ-015, SEC-013; TEST-029
**Tier**: T3
**Status**: 🧪 testing/review
**Dependencies**: TICKET-007, TICKET-008
**Files likely touched:** `skills/meta/quality-contract/rules/lifecycle.mjs`, `skills/meta/quality-contract/fixtures/vnext/lifecycle.json`, `skills/meta/quality-contract/trusted-events.mjs`, `scripts/test-quality-contract.sh`
goal: Lifecycle state is append-only, exact-subject-bound, replay-safe, and compatible.
supports: REQ-015, SEC-013
success: Every allowed transition—including keep/iterate/rollback/retire/learn—passes and every invalid/stale/replayed/unauthorized path preserves the prior state.
implementer: root
independence: degraded independence

## Human Review

- Confirm the exported transition table covers intended reject/revise/rework routes.
- Confirm external attestation and replay adapters are trust boundaries, not repository-manufactured proof.
- Confirm invalid events always retain the prior canonical state.

## Algorithm / Flow

1. Validate event schema/signature/issuer/time/revocation/subject/assignment.
2. Verify exact predecessor and transition-table edge.
3. Atomically consume nonce for authority-bearing events.
4. Append success or failure evidence without rewriting history.

## Acceptance Criteria

- [x] Positive fixtures cover every transition edge.
- [x] Outcome routes reach learned, validation iteration, rollback, or retirement under the correct authority.
- [x] Predecessor fork, replay, trusted expiry, and subject mismatch fail closed.
- [x] Legacy input is report-only and cannot transition.

## Out of Scope

External identity registry, production dispatcher, and database service.
