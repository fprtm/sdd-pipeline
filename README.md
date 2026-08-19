# SDD Pipeline

**Spec in front, judgment behind.**

A skill framework that gives you control over — and trust in — AI-generated code. Works with Claude Code, Codex, OpenCode, Cursor, and any agent that reads Markdown.

## The Problem

AI codes 5–10x faster than you can review. Without a system, you end up stacking code you don't fully understand — and "all tests pass" doesn't make you feel safe, because it shouldn't:

| Research finding (2025–2026) | What it means |
|------------------------------|---------------|
| AI code carries ~1.7x more defects than human code (XSS 2.74x, password mishandling 1.88x) | Security-sensitive AI output needs *harder* scrutiny, not equal |
| ~45% of AI-generated code contains at least one vulnerability | "It passed tests" is not "it's safe" |
| Developers using AI write less secure code while feeling *more* confident | Confidence after AI assistance is a bias signal, not evidence |
| AI output is syntactically clean — the exact surface reviewers use as merge confidence | Neatness must be explicitly discounted as evidence of correctness |
| AI generates 140–200 lines/min vs. a fraction of that in human review capacity | Unthrottled generation turns review into theater |
| Comprehension debt: the gap between code in the repo and code the team understands | Every merged change no one can explain is debt, working or not |

SDD Pipeline attacks this from both ends:

- **Spec in front** — know *what* you're building before the agent runs: a fixed ask → spec → plan sequence, a Definition of Done on every task, stable IDs linking requirement → spec → security control → ticket → test.
- **Judgment behind** — judge what got built after it runs: a research-grounded judgment gate (every report names its weakest point), security escalation for AI output in risky zones even when checks pass, a coverage gate with honesty checks, and a traceability matrix that is not allowed to lie.

## How It Works

```
THINK                  BUILD                  PROVE
├ Elicitation          ├ Ticket Decomposition ├ Verification
├ Context Loading      ├ Doc Generator        ├ Adversarial Testing
├ Scope Guard          ├ Test Plan            ├ Security Check
├ Complexity Analysis  ├ Constraints          ├ Coverage Gate
├ SDLC Detection       ├ Anti-Patterns        ├ Browser QA (UI)
├ Architecture         ├ Change Plan          ├ Performance Check
├ Threat Model         ├ Git Workflow         └ Report + JUDGMENT GATE
└ SDD Grill            └ Execution Guard
```

The sequence is **fixed** — ask → spec → plan → build → check, every time — and only the *depth* adapts to task size. A typo gets zero ceremony; a new payment system gets the full evidence trail. Skipping a step is always announced, never silent.

## What Makes It Different

- **AI-output judgment gate** — verification proves the code *runs*; judgment proves a human *understands and accepts* it. Every judged report names its weakest point and hallucination-risk zones; AI-generated changes touching auth/input/crypto/SQL get flagged for human eyes **even when all automated checks pass**; generation is throttled to review capacity so comprehension debt doesn't pile up.
- **Plan before code, DoD always** — a plan file is written and (per mode) approved before BUILD; every task small+ gets a Definition of Done checklist. "Done" is never whatever the agent felt like stopping at.
- **Traceability spine with a ship gate** — stable IDs (`REQ → FSD → ADR/SEC → TICKET → TEST`) in a matrix that makes gaps visible: an untested requirement is a red row, not a hidden one. Large/full builds may not ship while a Must/Should row is red — and the gate is never quietly downgraded.
- **Mechanical enforcement, not just prose** — three zero-dependency scripts catch what markdown instructions can't guarantee: `check-traceability.mjs` (drift, broken refs, freelance tickets/tests), `check-file-hygiene.mjs` (docs-tree conventions), `check-parallel-safety.mjs` (file-overlap before parallel agents spawn). All CI-wireable.
- **Security shifted left AND checked right** — a lightweight STRIDE threat model at design time (SEC-xxx controls with owners), re-verified by the post-code security checklist and required tests for every High/Critical control.
- **A coverage gate that can't be gamed** — ≥80% line+branch is necessary but not sufficient: every FSD error flow tested, every High/Critical SEC control tested, no skipped/`.only`/always-true fake passes, and UI Must-journeys verified in a real browser. Never rounds a fail up to a pass.
- **Hard safety stops** — tests and browser QA run against **local/disposable targets only**; anything pointing at production (or unclear) is a full stop, not a guess. Provisioning/deploying/spending always requires explicit human confirmation, in every mode.

## Supporting Machinery

