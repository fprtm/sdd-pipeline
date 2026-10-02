---
description: Dependency-ordered work order for SDD Pipeline vNext WP-02 through WP-14.
status: active
lifecycle: active
updated: 2026-10-02
---

# Full-Team SDLC vNext — Work Order

**Spec:** [FSD](../fsd.md), [SDS](../sds.md), [Threats](../threats.md), [Tests](../tests.md), [DoD](../dod.md). **Decisions:** ADR-001..003. **Frozen evaluation:** active `benchmarks/vnext/protocol-v3.json` (file SHA-256 `0e2e56548e99c0c7b8246efaf200b1db791ed265e761dd9ec1d4e4585a551106`; canonical manifest digest `sha256:5c2cf1fad8c4a3b5c984b3e926d42641965ea201c28de56b0b5c58f21414eba7`), superseding immutable revisions 1/2 to bind all corpus categories and missing quality-dimension metrics. No ticket adds a public command or production authority.

## Status

| ID | Work package | Tier | Status | Dependencies |
|---|---|---|---|---|
| TICKET-007 | WP-02 control axes | T3 | 🧪 testing/review | WP-00, WP-01 |
| TICKET-008 | WP-03 role authority | T3 | 🧪 testing/review | TICKET-007 |
| TICKET-009 | WP-04 lifecycle engine | T3 | 🧪 testing/review | TICKET-007, TICKET-008 |
| TICKET-010 | WP-05 product loop | T2 | 🧪 testing/review | TICKET-008, TICKET-009 |
| TICKET-011 | WP-06 delivery loop | T3 | 🧪 testing/review | TICKET-007..009 |
| TICKET-012 | WP-07 QA profiles | T3 | 🧪 testing/review | TICKET-011 |
| TICKET-013 | WP-08 security/readiness | T3 | 🧪 testing/review | TICKET-009, TICKET-011 |
| TICKET-014 | WP-09 release/observe/learn | T3 | 🧪 testing/review | TICKET-008, TICKET-009, TICKET-013 |
| TICKET-015 | WP-10 benchmark runner | T3 | 🧪 testing/review | TICKET-009..014 |
| TICKET-016 | WP-11 pack system | T2 | 🧪 testing/review | TICKET-007..009 |
| TICKET-017 | WP-12 compatibility/portability | T3 | 🧪 testing/review | stable TICKET-007..016 schemas |
| TICKET-018 | WP-13 documentation/adoption | T2 | 🧪 testing/review | TICKET-010..017 |
| TICKET-019 | WP-14 pilot/promotion decision | T3 | ⛔ blocked (external pilot evidence) | TICKET-007..018 |

## Frontier

Start TICKET-007. Then TICKET-008 → TICKET-009. TICKET-010 and TICKET-011
may proceed once those contracts stabilize; TICKET-012/TICKET-013 follow the
delivery seam, then TICKET-014. TICKET-016 can proceed beside those when files
do not overlap. TICKET-015 needs all measured lifecycle behavior; TICKET-017
packages stable schemas; documentation and pilot close the chain.

Parallel execution still requires explicit user confirmation and the mechanical
overlap check. This work order authorizes sequential execution under the user's
approved goal; it does not authorize agent spawning by itself.
