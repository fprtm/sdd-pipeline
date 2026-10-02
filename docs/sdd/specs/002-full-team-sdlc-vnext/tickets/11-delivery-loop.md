# TICKET-011 — WP-06 delivery loop

**Feature**: FSD-002
**Refs**: REQ-017, SEC-015; TEST-031
**Tier**: T3
**Status**: 🧪 testing/review
**Dependencies**: TICKET-007, TICKET-008, TICKET-009
**Files likely touched:** `skills/build/test-plan/SKILL.md`, `skills/build/ticket-decomposition/SKILL.md`, `skills/prove/verification/SKILL.md`, `skills/meta/quality-contract/rules/delivery.mjs`, `skills/meta/quality-contract/rules/engineering.mjs`, templates
goal: Current core consumes assurance/evidence/authority without duplicating truth.
supports: REQ-017, SEC-015
success: Low-risk paths remain usable while all six engineering concerns stay explicit and weak/self-reported A2/A3 evidence cannot accept.
implementer: root
independence: degraded independence

## Human Review

- Confirm the assurance-to-evidence mapping fits the approved quality contract.
- Confirm the verifier packet is minimal enough for blind independent review.
- Confirm all open defects should trigger rework, including low-severity defects.

## Algorithm / Flow

1. Derive evidence requirements from effective assurance and acceptance criteria.
2. Materialize bounded work/verifier packets referencing canonical specs.
3. Bind deviations, candidate, defects, and rework transitions.
4. Reverify changed subjects; never reuse stale acceptance evidence.

## Acceptance Criteria

- [x] Spec/ticket schema and evidence-level mapping have one owner.
- [x] Ticket work packets expose risk, assurance, evidence, rollback/recovery, stop conditions, and deviations without transcript dependence.
- [x] Architecture fitness, compatibility, reversibility, maintainability, performance, and operability have an exact-subject shadow profile.
- [x] Independent verifier packet is context-minimal and exact-subject-bound.
- [x] TEST-031 covers compatibility and negative A2/A3 paths.

## Out of Scope

New public commands and automatic agent dispatch.
