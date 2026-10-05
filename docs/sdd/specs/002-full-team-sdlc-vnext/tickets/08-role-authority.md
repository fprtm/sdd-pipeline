# TICKET-008 — WP-03 role authority

**Feature**: FSD-002
**Refs**: REQ-014, SEC-012; TEST-028
**Tier**: T3
**Status**: 🧪 testing/review
**Dependencies**: TICKET-007
**Files likely touched:** `skills/meta/quality-contract/rules/roles.mjs`, `skills/meta/quality-contract/fixtures/vnext/roles.json`, `scripts/test-quality-contract.sh`, role-facing skills
goal: Role accountability and separation are versioned decisions, not personas.
supports: REQ-014, SEC-012
success: A2/A3 self-approval and missing authority fail closed; valid A1 multi-hat work is explicitly degraded.
implementer: root
independence: degraded independence

## Human Review

- Confirm A2/A3 qualification and separation floors match ADR-001.
- Confirm repository actor strings never become external human authority.
- Confirm A1 multi-hat degradation remains usable and visibly non-independent.

## Algorithm / Flow

1. Validate role contracts and exact-subject assignments.
2. Resolve conflicts, qualification, liveness, and assurance-specific separation.
3. Return allowed approvals/blocks plus degraded/blocked fallback.
4. Never upgrade distinct actor strings into external human authority.

## Acceptance Criteria

- [x] Same-actor/expired/wrong-subject/conflict fixtures block exactly; alias strings without attestation cannot satisfy A3.
- [x] Default team contracts and small-team policy are represented once.
- [x] TEST-028 passes with registered machine codes.

## Out of Scope

Identity-provider implementation and production role provisioning.
