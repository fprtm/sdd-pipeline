# spec-driven-development — reference (read on demand)

This file holds elaboration that isn't needed to route or gate correctly — the
core `SKILL.md` is self-sufficient without it. Read this only for the specific
detail you need (announcing roles in autopilot, adapting doc placement to a
non-default topology, understanding why doc-currency is enforced, the shared-file
failure modes, the setup pointer text, or the full skill roster).

## Project-setup pointer (verbatim)

The minimal block to add to the project's `CLAUDE.md`/`AGENTS.md` in the setup
step (core `SKILL.md` → "Project setup"):

> `## Development process` — For any feature/bugfix/dev work, use the
> `spec-driven-development` skill (it right-sizes itself). At the start of a
> session on existing work, read `docs/sdd/memory/INDEX.md` and the relevant
> memory notes, and the current `docs/sdd/` state, before acting.

## Why one topic = one file (the shared-file failure modes)

The core rule "one dated self-contained file per topic; `00-overview.md` is a thin
index" exists because a single shared file that every session appends to fails
three ways at once:

- **Merge conflicts** — two sessions editing the same `00-overview.md` (or one
  giant `03-fsd.md`) at different times collide, or one silently overwrites the
  other's state.
- **Unbounded growth** — each feature's brief + board + IDs piling into one file
  makes it grow without limit.
- **Token waste** — every later session must re-read the whole thing to find one
  relevant part, which is exactly what the index-first, description-gated read
  avoids.

The numbered `docs/sdd/` trail is the deliberate exception: a single full-mode
product is *one* cohesive build, so one shared gate board and fixed filenames are
correct there. Topic-scoping (`changes/`, `decisions/`, `memory/` as folders of
one-file-per-topic) is for anything that *recurs* over time.

**Why there's a checker, not just the rule.** Markdown instructions are followed
probabilistically — a weaker model under time pressure can (and, in real runs,
does) skip the date prefix or the frontmatter even when the rule is loaded and
correct. `check-file-hygiene.mjs` (bundled with this skill) turns "hope the model
remembers" into "a deterministic script catches it," the same backstop pattern
`traceability` already uses for the ID matrix. Run it after touching
`changes/`/`decisions/`/`memory`, and wire it into CI via `infra` so drift outside
an agent session still gets caught.

## Full skill roster (self-sufficiency)

Every phase's exit gate is satisfiable with this pack alone. Pipeline skills:
`map-codebase`, `discovery`, `to-prd`, `analytics-design`, `to-diagrams`,
`to-fsd`, `arch-decision`, `stack-conventions`, `database-design`, `ux-design`,
`threat-model`, `backlog-leveling`, `test-plan`, `code-standards`, `implement`,
`code-review`, `debug`, `browser-qa`, `infra`, `coverage-check`, `documentation`.
Multi-agent: `parallel-work` (worktree isolation, vertical-slice assignment,
ticket claiming, merge order — for running several implementation agents on the
same repo at once). Cross-cutting:
`traceability`, `decision-log`, `project-memory`, `handoff`, `stakeholder-brief`,
`git-workflow`. Maintenance (not a phase): `self-update`. External skills
(mattpocock/skills, superpowers, an installed TDD/review/debug skill) are preferred
when present but never required.

## The team this represents

Running this pipeline is like running a full delivery team. Each phase plays a
role, so one agent (or a human + agent) covers the whole org:

| Role | Phase(s) | Skill |
|------|----------|-------|
| Onboarding engineer (brownfield) | before 0, on existing code | `map-codebase` |
| Product manager | 0–1 | `discovery`, `to-prd` |
| Data analyst | 1, cross-cutting | `analytics-design` |
| Business analyst / systems analyst | 2–3 | `to-diagrams`, `to-fsd` |
| Architect / tech lead | 4 | `arch-decision`, `stack-conventions` |
| Data engineer / DBA | 4 | `database-design` |
| UI/UX designer | 4 | `ux-design` |
| Security engineer (AppSec) | 5, re-check at 10 | `threat-model` |
| Delivery lead | 6 | `backlog-leveling` (tickets + estimate) |
| QA / test lead | 7, 10 | `test-plan`, `coverage-check`, `browser-qa` (UI e2e) |
| Engineer | 8, + when bugs arise | `implement` (+ `code-standards`), `debug`, `git-workflow` |
| DevOps / SRE / platform | 9 | `infra` |
| Reviewer / staff engineer | 10 | `code-review` |
| Tech writer | 11, any | `documentation` |
| Delivery manager / scribe | any | `stakeholder-brief`, `handoff`, `decision-log`, `project-memory` |

Say this out loud when you switch phases ("acting as the architect now…") so a
non-technical user can follow who's "in the room". In **copilot** mode the human
is the senior in the loop; in **autopilot** the agent plays every seat and
records the decisions each role would have signed off.

## Placement per topology (full detail)

The core workspace tree is the default for one project. Adapt it to whatever
topology `arch-decision` chose, keeping two invariants: (1) the **spec trail
stays together**, and (2) **code-level docs co-locate with the code they
describe** (a README/JSDoc next to the module or feature slice). Co-location plus
an index is what keeps docs readable *at scale* — you read the slice you're
touching, not one giant document.

- **Separate FE / BE repos:** each repo carries its own `docs/dev/` + inline
  docs. The product spec trail (`docs/sdd/`) lives once — in the repo where the
  feature is driven, or a shared specs/docs repo — and both repos link to it.
  User docs live with the FE (or a shared docs site).
- **Monorepo:** spec trail at the root `docs/sdd/`; per-app/per-package docs
  under each package; a root `docs/dev/README.md` index links them.
- **Modular monolith (clean architecture):** each module gets a **co-located
  `README.md` documenting its PUBLIC interface (its ports)** — that *is* the
  deep-module doc. `docs/dev/architecture.md` is the map that links the modules
  and states the dependency rule (domain ← application ← infrastructure).
- **Feature-sliced frontend:** each slice (`features/<x>/`) carries its own
  README and the user-facing doc for that feature (`docs/user/<x>.md`).

A top-level index (`docs/dev/README.md`) links every module/feature doc so
nothing is orphaned. `documentation` builds and maintains that index;
`arch-decision`'s topology choice determines which shape above you use.

## Why doc-currency is enforced (not just described)

Docs that drift from reality are worse than none, so this pipeline treats
currency as enforced, not aspirational:

- `implement` updates the co-located module/feature doc **and** inline
  JSDoc/docstrings **as part of each ticket** (doc-as-you-go) — see `implement`.
- `code-review` **blocks** a change that alters a public interface or
  user-visible behavior without a matching doc update — see `code-review`.
- `infra` adds a **docs-drift check in CI** so changes made *outside* the
  pipeline (hand-edited code) still get flagged — see `infra`. (There's no magic
  git hook; currency is enforced by the review gate and CI. In autopilot the
  agent writes docs automatically per change; in copilot it drafts for review.)
- `documentation` (phase 11) is the *final polish + index*, not the first time
  docs get written.

## Cross-cutting skills — what each one owns

(Full detail lives in each skill's own `SKILL.md`; this is just the map.)

- `traceability` — the matrix; run `tools/check-traceability.mjs` to verify it.
- `decision-log` — `docs/sdd/decisions/` (one timestamped file per decision;
  what was locked and why), including every
  autopilot default chosen for the user (marked for human review).
- `stakeholder-brief` — `docs/sdd/STAKEHOLDER-BRIEF.md`; plain-language status
  and a sign-off loop that writes decisions back into the specs.
- `handoff` — `docs/sdd/HANDOFF.md`; a resumable snapshot for another agent or a
  cheaper model to continue cold.
