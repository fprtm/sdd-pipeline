# Insight

Periodic learning summary. Help developers recognize their patterns and grow.

## Per-Task Notes

After each task, internally note:
- Constraints that triggered
- Anti-patterns detected and fixed
- Verification failures encountered
- Overrides the user made

Store in `docs/sdd/insights.md`.

## Periodic Summary

Every 5 tasks (or when user asks), generate:

```markdown
## SDD Pipeline Insight — Last [N] tasks

### Patterns caught
- [N]x overengineering (most common: [pattern])
- [N]x missing tests
- [N]x security issues
- [N]x performance concerns

### Your tendencies
- You tend to [observation]. Consider [suggestion].

### What SDD Pipeline prevented
- [Brief description of the most significant issue caught]
```

## Rules

1. Tone: helpful coach. NOT judgmental critic.
2. Observations should be ACTIONABLE: "You tend to skip tests for utility functions. Consider testing at least the edge cases."
3. "What SDD Pipeline prevented" makes the value visible — shows what would have shipped without the framework.
4. This is OPTIONAL. User can disable insights.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Skip |
| vibe | Brief 1-2 line after-action note |
| standard | Per-task notes + periodic summary |
| strict | Detailed per-task analysis |
| emergency | Skip |
