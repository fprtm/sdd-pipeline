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