- **5 modes** — prototype / vibe / standard / strict / emergency, auto-detected, each dialing ceremony up or down without ever dropping a gate silently.
- **Adaptive depth + evidence gates by size** — micro/small/medium/large each get a defined set of active gates (documented in the orchestrator), so a bugfix never drowns in ceremony and a product never ships unproven.
- **SDD Grill** — a frontier/round interview that interrogates consequential decisions *before* they lock in, backed by the framework's own judgment engines.
- **Architecture analysis** — pattern detection, deletion test, adapter-count rule, design-it-twice for high-stakes calls; proposals always pin down the actual directory tree and the FE↔BE contract per endpoint.
- **Vertical-slice tickets, tiered T1/T2/T3** — independently demoable slices with computed blocking edges; tiers route trivial work to cheap models and risky work to strong ones. Local ticket files are the SSOT; mirroring to GitHub Issues is optional (asked, never assumed).
- **Parallel work on one repo** — git worktree isolation, a deterministic file-overlap check, ticket claiming, dependency-ordered merges. Always confirmed before spawning; hard cap 6 agents.
- **SDLC awareness, decision log (rule-of-three), domain glossary, project memory, session persistence, stats** — the context machinery that keeps the pipeline consistent across a whole session and a whole team.
- **UX design as process** — direction confirmed with concrete previews, design tokens as SSOT (WCAG AA), index-first flow files, and empty/loading/error/success states required per screen (they become FSD error flows, then tests).
- **Database design, stack conventions, infra, analytics** — the schema designed before it's built (additive-first migrations), the stack's official conventions version-pinned into an enforceable guide, CI/IaC/observability wired to the same gates, and product metrics tied to requirements instead of vanity.

## Slash Commands

Most of the time the orchestrator works invisibly — describe the work and it runs the fixed sequence at the right depth. Reach for a command to *start* at a specific phase:

| Command | When | What it does |
|---------|------|---------------|
| `/sdd-pipeline:brainstorm` | Idea is still fog | Open conversation + research to ripen a vague idea. Pipeline stays off. |
| `/sdd-pipeline:discover` | Decisions forming | Interrogates a decision before it locks in — frontier/round interview + council/devil's advocate |
| `/sdd-pipeline:design` | Solution shaping | Architecture analysis and/or specs; auto-splits large work into tickets. Design-only is a complete deliverable — it stops there honestly. |
| `/sdd-pipeline:implement` | Time to build | Executes an existing plan/spec/ticket with build-time guardrails |
| `/sdd-pipeline:check` | Prove it | Adaptive QA: verifies a fresh change, audits the codebase otherwise — ends with the impact summary |

## Project File Structure

```
docs/sdd/
├── index.md              # Lightweight relationship graph — read this first
├── config.md             # Project settings, mode, SDLC, constraints
├── memory.md             # Saved decisions · glossary.md — domain terms
├── traceability.md       # REQ→FSD→SEC→TICKET→TEST matrix + ID counters (large/full)
├── changes/              # Small/medium work: ONE dated self-contained file per topic
├── decisions/            # One file per decision (rule-of-three gated) — 005-x.md IS ADR-005
├── design/               # FSD/SDD/PRD/threat models/UX (numbered — file number IS the spine ID)
├── ux-screens/           # One priority-tagged file per UI flow
├── tickets/              # Vertical-slice tickets with global TICKET-xxx ids
├── test-plans/ dod/ erd/ plans/ reports/ stats/
```

## Install

Fastest path, inside Claude Code:

```
/plugin marketplace add fprtm/sdd-pipeline
/plugin install sdd-pipeline
```

For Codex/OpenCode/Cursor, project-scoped installs, partial installs (`--only`), enforcement hooks, CI, updating, or uninstalling — see **[docs/INSTALL.md](docs/INSTALL.md)**.

Project configuration:

```bash
./install/install.sh --agent claude --with-templates
# or manually: mkdir -p docs/sdd && cp templates/sdd.config.md docs/sdd/config.md
```

Validate the skill files:

```bash
./scripts/validate-skills.sh
```

## Examples

See `docs/examples/` for step-by-step walkthroughs:
- [Building a Feature](docs/examples/build-feature.md) — standard mode, medium task
- [Fixing a Bug](docs/examples/fix-bug.md) — lightweight pipeline for bug fixes
- [Starting a New Project](docs/examples/new-project.md) — architecture proposal + full doc suite
- [Strict Mode](docs/examples/strict-mode.md) — production payment code with checkpoints

## Skill Composition

SDD Pipeline detects when a task needs capabilities beyond engineering guardrails and recommends external skills (aesthetics → Taste/design skills; TDD → mattpocock-skills:tdd; live docs → context7; browser automation → playwright). The rule: **SDD Pipeline yields on aesthetics and workflow preferences, wins on safety and engineering correctness.**

## What SDD Pipeline Does NOT Do

- **No aesthetic judgment** — compose with a design skill (it will recommend one)
- **No communication style** — compose with persona skills
- **No role-based team enforcement** — shared config via committed `docs/sdd/config.md`, nothing more

## Philosophy

> Human at the beginning (direction). Agent in the middle (execution). Human at the end (judgment). The spec makes the middle controllable; the judgment gate makes the end trustworthy.

## v2 — A New Engine

v2.0.0 is a full engine replacement, not an upgrade: the adaptive-depth, judgment-first machine (developed as "Reins") with the strongest parts of the original gated pipeline absorbed into it — the traceability spine, design-phase threat modeling, the honest coverage gate, LOCAL-only safety stops, and the mechanical checkers. v0.33.0 was the last release of the old 11-phase architecture; it remains available in git history.

## Acknowledgments

Several interaction patterns — the frontier/round interview mechanic (SDD Grill), the rule-of-three decision gate, durable spec formatting, and architecture judgment heuristics (deletion test, adapter-count rule) — were adapted from design patterns in [mattpocock-skills](https://github.com/mattpocock) (grilling, domain-modeling, codebase-design, to-spec). Reimplemented natively with SDD Pipeline's own judgment engines behind the recommendations, not forked.

## License

MIT
