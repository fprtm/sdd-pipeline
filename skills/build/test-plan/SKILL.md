# Test Plan — The Proof Layer

Turn acceptance criteria into an executable definition of "done and proven". Written **before or alongside** implementation so test-first work has targets to go red against, and so the PROVE phase has a checklist instead of a vibe.

Write to `docs/sdd/test-plans/{NNN}-{slug}-tests.md` (shape in `skills/build/doc-generator/formats.md`). TEST-xxx IDs are item-level and global (counter in `docs/sdd/traceability.md`).

## When This Runs

Medium+ tasks in standard/strict mode get a test plan; small tasks get their tests named in the DoD instead of a separate file; micro tasks skip. Strict promotes (small gets a mini plan); prototype/vibe demote. Announce what was (not) generated, per doc-generator's rules.

## Positive AND Negative — Both, Per Flow, Always

**Every flow in the plan carries at least one passing case and at least one failing case.** A plan listing only happy paths is not a test plan; it's a demo script. The negative side is where defects actually live, and it's the side an agent writing its own tests will quietly under-produce, because passing tests are easier to write and feel like progress.

Concretely, per FSD flow:

| | What it proves |
|---|---|
| **Positive** ≥1 | Valid input produces the specified outcome |
| **Negative** ≥1 | Invalid/boundary/denied input is **rejected the way the spec says** — the right error, the right status, no partial write |

A flow with only positive cases is an incomplete row: name it in the plan as a gap rather than leaving the imbalance implicit. `skills/prove/coverage-check/` treats a flow whose FSD defines an error path but whose plan has no negative case as a gate failure, not a rounding error.

## Tests Before Code — The Developer Reviews Intent, Not Implementation

The fundamental review problem: AI generates 500 lines of implementation code, the developer has to understand all 500 lines. No amount of post-hoc review tooling changes this arithmetic.

**Tests-first changes what the developer reviews.** Instead of reviewing the implementation (complex, dense, implementation-specific), the developer reviews the test code (shorter, expresses intent, maps directly to the spec they helped create through deliberation).

### The Protocol

For medium+ tasks in standard/strict mode:

1. **Test plan** is written from spec (this already happens — see above).
2. **Test code is generated from the test plan BEFORE implementation.** Concrete test functions, using the stack's test framework, asserting the behaviors defined in the plan. These tests should FAIL — there's no implementation yet.
3. **Developer reviews the test code.** This is the key moment: the developer is reviewing 50-100 lines of intent-expressing test code, not 500 lines of implementation. The question is: "do these tests capture what we agreed on during deliberation?" — a question they can answer because they participated in the deliberation.
4. **Developer approves the tests** (standard: shown, proceed after presenting; strict: explicit approval required).
5. **Implementation is generated to make the tests pass.** The tests are the acceptance criteria, already approved.
6. **Tests pass = spec is mechanically verified.** The developer's review burden for the implementation drops to the review guide's trust tiers — 🔴 items still get deep review, but 🟡 items that have approved tests covering them need only an intent check.

### Mode Behavior for Tests-First

| Mode | Tests-first behavior |
|------|---------------------|
| **prototype** | Skip — code and tests generated together |
| **vibe** | Tests written first, auto-approved, no pause |
| **standard** | Tests written first, shown to developer, proceed after presenting |
| **strict** | Tests written first, developer must explicitly approve before implementation begins |

### Why This Works

The test code is a **translation of the spec into executable assertions**. The spec came from deliberation (which the developer participated in). So the developer is reviewing a translation of their own decisions — not an opaque implementation of their decisions. If the translation is faithful, the implementation is constrained to match.

This doesn't eliminate the need for code review (🔴 items still need deep review — tests can pass while containing a security flaw). But it **shifts the bulk of review** from "is this implementation correct?" to "do these tests capture what I asked for?" — a question that's both faster to answer and one the developer is better positioned to judge.

### Tests-First Does NOT Mean

