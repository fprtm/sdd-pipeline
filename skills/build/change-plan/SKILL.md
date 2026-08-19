# Change Plan

Pre-declare what files will change. Track deviations. Enforce scope discipline.

## Before Writing Code

Declare every file you plan to touch:

```
CHANGE PLAN:
CREATE:
- path/to/new-file.ts — [why: new component for X]

MODIFY:
- path/to/existing.ts — [why: add Y function]
- path/to/config.ts — [why: register new route]

DELETE:
- path/to/old-file.ts — [why: replaced by new-file.ts]

Estimated total: [N] files
```

## During Execution

If you need to touch a file NOT in the change plan:

1. Note the deviation and reason.
2. **Standard mode**: pause. "I need to also modify `config.ts` because [reason]. OK?"
3. **Strict mode**: pause and wait for explicit approval.
4. **Vibe/prototype mode**: proceed, note deviation in summary.

## After Execution

Generate change summary:

```
CHANGES COMPLETED:
- Planned: [N] files (as declared)
- Deviations: [M] files
  - path/to/unexpected.ts — [justification]

Categories:
- Requested: [files directly implementing the task]
- Incidental: [files that had to change for the task to work]
- Refactoring: [files improved beyond minimum requirement] (should be 0 unless asked)
```

## Integration with Plan File

The change plan is included in `docs/sdd/plans/current.md` (written by orchestrator before BUILD). The plan file contains scope, approach, and the change plan together. This skill handles the execution tracking — comparing actual changes vs planned changes.

After task completion, the change summary is included in the verification report and stats.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Skip entirely |
| vibe | Auto-declare, no approval needed, note deviations in summary |
| standard | Declare and confirm before starting. Pause on deviation. |
| strict | Declare, get approval per file, re-approve on any deviation |
| emergency | Skip entirely |
