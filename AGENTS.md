# SDD Pipeline v0.1.0 — Project Router

Use SDD Pipeline for coding, debugging, architecture, and refactoring. For
writing, research, or discussion without execution intent, answer normally and
do not load pipeline policy.

## Entry

Read `skills/orchestrator/SKILL.md` first. It is a context-bounded router; load
only the referenced behavior, delivery, or project-state policy required by
the current decision point. Do not preload every skill or reference.

If `docs/sdd/` exists, SDD remains active for subsequent **coding** tasks.
Repository state survives compaction, but it never converts ordinary
conversation into a governed coding task.

## Non-negotiable spine

```text
ASK → SPEC → PLAN → BUILD → CHECK
```

- A question is not an execution signal.
- Small+ work gets one written record and DoD before edits.
- Large work uses approved vertical-slice tickets; small/medium work uses one
  `docs/sdd/changes/{date}-{slug}.md` record.
- Applicable tests and coverage must actually run before being reported green.
- No hardcoded secrets. Production, deployment, spending, and human authority
  require explicit external authorization.
- Project instructions override SDD defaults; absent fresh contexts, report
  `degraded independence` rather than claiming independent review.

## Load on demand

- Discovery: `skills/commands/discover/SKILL.md`
- Specification: `skills/commands/spec/SKILL.md`
- Build: `skills/commands/implement/SKILL.md`
- Verification or audit: `skills/commands/check/SKILL.md`
- Brownfield documentation: `skills/commands/docs/SKILL.md`
- Read-only code learning: `skills/commands/learn/SKILL.md`
- State transfer: `skills/commands/handoff/SKILL.md`
- Pipeline update: `skills/commands/update/SKILL.md`

Phase, mode, constraint, and meta skills are loaded only when routed by the
entrypoint or direct command. Read `docs/sdd/index.md` before opening additional
SDD artifacts, and run file-hygiene/traceability checks after changing them.
