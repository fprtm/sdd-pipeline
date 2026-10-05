---
description: Review guide and dependency order for Quality Contract v1 implementation.
status: draft
lifecycle: active
updated: 2026-09-30
---

# Quality Contract v1 — Work Order

**Spec**: [FSD](../fsd.md), [SDS](../sds.md), [Threat model](../threats.md), [Test plan](../tests.md). **Decision record**: [discovery ledger](../../../changes/2026-09-30-deliberation-quality-contract-v1.md). **State**: implementation evidence is present and the review/fix loop is in progress; no slice is marked testing/review or done until its actor record and contract review are recorded. Canonical specs are authoritative; these files are digest-pinned executable projections.

## Reading order

1. FSD (~3 min): behavior and failure rules.
2. SDS (~3 min): trust boundaries and module responsibilities.
3. Threats/tests (~3 min): controls and proof.
4. The relevant ticket: exact seam, scope, stop condition, and tests.

## Status

| ID | Title | Tier | Status | Dependencies |
|---|---|---|---|---|
| TICKET-001 | Contract core and result envelope | T2 | in progress | none |
| TICKET-002 | Canonical contract and projection | T2 | in progress | TICKET-001 |
| TICKET-003 | Trusted preflight and execution eligibility | T3 | in progress | TICKET-001, TICKET-002 |
| TICKET-004 | Evidence-backed acceptance | T3 | in progress | TICKET-001, TICKET-002, TICKET-003 |
| TICKET-005 | Adapter, installer, and CI migration | T2 | in progress | TICKET-001 |
| TICKET-006 | Compatibility, pilot, and lifecycle hardening | T2 | in progress | TICKET-003, TICKET-004, TICKET-005 |

## Frontier

Start TICKET-001. After it is independently reviewed, TICKET-002 and TICKET-005 can proceed separately. TICKET-003 then TICKET-004 establish the trust-critical path; TICKET-006 closes validation and rollout readiness. No ticket adds a public command.
