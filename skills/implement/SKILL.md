---
name: implement
description: >-
  Build the code for a backlog ticket, test-first, one ticket at a time, honoring
  the architecture's dependency rule and the security controls. Use at phase 8 of
  spec-driven-development, or when the user says "implement TICKET-xxx / build
  this / start coding". Self-sufficient, but defers to a stronger TDD/impl skill
  (e.g. mattpocock's implement/tdd, superpowers' executing-plans) if one is
  installed.
---

# implement — turn tickets into tested code

This is the coding phase. It is deliberately disciplined: the specs, architecture,
threat model, and test plan already exist, so implementation is about *faithfully
realizing* them, not re-deciding them. If you find yourself wanting to change a
decision, that's a signal to loop back to the owning phase — not to freelance.

> **Defer if a better tool exists.** If the environment has a dedicated TDD or
> implementation skill (mattpocock `implement`/`tdd`, superpowers
> `executing-plans`/`test-driven-development`), use it and let this skill's rules
> act as the checklist. Otherwise, do it yourself as below.

## Work one ticket at a time

Pick the next ticket whose dependencies are met (respect the backlog's waves).
For each ticket:

1. **Re-read the ticket + its traces** — the FSD it implements, the ADRs that
   constrain it, the SEC controls it must honor, and the TEST-xxx that will prove
   it. Everything you need is in `docs/sdd/`.
2. **Right executor for the tier** — a T1 ticket can be handled quickly; a T3
   (security-sensitive, cross-cutting) deserves extra care and a review before
   moving on. Don't hand a T3 to autopilot-speed.

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

## Honor the architecture and security

- **Dependency rule** — obey the direction from `04-architecture.md` (e.g. domain
  imports nothing; adapters depend inward). Business logic goes in the domain/app
  layer behind ports, not in controllers or components. Keep it testable in
  isolation with fakes at the seams the architecture named.
- **Security controls** — implement the SEC-xxx that the ticket references
  (authz on every server action, validated input, output encoding, no secrets in
  code, parameterized queries…). A ticket that touches a control is not done until
  that control's test passes.
- **Match the surrounding code** — read neighboring files first; mirror their
  naming, structure, and idioms. New code should look like it belongs.

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
