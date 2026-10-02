---
name: sdd
description: Route coding, debugging, architecture, and refactor requests through adaptive THINK, BUILD, and PROVE guardrails. Do not use for writing, research, or discussion without execution intent.
---

# SDD Pipeline Orchestrator

SDD Pipeline keeps a specification in front of implementation and evidence
behind it. This entrypoint is intentionally small: select the current path,
then load only the policy reference needed for that path.

## Fast boundary

- **Non-software work or discussion without execution intent:** answer normally.
  Do not load SDD policy references, create artifacts, or start BUILD.
- **Micro coding edit:** load the behavior reference; apply the applicable
  constraint and evidence floor without manufacturing extra ceremony.
- **Small or larger coding work:** load the behavior and delivery references
  before editing. Load project-state policy only when repository adoption,
  artifact placement, persistence, or lifecycle handling is relevant.
- **Direct command:** use the named command skill. Follow its routing and load
  the references below only when that command reaches the corresponding stage.

## Fixed delivery spine

```text
ASK → SPEC → PLAN → BUILD → CHECK
```

- A question is not an execution signal.
- Small+ work always has a written record and Definition of Done before edits.
- Large work uses approved vertical-slice tickets; small/medium work uses one
  `docs/sdd/changes/{date}-{slug}.md` record.
- Applicable coverage is always measured. Mode changes depth and narration,
  never the evidence floor or an `OVERRIDE: None` rule.
- User approval never creates production, release, review, or human authority
  that the environment cannot attest.
- Tests and browser QA target local or disposable environments only. Production,
  provisioning, deployment, and spending require explicit human authorization.

## Progressive-disclosure routes

Read each file only when its condition is true:

1. [Behavior policy](references/behavior.md) — any governed coding task. Owns
   mode selection, the unified mode matrix, complexity/risk/assurance,
   domain/SDLC detection, role boundaries, and brownfield behavior.
2. [Delivery policy](references/delivery.md) — an execution signal reaches
   SPEC, PLAN, BUILD, or CHECK. Owns approval, pipeline execution, evidence
   gates, review tiers, agent separation, and completion bookkeeping.
3. [Project-state policy](references/project-state.md) — SDD activation,
   artifact creation/retirement, repository layout, or session persistence is
   relevant.
4. [Config reference](config-reference.md) — `docs/sdd/config.md` exists. Read
   once per session to apply `disable:` and team-sharing settings.
5. [Composition policy](composition.md) — the task genuinely needs an external
   capability such as aesthetics, browser automation, or deep specialist audit.

Do not preload all references. A pure discussion stops at the fast boundary;
a micro edit normally needs only behavior policy and its concrete constraint.

## Core precedence

```text
project rules > hard stop > assurance profile > risk controls
              > task complexity > ceremony
```

- Project `AGENTS.md`, `CLAUDE.md`, and explicit config override SDD defaults.
- Unknown risk never defaults low. Users may raise assurance but may not lower
  it below policy.
- A valid shadow or mechanical result is evidence, not dispatch, acceptance,
  release, or promotion authority.
- If fresh independent contexts are unavailable, report `degraded
  independence`; never relabel a self-review as independent.

## Direct commands

`/sdd-pipeline:discover`, `/sdd-pipeline:spec`,
`/sdd-pipeline:implement`, `/sdd-pipeline:check`, `/sdd-pipeline:docs`,
`/sdd-pipeline:learn`, `/sdd-pipeline:handoff`, and
`/sdd-pipeline:update` are the only public commands. Utility commands do not
replace missing delivery prerequisites.

## Closing

At a governed terminal outcome, load
`skills/meta/workflow-navigation/SKILL.md`. Report the actual outcome, material
skips or limitations, one recommended next action, and at most two contextual
alternatives. Never route past an unresolved decision, missing work order,
failed evidence gate, or absent authority.
