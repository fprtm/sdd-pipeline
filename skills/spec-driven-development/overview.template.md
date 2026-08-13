# <Project> — SDD Overview & Index

> **Plain-language summary:** _one paragraph: what this project is and where it
> stands overall._

- **Interaction mode:** autopilot | copilot
- **Owner (PM):** <name> · **Tech lead:** <name>

<!--
  THIS FILE IS THIN. It is the INDEX + global ID registry, not a place to append
  every topic's brief or board.
  - LITE / brownfield (many changes over time): fill ONLY the "Topic index" table
    below — one row per change. Each change's brief, gate board, and IDs live in
    its own self-contained docs/sdd/changes/YYYY-MM-DD-<topic>.md (see
    change.template.md). This keeps two sessions from editing the same file and
    stops this file from ballooning.
  - FULL build (one cohesive product): use the "Gate board (full build)" section
    instead — it's one build, so one shared board is correct.
  Read protocol: read this index first, match your task to a row by its
  one-line description, then open ONLY that file.
-->

## Topic index (lite / ongoing changes)
_One row per change. The `description` is the relevance hook — a reader decides
from here whether to open the file. Adding a topic = adding one row (no conflict)._

| Date | Topic file | Description (one line) | Status | Branch |
|------|-----------|------------------------|--------|--------|
| YYYY-MM-DD | [changes/YYYY-MM-DD-<topic>.md](changes/YYYY-MM-DD-<topic>.md) | <what it is> | building | feat/<slug> |

## Gate board (full build only — one cohesive product)
_Use this section only for a single full-mode product build; for ongoing lite
changes, leave it and use each topic file's own mini board instead.
A gate may not be ✅ until its exit condition holds._

| # | Phase | Gate | State |
|---|-------|------|-------|
| 0 | Discover | problem confirmed in one sentence; 9 discovery Qs answered | ⬜ |
| 1 | PRD | every REQ has user + why + acceptance criteria | ⬜ |
| 2 | Diagrams | context + DFD + key sequences exist | ⬜ |
| 3 | FSD | every REQ ↔ FSD; error flows enumerated | ⬜ |
| 4 | Architecture | style + stack + topology decided (ADRs) | ⬜ |
| 5 | Security (SSDLC) | every High/Critical threat has a control | ⬜ |
| 6 | Backlog | tickets tiered + self-contained + traced | ⬜ |
| 7 | Test plan | happy+regression+edge+e2e; coverage target set | ⬜ |
| 8 | Implement | tickets done red→green→refactor | ⬜ |
| 9 | Infra & delivery | CI+gates early; IaC, secrets, observability, deploy+rollback | ⬜ |
| 10 | Verify | coverage ≥ target, review clean, threats re-checked | ⬜ |
| 11 | Ship | traceability matrix green; deployed + smoke-checked | ⬜ |

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
