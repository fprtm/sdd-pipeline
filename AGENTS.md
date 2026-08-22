# SDD Pipeline v3.0.2 — Spec in Front, Judgment Behind

You are operating under SDD Pipeline. Read `skills/orchestrator/SKILL.md` for full instructions.

## Activation — Repo State Is Authoritative

If `docs/sdd/` exists in this project (any content — `config.md`, `index.md`, `plans/`, `changes/`), **SDD Pipeline is active for every coding task**, regardless of whether this session remembers triggering it. Don't rely on conversational memory alone — check the filesystem. This is cheap (one existence check) and immune to context compaction.

First-time on an existing project (code exists, `docs/sdd/` doesn't): bootstrap `config.md` + `index.md` incrementally on the first task, don't retroactively document the codebase. See orchestrator's "Brownfield Adoption."

## The Fixed Sequence

Every execution request: **ASK → SPEC → PLAN → BUILD → CHECK**. Only depth adapts to size. Never skip from request straight to BUILD for small+ tasks. A question ("gimana kalau...?") is discussion, not an execution signal — building starts on an actual instruction.

Before the first code edit of any task, announce: `Plan written to docs/sdd/...` or `No plan/docs — reason: <...>`. Record skipped gates in stats (`gates_skipped`). See orchestrator's "Plan Transparency."

## Detection — Always Announced

On every task, detect and announce:
- **Mode**: prototype / vibe / standard / strict / emergency
- **Size**: micro / small / medium / large
- **Domain**: web / cli / mobile / library / api
- **SDLC**: scrum / kanban / waterfall / solo — **always detected, every mode including prototype**. Announce it: `SDLC: kanban (detected from ...)`. Silent detection is invisible work.

## Tickets — Vertical Slices, Always Offered

Large tasks get vertical-slice decomposition (never layer-splits) with blocking edges, even in prototype mode (lightweight tickets: title + what-to-build + files + blockers). Before writing tickets, ask: **local files only** (`docs/sdd/tickets/`) or **also mirror to GitHub Issues**? Local is always the SSOT; GitHub is a mirror, never a replacement.

## Three Phases

**THINK** (before coding): Clarify requirements, load context, define scope, detect complexity, detect SDLC, analyze architecture, threat-model sensitive flows, design schema/UX when relevant, offer SDD Grill for casual decisions before they lock in.
**BUILD** (during coding): Decompose large tasks into vertical-slice tickets (tiered T1/T2/T3, global TICKET-xxx ids), write test plan, generate docs (FSD/SDS/PRD/ERD/DoD), apply constraints, enforce change plan, detect anti-patterns, guard execution, commit traceably.
**PROVE** (after coding): Verify correctness (types/tests/lint/spec-conformance), test adversarially, check security against SEC-xxx controls, run coverage gate honestly, browser-verify UI Must-journeys, report with blind spots — then judgment gate: weakest point named, security escalation for risky zones even when checks pass, comprehension confirmed.

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

Entry point: `skills/orchestrator/SKILL.md` (+ `composition.md`). 5 manual commands: `skills/commands/` (brainstorm, discover, design, implement, check). 54 reference modules under `skills/think/`, `skills/build/`, `skills/prove/`, `skills/meta/`, `skills/modes/`, `skills/constraints/`, `skills/agents/` — loaded by path when needed, never all at once.
