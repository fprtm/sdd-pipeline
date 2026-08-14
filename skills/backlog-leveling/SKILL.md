---
name: backlog-leveling
description: >-
  Turn the FSD + architecture into an implementation backlog of tickets, each
  tiered by difficulty (T1/T2/T3) so trivial work can be handed to a junior dev
  or a cheap model and hard work to a senior/strong model. Use when the user
  says "break this into tickets / backlog / tasks / estimate / how long", or as
  phase 6 of spec-driven-development. Every TICKET-xxx traces to an FSD and is
  self-contained; the tiers also drive a rough effort/cost estimate.
---

# backlog-leveling — tiered, executor-friendly backlog

The goal is a backlog where each ticket is a **self-contained work order**: a
junior developer or a cheap model can pick it up, understand it from the ticket
alone, and finish it without reverse-engineering the whole spec. Cost and skill
are allocated deliberately.

Write to `docs/sdd/06-backlog.md` using `backlog.template.md` (bundled with this
skill) — see [`reference.md`](reference.md) for a full worked ticket example.

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
- **Cheap-model-executable test** (this is the pipeline's core promise): could a
  *junior dev or a cheap/small model* execute this without inventing anything?
  Its steps must name the **concrete files/functions** to touch, point at the
  **exact spec sections** that define every shape (the FSD behavior, the
  `04-schema.md` fields, the endpoint contract, the `04-stack-guide.md` idioms),
  and say "use X from FSD-nnn, don't invent it." A T1 ticket should read almost
  paint-by-numbers. If executing it would require guessing a field, a shape, a
  path, or a contract, the ticket isn't ready — add the detail or link it.
- **Every ticket traces to an FSD** (or a SEC control, or an ADR follow-up). No
  freelance tickets. `traceability` flags orphans.
- **Security tickets exist**: every SEC-xxx that needs code gets its own ticket,
  tiered honestly (usually T2/T3).
- **Sequence by dependency**, and mark what can run in **parallel** — this is
  what lets a multi-agent runtime fan tickets out to several subagents at once.
- **Foundation first, then one vertical slice at a time — not layer-by-layer.**
  When a feature has several similar operations (the classic case: CRUD on one
  resource — Create/Read/Update/Delete; also applies to multiple report types,
  notification channels, etc.):
  1. **One foundation ticket first**, *only if genuinely shared and not already
     there* — the type/interface/schema/port every operation needs (respect
     `database-design`'s schema work; don't speculative-design shared
     abstractions no operation needs yet — that's still YAGNI).
  2. **Then one ticket per operation, each a complete vertical slice**: route →
     service → domain → tests → docs for *that one operation*, done and
     shippable, before the next operation's ticket starts. **Don't** create
     cross-cutting tickets like "all four routes" then "all four services" —
     layer-slicing leaves every operation simultaneously half-done, which is
     exactly what makes progress hard to see and a to-do list drift from reality.
  3. This ordering is also *why* it's easier to track: a vertical-slice ticket
     has one unambiguous done/not-done state, not several partially-finished
     threads at once.

  Say explicitly in the backlog which tickets are foundation vs. per-operation
  slices, and their order.
- **Acceptance criteria are Given/When/Then** so `test-plan` maps them 1:1 to
  tests and the executor knows exactly when they're done.
- **Right-size**: a ticket should be finishable in one focused sitting. If it
  can't be, split it — and keep the IDs stable.

## Estimate (optional — the tiers make it cheap)

When someone asks "how long / how much", the tiered backlog gives a transparent
estimate — derived from it, not guessed. Write `docs/sdd/ESTIMATE.md` using
`estimate.template.md` (bundled with this skill); see `reference.md` for the
sizing formula and the plain-language headline pattern. Always **ranges with
shown assumptions**, never false precision — and re-estimate when the backlog
changes. Record confirmed estimating assumptions in `decision-log`.

## Exit gate

Every FSD and every code-bearing SEC has ≥1 ticket; every ticket is tiered, has
acceptance criteria and a definition of done, and passes the self-containment
test; parallelizable tickets are marked. Invoke `traceability`, then proceed to
`test-plan`. (Produce `ESTIMATE.md` too if effort/cost was asked for.)
