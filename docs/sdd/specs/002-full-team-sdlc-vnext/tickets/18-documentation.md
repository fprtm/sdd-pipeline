# TICKET-018 — WP-13 documentation and adoption

**Feature**: FSD-002
**Refs**: REQ-024, REQ-NF-011, SEC-022; TEST-038
**Tier**: T2
**Status**: 🧪 testing/review
**Dependencies**: TICKET-010 through TICKET-017
**Files likely touched:** `README.md`, `docs/ARCHITECTURE.md`, `docs/INSTALL.md`, `docs/guides/`, skill references, validation tests
goal: Every audience can operate vNext without duplicate normative policy.
supports: REQ-024, REQ-NF-011, SEC-022
success: Lifecycle, role, assurance, benchmark, migration, and examples link to canonical owners and classify claims.
implementer: root
independence: degraded independence

## Human Review

- Confirm each audience can follow the guides without reading implementation internals.
- Confirm synthetic/mechanical evidence is never worded as real pilot superiority.

## Algorithm / Flow

1. Generate audience guides from stabilized canonical behavior.
2. Label material claims policy/mechanical/runtime/host-dependent.
3. Link rather than duplicate normative tables/schemas.
4. Add structural drift assertions and run local link/hygiene checks.

## Acceptance Criteria

- [x] All required guides and worked examples exist.
- [x] No duplicate normative SSOT or unsupported quality claim remains.
- [x] TEST-038 and documentation checks pass.

## Out of Scope

Marketing claims beyond measured benchmark segments.
