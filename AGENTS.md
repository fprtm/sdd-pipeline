# SDD Pipeline v2.1.1 — Spec in Front, Judgment Behind

You are operating under SDD Pipeline. Read `skills/orchestrator/SKILL.md` for full instructions.

## Quick Reference

SDD Pipeline gives humans control over — and trust in — AI-generated code through three phases:

**THINK** (before coding): Clarify requirements, load context, define scope, detect complexity, detect SDLC methodology, analyze architecture, threat-model sensitive flows, design the schema/UX when relevant, offer SDD Grill for casual decisions before they lock in.
**BUILD** (during coding): Decompose large tasks into vertical-slice tickets (tiered T1/T2/T3, global TICKET-xxx ids), write the test plan, generate docs (FSD/SDS/PRD/ERD/DoD), apply constraints, enforce change plan, detect anti-patterns, guard execution, commit traceably (git-workflow).
**PROVE** (after coding): Verify correctness (types/tests/lint/spec-conformance), test adversarially, check security against SEC-xxx controls, run the coverage gate honestly, browser-verify UI Must-journeys, report with blind spots — then the judgment gate: weakest point named, hallucination-risk zones flagged, security escalation for risky zones even when checks pass, comprehension confirmed before the task closes.

## Modes

- **prototype**: Speed-first. Minimal guardrails. No plan file, no grill.
- **vibe**: Invisible guardrails. Plan written silently, auto-approved. Stats footer shown.
- **standard**: Balanced. Default. Plan shown, user approves before build. Grill auto-suggested for architecture decisions.
- **strict**: Maximum control. Plan MUST be approved. Checkpoints at every decision. Promotes evidence gates one size-level.
- **emergency**: Fix-first. For outages and urgent bugs. No grill, no plan; gates deferred to the post-fix follow-up.

## Pipeline Flow

```
1. Detect mode, task size, domain, SDLC, architecture
2. Run THINK phase (parallel: elicitation + context + scope + complexity + SDLC
   + architecture; threat-model per the gates table)
3. Check skill composition (recommend external skills if needed)
4. Offer SDD Grill if a consequential decision is about to lock in casually
5. Write plan to docs/sdd/plans/current.md → approval per mode
   (large tasks: decompose into vertical-slice tickets first, work the frontier)
6. Run BUILD phase (test plan + doc generator + constraints + anti-patterns
   + change plan + execution + traceable commits)
7. Run PROVE phase (parallel: verification + adversarial + security + coverage
   + performance; browser QA for UI)
8. Update traceability where it applies, generate report, run the judgment gate,
   log decisions (rule-of-three gated), update glossary, record stats, update index
```

## The Fixed Sequence

Every execution request follows the same order — only depth adapts to size: **ASK** (elicitation/grill per size) → **SPEC** (small: minimal spec + DoD; large: full suite — DoD always exists for small+) → **PLAN** (approval per mode) → **BUILD** → **CHECK**. Never skip from request straight to build. A question ("gimana kalau...?") is discussion, not an execution signal — building starts only on an actual instruction.

## Evidence Gates by Size

Traceability matrix + ship gate: large/full only (medium: inline lite trail; small/micro: skip, DoD still applies). Threat model: mandatory at large/full, zone-triggered otherwise. Coverage gate ≥80% + honesty checks: medium+. Test plan file: medium+. Full table in `skills/orchestrator/SKILL.md`. Whatever applies: announce what ran and what was skipped, with the reason.

## Hard Stops (Every Mode)

- No hardcoded secrets. Ever. This is the one constraint marked `OVERRIDE: none` — unlike every other rule, there's no inform-then-comply path for it: refuse, don't negotiate, not even in emergency mode. See orchestrator Priority Rules 2-3.
- Tests/browser QA run against **local/disposable targets only** — anything pointing at production or unclear: STOP and ask.
- Provisioning, deploying to shared/prod, or anything that costs money: explicit human confirmation first.
- Spawning parallel agents: run `check-parallel-safety.mjs`, confirm the plan with the user first.

## Priority Rules

1. Project CLAUDE.md/AGENTS.md rules override SDD Pipeline defaults.
2. User overrides override constraints — inform of the risk, then comply; never refuse, never nag after acceptance.
3. Emergency overrides everything.
4. Non-coding tasks and pure discussion: skip SDD Pipeline entirely.

## Language

Specs, plans, and user-facing docs follow the user's language. Code-level artifacts are always English: identifiers, JSDoc/comments, commit messages, branch slugs.

## Project Files

All SDD Pipeline project artifacts live in `docs/sdd/` (tree + conventions in the orchestrator; mechanically enforced by `check-file-hygiene.mjs`):
`index.md` (read first) · `config.md` · `glossary.md` · `memory/` (knowledge graph: INDEX.md + linked notes) · `traceability.md` (matrix + ID counters) · `HANDOFF.md` · `stack-guide.md` · `analytics.md` · `insights.md` · `changes/` (one dated self-contained file per small/medium topic) · `decisions/` (005-x.md IS ADR-005) · `design/` (numbered FSD/SDS/PRD/threats/UX — file number IS the spine ID) · `ux-screens/` · `design-system/` · `tickets/` · `test-plans/` · `dod/` · `erd/` · `plans/` · `reports/` · `stats/`

## Skills Location

All skills are in `skills/`, organized by phase:
- `skills/orchestrator/` — main entry point (+ `composition.md`)
- `skills/think/` — elicitation, context-loader, scope-guard, complexity-analyzer, sdlc-detector, arch-analyzer, grill, threat-model, database-design, ux-design, stack-conventions, analytics-design
- `skills/build/` — constraints, anti-patterns, change-plan, execution-guard, model-router, doc-generator, ticket-decomposition, test-plan, git-workflow, infra
- `skills/prove/` — verification, adversarial, security-check, performance-check, coverage-check, browser-qa, report, judgment
- `skills/meta/` — decision-log, comprehension, insight, health-check (+ file-hygiene checker), memory, stats, glossary, traceability (+ checker), handoff
- `skills/modes/` — prototype, vibe, standard, strict, emergency
- `skills/constraints/` — universal, web, cli, mobile, library, api
- `skills/agents/` — orchestration, parallel-work (+ safety checker), model-strategy, subagent-patterns
- `skills/commands/` — the 5 standalone slash-command entry points (brainstorm, discover, design, implement, check)
