---
name: project-memory
description: >-
  A lightweight, Obsidian-style knowledge graph about THIS codebase — small
  linked markdown notes (one module/concept/gotcha each) the agent writes as it
  learns and reads first on later sessions, so it understands the project
  cheaply instead of re-scanning everything every time. Expensive to seed once,
  cheap forever after. Use when you learn something durable about how the code
  works, at the end of a substantial session, or when the user says "remember
  this / note this / what do you know about X". Lives in docs/sdd/memory/.
---

# project-memory — understand the codebase cheaply, session after session

Re-reading a large codebase from scratch every session is slow and expensive.
This is the fix: a small graph of markdown notes capturing what's *durable and
non-obvious* about the project, so the next session (or a cheaper model) reads
the memory + a targeted look at the code, not the whole repo. It is **not** the
spec (`docs/sdd/`) and **not** a trace of everything — only reusable knowledge.

Lives in `docs/sdd/memory/`. Plain markdown + `[[wikilinks]]`, exactly like an
Obsidian vault — an LLM reads it natively, and the links form a navigable graph.

## Structure

```
docs/sdd/memory/
  INDEX.md            # one line per note — READ THIS FIRST (it's the map, and cheap)
  <slug>.md           # one note per durable fact
```

Each note has short frontmatter + a focused body that links to related notes:

```markdown
---
title: Quota reservation (no-oversell)
type: gotcha        # module | concept | gotcha | how-to | pointer
updated: 2026-08-12
---
Reserving quota uses a row-lock (`SELECT … FOR UPDATE`) on the
`(variant, date)` row, holding on checkout and finalizing on payment. The
invariant `sold + held ≤ quota` must hold atomically — see [[ordering-module]].
The lock is why concurrent checkouts serialize here; don't "optimize" it away.
Source of truth: [[04-schema]] quota table, FSD-007.
```

## What belongs in memory (and what doesn't)

- **Do record**: what each module does + where it lives + its public interface;
  domain concepts and their real meaning; **gotchas** (non-obvious traps,
  constraints, "why it's like this"); recurring how-tos; pointers to the code
  location of important things.
- **Don't record**: the spec (that's `docs/sdd/`); anything obvious from a
  quick read; git history; a blow-by-blow of every change. Memory earns its
  keep by holding what you'd otherwise have to *rediscover*.

## Rules (keep it cheap)

- **One durable fact per note**, short. If a note grows into several topics,
  split it — small notes link better and load cheaper.
- **Link liberally** with `[[slug]]` — a link to a note that doesn't exist yet
  is fine; it marks something worth writing later. The links are the graph.
- **`INDEX.md` is the map** — one line per note (`- [[slug]] — hook`), always
  current. Read it first; then open only the few notes that matter to the task.
  **Never load the whole vault** — that defeats the point.
- **Update a note when it's wrong; delete it when obsolete.** Stale memory is
  worse than none.
- **Seed on brownfield, grow as you go.** `map-codebase`'s pass is the first
  seed; every session that learns something durable adds or fixes a note.

## Reading it (the payoff)

At the start of work on an existing project: read `docs/sdd/memory/INDEX.md`,
then the handful of notes relevant to the area you're touching. That plus a
targeted code read is usually enough — far cheaper than re-scanning the repo.
The project's `CLAUDE.md`/`AGENTS.md` should point here (see the orchestrator's
"Project setup" step) so this happens every session automatically.

## Exit

`INDEX.md` reflects every note; each note is one focused, linked fact; the next
session can get oriented from memory + a targeted read instead of a full
re-scan. What you learned this session that's durable is written down, not lost.
