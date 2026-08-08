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
  00-overview.md         # feature brief + gate board + ID registry (this skill)
  00-context.md          # ubiquitous language / glossary (domain-modeling)
  01-prd.md              # to-prd
  02-diagrams.md         # to-diagrams (context, DFD, sequence, ERD)
  03-fsd.md              # to-fsd
  04-architecture.md     # arch-decision (ADRs + stack)
  05-threat-model.md     # threat-model (SSDLC)
  06-backlog.md          # backlog-leveling (tiered tickets)
  07-test-plan.md        # test-plan
  08-delivery.md         # infra: environments, pipeline, runbook, SLOs (optional doc)
  traceability.md        # the matrix — always current
```

The `infra` phase also produces real files in the repo (CI config, IaC,
deploy scripts) — `08-delivery.md` is the human-readable index/runbook for them.

## The phases and their gates

First, create `docs/sdd/00-overview.md` from `templates/overview.template.md`:
the feature brief, the **gate board**, and the **ID registry**. This is the
tech-lead dashboard — update the gate board's state column as you enter and exit
each phase (⬜→🟨→✅, or ⛔ with a reason), and bump the ID registry's "next free"
counters whenever you allocate an ID. Keep it current; it is how a human sees
status at a glance.

Then run the phases in order. **A gate that fails blocks the next phase** — say
so plainly, mark it ⛔ on the board, and stop; do not sneak forward.

| # | Phase | Skill to invoke | Exit gate (must be true to proceed) |
|---|-------|-----------------|-------------------------------------|
| 0 | Discover | `discovery` (+ `grill-me`/`brainstorming` if present) | Problem stated in one sentence the user agrees with; the 9 discovery questions answered (gaps recorded as assumptions) |
| 1 | Product spec | `to-prd` | Every REQ has a user, a why, and acceptance criteria |
| 2 | Model & visualize | `domain-modeling` (if present) + `to-diagrams` | Glossary agreed; context + DFD + key sequence diagrams exist |
| 3 | Functional spec | `to-fsd` | Every REQ maps to ≥1 FSD; no FSD is orphaned |
| 4 | **Architecture gate** | `arch-decision` | Arch style + stack + topology (FE/BE) chosen with ADRs; user signed off (or agent chose the most robust/scalable/maintainable default and said so) |
| 5 | **Security gate (SSDLC)** | `threat-model` | Each data flow threat-modeled; every High/Critical threat has a control (SEC-xxx) |
| 6 | Backlog | `backlog-leveling` | Tickets tiered (T1/T2/T3), each traces to an FSD, each has acceptance criteria a junior/cheap model can execute |
| 7 | Test plan | `test-plan` | Happy + regression + edge + e2e cases defined; coverage target set (default ≥80%) |
| 8 | Implement | `implement` (or installed `tdd`/`executing-plans`) | Work one ticket at a time, red→green→refactor; each ticket's tests pass |
| 9 | Infra & delivery | `infra` | CI + coverage/security gates set up (early); IaC, envs, secrets, observability, deploy+rollback ready |
| 10 | **Verify gate** | `coverage-check` + `code-review` + re-check `threat-model` | Tests pass, coverage ≥ target, review clean, no unmitigated High/Critical threat |
| 11 | Ship | `finishing-a-development-branch` / `handoff` (if present) | Traceability matrix green; changelog written; deployed + smoke-checked |

> Phase 9 (`infra`) is partly *early*: stand up the CI pipeline and the coverage +
> security gates at the **start** of implementation so every ticket lands green;
> provision and deploy near the end. It's listed at 9 for reading order, not to
> imply CI waits until implementation is finished.

## How to route

- Prefer skills that already exist in the environment. This pack ships the
  phases most collections lack: `discovery`, `to-prd`, `to-diagrams`, `to-fsd`,
  `arch-decision`, `threat-model`, `backlog-leveling`, `test-plan`, `implement`,
  `infra`, `coverage-check`, `traceability`. For debugging, code review,
  planning, worktrees, grilling, and finishing branches, **defer to the user's
  installed skills** (e.g. mattpocock/skills or superpowers) when present — and
  for `implement` too, prefer a dedicated TDD skill if one is installed. If none
  is installed, do the phase inline using these skills / ordinary good practice.
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

## Modes

Ask the user how they want to work. There are two independent choices:
**interaction mode** (how much the agent drives) and **size** (how heavy the
ceremony is). Neither ever removes a gate or the deep requirement collection —
they change cadence and weight, not rigor.

### Interaction mode

- **Autopilot** — the agent runs the whole pipeline as an autonomous team with
  minimal back-and-forth. Because no human tech lead is in the loop, requirement
  collection must be **exhaustive up front**: run `discovery` deeply and **batch
  all questions** into as few rounds as possible. At every gate, if the user
  hasn't decided, choose the most robust/scalable/maintainable default (see
  `arch-decision`), **record it as an explicit assumption**, and proceed. Produce
  every artifact and keep the gate board + traceability current so a human can
  audit afterwards. **Stop only** for (a) truly blocking unknowns, or (b)
  irreversible/outward/destructive actions — provisioning cloud resources,
  deploying, spending money, deleting data, sending things externally — which
  always need explicit human confirmation. Friendly for non-developers (ask about
  goals/users/outcomes in plain language) and developers alike.

- **Copilot** — the agent collaborates with a developer through the **same full
  sequence** and the **same critical info-collection rigor** (discovery and every
  gate still happen), but **pauses at each gate** for review/approval, surfaces
  trade-offs, and defers technical decisions where the developer has a preference.
  Developer-friendly: concise and technical; show the ADRs/tickets/diffs for
  sign-off rather than deciding silently. Use a grilling skill if installed to
  pressure-test decisions.

Both modes cover all phases 0–11. The difference is autonomy and when you pause —
**not** how much you collect or which gates you enforce.

### Size (orthogonal to interaction mode)

- **Full** — new product or subsystem: run every phase at full weight.
- **Lite** — a feature or bugfix: collapse to a one-paragraph PRD → one sequence
  diagram → an FSD bullet list → confirm the existing architecture still holds →
  a quick threat check → 1–3 tickets → test plan → implement → verify. The gates
  still apply; they're just lighter.

### Modular use (no orchestrator)

Any skill here works standalone — invoke `to-prd`, `threat-model`, `test-plan`,
`arch-decision`, etc. directly when you only need that one artifact. You lose the
automatic gating and traceability wiring, so if you want the chain enforced,
route through this orchestrator instead.

Default if the user doesn't say: ask once — "autopilot or copilot?" and "full or
lite?" — then proceed. In autopilot with no answer, assume **autopilot + full**
for a new build, **autopilot + lite** for a small change, and state the assumption.
