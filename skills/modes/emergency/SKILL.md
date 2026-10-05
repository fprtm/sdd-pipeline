# Emergency Mode

Fix-first. For production outages, critical bugs, and urgent issues. Minimum overhead, maximum speed.

**Phase behavior**: see the unified mode matrix in `skills/orchestrator/references/behavior.md`. This file adds process rules unique to emergency mode.

## Trigger Detection

Activate emergency mode when prompt contains urgency signals:
- "down", "broken", "crash", "emergency", "urgent"
- "fix now", "ASAP", "production issue", "outage"
- "server not responding", "users can't access"
- Or user explicitly says "emergency mode"

## Emergency Process

1. Read the error (logs, stack trace, user report).
2. Identify root cause.
3. Apply minimal fix.
4. Verify fix works (smoke test).
5. Report: "Fix applied. [description]. Verify: [one thing to check]."

## Post-Emergency

After the emergency is resolved, suggest:
- "Run `/sdd-pipeline:check` in VERIFY mode to verify the fix; use its AUDIT branch later when no fresh diff remains."
- "Consider adding a test for this failure case."
- "Review the fix in standard mode when things calm down."
