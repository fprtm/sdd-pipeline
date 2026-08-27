# SDD Pipeline

**Spec-Driven Development. Spec in front, judgment behind.**

A skill framework that gives you control over — and trust in — AI-generated code. Works with Claude Code, Codex, OpenCode, Cursor, and any agent that reads Markdown.

> **Naming note**: "SDD" here is *Spec-Driven Development* — the framework's name. One of the document types the pipeline generates used to also be called "SDD" (Software Design Document) — same three letters, unrelated meaning, a real collision. That document type is now called **SDS (Software Design Specification)** instead (`docs/sdd/specs/{NNN}-{slug}-sds.md`, spine ID `SDS-003`) specifically to avoid it; "SDD" unqualified always means the framework from here on.
>
> **Second naming note**: `docs/sdd/specs/` (the numbered FSD/SDS/PRD/threat-model bundle, none of it visual) is a different directory from `docs/sdd/design-system/` (the actual visual design — tokens, screens, UI patterns). Both used to sit under a directory literally named `design/`, which was the same "design" ambiguity the `/design`→`/spec` command rename fixed in v4.0.0 — just one level down, in the file tree instead of the command name. v5.6.0 renamed the directory too: `specs/` = written specs, `design-system/` = how it looks.

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

## How It Works — The Fixed Sequence

Everything in this framework hangs off five steps, in this order, every time:

```
   ASK    →    SPEC    →    PLAN    →    BUILD    →    CHECK
   what?       write         agree        code          prove
               it down       first        it            it
```

The order is **fixed**. Only the *depth* adapts to task size — a typo gets zero ceremony, a new payment system gets the full evidence trail. **Skipping a step is always announced, never silent**, and the reason is recorded in stats so "why didn't this task get docs" stays answerable later instead of trusted on faith.

| Step | What happens | What it leaves behind | Skip it and… |
|---|---|---|---|
| **ASK** | Product discovery: five seats — **why · constraints · what · data · technical** — worked in dependency order, every question carrying a recommendation, council review at the end. Opens as plain conversation when the idea is still fog, then shifts into decisions. | glossary terms, ADRs | you build the wrong thing, precisely and efficiently |
| **SPEC** | Each domain is **deliberated** with the user before its document is written — database design, architecture, UX, app flows — using grill mechanics, every question carrying a recommendation, held to a **depth requirement per topic** (every table's columns, every FK's cascade, every endpoint's contract, every screen's interactions — not a one-line label), then a **fidelity check** confirms the written document actually matches what was settled, value for value, before it's reported done. Discover settled WHICH; spec settles HOW, then captures it as FSD/SDS/PRD/ERD, threat model, UX, DoD. | `docs/sdd/specs/`, `erd/`, `dod/`, `design-system/design.md` | five answered questions evaporate into the chat, the agent invents design decisions while writing, a topic gets named without concrete detail, or the write-up silently drifts from what was actually agreed |
| **PLAN** | The work order, approved before any code: the ticket breakdown for large work, the change file for small/medium. | `tickets/` (large) or `changes/{date}-{slug}.md` (small/medium) | "done" becomes wherever the agent felt like stopping |
| **BUILD** | Code, under guardrails: constraints, change plan, anti-pattern scan, execution guard, traceable commits. Large work splits into vertical-slice tickets first. | code, commits, `tickets/` | scope drift with no seam to catch it |
| **CHECK** | Types, tests, lint, spec conformance → coverage gate, adversarial, security, performance, browser QA → report → **judgment gate**. | `reports/`, a green (or honestly red) matrix | "all tests pass" mistaken for "it's safe" |

Two rules that make the sequence more than a diagram:

- **Never jump from a request straight to BUILD** for anything above `micro`. Even a crystal-clear request gets step 2 — something written. A clear request with zero written spec is how scope drift starts.
- **A question is not an execution signal.** "What if we used X?" is discussion — answer it, grill it if it's consequential, but don't start building. Building starts on an instruction.

The five steps group into the three phases the skill tree is organized by — roughly **THINK** = ASK + SPEC, **BUILD** = PLAN + BUILD, **PROVE** = CHECK. "Roughly" because SPEC straddles the line: the analysis half (threat model, architecture, UX) lives in `think/`, while the doc-*writing* half (`doc-generator`, `test-plan`) lives in `build/`. The five steps are the sequence you experience; the three phases are how the ~59 skill files are filed.

```
THINK                  BUILD                  PROVE
├ Elicitation          ├ Ticket Decomposition ├ Verification
├ Context Loading      ├ Doc Generator        ├ Adversarial Testing
├ Scope Guard          ├ Test Plan            ├ Security Check
├ Complexity Analysis  ├ Constraints          ├ Coverage Gate
├ SDLC Detection       ├ Anti-Patterns        ├ Browser QA (UI)
├ Architecture         ├ Change Plan          ├ Performance Check
├ Threat Model         ├ Git Workflow         └ Report + JUDGMENT GATE
├ UX Design            └ Execution Guard
└ SDD Grill
```

## What Makes It Different

