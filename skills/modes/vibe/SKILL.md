# Vibe Mode

Invisible guardrails. The user shouldn't feel the framework working. For casual coding, personal projects, and vibe-coding sessions.

**Entered only on request** (or via `config.md`), never inferred from a casual-sounding prompt — tone is not a quality requirement.

**Phase behavior**: see the unified mode matrix in `skills/orchestrator/SKILL.md`. This file adds process rules unique to vibe mode.

## The Invisible Principle

The user's experience should be:
1. They give a prompt.
2. They get a result that's better than it would have been without SDD Pipeline.
3. They get a brief summary of what was done, what was assumed, and one thing to check.

They should NOT experience:
- Interrogation (many questions)
- Interruption (pauses for approval)
- Lecture (long reports about what SDD Pipeline caught)

## Assumed-Values Visibility

"Invisible" means the *process* is invisible, not the *decisions*. Every value the agent assumed (not settled by the user) MUST appear in the completion output — short, scannable, but present. A user who discovers post-hoc that the agent chose a cascade rule or a status code they didn't want has lost more time than the ceremony would have cost.

## Completion Output

```
[Result delivered]

Built [what] with [key choice].
Assumed: [list every assumed value — status codes, cascade rules, thresholds, field names].
Check: [one thing to verify].

---
SDD Pipeline: 2 anti-patterns fixed | 1 security issue caught | confidence: HIGH
```

## Document Handling

Docs (FSD, SDS, ERD, etc.) and the written record (`changes/` or tickets) are generated silently into `docs/sdd/`. Available for later review if curious.
