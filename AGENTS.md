# SDD Pipeline v6.1.0 — Spec in Front, Judgment Behind

You are operating under SDD Pipeline. Read `skills/orchestrator/SKILL.md` for full instructions.

## Activation — Repo State Is Authoritative

If `docs/sdd/` exists in this project (any content — `config.md`, `index.md`, `plans/`, `changes/`), **SDD Pipeline is active for every coding task**, regardless of whether this session remembers triggering it. Don't rely on conversational memory alone — check the filesystem. This is cheap (one existence check) and immune to context compaction.

First-time on an existing project (code exists, `docs/sdd/` doesn't): bootstrap `config.md` + `index.md` incrementally on the first task, don't retroactively document the codebase. See orchestrator's "Brownfield Adoption."

## The Fixed Sequence

Every execution request: **ASK → SPEC → PLAN → BUILD → CHECK**. Only depth adapts to size. Never skip from request straight to BUILD for small+ tasks. A question ("gimana kalau...?") is discussion, not an execution signal — building starts on an actual instruction.

Before the first code edit of any task, announce the written record: `Change file written to docs/sdd/changes/...` (small/medium), `Tickets written to docs/sdd/specs/{NNN}-{slug}/tickets/... — N tickets` (large), or `No written record — reason: <...>`. There is no `plans/current.md` any more — for large work the approved ticket breakdown *is* the plan. Record skipped gates in stats (`gates_skipped`). See orchestrator's "Plan Approval Flow."

**ASK is product discovery, not a warm-up.** `/sdd-pipeline:discover` opens as plain conversation while the idea is fog, announces its shift, then works five seats in dependency order: **Why · Constraints · What · Data · Technical**, every question carrying a recommendation, council over each hard decision and once over the whole shape. A seat is skipped only when the product has no such surface (no screens → no UI questions) — **never because of mode, size, or urgency**.

**SPEC deliberates before it documents.** Every step that produces a document first **deliberates** the domain with the user — grill's frontier/round mechanics, the deliberation agenda from the relevant think/ skill, every question carrying a recommendation — then writes the artifact from what was settled. Discover settled WHICH (entities, stack, approach); spec's deliberation settles HOW (entity relationships, code patterns, interaction states, cascade behavior, deep stack choices). A document written without deliberation is the agent making design decisions alone. Deliberation topics are domain-gated, not mode-gated: mode controls depth (rounds), not whether the topic is raised. **Deliberation at headline level is not deliberation** — each agenda topic has a depth requirement (e.g., DB: present every table with columns, every FK with cascade; architecture: present every endpoint with typed contract; UX: present every screen with interaction table). A topic labeled but not detailed stays in the frontier. See `skills/commands/spec/SKILL.md`.

**Fidelity check — the document must transcribe what was settled, not summarize it.** After writing any document that followed a deliberation, re-read every settled decision against what was actually written: do the specific values (cascade rule, status code, threshold, field name) match, or did writing from "shared understanding" quietly substitute a plausible default? This is the step that keeps deep deliberation from being undone by a lossy write-up — skipping it is how a thoroughly-discussed decision still ends up wrong on paper. Same check applies at verification (Layer 4 Spec Conformance now checks code against the spec's *specific decided values*, not just "a test exists") and at the judgment gate's Plausibility Discount ("does every value here trace to something settled, or did I fill in something that sounds right?"). See `skills/commands/spec/SKILL.md`, `skills/build/doc-generator/SKILL.md`, `skills/prove/verification/SKILL.md`.

**A spec bundle ends with a reading-order guide, not just a filename list.** A `large` feature can produce 15-20 files (FSD/SDS/ERD/threats/UX/tickets) — a run that reports "Generated: fsd.md, sds.md, erd.md..." hands the human a pile with no map. Every run producing 2+ documents for one feature closes with an explicit "How to Review This Feature" order (FSD → SDS → ERD/threats/UX as needed → tickets in dependency order), skipping doc types that weren't generated. `large` scope writes it permanently into `specs/{NNN}-{slug}/tickets/00-index.md` (the feature's actual entry point); smaller runs state it once in the closing chat message. See `skills/build/ticket-decomposition/SKILL.md`'s "The Feature Index" and `skills/commands/spec/SKILL.md`'s "How to Review This Feature."

**One folder per feature — `docs/sdd/specs/{NNN}-{slug}/`, not five directories that share a number.** Every document tied to a feature's spine number — `fsd.md`, `sds.md`, `prd.md`, `threats.md`, `ux.md`, `erd.md`, `tests.md`, `dod.md`, plus a `tickets/` subdirectory for `large` scope — lives inside one folder, bare filenames (no repeated `{NNN}-{slug}-` prefix on each). `design-system/` (project-wide visual design: `design.md` + `ux-screens/`) is unaffected — flows and the design system aren't owned by one feature the way a spec bundle is. **The folder is found by number, never by regenerating the slug**: a new document for an existing feature globs `specs/{NNN}-*` for the already-known number; it never independently reconstructs the slug and searches by full name, because a re-derived slug can drift ("employee-branch-backup" vs "branch-backup-employee") and silently create a duplicate folder for the same feature. `check-file-hygiene.mjs` catches this mechanically — two `specs/` folders sharing a leading number with different slugs is flagged as a collision. See `skills/build/doc-generator/SKILL.md`'s "Number-First Lookup."

## Detection — Always Announced

On every task, detect and announce:
- **Mode**: prototype / vibe / standard / strict / emergency. Dials *depth and visibility*, never *coverage*. **Tone is not a signal** — `vibe`/`prototype` only on request or via `config.md`.
- **Size**: micro / small / medium / large
- **Domain**: web / cli / mobile / library / api
- **SDLC**: two layers — the **model** (waterfall / iterative / v-model / spiral / agile / devops / rad / incremental / solo) and, only when the model is agile, the **framework** (scrum / kanban / scrumban / xp). Scrum/Kanban are Agile frameworks, not SDLC models — never reported as if they were the model itself. **Always detected, every mode including prototype**, always with a `sdlc-reason`. Announce it: `SDLC: agile/kanban (detected from ...) — why: ...`. Silent detection is invisible work.

## Tickets — Vertical Slices, Always Offered

Large tasks get vertical-slice decomposition (never layer-splits) with blocking edges, even in prototype mode (lightweight tickets: title + what-to-build + files + blockers). Before writing tickets, ask: **local files only** (`docs/sdd/specs/{NNN}-{slug}/tickets/`) or **also mirror to GitHub Issues**? Local is always the SSOT; GitHub is a mirror, never a replacement.

## Three Phases

**THINK** (before coding): Clarify requirements, load context, define scope, detect complexity, detect SDLC, analyze architecture, threat-model sensitive flows, design schema/UX when relevant, offer SDD Grill for casual decisions before they lock in.
**BUILD** (during coding): Decompose large tasks into vertical-slice tickets (tiered T1/T2/T3, global TICKET-xxx ids), write test plan, generate docs (FSD/SDS/PRD/ERD/DoD), apply constraints, enforce change plan, detect anti-patterns, guard execution, commit traceably.
**PROVE** (after coding): Verify correctness (types/tests/lint/spec-conformance), test adversarially, check security against SEC-xxx controls, run coverage gate honestly, browser-verify UI Must-journeys, report with blind spots — then judgment gate: weakest point named, security escalation for risky zones even when checks pass, comprehension confirmed.

## The 10x Review Gap — Three Mechanisms

AI generates code far faster than a developer can review it. Spec-in-front and judgment-behind reduce what goes WRONG but don't reduce the REVIEW BURDEN. Three mechanisms close the gap:

1. **Tests before code**: test code is generated from the spec BEFORE implementation (medium+ standard/strict). The developer reviews 50-100 lines of intent-expressing tests instead of 500 lines of implementation. Tests pass = spec mechanically verified.
2. **Reviewable chunks**: implementation is broken into semantic chunks (one behavior, one function), each announced with spec mapping and trust tier. 🔴 chunks (auth/payment/trust-boundary) pause for acknowledgment. 500-line diff → five focused chunks.
3. **Review guide with trust tiers**: every report includes a trust-tiered map — 🔴 DEEP REVIEW / 🟡 VERIFY INTENT / 🟢 LIGHT SCAN — each item mapping to its spec, naming what to verify, stating its test coverage. Review debt (unacknowledged 🔴 items from prior tasks) is tracked and stated.

## Tests — Executed, Not Just Written

- **Every result comes from a command that actually ran**, quoted from its real output. A suite that was generated but not executed is `SKIPPED`, never `PASS`. No coverage figure that no command produced.
- **Every flow gets a positive AND a negative case.** A plan with only happy paths is a demo script; the negative side is where defects live and the side an agent under-produces by default.
- **Multi-perspective coverage: every actor role, every state that matters.** If the FSD defines admin/user/anonymous, tests from only one role = gap. Each flow gets a condition matrix (entity state, ownership, data volume, timing) and tests where behavior changes. "A logged-in user" is not enough when three roles exist.
- **Security tests are executable, not just checklists.** Every High/Critical SEC-xxx control becomes a runnable test that attempts the attack and asserts it fails correctly (401/403, not 500). A SEC control without a test is a claim without evidence.
- **Performance tests measure, not just scan.** Endpoints with REQ-NF targets get executable response-time/query-count assertions with realistic data volumes (not empty databases). Static pattern detection is necessary but insufficient.
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
