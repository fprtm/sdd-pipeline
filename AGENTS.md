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
| 1 Product spec | `to-prd` | `docs/sdd/01-prd.md` (REQ-xxx) |
| 2 Visual models | `to-diagrams` | `docs/sdd/02-diagrams.md` (context, DFD, sequence) |
| 3 Functional spec | `to-fsd` | `docs/sdd/03-fsd.md` (FSD-xxx) |
| 4 Architecture gate | `arch-decision` | `docs/sdd/04-architecture.md` (ADR-xxx, FE+BE+topology) |
| 5 Security gate (SSDLC) | `threat-model` | `docs/sdd/05-threat-model.md` (SEC-xxx) |
| 6 Backlog | `backlog-leveling` | `docs/sdd/06-backlog.md` (tiered TICKET-xxx) |
| 7 Test plan | `test-plan` | `docs/sdd/07-test-plan.md` (TEST-xxx, ≥80% target) |
| 8 Implement | your TDD/impl skill | code |
| 9 Verify gate | `coverage-check` + your review skill | proof |
| 10 Ship | your finish/handoff skill | merged, matrix green |
| — | `traceability` | `docs/sdd/traceability.md` (run after each phase) |

Phases 8–10 **defer to skills you already have** (e.g. mattpocock/skills or
superpowers for TDD, code review, git worktrees, finishing branches). If none
are installed, the orchestrator does them inline with ordinary good practice.

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
