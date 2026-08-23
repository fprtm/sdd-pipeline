# SDD Pipeline

**Spec-Driven Development. Spec in front, judgment behind.**

A skill framework that gives you control over — and trust in — AI-generated code. Works with Claude Code, Codex, OpenCode, Cursor, and any agent that reads Markdown.

> **Naming note**: "SDD" here is *Spec-Driven Development* — the framework's name. One of the document types the pipeline generates used to also be called "SDD" (Software Design Document) — same three letters, unrelated meaning, a real collision. That document type is now called **SDS (Software Design Specification)** instead (`docs/sdd/design/{NNN}-{slug}-sds.md`, spine ID `SDS-003`) specifically to avoid it; "SDD" unqualified always means the framework from here on.

## The Problem

AI generates code far faster than a human can review it line by line. Without a system, you end up stacking code you don't fully understand — and "all tests pass" doesn't make you feel safe, because it shouldn't:

| Research finding | Source | What it means |
|---|---|---|
| AI-generated code carries ~1.7x more defects per pull request than human-written code | [GitClear, *AI Copilot Code Quality*, 2025](https://www.gitclear.com/ai_assistant_code_quality_2025_research) | Security-sensitive AI output needs *harder* scrutiny, not equal |
| AI-generated code contains ~2.74x more vulnerabilities than human-written code, with XSS the single worst category | [Veracode, *2025 GenAI Code Security Report*](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/) | Some vulnerability classes are so AI-prone they need a dedicated check, not a general one |
| ~45% of AI-generated code samples contained at least one exploitable vulnerability across 100+ LLMs tested | [Veracode, *2025 GenAI Code Security Report*](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/) | "It passed tests" is not "it's safe" |
| Developers using AI assistants wrote measurably less secure code while reporting *higher* confidence in its security | [Perry et al., *Do Users Write More Insecure Code with AI Assistants?*, Stanford, 2023](https://arxiv.org/pdf/2211.03622) | Confidence after AI assistance is a bias signal, not evidence |

Two more things this pipeline is built around, true by observation rather than a single cited figure: AI output tends to be syntactically clean — the exact surface reviewers use as merge confidence, so neatness has to be explicitly discounted as evidence of correctness — and *comprehension debt* (the gap between code in the repo and code the team actually understands) compounds with every merged change no one can fully explain, working or not.

SDD Pipeline attacks this from both ends:

- **Spec in front** — know *what* you're building before the agent runs: a fixed ask → spec → plan sequence, a Definition of Done on every task, stable IDs linking requirement → spec → security control → ticket → test.
- **Judgment behind** — judge what got built after it runs: a judgment gate grounded in the research above (every report names its weakest point), security escalation for AI output in risky zones even when checks pass, a coverage gate with honesty checks, and a traceability matrix that's mechanically checked for drift and dangling references.

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
- **A coverage gate that resists the easy ways to game it** — ≥80% line+branch is necessary but not sufficient: every FSD error flow tested, every High/Critical SEC control tested, no skipped/`.only`/always-true fake passes, and UI Must-journeys verified in a real browser. Never rounds a fail up to a pass. (It's still an AI-run check reporting on AI-written code — see Limitations below for what that does and doesn't guarantee.)
- **Hard safety stops** — tests and browser QA run against **local/disposable targets only**; anything pointing at production (or unclear) is a full stop, not a guess. Provisioning/deploying/spending always requires explicit human confirmation, in every mode.

### vs. other spec-driven tools

Several other projects also push AI agents toward spec-first work — worth knowing about, and worth being precise about how they differ rather than just asserting "we're better." Based on each project's own public docs as of this writing:

| | [spec-kit](https://github.com/github/spec-kit) (GitHub) | [BMAD-METHOD](https://github.com/bmad-code-org/bmad-method) | [Agent OS](https://buildermethods.com/agent-os) | [Kiro](https://kiro.dev) (AWS) | SDD Pipeline |
|---|---|---|---|---|---|
| Core shape | Spec → Plan → Tasks → Code | Multi-persona agent team (PM/Architect/Dev/QA/...), 4-phase lifecycle | Codebase-standards injection only — explicitly doesn't do spec-writing/task-breakdown | Requirements → Design → Tasks (EARS notation), steering files | THINK → BUILD → **PROVE** |
| Portable across agents | Yes — 30+ agent integrations | Yes, plus web-bundle exports (Gemini Gems, custom GPTs) | Yes — Claude Code, Cursor, Codex, Gemini, Windsurf | No — AWS's own IDE only | Yes — plain Markdown, works with any agent that reads it |
| Post-code judgment gate | Not described in public docs | A QA persona exists as part of the agent team | Out of scope by design | Human-in-the-loop approval of design/tasks, not post-code judgment | Yes — explicit gate: weakest point + hallucination-risk zones + security escalation, even when checks pass |
| Design-time threat modeling tied to a post-code security check | Not described | Not described | Out of scope | Not described | Yes — STRIDE at design time, SEC-xxx controls, re-verified post-code by shared ID |
| Traceability matrix with a ship gate | Traceability via presets/customization, not a described default gate | Handoff artifacts between agents, not a stable-ID matrix | Out of scope | Not described | Yes — `REQ→FSD→SEC→TICKET→TEST`, red row blocks ship at large/full tier |

The honest read: spec-kit and BMAD are strong on the THINK side (spec quality, agent coordination) and don't appear to claim a PROVE-side judgment layer the way this repo does; Agent OS solves a genuinely different, narrower problem (your codebase's own conventions) and composes fine alongside a THINK/PROVE framework rather than competing with one; Kiro's spec workflow is the closest in spirit but is a single-vendor IDE, not a portable skill set. If judgment-after-verification and a ship gate that can't be quietly downgraded aren't what you need, one of the others may fit better — see this repo's own Limitations section below before assuming SDD Pipeline is the stronger choice by default.

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
| `/sdd-pipeline:spec` | Solution shaping | Architecture analysis, specs (FSD/SDS/PRD/ERD), threat model, UX when there are screens; auto-splits large work into tickets. Runs **step by step** — each announced, each confirmed. Spec-only is a complete deliverable — it stops there honestly. |
| `/sdd-pipeline:implement` | Time to build | Executes an existing plan/spec/ticket with build-time guardrails |
| `/sdd-pipeline:check` | Prove it | Adaptive QA: verifies a fresh change, audits the codebase otherwise — ends with the impact summary |

## Project File Structure

```
docs/sdd/
├── index.md              # Lightweight relationship graph — read this first
├── config.md             # Project settings, mode, SDLC, constraints
├── glossary.md           # Domain terms — canonical meaning + rejected synonyms
├── memory/               # Knowledge graph: INDEX.md (map) + one linked note per durable fact
├── traceability.md       # REQ→FSD→SEC→TICKET→TEST matrix + ID counters (large/full)
├── HANDOFF.md · stack-guide.md · analytics.md · insights.md
├── changes/              # Small/medium work: ONE dated self-contained file per topic
├── decisions/            # One file per decision (rule-of-three gated) — 005-x.md IS ADR-005
├── design/               # FSD/SDS/PRD/threat models/UX (numbered — file number IS the spine ID)
├── ux-screens/           # One file per user journey, priority-tagged
├── design-system/design.md   # UI entry doc — direction, tokens, screen inventory (when there's a UI)
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

## Limitations

Read this before trusting any of the guarantees above at face value:

- **Most of this is markdown instructions, not code.** Only three things in this repo are actually executed and enforced mechanically: `check-traceability.mjs`, `check-file-hygiene.mjs`, and `check-parallel-safety.mjs`. Everything else — the phases, the gates, the judgment prompts, the "never skip this" rules — is prose an LLM agent reads and (with high but not perfect reliability) follows. A markdown rule is a strong steer, not a guarantee, the same way any instruction to any agent is.
- **The judgment gate is self-reported.** The same agent that wrote the code writes its own "weakest point" and runs its own coverage/traceability checks. The mechanical checkers catch structural problems (broken references, missing frontmatter, drifted IDs, file-overlap) — they don't independently re-verify that a test the matrix marks 🟢 actually passes, or that a reported "weakest point" is the *real* one.
- **The stats footer is self-measured, not audited.** "N anti-patterns caught" is the agent's own count of its own session, not something externally validated.
- **No benchmark shows this pipeline reduces the vulnerability rate cited above.** The research table motivates *why* a judgment layer matters; it isn't evidence that this specific implementation moves that number. Treat it as a structured way to apply scrutiny, not a proven fix.
- **The hard floor is small and worth knowing by name**: local-only test/browser targets, human confirmation before spend/prod/parallel-agent-spawn, and the non-negotiable "no hardcoded secrets" constraint (see AGENTS.md's Hard Stops). Everything else is a strong default that a sufficiently insistent user, or a sufficiently confused agent, can end up working around.

## Philosophy

> Human at the beginning (direction). Agent in the middle (execution). Human at the end (judgment). The spec makes the middle controllable; the judgment gate makes the end trustworthy.

## v2 — A New Engine

v2.0.0 is a full engine replacement, not an upgrade: the adaptive-depth, judgment-first machine (developed as "Reins") with the strongest parts of the original gated pipeline absorbed into it — the traceability spine, design-phase threat modeling, the honest coverage gate, LOCAL-only safety stops, and the mechanical checkers. v0.33.0 was the last release of the old 11-phase architecture; it remains available in git history.

## Acknowledgments

Several interaction patterns — the frontier/round interview mechanic (SDD Grill), the rule-of-three decision gate, durable spec formatting, and architecture judgment heuristics (deletion test, adapter-count rule) — were adapted from design patterns in [mattpocock-skills](https://github.com/mattpocock) (grilling, domain-modeling, codebase-design, to-spec). Reimplemented natively with SDD Pipeline's own judgment engines behind the recommendations, not forked.

## License

MIT
