# Handoff — Portable State Transition

A handoff transfers the minimum trustworthy state needed to perform one named
transition. It is not a transcript and does not become a second source of
truth. Provider and model names are optional metadata only.

## Choose the Form

- **Reference**: next actor can read the repository. Write and replace
  `docs/sdd/HANDOFF.md`; point to canonical files instead of copying them.
- **Portable**: repository access is absent. Emit the minimum required state in
  the response. Do not create a file unless the user asks.

`HANDOFF.md` has lifecycle `transient`. Retire it after the transition is
accepted and `skills/meta/artifact-lifecycle/` retirement checks pass.

## Required Contract

Use these headings and fields so humans and validators can inspect the package:

```markdown
# SDD Handoff

protocol: sdd-handoff/v1
form: reference | portable
state: active | consumed
created_at: <ISO-8601 timestamp>
producer_actor: <stable actor/context id>

## Resume Goal
target_state: <observable outcome>
success_when:
- <observable condition>

## Transition
phase: <ASK|SPEC|PLAN|BUILD|CHECK>
next_action: <one concrete action>

## Integrity
repo_head: <commit SHA or unavailable>
dirty: <true|false|unknown>
relevant_paths:
- <repo-relative existing path, or planned:path for an intended new file>

## Authority
baseline:
- <authority supplied by user/environment>
carried:
- <same or narrower authority item>

## Capabilities
required: <comma-separated capabilities>
optional: <comma-separated capabilities or none>

## Evidence
- <command and observed result, or explicit unverified item>

## Pointers
- <canonical repo path>

## Minimum State
<required only for portable form: decisions, constraints, current state,
blockers, and exact verification commands>
```

Do not introduce global goal/fact/assumption counters. Reuse existing
`REQ/FSD/ADR/TICKET/TEST` references where they help.

## PRODUCE

1. Read current state from the approved spec/work order, repo diff, and test
   output; do not reconstruct it from conversation memory.
2. State a resume goal as outcome + observable success conditions.
3. Record HEAD, dirty state, and only paths relevant to the transition.
   Paths are repository-relative; absolute paths and `..` traversal are invalid.
4. Record required runtime capabilities: repository read/write, shell, Git,
   browser, fresh contexts, subagent dispatch, or worktrees as applicable.
5. Copy only existing authority and narrow it where useful. A handoff cannot
   authorize deployment, spending, deletion, or broader writes.
6. Replace the prior reference snapshot, or return one portable package.

## VALIDATE → CONSUME → RESUME

1. Accept only `sdd-handoff/v1`; otherwise stop as `BLOCKED`.
2. Check the resume target and at least one observable success condition.
3. Compare required capabilities with the current harness. Missing required
   capability is `BLOCKED`; missing optional capability is `DEGRADED` with the
   reason named.
4. Compare carried authority with the known baseline. Expansion is invalid;
   an absent baseline cannot justify new authority.
5. With repo access, verify HEAD, dirty relevant paths, pointers, and critical
   evidence. Relevant drift must be surfaced; unrelated drift does not by
   itself invalidate the package.
6. For portable form, require Minimum State. For reference form, require every
   pointer to resolve.
7. Resume the named next action. Repeat a completed phase only when evidence
   conflicts, required information is missing, a blocker remains, or relevant
   repository state changed.

## Acceptance

A fresh actor can identify the goal, trusted state, and next action from the
handoff plus at most two canonical entry documents. Any uncertainty is labeled
`BLOCKED`, `DEGRADED`, or `UNVERIFIED`; it is never silently upgraded to fact.
