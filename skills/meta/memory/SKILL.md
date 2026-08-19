# Project Memory

Save project decisions so SDD Pipeline doesn't ask the same questions twice.

## What to Save

When a user answers an elicitation question that's likely to apply to future tasks of the same type:

- "CRUD endpoints in this project use Zod validation, JWT auth, cursor pagination"
- "This project prefers Tailwind over CSS modules because the team knows Tailwind"
- "User overrides 'no factory' constraint in the product module because there are 12 product types"

## Storage

Save to `docs/sdd/memory.md`:

```markdown
## Project Memory

### Conventions
- [convention]: [detail] — saved [YYYY-MM-DD]

### Preferences
- [preference]: [detail] — saved [YYYY-MM-DD]

### Overrides
- Constraint [name] overridden in [context]: [reason] — saved [YYYY-MM-DD]
```

## How It's Used

1. Before elicitation: check memory for previously answered questions.
2. If memory has the answer: use it silently. Don't re-ask.
3. Before constraint check: check for saved overrides. Don't re-flag overridden constraints in the same context.

## Escape Hatch

If user says "this is different" or "not this time" or "ignore that" for a memorized decision:
- Skip the memory for THIS task only.
- Do NOT delete the memory entry (it may apply to the next task).

## Rules

1. Memory is per-project (stored in project directory).
2. Users can manually edit `docs/sdd/memory.md`.
3. Only save decisions likely to be REPEATED. One-off choices don't need memory.
4. Include dates so stale memories can be identified.
5. **Max 50 entries**. When exceeding 50, prune oldest entries that haven't been referenced in 30+ days.
6. After saving, update `docs/sdd/index.md` if memory affects architecture or key conventions.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Don't save (prototype decisions aren't meant to last) |
| vibe | Save automatically |
| standard | Save automatically |
| strict | Save with detailed context |
| emergency | Don't save |
