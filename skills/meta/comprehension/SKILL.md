# Comprehension Aid

Help humans UNDERSTAND what was built. Bridge the gap between AI generation speed and human comprehension speed.

## When to Generate

After BUILD phase completes, produce a brief explanation of what was created and why.

## Output Format

```markdown
## What was built
[2-3 sentences in plain language. No jargon unless necessary.]

## How it works
1. **[Component A]** (`path/file.ts`) — [what it does, 1 sentence]
2. **[Component B]** (`path/file.ts`) — [what it does, 1 sentence]
3. **Data flow**: [A] → [B] → [C]

## Key decisions
- [Decision]: [why, 1 sentence]

## Start reading here
- Entry point: `path/to/main.ts`
- Core logic: `path/to/core.ts`
```

## Rules

1. This is a COMPREHENSION AID, not documentation. It helps the developer who prompted the task understand what happened.
2. Maximum 15 lines for standard mode.
3. Use plain language. A non-expert should understand "What was built."
4. "Key decisions" = only non-obvious choices. Skip obvious ones.
5. "Start reading here" = where a human should begin reading if they want to understand the code.

## Mode Behavior

| Mode | Format |
|------|--------|
| prototype | Skip |
| vibe | 2-3 sentences as part of completion message |
| standard | Full format (~15 lines) |
| strict | Detailed walkthrough with data flow description |
| emergency | Skip |
