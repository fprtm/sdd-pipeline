# Scope Guard

Define task scope, estimate blast radius, and set change limits before coding starts.

## Blast Radius Estimation

Estimate files that will be touched based on task type:

| Task Type | Expected Files | Hard Limit |
|-----------|---------------|------------|
| Bug fix | 1-5 | 8 |
| Small feature | 3-8 | 12 |
| Medium feature | 5-15 | 20 |
| Large feature | 10-30 | declaration required, no hard limit |
| Refactor | 10-50 | declaration required, no hard limit |
| Migration | 20+ | declaration required, no hard limit |
| Style/format | unlimited | declaration required, no hard limit |

Context matters: "add dark mode across 25 CSS files" is normal. "Fix typo across 25 files" is suspicious — investigate.

## Scope Declaration

Before coding, state:

```
SCOPE:
- IN: [what this task will do]
- OUT: [what this task will NOT touch]
- Files expected: [estimated count]
```

Explicitly name what is OUT of scope: "I will NOT refactor unrelated code, update documentation for other features, or change the build configuration unless you ask."

## If Blast Radius Exceeds Estimate

When you realize the task needs more files than expected:

1. **Standard/strict mode**: pause and explain. "This task needs [N] files instead of [expected]. Reason: [why]. Proceed?"
2. **Vibe mode**: proceed but note in completion summary.
3. **Prototype/emergency mode**: proceed without comment.

## Scope Creep Prevention

During execution, if you notice something unrelated that could be improved:
- Do NOT fix it silently.
- Note it: "I noticed [issue] but it's out of scope for this task."
- Let the user decide whether to address it.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | No scope limits |
| vibe | Soft limits. Warn internally, don't interrupt user. |
| standard | Hard limits. Pause if exceeded. |
| strict | Strict limits. Must justify and get approval for each deviation. |
| emergency | No scope limits. Fix what's broken. |