- **AI-output judgment gate** — verification proves the code *runs*; judgment proves a human *understands and accepts* it. Every judged report names its weakest point and hallucination-risk zones; AI-generated changes touching auth/input/crypto/SQL get flagged for human eyes **even when all automated checks pass**; generation is throttled to review capacity so comprehension debt doesn't pile up.
- **Three mechanisms that close the 10x review gap** — AI generates code far faster than a developer can review it. Spec-in-front and judgment-behind reduce what goes *wrong* but don't reduce the *review burden*. Three mechanisms attack the arithmetic directly: (1) **tests before code** — test code generated from the spec BEFORE implementation; the developer reviews 50-100 lines of intent-expressing tests instead of 500 lines of implementation; tests pass = spec mechanically verified. (2) **Reviewable chunks** — implementation broken into semantic units (one behavior, one function), each announced with spec mapping and trust tier; 🔴 chunks (auth/payment/trust-boundary) pause for acknowledgment. (3) **Review guide with trust tiers** — every report includes a map: 🔴 DEEP REVIEW / 🟡 VERIFY INTENT / 🟢 LIGHT SCAN, each item naming its spec, what to verify, and its test coverage. Review debt (unacknowledged 🔴 items from prior tasks) is tracked and stated.
- **Approved work order before code, DoD always** — nothing gets built until a written record exists and (per mode) is approved: the ticket breakdown for large work, a single dated change file for small/medium. Every task small+ gets a Definition of Done checklist. "Done" is never whatever the agent felt like stopping at.
- **Traceability spine with a ship gate** — stable IDs (`REQ → FSD → ADR/SEC → TICKET → TEST`) in a matrix that makes gaps visible: an untested requirement is a red row, not a hidden one. Large/full builds may not ship while a Must/Should row is red — and the gate is never quietly downgraded.
- **Mechanical enforcement, not just prose** — three zero-dependency scripts catch what markdown instructions can't guarantee: `check-traceability.mjs` (drift, broken refs, freelance tickets/tests), `check-file-hygiene.mjs` (docs-tree conventions), `check-parallel-safety.mjs` (file-overlap before parallel agents spawn). All CI-wireable.
- **Deliberation held to a depth requirement, not a headline** — "we'll use 3NF" or "cascade on delete" is a label, not a decision the user actually reviewed. Every deliberation topic (database, architecture, UX, app flows) carries a minimum granularity before it counts as settled: every table's columns, every FK's cascade behavior, every endpoint's typed contract, every screen's interaction table, every flow's step-by-step branches. A topic named but not detailed stays in the frontier — the document doesn't get written from it.
- **A fidelity check between what was agreed and what got written** — writing a document "from shared understanding" after a deliberation is reconstruction, not transcription, and reconstruction drifts: a cascade rule quietly becomes the "usual" one, a threshold gets rounded. Every document that follows a deliberation gets checked value-by-value against what was actually settled before it's reported done. The same check runs again at verification (spec conformance checks the code's *specific* decided values, not just "a test exists for this topic") and at the judgment gate (does this specific value trace to something settled, or did a plausible default get filled in silently).
- **Multi-perspective test coverage, not just "does it work"** — every flow is tested from each actor role the FSD defines (admin, user, anonymous — not just "a logged-in user"), with a condition matrix per flow (entity states, ownership boundaries, data volumes, timing). Tests that only prove the happy path for one role are flagged as gaps, not counted as coverage.
- **Security tests are executable, not just checklists** — a lightweight STRIDE threat model at design time (SEC-xxx controls with owners), re-verified post-code by both a domain-aware checklist AND runnable test code. Every High/Critical SEC control becomes a test that attempts the attack (IDOR, injection, auth bypass) and asserts it fails correctly. A SEC control with no test is a claim without evidence — flagged even when the checklist passes.
- **Performance tests measure, not just scan** — static detection catches code-level anti-patterns (N+1, missing index, unbounded cache), but executable tests assert actual response time, query count, and memory usage against realistic data volumes. An endpoint that returns in 5ms on an empty database is untested, not fast.
- **A coverage gate that resists the easy ways to game it** — ≥80% line+branch, **measured in every mode** (mode dials narration and whether a failure blocks, never whether the gate runs), with the denominator scaling by size: the lines you changed on a small fix, the whole repo at medium+. The percentage is necessary but not sufficient: every flow needs **both a positive and a negative case** from each relevant actor role, every FSD error flow tested, every High/Critical SEC control tested with executable security tests, no skipped/`.only`/always-true fake passes, and UI Must-journeys verified in a real browser. Never rounds a fail up to a pass. (It's still an AI-run check reporting on AI-written code — see Limitations below for what that does and doesn't guarantee.)
- **Tests that were actually executed, not merely written** — every result in a verification report traces to a command that ran, quoted from its real output. A suite that was generated but never run is `SKIPPED`, never `PASS`; writing tests and running tests are different acts and only the second is evidence.
- **UI gets a real regression net** — screens ship with stable `data-testid` anchors, Must journeys get committed Playwright specs so CI keeps guarding them, and browser QA selects by role+name first (which exercises accessibility on the way past). On an existing repo with no harness, adding one is **asked, never silently installed** — a bugfix shouldn't quietly arrive with a new dev-dependency and a CI workflow.
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

