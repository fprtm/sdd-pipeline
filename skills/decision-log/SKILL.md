---
name: decision-log
description: >-
  Keep a MANDATORY, timestamped record of every significant decision — scope
  cuts, assumptions, trade-offs, accepted risks, spec refinements, tool/library
  choices, and what got LOCKED. Fires proactively, not only on request: the
  moment you pick a default the user didn't specify, choose between two
  reasonable approaches, cut scope, accept a risk, or change a spec because
  reality demanded it — record it immediately, before moving on, even if the
  user didn't ask. Also on "record this / decision log / why did we do X / what
  did we lock about Y". Writes one timestamped file per decision in
  docs/sdd/decisions/.
---

# decision-log — never lose the "why", and make it findable

Six months later the expensive question is always "why did we do it this way,
and is it locked?". This log answers it. It is **not optional** — a pipeline
that decides things silently is a pipeline you can't audit or trust.

## Format: one file per decision (timestamped folder)

`docs/sdd/decisions/` — a folder, one markdown file per decision, so each
decision is its own findable, linkable node (Obsidian-style; ties into
`project-memory`):

```
docs/sdd/decisions/
  2026-08-12-1430-datastore-postgres.md
  2026-08-12-1615-share-link-idempotent.md
```

Filename: `YYYY-MM-DD-HHMM-<short-topic-slug>.md` — sortable (chronological by
name) and readable at a glance. Each file:

```markdown
---
title: Datastore = PostgreSQL
timestamp: 2026-08-12 14:30
status: locked            # proposed | decided | locked | superseded
decided-by: user          # user | agent (autopilot default — review) | user+agent
links: [REQ-NF-002, ADR-003, [[ordering-module]]]
---

## Description
One-line statement of what was decided.

## Context
What forced the decision — the constraints, the situation.

## Decision (and what's locked)
The choice, stated plainly. Say explicitly what is now LOCKED (won't be
revisited without a superseding decision) vs. still open.

## Why / alternatives
Why this over the others; name the main alternative(s) rejected and why.

## Consequences
What this constrains or costs downstream. Supersedes: <file> (if any).
```

- **Stable, dated, append-only** — never edit a decision away; if reversed, add
  a new file that `Supersedes:` it and flip the old one's `status: superseded`.
- **Say who decided** — mark autopilot defaults clearly so a human reviews them.
- **Link** to the REQ/FSD/ADR/SEC and any `[[memory-note]]` it touches.

## Lite/quick mode

In `lite`/`quick` (no full `docs/sdd/` tree), a decision is still recorded —
inline in a "Decisions" section of the `CHANGE-*.md`, with the same fields.
Don't skip it for lack of a folder.

## Architecture decisions (no duplication)

Deep **architecture** decisions live as ADRs in `04-architecture.md` — that
stays their SSOT. A decision file **links** to the ADR rather than copying it.

## When to write — self-check, don't wait to be asked

Every response where you built or decided something, ask: *did I just pick a
default, cut scope, choose between approaches, accept a risk, or lock something?*
If yes, write the file **now**, same turn. This matters most in autopilot or an
unattended stretch — exactly when a missed decision does the most damage.

## Exit

`docs/sdd/decisions/` holds a timestamped file for every non-trivial choice,
each stating what's locked and why, attributed and linked; autopilot defaults
are marked for review; architecture entries link to ADRs.
