# <Feature / Release> — SDD Overview

> **Plain-language summary:** _one paragraph: what this is and where it stands._

- **Mode:** full | lite
- **Owner (PM):** <name> · **Tech lead:** <name>
- **Problem (one sentence):**
- **Status:** discovery | speccing | building | verifying | shipped

## Gate board
_The tech-lead dashboard. A gate may not be ✅ until its exit condition holds._

| # | Phase | Gate | State |
|---|-------|------|-------|
| 0 | Discover | problem confirmed in one sentence | ⬜ |
| 1 | PRD | every REQ has user + why + acceptance criteria | ⬜ |
| 2 | Diagrams | context + DFD + key sequences exist | ⬜ |
| 3 | FSD | every REQ ↔ FSD; error flows enumerated | ⬜ |
| 4 | Architecture | style + stack + topology decided (ADRs) | ⬜ |
| 5 | Security (SSDLC) | every High/Critical threat has a control | ⬜ |
| 6 | Backlog | tickets tiered + self-contained + traced | ⬜ |
| 7 | Test plan | happy+regression+edge+e2e; coverage target set | ⬜ |
| 8 | Implement | tickets done red→green→refactor | ⬜ |
| 9 | Verify | coverage ≥ target, review clean, threats re-checked | ⬜ |
| 10 | Ship | traceability matrix green; changelog written | ⬜ |

_States: ⬜ not started · 🟨 in progress · ✅ passed · ⛔ blocked (note why)_

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
_Prevents collisions, especially when work is fanned out to parallel agents.
Reserve a range before delegating; never let two agents allocate the same ID._

| Prefix | Next free |
|--------|-----------|
| REQ- | 001 |
| REQ-NF- | 001 |
| FSD- | 001 |
| ADR- | 001 |
| ADR-FE- | 001 |
| SEC- | 001 |
| TICKET- | 001 |
| TEST- | 001 |

## Open decisions / risks
-
