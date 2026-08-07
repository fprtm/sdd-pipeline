# Wishlist + Shareable Link — SDD Overview

> **Plain-language summary:** Logged-in shoppers can save products to a personal
> wishlist, manage it, and optionally share a read-only link so friends can see
> it. This document set is the full spec-driven trail from idea to a testable,
> secured, traceable plan. Status below is a worked example (specs complete
> through phase 7; implementation left to the reader's stack).

- **Mode:** full
- **Owner (PM):** A. Rahman · **Tech lead:** D. Putri
- **Problem (one sentence):** Shoppers who aren't ready to buy have no way to
  remember or share products they like, so they leave and don't come back.
- **Status:** speccing → (ready to build)

## Gate board
_A gate may not be ✅ until its exit condition holds._

| # | Phase | Gate | State |
|---|-------|------|-------|
| 0 | Discover | problem confirmed in one sentence | ✅ |
| 1 | PRD | every REQ has user + why + acceptance criteria | ✅ |
| 2 | Diagrams | context + DFD + key sequences exist | ✅ |
| 3 | FSD | every REQ ↔ FSD; error flows enumerated | ✅ |
| 4 | Architecture | style + stack + topology decided (ADRs) | ✅ |
| 5 | Security (SSDLC) | every High/Critical threat has a control | ✅ |
| 6 | Backlog | tickets tiered + self-contained + traced | ✅ |
| 7 | Test plan | happy+regression+edge+e2e; coverage target set | ✅ |
| 8 | Implement | tickets done red→green→refactor | ⬜ |
| 9 | Verify | coverage ≥ target, review clean, threats re-checked | ⬜ |
| 10 | Ship | traceability matrix green; changelog written | ⬜ |

_States: ⬜ not started · 🟨 in progress · ✅ passed · ⛔ blocked_

## Documents
- [00 Context / glossary](00-context.md)
- [01 PRD](01-prd.md)
- [02 Diagrams](02-diagrams.md)
- [03 FSD](03-fsd.md)
- [04 Architecture](04-architecture.md)
- [05 Threat model](05-threat-model.md)
- [06 Backlog](06-backlog.md)
- [07 Test plan](07-test-plan.md)
- [Traceability matrix](traceability.md)

## ID registry (next free)
| Prefix | Next free |
|--------|-----------|
| REQ- | 009 |
| REQ-NF- | 006 |
| FSD- | 015 |
| ADR- | 006 |
| ADR-FE- | 003 |
| SEC- | 009 |
| TICKET- | 021 |
| TEST- | 034 |

## Open decisions / risks
- Share-link privacy model: link-with-token vs. named recipients. **Decided:**
  unguessable token, revocable, no PII in URL (see ADR-006, SEC-002).
- Wishlist size cap deferred to v2 (REQ-NF-003 sets a soft guard).
