---
name: implement
description: >-
  Build the code for a backlog ticket, test-first, one ticket at a time, honoring
  the architecture's dependency rule and the security controls. Use at phase 8 of
  spec-driven-development, or when the user says "implement TICKET-xxx / build
  this / start coding".
---

# implement — turn tickets into tested code

This is the coding phase, fully self-sufficient on its own. It is deliberately
disciplined: the specs, architecture, threat model, and test plan already exist,
so implementation is about *faithfully realizing* them, not re-deciding them. If
you find yourself wanting to change a decision, that's a signal to loop back to
the owning phase — not to freelance.

If a specialized TDD/implementation skill is also installed (e.g. mattpocock's
`implement`/`tdd`, superpowers' `executing-plans`), prefer it and treat this
skill's rules as the checklist to hold it to. Otherwise, do it yourself as below.

## The smallest change that satisfies the ticket (the "lazy senior" rule)

A good senior dev is *lazy* in the best sense: they make the **smallest, most
surgical change** that meets the ticket, and touch nothing else. Follow that:

- **Scope discipline.** Change only what the current ticket requires. Adding
  feature A is not license to refactor B and C because you noticed them. If you
  came to add "BTER reminder", don't also rewrite the OTD and petty-cash
  reminders — even to extract a shared abstraction — unless *that* is the ticket.
- **A refactor is its own decision.** If the clean way genuinely needs a
  refactor of existing working code, **stop and surface it**: name it, log it
  (`decision-log`), and either get the user's go-ahead or split it into its own
  ticket. Don't let it balloon the diff silently — a huge diff for a small
  feature is a red flag the user has to untangle in review.
- **Don't rewrite what works.** Prefer the minimal edit over a rewrite; keep the
  diff reviewable. Reuse existing patterns/utilities instead of inventing
  parallel ones (that's also the DRY/SSOT bar from `code-standards`).
- **Trace, then fix precisely.** For a bug, find the actual root cause
  (`debug`) and fix *that* — not a broad "clean-up while I'm here" pass around it.

The test of a good implementation diff: a reviewer can see it maps to the ticket
line-for-line, with no "why did this file change?" surprises.

## Work one ticket at a time

Pick the next ticket whose dependencies are met (respect the backlog's waves).
For each ticket:

1. **Re-read the ticket + its traces** — the FSD it implements, the ADRs that
   constrain it, the SEC controls it must honor, and the TEST-xxx that will prove
   it. Everything you need is in `docs/sdd/`.
2. **Right executor for the tier** — a T1 ticket can be handled quickly; a T3
   (security-sensitive, cross-cutting) deserves extra care and a review before
   moving on. Don't hand a T3 to autopilot-speed.

## Before running any test: local DB only (hard stop)

Tests mutate and delete data. **Before running the suite, confirm the target is
a local/disposable test DB** (`NODE_ENV=test`/`development`, a `localhost`/`*_test`/
in-memory/testcontainer DB from `.env.test`, not the real `.env`). **If anything
points at production or a non-local host — or you can't tell — STOP and ask the
user; do not run.** Full rule: `test-plan` → "Test environment safety". This is
irreversible if you get it wrong; never guess.

## Test-first loop (red → green → refactor)

For each acceptance criterion / TEST-xxx:

1. **Red** — write the test first, from the ticket's Given/When/Then. Run it; watch
   it fail for the *right* reason (asserting real behavior, not a typo).
2. **Green** — write the *simplest* code that passes. No speculative generality.
3. **Refactor** — clean it up with the test as a safety net. Remove duplication;
   keep names aligned with `00-context.md` (the ubiquitous language).

Cover the **error/alternate flows** from the FSD, not just the happy path — that's
where defects and the interesting tests live. Every bug found gets a failing
regression test before the fix.

## Write to the code-quality bar

Every line must clear `code-standards` (SSOT/DRY/YAGNI/deep modules/clarity —
read that skill for the definitions; run its "check before done" on your diff)
**and** `docs/sdd/04-stack-guide.md` (the stack-specific idioms from
`stack-conventions` — write idiomatic code for the framework, not generic code
that ignores it). Non-negotiable output quality, not a suggestion.

## Honor the architecture and security

- **Dependency rule** — obey the direction from `04-architecture.md` (e.g. domain
  imports nothing; adapters depend inward). Business logic goes in the domain/app
  layer behind ports, not in controllers or components. Keep it testable in
  isolation with fakes at the seams the architecture named.
- **Security controls** — implement the SEC-xxx that the ticket references
  (authz on every server action, validated input, output encoding, no secrets in
  code, parameterized queries…). A ticket that touches a control is not done until
  that control's test passes.
- **Read the actual current code before touching it** — not just to match
  naming/structure/idioms, but to verify what it *actually does right now*.
  The FSD/ticket describes intent; the code is the ground truth for current
  behavior, and the two can have drifted.
- **Migration or schema change?** — hold it to `database-design` (normalization,
  table boundaries, indexing tied to real queries, additive migrations) before
  writing it.

## Document as you go (same change, not later)

A ticket isn't done until its docs match its code. **Check whether docs already
exist for what you touched, then update them if behavior changed or create them
if missing** — both the user guide and developer docs, plus inline
JSDoc/docstrings for any public interface (see `documentation`). Do it while the
context is fresh, not deferred to ship; a missing doc is a *create*, not a skip.
**JSDoc stays simple and is written in English** (code artifacts are English even
when specs/user docs aren't). `code-review` blocks a public-interface change with
no matching doc.

## Keep the trail honest as you go

- Update the ticket's state on the gate board (`00-overview.md`) and flip its row
  toward green in `traceability.md` **only when its tests actually pass**.
- If implementation reveals a spec gap or a wrong assumption (it often does),
  **loop back** to the owning phase and fix the doc, then note the change. This
  feedback loop is a feature — see how the wishlist example refined FSD-008.
- Never mark a ticket done with skipped/`.only`/always-true tests, or with the
  behavior stubbed. `coverage-check` will catch it; don't make it have to.

## Mode-aware

- **Autopilot:** implement ticket after ticket without pausing, but stop before
  anything irreversible/destructive (dropping data, force-pushing, deleting) and
  before shipping — those need explicit human confirmation.
- **Copilot:** implement, then pause for the developer to review the diff/tests per
  ticket (or per wave) before continuing.
- **Parallel:** where the runtime supports subagents and the backlog marks tickets
  parallel-safe, fan them out — but reserve ID ranges first (see the overview's ID
  registry) and reconcile the traceability matrix centrally so nothing collides.

## Exit gate

The ticket's TEST-xxx pass; error flows covered; architecture dependency rule and
referenced SEC controls honored; traceability updated. Move to the next ticket.
When the backlog is drained, hand off to the **verify gate** (`coverage-check` +
code review + threat re-check) and `infra` for delivery.
