---
name: test-plan
description: >-
  Build a structured test plan before/alongside implementation — happy path,
  regression, edge/negative, and end-to-end — each case traced to an FSD and a
  ticket, with an explicit coverage target (default ≥80%). Use when the user says
  "write the test plan / test cases", "what should we test", or as phase 7 of
  spec-driven-development. Feeds TDD and the verify gate.
---

# test-plan — the proof layer

A test plan turns acceptance criteria into an executable definition of "done and
proven". It is written **before or alongside** implementation so TDD has targets
to go red against, and so the verify gate has a checklist.

Write to `docs/sdd/07-test-plan.md` using `test-plan.template.md` (bundled with this skill).

## Test classes (label every case with one)

- **Happy path** — the main flow works with valid input. One per FSD main flow.
- **Regression** — locks a previously-agreed behavior (and every bug you fix
  gets a regression test so it can't come back). Includes each High/Critical
  SEC control's expected behavior.
- **Edge / negative** — boundaries, empty/max, invalid input, error flows from
  the FSD's alternate paths, authorization denials. This is where most defects
  hide, so weight effort here.
- **E2E** — a real user journey across the whole stack, mirroring a sequence
  diagram from `to-diagrams`. Fewer of these, but they must cover each
  Must-priority journey. **For a product with a UI, "the outer interface" means a
  real browser, not the API underneath** — plan these journeys for execution by
  `browser-qa` (drive the running app in a browser and assert the result), and
  prefer a committed Playwright/Cypress spec so CI keeps guarding it. An e2e case
  "verified" only at the API/SSR level for a UI product is an integration test
  wearing an e2e label — say so, don't count it as browser-verified.
- **Non-functional** — performance (assert the REQ-NF p95/throughput target),
  and security cases derived from `threat-model`.

## Anatomy of a test case

```
### TEST-030 — Save persists and de-dupes  [class: happy + edge]
Proves: FSD-012 · Ticket: TICKET-018 · Level: unit+integration
Given: a logged-in user and an existing product
When: they save it, then save the same product again
Then: exactly one wishlist row exists; the second save is a no-op
Data/fixtures: seeded user U1, product P1
```

Keep tests behavior-focused (assert observable outcomes, not internals) so they
survive refactors — this is what makes the suite a safety net rather than a
maintenance tax.

## Test environment safety — LOCAL only, never production (hard stop)

Tests create, mutate, and delete data. **Running them against a production (or
any non-local/shared) database or environment can destroy real data — this is
one of the few truly irreversible mistakes.** So, before running *any* test
suite (here, in `implement`, `debug`, or `coverage-check`):

- **Confirm the target is local/ephemeral.** `NODE_ENV` (or the stack's
  equivalent) must be `test`/`development`, and the datastore must be a local or
  disposable test DB (e.g. `localhost`/`127.0.0.1`, a `*_test` database, an
  in-memory DB, or a throwaway testcontainer) loaded from a test env file
  (`.env.test`/`.env.test.local`), **not** the app's real `.env`.
- **If anything points at production or a non-local host** — `NODE_ENV=production`,
  a `DATABASE_URL`/DB host that isn't clearly local/test, a shared staging DB, or
  you simply can't tell — **STOP. Do not run the tests. Ask the user to confirm
  the correct local test target first.** Never guess; never "just try it."
- Prefer a dedicated test database and transactional or truncate-between-tests
  isolation, so a test run can't leak into dev data either.

State the exact test command + which env file it uses in the plan, so the
executor runs the right one.

## The pyramid — right shape, not just count

Aim for many fast unit tests, a solid band of integration tests at the seams the
architecture defined (`arch-decision`), and a **small, high-value** set of e2e
tests over the key journeys — for a UI, executed in a real browser by
`browser-qa`. Don't invert it into all-e2e (slow, flaky) or all-unit (misses
wiring bugs, and never proves the UI actually works).

## Coverage target

- **Default gate: line + branch coverage ≥ 80%**, enforced in `coverage-check`
  at the verify gate. State the exact number and the tool/command in the plan.
- Coverage is a floor, not a goal. **100% of Critical/High security controls and
  every FSD error flow must be tested even if overall coverage is already met.**
  A green coverage number over untested error paths is a false comfort — call
  that out.
- If the user wants a different threshold, record it here and in
  `coverage-check`; keep them in sync.

## Traceability of tests (both directions)

- Every Must FSD → ≥1 happy + relevant edge tests.
- Every High/Critical SEC → ≥1 security/regression test.
- Every ticket's acceptance criteria → the TEST-xxx that verifies it.
- Any FSD with no test is a **red row** in the matrix — surface it, don't paper
  over it.

## Exit gate

Each Must FSD and each High/Critical SEC has planned cases across the right
classes; the coverage target and command are written; e2e cases exist for Must
journeys. Invoke `traceability`, then implementation (`tdd` / `implement`) can
begin against these targets.
