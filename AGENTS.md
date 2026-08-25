# SDD Pipeline v5.2.0 — Spec in Front, Judgment Behind

You are operating under SDD Pipeline. Read `skills/orchestrator/SKILL.md` for full instructions.

## Activation — Repo State Is Authoritative

If `docs/sdd/` exists in this project (any content — `config.md`, `index.md`, `plans/`, `changes/`), **SDD Pipeline is active for every coding task**, regardless of whether this session remembers triggering it. Don't rely on conversational memory alone — check the filesystem. This is cheap (one existence check) and immune to context compaction.

First-time on an existing project (code exists, `docs/sdd/` doesn't): bootstrap `config.md` + `index.md` incrementally on the first task, don't retroactively document the codebase. See orchestrator's "Brownfield Adoption."

## The Fixed Sequence

Every execution request: **ASK → SPEC → PLAN → BUILD → CHECK**. Only depth adapts to size. Never skip from request straight to BUILD for small+ tasks. A question ("gimana kalau...?") is discussion, not an execution signal — building starts on an actual instruction.

Before the first code edit of any task, announce the written record: `Change file written to docs/sdd/changes/...` (small/medium), `Tickets written to docs/sdd/tickets/... — N tickets` (large), or `No written record — reason: <...>`. There is no `plans/current.md` any more — for large work the approved ticket breakdown *is* the plan. Record skipped gates in stats (`gates_skipped`). See orchestrator's "Plan Approval Flow."

**ASK is product discovery, not a warm-up.** `/sdd-pipeline:discover` opens as plain conversation while the idea is fog, announces its shift, then works five seats in dependency order: **Why · Constraints · What · Data · Technical**, every question carrying a recommendation, council over each hard decision and once over the whole shape. A seat is skipped only when the product has no such surface (no screens → no UI questions) — **never because of mode, size, or urgency**.

**SPEC deliberates before it documents.** Every step that produces a document first **deliberates** the domain with the user — grill's frontier/round mechanics, the deliberation agenda from the relevant think/ skill, every question carrying a recommendation — then writes the artifact from what was settled. Discover settled WHICH (entities, stack, approach); spec's deliberation settles HOW (entity relationships, code patterns, interaction states, cascade behavior, deep stack choices). A document written without deliberation is the agent making design decisions alone. Deliberation topics are domain-gated, not mode-gated: mode controls depth (rounds), not whether the topic is raised. See `skills/commands/spec/SKILL.md`.

## Detection — Always Announced

On every task, detect and announce:
- **Mode**: prototype / vibe / standard / strict / emergency. Dials *depth and visibility*, never *coverage*. **Tone is not a signal** — `vibe`/`prototype` only on request or via `config.md`.
- **Size**: micro / small / medium / large
- **Domain**: web / cli / mobile / library / api
- **SDLC**: scrum / kanban / waterfall / solo — **always detected, every mode including prototype**. Announce it: `SDLC: kanban (detected from ...)`. Silent detection is invisible work.

## Tickets — Vertical Slices, Always Offered

Large tasks get vertical-slice decomposition (never layer-splits) with blocking edges, even in prototype mode (lightweight tickets: title + what-to-build + files + blockers). Before writing tickets, ask: **local files only** (`docs/sdd/tickets/`) or **also mirror to GitHub Issues**? Local is always the SSOT; GitHub is a mirror, never a replacement.

## Three Phases

**THINK** (before coding): Clarify requirements, load context, define scope, detect complexity, detect SDLC, analyze architecture, threat-model sensitive flows, design schema/UX when relevant, offer SDD Grill for casual decisions before they lock in.
**BUILD** (during coding): Decompose large tasks into vertical-slice tickets (tiered T1/T2/T3, global TICKET-xxx ids), write test plan, generate docs (FSD/SDS/PRD/ERD/DoD), apply constraints, enforce change plan, detect anti-patterns, guard execution, commit traceably.
**PROVE** (after coding): Verify correctness (types/tests/lint/spec-conformance), test adversarially, check security against SEC-xxx controls, run coverage gate honestly, browser-verify UI Must-journeys, report with blind spots — then judgment gate: weakest point named, security escalation for risky zones even when checks pass, comprehension confirmed.

## Tests — Executed, Not Just Written

- **Every result comes from a command that actually ran**, quoted from its real output. A suite that was generated but not executed is `SKIPPED`, never `PASS`. No coverage figure that no command produced.
- **Every flow gets a positive AND a negative case.** A plan with only happy paths is a demo script; the negative side is where defects live and the side an agent under-produces by default.
- **Coverage ≥80% line+branch is measured in every mode**, at every size above `micro`. Mode dials narration and whether a FAIL blocks — never whether the gate runs. Denominator scales: changed lines at `small`, whole repo at medium+. New logic ships with its tests **in the same change**.
- **UI**: stable `data-testid` on interactive and asserted elements (`constraints/web` W9); browser QA selects role+name first, testid as fallback. Must journeys get **committed Playwright specs** — a live browser run proves it worked once; the committed spec is the smoke/regression net. Greenfield/large: the harness is in scope, ticketed. **Existing repo, small/medium change, no harness → ask first** (set it up / interactive check only / skip and mark unverified). Never install a test harness as a surprise.

## Hard Stops (Every Mode)

- No hardcoded secrets. `OVERRIDE: none` — refuse, don't negotiate.
- Tests/browser QA: **local/disposable targets only**. Production or unclear → STOP and ask.
- Provisioning, deploying, spending money → explicit human confirmation.
- Spawning parallel agents → run `check-parallel-safety.mjs`, confirm with user.

## Priority Rules

1. Project CLAUDE.md/AGENTS.md rules override SDD Pipeline defaults.
2. User overrides: inform of risk, then comply. Never refuse, never nag after acceptance.
3. Emergency overrides everything (except `OVERRIDE: none` rules).
4. Non-coding tasks and pure discussion: skip SDD Pipeline entirely.

## Skills

Entry point: `skills/orchestrator/SKILL.md` (+ `composition.md`). 4 manual commands: `skills/commands/` — **discover** (ASK: absorbed brainstorm in v5.0.0; two gears + five seats), **spec** (SPEC: was `design` before v4.0.0), **implement** (BUILD), **check** (CHECK). 54 reference modules under `skills/think/`, `skills/build/`, `skills/prove/`, `skills/meta/`, `skills/modes/`, `skills/constraints/`, `skills/agents/` — loaded by path when needed, never all at once.
