---
name: decision-log
description: >-
  Keep a running log of every significant decision — scope cuts, assumptions,
  trade-offs, accepted risks, spec refinements, tool/library choices — so the
  "why" is never lost. Fires PROACTIVELY, not only on request: the moment you
  (the agent) pick a default the user didn't specify, choose between two
  reasonable approaches, cut scope, accept a risk, or change a spec because
  reality demanded it — log it immediately, before moving on, even if the user
  didn't ask. Also triggers explicitly on "record this decision / decision log
  / why did we do X / what did we decide about Y". Appends to
  docs/sdd/DECISIONS.md (or inline in a `CHANGE-*.md` in lite/quick mode).
---

# decision-log — never lose the "why"

Six months later, the expensive question is always "why did we do it this way?".
This log answers it. It is a chronological record of the decisions that shaped the
project, so anyone (a new dev, a cheaper model, the user) can understand the
reasoning without archaeology.

Output: `docs/sdd/DECISIONS.md` (append-only — decisions are never edited away;
if one is reversed, add a new entry that supersedes it).

## What belongs here

Log any decision that would be costly or confusing to reverse-engineer:
- **Scope** — what was cut or deferred and why (the "Won't" items).
- **Assumptions** — anything assumed rather than confirmed, **especially autopilot
  defaults chosen on the user's behalf** (so a human can audit and correct them).
- **Trade-offs** — when two good options existed and you picked one.
- **Accepted risks** — from the threat model, with the named owner.
- **Spec refinements** — when implementation reality changed a spec (e.g. an FSD
  refined because of a security constraint).
- **Tool / process choices** — anything not already an ADR.

## Relationship to ADRs (no duplication)

**Architecture** decisions live as ADRs in `04-architecture.md` — that stays the
SSOT for them. The decision log **links** to an ADR (`see ADR-003`) rather than
copying it. The log is the broader, chronological "everything else + pointers"
record; ADRs are the deep architecture entries.

## Entry format

```
### DEC-007 — Share link is idempotent, not re-shown  (2026-08-08)
Phase/role: 8 / engineer
Decision: A second "Share" while a link is active does not re-return the token.
Context: only the token hash is stored (SEC-002), so the raw URL can't be
         re-derived server-side.
Why / alternatives: storing the token reversibly was rejected (weakens hash-at-
         rest); security > convenience of re-showing the URL.
Decided by: agent (autopilot default) — flagged for human confirmation.
Links: FSD-008, SEC-002.  Supersedes: —
```

- Stable IDs (`DEC-xxx`), dated, never renumbered.
- Say **who decided** — the user, or the agent as an autopilot default (mark those
  clearly so they get reviewed).
- Link to the REQ/FSD/ADR/SEC it touches; keep the entry short.

## When to write

Append the moment a decision is made — don't batch at the end (you'll forget the
why). Don't wait to be asked. The orchestrator prompts for it at each gate;
`stakeholder-brief` writes stakeholder decisions here; autopilot records every
default it chose.

**Self-check, every response where you built or decided something:** before
moving to the next thing, ask "did I just pick a default, cut scope, choose
between two viable approaches, or accept a risk?" If yes, log it **now**, in
the same turn — not as a follow-up, not only if the user notices and asks.
This matters most exactly when no one is watching closely (autopilot, or a
long unattended stretch) — that is precisely when an unrecorded decision does
the most damage later.

## Exit
`docs/sdd/DECISIONS.md` reflects the real decision history: every non-trivial
choice has a dated, attributed, linked entry; autopilot defaults are marked for
review; architecture entries link to ADRs rather than duplicating them.
