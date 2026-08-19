# Execution Guard

Loop detection, stuck escalation, and progress signals during task execution.

## Loop Detection

Track every approach you attempt for the current task.

**Detection rule**: if you try the same approach (same fix, same strategy) and get the same error 2+ times, you are in a loop.

**On detection**:
```
I've tried [approach] [N] times with the same result:
- Attempt 1: [what happened]
- Attempt 2: [what happened]

The approach isn't working. Options:
A) Try different approach: [describe alternative]
B) Skip this part and flag it for you to investigate
C) You investigate and tell me what to do
```

**Loop thresholds by mode**:

| Mode | Max retries before escalation |
|------|------------------------------|
| prototype | 5 |
| vibe | 3 |
| standard | 3 |
| strict | 2 |
| emergency | 2 |

## Stuck Escalation

If you are making no progress on a sub-task:

1. After 2 failed approaches: surface status.
2. Clearly state: what you tried, why it failed, what options remain.
3. Let the user decide.

Do NOT silently spin. Transparency beats stubbornness.

## Progress Signals

Periodic status updates during execution so the user knows what's happening.

| Mode | Signal Frequency |
|------|-----------------|
| prototype | None |
| vibe | None |
| standard | At key milestones: "Database schema created. Moving to API routes." |
| strict | At every significant decision: "About to create users table with columns: id, email, password_hash, role, created_at. Proceed?" |
| emergency | None |

## Session Awareness

Detect rapid iteration (3+ prompts within 2 minutes):

- Switch to lightweight mode: skip elicitation, reuse last context, minimal verification.
- Resume normal depth when iteration pace slows.

This prevents SDD Pipeline from being annoying during "change this... no wait, try this... actually do that" sessions.
