---
name: spec-driven-development
description: >-
  Orchestrator/spine for building a feature (or whole product) spec-first, with
  hard gates. Use when the user wants to go from a rough idea to shipped code in
  a disciplined, traceable way — or says "spec-driven", "SDD", "build this
  properly", "from idea to production". Routes through PRD → diagrams → FSD →
  architecture → security → backlog → test plan → implement → verify → ship, and
  delegates each phase to the right skill.
---

# Spec-Driven Development (the spine)

You are running a **gated, traceable pipeline**. The point is not to produce
documents for their own sake — it is to make sure that by the time code is
written, *what* to build, *how* it is shaped, *how* it is secured, and *how* it
is proven are all decided and linked to each other.

## The prime directive: traceability

Every artifact carries stable IDs, and every ID links upward:

```
REQ-xxx  (PRD)      ──▶ what & why
FSD-xxx  (FSD)      ──▶ traces to REQ-xxx
ADR-xxx  (arch)     ──▶ constrains FSD-xxx
SEC-xxx  (security) ──▶ protects REQ/FSD
TICKET-xxx (backlog)──▶ implements FSD-xxx
TEST-xxx (test plan)──▶ proves FSD-xxx + TICKET-xxx
```

The single source of truth is `docs/sdd/traceability.md`. It must never lie.
If a requirement has no test, that is a gap you surface — not a detail you hide.

## Two-layer rule (dev + non-dev)

Every artifact you produce has, at the top, a **Plain-language summary** (3–6
sentences a non-developer / PM can read) and below it the technical detail.
Never make a stakeholder read a data-flow diagram to learn what a feature does.

## Workspace layout

Create these under the repo (make the folders if missing):

```
docs/sdd/
  00-context.md          # ubiquitous language / glossary (domain-modeling)
  01-prd.md              # to-prd
  02-diagrams.md         # to-diagrams (context, DFD, sequence, ERD)
  03-fsd.md              # to-fsd
  04-architecture.md     # arch-decision (ADRs + stack)
  05-threat-model.md     # threat-model (SSDLC)
  06-backlog.md          # backlog-leveling (tiered tickets)
  07-test-plan.md        # test-plan
  traceability.md        # the matrix — always current
```

## The phases and their gates

Run in order. **A gate that fails blocks the next phase** — say so plainly and
stop; do not sneak forward.

| # | Phase | Skill to invoke | Exit gate (must be true to proceed) |
|---|-------|-----------------|-------------------------------------|
| 0 | Align & discover | `grill-me` / `brainstorming` (if present) | User confirms the problem statement in one sentence |
| 1 | Product spec | `to-prd` | Every REQ has a user, a why, and acceptance criteria |
| 2 | Model & visualize | `domain-modeling` (if present) + `to-diagrams` | Glossary agreed; context + DFD + key sequence diagrams exist |
| 3 | Functional spec | `to-fsd` | Every REQ maps to ≥1 FSD; no FSD is orphaned |
| 4 | **Architecture gate** | `arch-decision` | Arch style + stack chosen with ADRs; user signed off (or agent chose the most robust/scalable/maintainable default and said so) |
| 5 | **Security gate (SSDLC)** | `threat-model` | Each data flow threat-modeled; every High/Critical threat has a control (SEC-xxx) |
| 6 | Backlog | `backlog-leveling` | Tickets tiered (T1/T2/T3), each traces to an FSD, each has acceptance criteria a junior/cheap model can execute |
| 7 | Test plan | `test-plan` | Happy + regression + edge + e2e cases defined; coverage target set (default ≥80%) |
| 8 | Implement | `tdd` + `implement` / `executing-plans` (if present) | Work one ticket at a time, red→green→refactor |
| 9 | **Verify gate** | `coverage-check` + `code-review` + re-check `threat-model` | Tests pass, coverage ≥ target, review clean, no unmitigated High/Critical threat |
| 10 | Ship | `finishing-a-development-branch` / `handoff` (if present) | Traceability matrix 100% green; changelog written |

## How to route

- Prefer skills that already exist in the environment. This pack ships the
  **new** phases (to-prd, to-diagrams, to-fsd, arch-decision, threat-model,
  backlog-leveling, test-plan, coverage-check, traceability). For TDD,
  debugging, code review, planning, worktrees, and finishing branches, **defer
  to the user's installed skills** (e.g. mattpocock/skills or superpowers). If
  none is installed, do the phase inline using ordinary good practice.
- Announce each phase as you enter it, name the gate, and after the phase state
  whether the gate passed.
- After **every** phase that creates or changes an ID, invoke `traceability` to
  update `docs/sdd/traceability.md`.

## Parallelism

Phases 1→7 are mostly sequential (each consumes the previous). Where an agent
runtime supports subagents (e.g. Claude Code), fan out **within** a phase:
draft multiple FSD sections, or write several ticket bodies, in parallel — then
reconcile IDs centrally so the matrix stays consistent. Never let two parallel
agents both allocate IDs; allocate the ID range first, then hand out slices.

## Scaling down

For a tiny change, don't ceremony-bomb the user. Collapse to: one-paragraph PRD
→ one sequence diagram → FSD bullet list → confirm existing architecture still
holds → quick threat check → 1–3 tickets → test plan → implement → verify. The
gates still apply; they just get lighter. Ask the user which mode they want:
**full** (new product/subsystem) or **lite** (feature/bugfix).
