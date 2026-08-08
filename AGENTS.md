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
| 0 Discover | `discovery` | `docs/sdd/00-context.md` + discovery brief (deep needs) |
| 1 Product spec | `to-prd` | `docs/sdd/01-prd.md` (REQ-xxx) |
| 2 Visual models | `to-diagrams` | `docs/sdd/02-diagrams.md` (context, DFD, sequence) |
| 3 Functional spec | `to-fsd` | `docs/sdd/03-fsd.md` (FSD-xxx) |
| 4 Architecture gate | `arch-decision` | `docs/sdd/04-architecture.md` (ADR-xxx, FE+BE+topology) |
| 5 Security gate (SSDLC) | `threat-model` | `docs/sdd/05-threat-model.md` (SEC-xxx) |
| 6 Backlog | `backlog-leveling` | `docs/sdd/06-backlog.md` (tiered TICKET-xxx) |
| 7 Test plan | `test-plan` | `docs/sdd/07-test-plan.md` (TEST-xxx, ≥80% target) |
| 8 Implement | `implement` + `code-standards` | tested code that clears the SSOT/DRY/YAGNI bar |
| 9 Infra & delivery | `infra` | CI/CD, IaC, envs, secrets, observability, deploy |
| 10 Verify gate | `coverage-check` + `code-review` + `threat-model` re-check | proof |
| 11 Ship | finish/`handoff` | deployed, matrix green |
| any | `traceability` · `stakeholder-brief` · `handoff` | matrix, non-IT brief, resumable snapshot |

This pack is **self-sufficient** (17 skills; runs end to end alone). For
debugging, planning, git worktrees, and grilling, **defer to skills you already
have** (mattpocock/skills, superpowers); prefer an installed TDD/code-review skill
over `implement`/`code-review` if present.

## Code-quality bar

All code (phase 8) and review (phase 10) must clear `code-standards`: **SSOT**
(one authoritative source per fact; types inferred from one schema; named
constants; ubiquitous naming), **DRY** (knowledge, not keystrokes; rule of three),
**YAGNI** (only what a requirement needs; no dead code), **deep modules** (simple
interfaces hiding complexity; logic in the domain layer). This is the output
contract, not a nicety.

## It represents a full team

Each phase = a role (PM, analyst, architect, security, delivery lead, QA,
engineer, DevOps/SRE, reviewer, tech writer). One agent covers the whole org; it
announces which role it's "wearing" per phase so non-technical users can follow.

## Modes

- **Autopilot** — agent runs the whole pipeline autonomously as a full team;
  collects requirements exhaustively up front (batched), picks robust defaults
  where the user doesn't decide (recording assumptions), and stops only for
  blockers or irreversible/outward actions (deploy, spend, delete, send). Works
  for non-developers and developers.
- **Copilot** — same full sequence and rigor, but pauses at each gate for a
  developer to review/approve and defers technical calls to them.
- **Modular** — invoke any single skill directly, without the orchestrator.

Size is orthogonal: **full** (new product/subsystem) vs **lite** (feature/bugfix).
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
