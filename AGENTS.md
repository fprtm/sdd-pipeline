# SDD Pipeline — agent instructions

This repo is a **portable skill pack** for AI coding agents. It installs a
gated, traceable **Spec-Driven Development** workflow. It is written to be usable
by any agent that can read Markdown instructions — Claude Code, Codex, Cursor,
Gemini CLI, GitHub Copilot CLI, OpenCode, and others.

## How different agents load these skills

- **Claude Code** — install as a plugin (see README). Skills in `skills/*/SKILL.md`
  are auto-discovered and invoked by name; subagents are used for parallel work.
- **Codex / Cursor / Gemini / Copilot / generic** — these read `AGENTS.md`
  (or an equivalent rules file). Point your agent at this file. Each skill is a
  self-contained `skills/<name>/SKILL.md` you can open on demand. The installer
  can also concatenate them into your agent's rules file.

Every skill file is plain Markdown with YAML frontmatter (`name`, `description`)
followed by instructions — no agent-specific syntax, no tool bindings. That is
what makes them portable.

## The workflow (invoke `spec-driven-development` first)

`spec-driven-development` is the orchestrator. It runs these phases with **hard
gates** and keeps a **traceability matrix** linking every requirement to a test:

| Phase | Skill | Output |
|-------|-------|--------|
| pre-0 (brownfield) | `map-codebase` | `docs/sdd/00-codebase-map.md` — run first when code already exists |
| 0 Discover | `discovery` | `docs/sdd/00-context.md` + discovery brief (deep needs) |
| 1 Product spec | `to-prd` (+ `analytics-design` for success metrics) | `docs/sdd/01-prd.md` (REQ-xxx) + `analytics.md` (KPIs/events) |
| 2 Visual models | `to-diagrams` | `docs/sdd/02-diagrams.md` (context, DFD, sequence) |
| 3 Functional spec | `to-fsd` | `docs/sdd/03-fsd.md` (FSD-xxx) |
| 4 Architecture & Design gate | `arch-decision` → `stack-conventions` → `database-design` (mandatory if data persisted) → `ux-design` (if there's a UI) | `04-architecture.md` (ADRs) + `04-stack-guide.md` + `04-schema.md` (data model) + `04-ux-design.md` (design system/screens) |
| 5 Security gate (SSDLC) | `threat-model` | `docs/sdd/05-threat-model.md` (SEC-xxx) |
| 6 Backlog | `backlog-leveling` | `06-backlog.md` (tiered TICKET-xxx) + `ESTIMATE.md` (effort/cost) |
| 7 Test plan | `test-plan` | `docs/sdd/07-test-plan.md` (TEST-xxx, ≥80% target) |
| 8 Implement | `implement` + `code-standards` (+ `debug`) + `git-workflow` per commit | tested code clearing the SSOT/DRY/YAGNI bar |
| 9 Infra & delivery | `infra` | CI/CD, IaC, envs, secrets, observability, deploy |
| 10 Verify gate | `coverage-check` + `code-review` + `threat-model` re-check (+ `debug`) | proof |
| 11 Ship | `documentation` + `git-workflow` (PR/changelog) + finish/`handoff` | deployed, docs written, matrix green |
| any | `traceability` · `decision-log` · `stakeholder-brief` · `handoff` · `self-update` | matrix, decision "why", non-IT brief, snapshot, pack self-update |

This pack is **self-sufficient** (28 skills; the pipeline runs end to end alone —
`self-update` is a maintenance helper that keeps the installed pack current from
the remote, not a phase). For planning,
git worktrees, and grilling, **defer to skills you already have** (mattpocock/
skills, superpowers); prefer an installed TDD / code-review / debugging skill over
`implement` / `code-review` / `debug` if present.

## Tidy output layout (canonical — one home per artifact)

Spec trail → `docs/sdd/` (00–08 incl. `04-schema.md`/`04-ux-design.md`, plus
`analytics.md`, `ESTIMATE.md`, `STAKEHOLDER-BRIEF.md`, `HANDOFF.md`,
`traceability.md`, a `decisions/` folder of timestamped decision files, and a
`memory/` Obsidian-style knowledge graph); user docs → `docs/user/`; developer
docs → `docs/dev/` (+ inline JSDoc/docstrings); code, tests, CI, IaC in their
normal repo locations. Never scatter files — if it isn't in this layout, give it
a home here first.

**Stack-aware:** `stack-conventions` (phase 4) reads the chosen stack's official
docs (via a docs tool like Context7 if available, else the official sites) and
writes version-pinned rules to `04-stack-guide.md` — TS strict, Laravel/Eloquent
conventions, framework idioms — which `implement` follows and `code-review` checks.

## Code-quality bar

All code (phase 8) and review (phase 10) must clear `code-standards`: **SSOT**
(one authoritative source per fact; types inferred from one schema; named
constants; ubiquitous naming), **DRY** (knowledge, not keystrokes; rule of three),
**YAGNI** (only what a requirement needs; no dead code), **deep modules** (simple
interfaces hiding complexity; logic in the domain layer). This is the output
contract, not a nicety.

## It represents a full team

Each phase = a role (PM, data analyst, business analyst, architect, DBA, UI/UX
designer, security, delivery lead, QA, engineer, DevOps/SRE, reviewer, tech
writer). One agent covers the whole org; it announces which role it's "wearing"
per phase so non-technical users can follow.

## Project setup (once per project)

First time you engage here: (1) ensure this repo's `AGENTS.md`/`CLAUDE.md`
points the agent at `spec-driven-development` and at reading
`docs/sdd/memory/INDEX.md` first — add a short pointer if missing (mandatory;
it's what makes the pipeline get used every session). (2) Read the memory graph
first if it exists — cheaper than re-scanning the repo. When you propose or
decide something the user didn't specify, say briefly **what**, **why**, and the
**main alternative rejected** — never let a decision pass unexplained.

## Stay in this mode for the whole conversation

Skills aren't automatically "sticky" across turns in most runtimes — once
`spec-driven-development` triggers, deliberately keep governing every later
message, not just the first, until the user changes topic or ends the session.
It also re-engages on **every new dev request mid-session**, not just the
first — a plain "now add X" is enough. Your first response must include a
one-line cheat-sheet (mode/size/stop-point options); state your current phase
when there's ambiguity instead of drifting back to generic answers; log
decisions as you go even in `quick`/`lite` (inline in the `changes/<topic>.md`, not a
separate file — that's `full`-mode only), proactively, not only when asked.

## Read state, then ask — don't guess

Before doing anything, **check whether `docs/sdd/` already exists** and read
`00-overview.md`/`traceability.md`/`decisions/`/`memory/INDEX.md` if so — resume
from the real state, don't restart or re-ask what's already answered. **Also read
the actual
code for whatever specific area is under discussion right now** — not just
`map-codebase`'s initial (deliberately shallow) pass; go deeper every time a
new topic/file/feature comes up. Docs and your own earlier summary can both
drift from what the code actually does — the code is the ground truth. For
anything consequential that state doesn't already answer, **ask rather than
assume** (always in copilot; in autopilot, for anything blocking/irreversible —
routine unknowns still get batched into a recorded default). **Whenever you ask,
brainstorm, or seek confirmation, use your host's native structured question tool**
(quick-select UI), not a plain-text question — fall back to plain text only when
the runtime has none.

## Modes

- **Autopilot** — agent runs the whole pipeline autonomously as a full team;
  collects requirements exhaustively up front (batched), picks robust defaults
  where the user doesn't decide (recording assumptions), and stops only for
  blockers or irreversible/outward actions (deploy, spend, delete, send). Works
  for non-developers and developers.
- **Copilot** — a real behavioral contract: produce **one phase (or one
  decision) at a time, then STOP and wait** for the developer's reply; offer
  options to pick, don't announce a done deal. Generating several phases in one
  turn is autopilot behavior — a bug in copilot. The difference must be *felt*
  each turn, not just stated once.
- **Modular** — invoke any single skill directly, without the orchestrator (the
  nicest way for a focused job; the most reliable way on a weaker/cheaper model).

Size is orthogonal — match ceremony to the work, don't reflexively go full:
**quick** (tiny change → fix test-first, no doc tree), **lite** (a feature → one
collapsed `changes/<topic>.md`), **full** (new product/subsystem → the whole trail).

**Brownfield:** if code already exists, run `map-codebase` first, then
`arch-decision` in respect-existing mode, frame work as changes, and add
characterization tests before altering legacy. Don't run the "choose a stack"
flow on a repo that already has one.

**Stop-point** is another orthogonal choice — how far to run:
- **`docs-only`** — phases 0–7 only (discovery → PRD → diagrams → FSD →
  architecture → security → backlog+estimate → test plan), **no code written**.
  The right choice for brainstorming, spec'ing something for another team, or
  getting buy-in before committing engineering time.
- **`spec+review`** — phases 0–7, then a human checkpoint before phase 8.
- **`full-build`** (default when the request is "build/ship this") — all phases
  0–11 through implementation and deploy.

If the request sounds like planning rather than building, default to
`docs-only` and say so.
Neither mode nor size ever removes a gate or reduces requirement collection.

## Principles baked in

- **Traceability is the point** — REQ → FSD → ADR/SEC → TICKET → TEST, always
  linked; gaps are surfaced, never hidden.
- **Gates block** — no implementation before architecture + security are
  decided; no ship before coverage ≥ target and the matrix is green.
- **Stack-neutral** — the agent asks; the user decides. If the user defers, the
  agent picks the most robust/scalable/maintainable option and justifies it.
- **FE + BE + topology** — architecture covers frontend, backend, and their
  relationship (fullstack, separate, be-only, fe-only, or monorepo).
- **Two-layer docs** — every artifact opens with a plain-language summary for
  non-developers, then technical detail for developers/agents.
- **Executor-friendly backlog** — tickets are tiered so trivial work can go to a
  junior dev or a cheap model, complex work to a senior/strong model.
- **Tests run against LOCAL DB only** — before running any suite, confirm the
  target is a local/disposable test DB (`NODE_ENV=test`, `localhost`/`*_test`/
  in-memory, from `.env.test`). If anything points at production or a non-local
  host, or you can't tell, **STOP and ask** — never run tests against real data.
- **In scope + readable + surgical** — the smallest change that satisfies the
  ticket, held to the SSOT/DRY/YAGNI bar, in every mode/size (quick/lite reduce
  ceremony, never code quality or scope). A refactor of working code is its own
  decision, not a silent diff-balloon.
- **Efficiency is first-class** — context window and tokens are a resource:
  read the minimum (memory INDEX + relevant notes + targeted code, not
  whole-repo scans), don't re-read, right-size output, use `handoff` on long
  runs. This is a framework for agentic development, not a one-off skill.
- **Ease of use is a feature** — two clear doors (just-build-it vs
  drive-step-by-step), light first turn, feels like a teammate not a form.
- **Write for the next reader** — a later session or cheaper model reads these
  cold: split by topic (never one giant file), scannable sections with stable
  IDs, to the point, each file self-contained. Could a fresh session act on it in
  a minute? If not, tighten it.
- **Definition of Done, always explicit** — each phase's exit gate is its DoD;
  each ticket's DoD = acceptance criteria + tests green + traceability + docs.
  Nothing is "done" until its DoD is checked, `quick`/`lite` included.
- **Keep a live to-do list** in the host's native tool, mirrored from the gate
  board / open tickets and updated as phases and tickets move.
