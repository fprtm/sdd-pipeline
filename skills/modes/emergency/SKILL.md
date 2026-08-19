# Emergency Mode

Fix-first. For production outages, critical bugs, and urgent issues. Minimum overhead, maximum speed.

## Trigger Detection

Activate emergency mode when prompt contains urgency signals:
- "down", "broken", "crash", "emergency", "urgent"
- "fix now", "ASAP", "production issue", "outage"
- "server not responding", "users can't access"
- Or user explicitly says "emergency mode"

## Behavior

| Phase | Setting |
|-------|---------|
| Elicitation | Skip. Focus on the error. |
| Context | Error-focused only: read error logs, stack traces, recent changes. |
| Scope guard | No limits. Fix what's broken. |
| Complexity | Skip. |
| Constraints | Skip ALL. Speed matters more than style. |
| Anti-patterns | Skip. |
| Plan file | Skip. Fix first. Post-fix plan retrospective written to archive. |
| Change plan | Skip. |
| Doc generator | Skip. Generate post-fix report only. |
| SDLC detector | Skip. Fix the bug, process later. |
| Arch analyzer | Skip. Don't refactor architecture during emergency. |
| Stats | Track what was fixed. Brief entry. No footer. |
| Execution guard | Loop detection after 2 tries. Escalate FAST. |
| Verification | Quick smoke test: does the fix work? |
| Adversarial | Skip. |
| Security | Skip. Can run post-fix. |
| Performance | Skip. |
| Report | 1-line: "Fix applied. [test result]." |
| Decision log | Post-facto: "Emergency fix: [what] [why] [files touched]." |
| Comprehension | Skip. |
| Insight | Skip. |
| Memory | Don't save. |

## Emergency Process

1. Read the error (logs, stack trace, user report).
2. Identify root cause.
3. Apply minimal fix.
4. Verify fix works (smoke test).
5. Report: "Fix applied. [description]. Verify: [one thing to check]."

## Post-Emergency

After the emergency is resolved, suggest:
- "Run `health-check` to verify fix quality."
- "Consider adding a test for this failure case."
- "Review the fix in standard mode when things calm down."