- **5 modes** — prototype / vibe / standard / strict / emergency. They dial **depth and visibility**, never **coverage**: no mode may skip a discovery seat, the DoD floor, or a non-negotiable rule. And ceremony is never inferred from tone — someone typing "bikin checkout dong" about a payment system is still building a payment system, so `vibe`/`prototype` are entered only when asked for or set in `config.md`.
- **Adaptive depth + evidence gates by size** — micro/small/medium/large each get a defined set of active gates (documented in the orchestrator), so a bugfix never drowns in ceremony and a product never ships unproven.
- **SDD Grill** — the frontier/round interview mechanic behind discovery: the whole askable frontier per round, a recommendation per question, adversarial toward your premises *and* its own advice, backed by the framework's own judgment engines.
- **Architecture analysis** — pattern detection, deletion test, adapter-count rule, design-it-twice for high-stakes calls; proposals always pin down the actual directory tree and the FE↔BE contract per endpoint.
- **Vertical-slice tickets, tiered T1/T2/T3** — independently demoable slices with computed blocking edges; tiers route trivial work to cheap models and risky work to strong ones. Local ticket files are the SSOT; mirroring to GitHub Issues is optional (asked, never assumed). Right-sizing guidance checks each breakdown against padding (a ticket that only wires an adjacent one) before it's finalized — more files isn't automatically more rigor.
- **A spec bundle ends with a reading-order guide, not a filename dump** — a `large` feature's FSD/SDS/ERD/threats/UX/tickets can easily be 15-20 files; `00-index.md` states which to read first, what each answers, and an honest time estimate, skipping doc types that weren't generated. Medium-scope runs get the same guide inline in the closing report instead of a separate file.
- **Parallel work on one repo** — git worktree isolation, a deterministic file-overlap check, ticket claiming, dependency-ordered merges. Always confirmed before spawning; hard cap 6 agents.
- **SDLC awareness, decision log (rule-of-three), domain glossary, project memory, session persistence, stats** — the context machinery that keeps the pipeline consistent across a whole session and a whole team.
- **UX design as process** — direction confirmed with concrete previews, design tokens as SSOT (WCAG AA), index-first flow files, and empty/loading/error/success states required per screen (they become FSD error flows, then tests).
- **Database design, stack conventions, infra, analytics** — the schema designed before it's built (additive-first migrations), the stack's official conventions version-pinned into an enforceable guide, CI/IaC/observability wired to the same gates, and product metrics tied to requirements instead of vanity.

## Slash Commands

Most of the time the orchestrator works invisibly — describe the work and it runs the fixed sequence at the right depth. Reach for a command to *enter the sequence at a specific step*:

```
   ASK    →    SPEC    →    PLAN    →    BUILD    →    CHECK
    ↑            ↑                         ↑            ↑
 /discover     /spec                   /implement     /check
```

| Command | Enters at | When | What it does |
|---------|-----------|------|---------------|
| `/sdd-pipeline:discover` | **ASK** | Anywhere from "I have a vague idea" to "I need to decide X" | Product discovery. Opens as plain conversation while the idea is fog, then shifts — out loud — into a seat-by-seat interrogation: **why · constraints · what · data · technical**. Frontier rounds with a recommendation per question, council review over each hard decision *and* over the whole shape at the end. |
| `/sdd-pipeline:spec` | **SPEC** | Decisions are settled, time to shape the details and write them down | **Deliberates** each domain with the user before writing its document — database design (relationships, cascades, indexes), architecture (patterns, deep stack, contracts), UX (interaction, states, error handling), app flows (journeys, edge cases, business rules). Grill mechanics, every question with a recommendation. Then writes FSD/SDS/PRD/ERD, threat model, UX; splits large work into tickets. Spec-only is a complete deliverable. |
| `/sdd-pipeline:implement` | **BUILD** | Time to build | Executes an approved ticket or change file with build-time guardrails |
| `/sdd-pipeline:check` | **CHECK** | Prove it | Adaptive QA: verifies a fresh change, audits the codebase otherwise — ends with the impact summary |

Each command is named after the step it enters. Two consequences worth knowing:

- **The SPEC-step command is `/spec`, not `/design`** — "design" reads as *visual* design, which is a different artifact entirely (`docs/sdd/design-system/design.md`, produced *inside* the SPEC step when the product has screens).
- **There's no separate `/brainstorm`** — a foggy idea and a forming decision are the same conversation at two different moments, and making the user pick which one they're in was a question they couldn't answer. `/discover` handles both and announces when it shifts gears.

PLAN has no command: it's the orchestrator's own step, and what gets approved there is the ticket breakdown (large work) or the change file (small/medium).

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
├── specs/                # FSD/SDS/PRD/threat models/UX (numbered — file number IS the spine ID; written specs, not visual design — see design-system/ for that)
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