- Writing tests for code that already exists (that's normal TDD)
- Writing tests without a spec (that's testing without intent)
- Skipping implementation review entirely (🔴 items still need deep review)
- Writing only happy-path tests (the positive+negative rule still applies)

## Test Classes — Label Every Case

- **Happy path** — the main flow works with valid input. One per FSD main flow.
- **Regression** — locks previously-agreed behavior; every bug fixed gets one so it can't come back. Includes each High/Critical SEC control's expected behavior.
- **Edge / negative** — boundaries, empty/max, invalid input, the FSD's error/alternate flows, authorization denials. **This is where most defects hide — weight effort here.**
- **E2E** — a real user journey across the whole stack, each mirroring the FSD/SDS's key flow or sequence diagram (**the sequence diagram is the backbone of the e2e test** — if you can't map the test to a diagram, one of the two is wrong). Few, but they must cover each Must-priority journey. **For a product with a UI, "the outer interface" means a real browser, not the API underneath** — plan these for `skills/prove/browser-qa/`, prefer a committed Playwright/Cypress spec so CI keeps guarding it. An e2e case verified only at API/SSR level for a UI product is an integration test wearing an e2e label — say so, don't count it as browser-verified.
- **Non-functional** — performance (assert the REQ-NF p95/throughput target) and security cases derived from `skills/think/threat-model/`.

## Anatomy of a Test Case

```
### TEST-030 — Save persists and de-dupes  [class: happy + edge]
Proves: FSD-003.1 · Ticket: TICKET-018 · Level: unit+integration
Given: a logged-in user and an existing product
When: they save it, then save the same product again
Then: exactly one wishlist row exists; the second save is a no-op
Data/fixtures: seeded user U1, product P1
```

Behavior-focused (assert observable outcomes, not internals) so tests survive refactors — a safety net, not a maintenance tax.

## Test Environment Safety — LOCAL ONLY, Never Production (HARD STOP)

Tests create, mutate, and delete data. **Running them against a production (or any non-local/shared) database or environment can destroy real data — one of the few truly irreversible mistakes.** Before running *any* test suite (here, during implementation, debugging, or coverage-check):

- **Confirm the target is local/ephemeral.** `NODE_ENV` (or the stack's equivalent) must be `test`/`development`, and the datastore must be local or disposable (`localhost`/`127.0.0.1`, a `*_test` database, in-memory, or a throwaway testcontainer) loaded from a test env file (`.env.test`), **not** the app's real `.env`.
- **If anything points at production or a non-local host** — `NODE_ENV=production`, a `DATABASE_URL`/host that isn't clearly local/test, a shared staging DB, or you simply can't tell — **STOP. Do not run the tests. Ask the user to confirm the correct local test target first.** Never guess; never "just try it."
- Prefer a dedicated test database with transactional or truncate-between-tests isolation, so a run can't leak into dev data either.

State the exact test command + which env file it uses in the plan, so any executor (human, cheap model, CI) runs the right one. This rule binds every skill that runs tests — it is restated in `skills/prove/verification/`.

## The Pyramid — Right Shape, Not Just Count

Many fast unit tests · a solid band of integration tests at the seams the architecture defined · a **small, high-value** set of e2e tests over Must journeys (browser-executed for a UI). Don't invert into all-e2e (slow, flaky) or all-unit (misses wiring bugs, never proves the UI works).

## Coverage Target — Achieved, Not Aspired To

- **Gate: line + branch ≥ 80%**, measured and enforced by `skills/prove/coverage-check/` in **every mode**. State the number and the tool/command in the plan.
- **"Planned to be covered" is not covered.** The plan sets the target; the gate proves it was hit against real tool output. A plan that names 40 cases while the suite runs 12 is a failing gate, not a partially-completed plan.
- Coverage is a **floor, not a goal**: 100% of Critical/High SEC controls and every FSD error flow must be tested even when the overall number is already met. A green percentage over untested error paths is false comfort — call it out.
- **New logic ships with its test in the same change.** Writing the function now and the test "next ticket" is how the 80% is permanently one ticket away. If a function is worth writing, its test is part of writing it.
- Different threshold? Record it here AND in coverage-check; keep them in sync.

## UI Work: Testable Selectors Are Part of the Deliverable

For any product with a UI, the test plan names the **`data-testid` anchors** each Must journey depends on, and the FE work that implements the screen adds them (`skills/constraints/web/`'s W9). Planning a browser journey against a UI that has no stable handles produces a spec that breaks on the next copy change — the selectors are part of the feature, not an afterthought of the test.

## Traceability (Both Directions)

Every Must FSD flow → ≥1 happy + relevant edge tests · every High/Critical SEC → ≥1 security/regression test · every ticket's acceptance criteria → the TEST-xxx that verifies it. Any FSD with no test is a red row in the matrix — surface it, don't paper over it.

## Exit Gate

Each Must FSD flow and each High/Critical SEC has planned cases across the right classes; coverage target + command written; e2e cases exist for Must journeys; the LOCAL-only env is stated. Update `skills/meta/traceability/`, then implementation can begin against these targets.
