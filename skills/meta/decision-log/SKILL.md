# Decision Log

Track decisions worth remembering. Not every decision — only the ones that would confuse a future reader if left unexplained.

## The Rule of Three — What Gets Logged

A decision earns an ADR entry only if **all three** are true:

1. **Hard to reverse** — undoing it later is expensive (data migration, API contract, architecture shape)
2. **Surprising without context** — a future reader would ask "wait, why did we do it this way?"
3. **Result of a real trade-off** — there were genuine alternatives, not one obvious path

If any of the three is missing, don't log it. This is a deliberate change from "log every non-trivial decision" — that approach produces a decisions folder nobody reads because it's 90% noise. A tight, curated log stays useful; a bloated one gets ignored.

### Examples

| Decision | Reversible? | Surprising? | Real trade-off? | Log it? |
|----------|------------|-------------|-----------------|---------|
| Chose PostgreSQL over MongoDB for relational order data | Hard (migration) | Yes | Yes | ✅ |
| Named a variable `userId` instead of `id` | Trivial | No | No | ❌ |
| Used bcrypt over argon2 for password hashing | Hard (rehash all) | Somewhat | Yes | ✅ |
| Added a null check before accessing `user.email` | Trivial | No | No | ❌ |
| Skipped rate limiting on an internal-only endpoint | Easy to add later | Yes (looks like an oversight) | Yes | ✅ |
| Used `const` instead of `let` | Trivial | No | No | ❌ |
| Overrode the "no premature abstraction" constraint for the plugin system | Moderate | Yes | Yes | ✅ (constraint overrides always pass the gate) |

**Constraint overrides always pass the gate automatically** — a user overriding an SDD Pipeline rule is by definition surprising to a future reader and worth recording.

## Log Entry Format

Each decision is a separate file in `docs/sdd/decisions/`.

**Filename**: `{NNN}-{slug}.md` (e.g., `005-postgres-over-mongo.md`)

**ADR ID**: the file number doubles as the decision's spine ID — `decisions/005-postgres-over-mongo.md` **is** `ADR-005`. The traceability matrix, FSD/SDD cross-references, and commit messages cite it by that ID. This is why decisions are numbered sequentially and never renumbered.

Keep it minimal — title + 1-3 sentences. Add optional sections only when they genuinely add value, not as boilerplate.

```markdown
# Decision #[N]: [Title]

**Date**: [YYYY-MM-DD]
**Status**: ACCEPTED | SUPERSEDED by #[M]

[1-3 sentences: what was decided, and why. That's often enough.]
```

**Optional sections** — include only if they add real value beyond the summary:

```markdown
## Alternatives Considered
- [Alternative]: [why not chosen]

## Consequences
- [What this makes easier/harder going forward]

## Override
[user overrode [constraint] because [reason]]
```

Most entries should be 3-5 lines total. If it's growing past half a page, it's probably drifting into SDD territory — generate an SDD instead (`skills/build/doc-generator/`) and just reference it here.

## Rules

1. Decision files are **write-once**. To change a decision, create a new one that supersedes it and mark the old one `SUPERSEDED by #[M]`.
2. Number decisions sequentially across all tasks.
3. Run every candidate decision through the rule-of-three gate before creating a file. When in doubt, don't log it — a missed decision costs nothing; a bloated log costs everyone's attention.
4. After writing, update `docs/sdd/index.md` with a link to the new decision.
5. If this is the first decision, create the `docs/sdd/decisions/` directory.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Skip entirely |
| vibe | Apply rule-of-three silently. Log only what passes. |
| standard | Apply rule-of-three. Reference logged decisions in verification report. |
| strict | Apply rule-of-three strictly, but also require explicit sign-off on anything borderline (2 of 3 criteria met) — ask the user (native question tool first, per `skills/think/elicitation/`) rather than silently skipping. |
| emergency | Log post-facto only if the fix itself was a hard-to-reverse call: "Emergency fix applied: [what] [why] [files touched]" |

## Searching Decisions

When starting a new task, check `docs/sdd/decisions/` and `docs/sdd/glossary.md` for relevant prior context:
- "Have we already decided on an auth approach?"
- "What ORM was chosen and why?"

This prevents re-debating settled decisions — and because the log is curated (not bloated), searching it is actually fast. Treat a found decision as binding by default; if `docs/sdd/config.md` sets `team.shared-decisions: false`, surface it and confirm it still applies to the current task instead of treating it as settled without asking (see orchestrator's "Team Support").
