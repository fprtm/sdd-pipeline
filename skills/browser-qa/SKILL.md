---
name: browser-qa
description: >-
  Verify a UI product's Must-priority user journeys by driving a REAL browser
  against the locally-running app — navigate, click, type, submit, and assert the
  result — instead of only unit/integration tests that never open a page. Use at
  the phase-10 verify gate for any product with a UI, or when the user says "QA
  this in the browser", "test the UI end-to-end", "click through the app", "does
  the feature actually work in a browser". Capability-agnostic (uses whatever
  browser tool is available); keeps e2e thin; runs LOCAL only, never production.
---

# browser-qa — verify the real UI, not just the code under it

Unit and integration tests prove the pieces; they don't prove a user can actually
complete the journey in a browser. This skill executes the **thin top of the test
pyramid**: drive a real browser through each **Must-priority** user journey
against the **locally-running** app and assert the outcome. It complements — never
replaces — `test-plan`'s unit/integration layers.

If a UI product's journeys are only "tested" at the API/SSR level, say so plainly;
that is not the same as browser-verified, and pretending otherwise is exactly the
false comfort the verify gate exists to prevent.

## Use whatever browser capability exists (capability-agnostic)

This skill describes the *capability*, not one tool. Drive the browser through
whatever the runtime offers, in this order of preference:

1. **The host agent's built-in browser tools** (e.g. Claude Code's browser), if
   present.
2. **Playwright MCP** — a portable MCP server that most agents (OpenCode, Codex,
   …) can connect to. Setup: [`docs/browser-qa-setup.md`](../../docs/browser-qa-setup.md).
3. **An in-repo runner** — Playwright or Cypress specs run via the project's own
   test command.

Whichever you use, **interact by accessibility ref, not screen coordinates**:
take a snapshot (accessibility tree), then act on elements by role + name
(`button "Login"`, `textbox "Email"`). Ref-based interaction is stable across
layout changes; coordinate-clicking is flaky. Use a vision/coordinate mode only
for things absent from the a11y tree (canvas, charts, drag-drop).

**If no browser capability is available at all:** do not fake it. Verify the
journey at the highest fidelity you can (API/SSR-level), and **flag in the verify
gate that the browser layer is unverified** — an honest gap, not a silent pass.

## Local only — never production (hard stop)

Driving a browser runs *real* app actions (writes, deletes, emails, charges).
Reuse `test-plan`'s **"Test environment safety"** rule without exception:

- Point the browser at a **local** app (`localhost`/`127.0.0.1`) backed by a
  **local/disposable** DB (a `*_test` DB, throwaway container, or seeded local
  DB), from a test env file — **not** production, staging, or any shared host.
- **If the app under test points at production or a non-local DB, or you can't
  tell — STOP and ask.** Never QA against real data.
- **Neutralize real-world side effects**: outbound email/SMS, payments, webhooks,
  third-party calls must hit sandboxes or test doubles, not real recipients.

## Keep it thin (the pyramid, enforced)

Browser e2e is slow and flakier than unit tests, so spend it only where it earns
its cost:

- **Only Must-priority journeys** — the ones `test-plan` marked `e2e`, each
  mirroring a sequence diagram from `to-diagrams`. A handful, not dozens.
- **Don't browser-test what a unit/integration test already covers** (validation
  rules, calculations, error branches) — those belong lower in the pyramid.
- One end-to-end pass per journey (happy path + the one or two most important
  failure states), not every permutation.

## Drive it: map each journey to explicit steps + assertions

For each Must journey, translate its acceptance criteria (the FSD's
Given/When/Then) into concrete browser steps, and **assert explicitly** — a click
that "didn't error" is not a pass; assert the observable outcome:

```
navigate  → http://localhost:3000
snapshot  → find textbox "Email", textbox "Password", button "Login"
type      → Email = test user, Password = test pass
click     → button "Login"
assert    → text "Dashboard" visible   (NOT just "click didn't throw")
click     → link "Products" → button "Add to Cart"
assert    → cart badge shows "1" AND text "Sepatu Test" visible
```

Assert the *result the user would check*, tied back to the FSD/TEST id.

## Two flavors — use both, they have different lifecycles

- **(a) Interactive agent-driven run** — the fast dev loop: run the app → drive
  the journey → assert → on failure, capture the exact failing step (which
  element/assertion, a screenshot if the tool provides one) → hand to `debug`/
  `implement` to fix the root cause → retest. Great feedback, but **ephemeral** —
  it's gone when the session ends.
- **(b) Committed e2e spec** — write the journey as a Playwright/Cypress file in
  the repo so it becomes a **durable regression net** that CI runs on every change
  (wired by `infra`). Prefer producing one committed spec per Must journey; the
  interactive run is for immediate feedback, the committed spec is what keeps the
  journey from silently breaking later.

## When a journey fails

- **Fix the root cause, not the assertion.** Loosening an assertion to make it
  green is the same sin as an always-true test — `coverage-check`/`code-review`
  will treat it as a fake pass.
- Report the failing **step** precisely (the action + the expected-vs-actual),
  not just "the test failed", so the fix is targeted.
- Every bug a browser run finds gets a regression case (ideally the committed
  spec above) so it can't come back.

## Report + traceability

Per journey, report **PASS/FAIL** with the failing step if any. Flip the `e2e`
TEST rows in `traceability.md` toward green **only when the browser run actually
passed** (or a committed spec passes in CI). A journey that couldn't be verified
(no capability, not automatable) is reported as an explicit gap, never as done.

## Exit gate

Every Must-priority journey is either **browser-verified green** (ideally with a
committed spec now guarding it in CI) or its verification gap is **explicitly
flagged** in the verify gate — never silently passed. Local-only was honored
throughout. This is part of the phase-10 verify gate for any product with a UI.
