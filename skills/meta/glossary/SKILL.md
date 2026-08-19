# Domain Glossary

Maintain a single source of truth for what terms mean in this project. Prevents the classic drift where "order," "customer," and "session" quietly mean three different things across the codebase.

## Why This Exists

Ambiguous terminology is a root cause of specification ambiguity (problem #1 in SDD Pipeline's original analysis). If "user" sometimes means "authenticated account" and sometimes means "any visitor," every downstream decision built on that word inherits the ambiguity. The glossary makes the project's vocabulary explicit and enforces one canonical word per concept.

## File

`docs/sdd/glossary.md` — created lazily, on the first term that needs pinning down. Don't pre-populate it with a generic dictionary.

## Format

```markdown
# Project Glossary

## [Term]
[1-2 sentence definition — what it IS, not what it does or how it's implemented.]

_Avoid_: [synonym1], [synonym2]

---
```

### Example

```markdown
## Order
A confirmed purchase intent tied to one customer, containing one or more line items and exactly one payment record. Exists from checkout submission through delivery or cancellation.

_Avoid_: purchase, transaction (transaction refers to the payment-provider record, not this)

---

## Session
A single authenticated browser context, identified by a JWT access token. Expires after 15 minutes of inactivity.

_Avoid_: login (login is the event that creates a session, not the session itself)

---
```

## What Belongs Here

Only **domain-specific** terms — words whose meaning is particular to this project's business logic. Do NOT include:
- General programming concepts (function, class, endpoint)
- Terms already unambiguous in context
- One-off variable names

## When to Update

Woven into any conversation, not a standalone step. Four live behaviors:

1. **Challenge conflicts** — if a term is used in a way that contradicts an existing glossary entry, flag it immediately: "Glossary says 'Order' includes cancelled orders — this usage implies it doesn't. Which is right?"
2. **Sharpen vague terms** — if a term is used ambiguously or overloaded (means different things in different places), force a precise canonical choice before proceeding.
3. **Stress-test relationships** — when a new term relates to an existing one, check the relationship holds under an edge case ("Can an Order exist without a Customer? A guest checkout?").
4. **Cross-reference against code** — if the stated definition contradicts what the code actually does, surface the contradiction rather than silently trusting either source.

Updates happen **inline**, the moment a term is resolved — never batched into an end-of-task cleanup.

## Integration

- **SDD Grill** (`skills/think/grill/`): new terms surfacing during a grill session get written here live.
- **Elicitation** (`skills/think/elicitation/`): check glossary before asking a question that hinges on a term — don't re-ask what's already pinned down.
- **Doc Generator** (`skills/build/doc-generator/`): FSD/SDD/PRD documents should use glossary terms consistently, not synonyms.
- **Decision Log** (`skills/meta/decision-log/`): decisions that define or change a term's meaning should update the glossary, not just the decision file.

## Rules

1. One canonical term wins. List rejected synonyms under `_Avoid_` so the choice isn't silently forgotten and re-litigated later.
2. Definitions describe what something IS, not how it's implemented or what it does procedurally.
3. Don't create the glossary file speculatively — first real ambiguity triggers it.
4. Keep entries short. If a definition needs a paragraph, the term is probably actually two terms — split it.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Skip — speed first, terminology drift is an acceptable cost |
| vibe | Update silently when ambiguity is caught. Don't interrupt the user to ask unless genuinely blocking. |
| standard | Flag conflicts and ask for clarification when they surface. |
| strict | Actively cross-reference new work against the glossary; treat unresolved ambiguity as a blocker before plan approval. |
| emergency | Skip entirely |
