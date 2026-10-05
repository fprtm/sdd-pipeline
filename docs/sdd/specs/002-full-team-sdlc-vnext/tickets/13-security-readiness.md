# TICKET-013 — WP-08 security and production readiness

**Feature**: FSD-002
**Refs**: REQ-019, SEC-016, SEC-017; TEST-033
**Tier**: T3
**Status**: 🧪 testing/review
**Dependencies**: TICKET-009, TICKET-011
**Files likely touched:** `skills/think/threat-model/SKILL.md`, `skills/prove/diagnose/SKILL.md`, `skills/build/infra/SKILL.md`, `skills/meta/quality-contract/rules/readiness.mjs`, readiness fixtures/templates
goal: A2/A3 security controls and operational readiness are evidence-bound.
supports: REQ-019, SEC-016, SEC-017
success: Missing High/Critical executable evidence or recovery/operations proof cannot become green.
implementer: root
independence: degraded independence

## Human Review

- Confirm the pinned SSDF 1.1 final, ASVS 5.0.0, and SAMM 2.0 mappings fit each pilot control.
- Confirm exceptions remain visible risk decisions and never turn missing executable evidence green.
- Confirm A3 operational evidence and external release authority reflect the deployment environment.

## Algorithm / Flow

1. Map SSDF/ASVS/SAMM references to local controls without copying external policy.
2. Validate control evidence, exceptions/owner/expiry, provenance/SBOM hooks.
3. Validate SLO/observability/rollback/restore/capacity evidence.
4. Emit readiness only; production authority remains external.

## Acceptance Criteria

- [x] Exception and evidence lifecycle is exact-subject/version bound.
- [x] A2/A3 profile fixtures fail on every missing mandatory class.
- [x] TEST-033 passes without network or production access.

## Out of Scope

Certification claims, vulnerability-scanner bundling, and deployment.
