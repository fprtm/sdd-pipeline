# Standard Mode

Balanced. Default mode for daily development. Guardrails are visible but not oppressive.

**Phase behavior**: see the unified mode matrix in `skills/orchestrator/SKILL.md`. This file adds process rules unique to standard mode.

## Plan Handling

Plan shown to user with key details. User can:
- Approve: "go", "ok", "approved" → proceed
- Modify: "change scope to..." → update plan, re-show
- Interrupt during BUILD if scope creeps

## Completion Footer

```
SDD Pipeline: 2 anti-patterns fixed, 1 security issue caught, 4 files changed
     Docs generated: FSD, DoD | Confidence: HIGH | 0 scope deviations
```

## This Is the Default

If no mode is detected or specified, use standard mode.
