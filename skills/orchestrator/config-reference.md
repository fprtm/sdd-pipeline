# Config Reference

Companion to `skills/orchestrator/SKILL.md` — everything the orchestrator reads out of `docs/sdd/config.md`. Read when a project has a `config.md`; skip otherwise.

## Disabled Features

`docs/sdd/config.md` can carry a `disable:` list naming skills to turn off project-wide, e.g.:

```
disable:
  - insight
  - performance-check
  - stats
  - doc-generator
```

Read once per session. Every name on it is **actually skipped** (not "run but suppressed"), matched by directory name (`insight`, not `skills/meta/insight/`). A disabled skill's evidence-gate row is skipped too — announce it ("DoD skipped — doc-generator disabled in config.md"), never silently. This is blunter than mode (which dials depth) — `disable:` removes a skill outright.

## Team Support

When `docs/sdd/config.md` is committed to the repository:
- All team members share the same mode defaults, constraint overrides, and project conventions
- Decision log is shared — team can reference past decisions
- Memory is shared — SDD Pipeline doesn't re-ask questions another team member already answered
- Stats aggregate across team usage

`config.md` can narrow this with a `team:` block:

```
team:
  shared-decisions: true
  shared-memory: true
```

Both default to `true` the moment `config.md` is committed (the behavior above). Set either to `false` to stop treating that store as settled team consensus for THIS project — concretely: `shared-memory: false` means `skills/think/elicitation/`'s "check memory first, use silently if found" rule changes to "check memory first, but surface it as *someone's* prior answer and confirm it still applies, don't silently reuse it"; `shared-decisions: false` means `skills/meta/decision-log/`'s "Searching Decisions" step still shows what's in `docs/sdd/decisions/` but doesn't treat a past entry as binding on the current task without asking. Use this for a repo shared across people/teams who don't want each other's saved answers auto-applied to their own work — e.g. a monorepo with genuinely separate sub-teams.

