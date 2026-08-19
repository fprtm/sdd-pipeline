# Browser QA — Verify the Real UI, Not Just the Code Under It

Unit and integration tests prove the pieces; they don't prove a user can complete the journey in a browser. This skill executes the **thin top of the test pyramid**: drive a real browser through each **Must-priority** user journey against the **locally-running** app and assert the outcome. It complements — never replaces — `skills/build/test-plan/`'s unit/integration layers. Part of the PROVE phase for any product with a UI; also triggered by "QA this in the browser", "does the feature actually work in a browser".

If a UI product's journeys are only "tested" at the API/SSR level, say so plainly — that is not browser-verified, and pretending otherwise is exactly the false comfort the coverage gate's honesty checks exist to prevent.

## Use Whatever Browser Capability Exists (Capability-Agnostic)

In order of preference:

1. **The host agent's built-in browser tools** (e.g. Claude Code's browser pane), if present.
2. **Playwright MCP** — portable MCP server most agents (OpenCode, Codex, …) can connect to. For OpenCode, the bundled idempotent setup merges it into the config: `node skills/prove/browser-qa/setup-browser-mcp.mjs` (`--project` for project-level, `--dry-run` to preview; requires Node ≥ 20). Writing agent config is a config change — say what changed and that a restart is needed.
3. **An in-repo runner** — Playwright or Cypress specs via the project's own test command.

Whichever you use, **interact by accessibility ref, not screen coordinates**: snapshot the accessibility tree, act on elements by role + name (`button "Login"`, `textbox "Email"`). Ref-based interaction survives layout changes; coordinate-clicking is flaky. Vision/coordinate mode only for what the a11y tree can't see (canvas, charts, drag-drop).

**If no browser capability is available at all:** don't fake it. Verify at the highest fidelity you can (API/SSR-level) and **flag the browser layer as unverified** — an honest gap, not a silent pass.

## Local Only — Never Production (HARD STOP)

Driving a browser runs *real* app actions (writes, deletes, emails, charges). `skills/build/test-plan/`'s environment-safety rule applies without exception:

- Point the browser at a **local** app (`localhost`/`127.0.0.1`) backed by a **local/disposable** DB (`*_test`, throwaway container, seeded local) from a test env file — never production, staging, or any shared host.
- **If the app under test points at production or a non-local DB, or you can't tell — STOP and ask.** Never QA against real data.
- **Neutralize real-world side effects**: outbound email/SMS, payments, webhooks, third-party calls hit sandboxes or test doubles, not real recipients.

## Keep It Thin (the Pyramid, Enforced)

- **Only Must-priority journeys** — the ones the test plan marked `e2e`, each mirroring the FSD's key sequence/flow diagram. A handful, not dozens.
- Don't browser-test what a unit/integration test already covers (validation rules, calculations, error branches).
- One pass per journey: happy path + the one or two most important failure states, not every permutation.

## Drive It: Explicit Steps + Assertions

Translate each journey's acceptance criteria (Given/When/Then) into concrete steps, and **assert explicitly** — a click that "didn't error" is not a pass:

```
navigate  → http://localhost:3000
snapshot  → find textbox "Email", textbox "Password", button "Login"
type      → Email = test user, Password = test pass
click     → button "Login"
assert    → text "Dashboard" visible   (NOT just "click didn't throw")
click     → link "Products" → button "Add to Cart"
assert    → cart badge shows "1" AND product name visible
```

Assert the *result the user would check*, tied back to the FSD/TEST id.

## Two Flavors — Different Lifecycles, Use Both

- **(a) Interactive agent-driven run** — the fast dev loop: run the app → drive the journey → assert → on failure capture the exact failing step (element/assertion, screenshot if available) → fix root cause → retest. Great feedback, but **ephemeral**.
- **(b) Committed e2e spec** — the journey as a Playwright/Cypress file in the repo: a **durable regression net** CI runs on every change (wired by `skills/build/infra/`). Prefer one committed spec per Must journey.

## When a Journey Fails

- **Fix the root cause, not the assertion.** Loosening an assertion to go green is the same sin as an always-true test — the coverage gate treats it as a fake pass.
- Report the failing **step** precisely (action + expected-vs-actual), not just "the test failed".
- Every bug a browser run finds gets a regression case (ideally a committed spec) so it can't come back.

## Report + Traceability

Per journey: **PASS/FAIL** with the failing step if any. Flip the `e2e` TEST rows in `docs/sdd/traceability.md` toward green **only when the browser run actually passed** (or a committed spec passes in CI). A journey that couldn't be verified is an explicit gap, never "done".

## Exit Gate

Every Must-priority journey either **browser-verified green** (ideally with a committed spec guarding it in CI) or its gap **explicitly flagged**. Local-only honored throughout.
