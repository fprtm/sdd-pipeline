---
name: backlog-leveling
description: >-
  Turn the FSD + architecture into an implementation backlog of tickets, each
  tiered by difficulty (T1/T2/T3) so trivial work can be handed to a junior dev
  or a cheap model and hard work to a senior/strong model. Use when the user
  says "break this into tickets / backlog / tasks", or as phase 6 of
  spec-driven-development. Every TICKET-xxx traces to an FSD and is self-contained.
---

# backlog-leveling — tiered, executor-friendly backlog

The goal is a backlog where each ticket is a **self-contained work order**: a
junior developer or a cheap model can pick it up, understand it from the ticket
alone, and finish it without reverse-engineering the whole spec. Cost and skill
are allocated deliberately.

Write to `docs/sdd/06-backlog.md` using `templates/backlog.template.md`.

## Anatomy of a ticket

```
### TICKET-018 — Persist wishlist item
Traces to: FSD-012 · Constrained by: ADR-003 (Postgres), ADR-001 (layered)
Tier: T1
Plain-language goal: When a logged-in user saves a product, remember it so it's
  still there next visit.
Context an executor needs:
  - Table `wishlist_items(user_id, product_id, created_at)`, unique (user_id, product_id)
  - Lives in the persistence/adapter layer; call it from the application service
Steps (high level, not prescriptive):
  1. Add migration for wishlist_items
  2. Add repository method saveItem(userId, productId)
  3. Wire it into the AddToWishlist use case
Acceptance criteria (Given/When/Then):
  - Given a logged-in user, when they save a product, then a row exists and a
    second save of the same product does not create a duplicate
Definition of done: code + unit test (TEST-030) green, coverage not reduced,
  lint/type-check pass, no secret added, PR references TICKET-018
Dependencies: TICKET-017 (migration tooling) must merge first
Files likely touched: /db/migrations, /adapters/wishlistRepo, /app/addToWishlist
```

## The tiers

Assign a tier from **the ticket's intrinsic difficulty and blast radius**, not
its size in lines:

- **T1 — trivial / mechanical.** Well-bounded, one obvious way to do it, low
  blast radius. Safe for a **junior dev or a cheap/small model**. CRUD glue,
  a migration, a pure function with clear I/O, wiring an existing pattern.
- **T2 — standard.** Some judgment, touches 2–3 components, a couple of edge
  cases. Mid-tier model or competent dev. Most tickets land here.
- **T3 — complex / risky.** Cross-cutting, concurrency, security-sensitive,
  ambiguous, or hard to reverse. **Senior dev or a strong model**, and usually
  pair with `tdd` + a design skill. Never hand a T3 to a cheap model unattended.

Put the tier in the ticket **and** summarize the split at the top of the backlog
(counts per tier) so the user can plan cost/staffing.

## Rules

- **Self-containment test**: could someone who never read the PRD finish this
  ticket from the ticket alone? If not, add the missing context (don't link-hunt
  them across five docs).
- **Every ticket traces to an FSD** (or a SEC control, or an ADR follow-up). No
  freelance tickets. `traceability` flags orphans.
- **Security tickets exist**: every SEC-xxx that needs code gets its own ticket,
  tiered honestly (usually T2/T3).
- **Sequence by dependency**, and mark what can run in **parallel** — this is
  what lets a multi-agent runtime fan tickets out to several subagents at once.
- **Acceptance criteria are Given/When/Then** so `test-plan` maps them 1:1 to
  tests and the executor knows exactly when they're done.
- **Right-size**: a ticket should be finishable in one focused sitting. If it
  can't be, split it — and keep the IDs stable.

## Exit gate

Every FSD and every code-bearing SEC has ≥1 ticket; every ticket is tiered, has
acceptance criteria and a definition of done, and passes the self-containment
test; parallelizable tickets are marked. Invoke `traceability`, then proceed to
`test-plan`.
