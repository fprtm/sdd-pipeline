# Test Plan — The Proof Layer

Turn acceptance criteria into an executable definition of "done and proven". Written **before or alongside** implementation so test-first work has targets to go red against, and so the PROVE phase has a checklist instead of a vibe.

Write to `docs/sdd/specs/{NNN}-{slug}/tests.md` — inside the same feature folder as its FSD (found by number, per doc-generator's "Number-First Lookup" rule), shape in `skills/build/doc-generator/formats.md`. TEST-xxx IDs are item-level and global (counter in `docs/sdd/traceability.md`).

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

## Multi-Perspective Coverage — Every Actor, Every State

A test plan that says "a logged-in user" when the FSD defines admin, regular user, and anonymous is testing one perspective and hoping the others work the same way. They don't.

### Per-Flow Actor Coverage

For each FSD flow, enumerate every **actor/role** that can interact with it (from the FSD's actors list, the ERD's role enum, or the auth model). Each actor gets at least one test:

| Actor | What the test proves |
|---|---|
| **The intended user** | The happy path works for the role the flow was designed for |
| **A different role** | The flow correctly allows or denies based on role (admin can do X, regular user can't — or vice versa) |
| **Another user of the same role** | User A cannot access/modify user B's data (IDOR prevention) |
| **Unauthenticated** | Protected flows reject with 401, not 500 or silent success |

A flow that the FSD says "only admin can do" needs at minimum: admin succeeds, regular user gets 403, anonymous gets 401. If the plan only has "admin succeeds," the other two are untested assumptions.

### Condition Matrix — Test Where Behavior Changes

For each flow, enumerate the **conditions that vary** and test the intersections where behavior changes:

| Dimension | Examples | Why it matters |
|---|---|---|
| **Entity state** | pending / active / cancelled / archived / soft-deleted | An action on a cancelled order should behave differently than on an active one |
| **Data volume** | empty (0) / single (1) / at-boundary / over-limit | Empty lists, pagination boundaries, and rate limits are where bugs hide |
| **Ownership** | own resource / other user's / shared / no-owner | Authorization logic fails at ownership boundaries |
| **Timing** | before prerequisite / during concurrent op / after expiry / after soft-delete | Expired tokens, stale caches, race conditions |
| **Input shape** | minimal valid / maximal valid / unicode / special characters / nested | Validation often passes for "normal" input and crashes on edge shapes |

**Not the full cartesian product** — that's combinatorial explosion. Test the **important intersections**: the ones where behavior changes. A good heuristic: if two conditions produce different code paths (different `if` branches, different error codes, different DB queries), their intersection needs a test.

For each flow, produce a mini-matrix in the plan:

```
### FSD-003 — Add to Cart
| Condition | Test |
|---|---|
| active product, logged-in owner | TEST-031 (happy path) |
| archived product, logged-in | TEST-032 (should fail: "product unavailable") |
| active product, anonymous | TEST-033 (should redirect to login) |
| active product, quantity > stock | TEST-034 (should fail: "insufficient stock") |
| active product, concurrent add by same user | TEST-035 (should not double-add) |
```

A flow with only one row in its condition matrix is undertested — name the gap.

## Test Classes — Label Every Case

- **Happy path** — the main flow works with valid input. One per FSD main flow, **per actor role** (not just "a user" — name the role).
- **Regression** — locks previously-agreed behavior; every bug fixed gets one so it can't come back. Includes each High/Critical SEC control's expected behavior.
- **Edge / negative** — boundaries, empty/max, invalid input, the FSD's error/alternate flows, authorization denials. **This is where most defects hide — weight effort here.** Includes entity-state tests (acting on cancelled/deleted/expired entities), ownership boundaries (user A on user B's resource), and data-volume boundaries (empty list, at-limit, over-limit).
- **E2E** — a real user journey across the whole stack, each mirroring the FSD/SDS's key flow or sequence diagram (**the sequence diagram is the backbone of the e2e test** — if you can't map the test to a diagram, one of the two is wrong). Few, but they must cover each Must-priority journey. **For a product with a UI, "the outer interface" means a real browser, not the API underneath** — plan these for `skills/prove/browser-qa/`, prefer a committed Playwright/Cypress spec so CI keeps guarding it. An e2e case verified only at API/SSR level for a UI product is an integration test wearing an e2e label — say so, don't count it as browser-verified.
- **Security** — executable tests derived from `skills/think/threat-model/` SEC-xxx controls. Not a checklist — runnable test code that proves the control works. See "Security Test Cases" below.
- **Performance** — executable assertions against REQ-NF targets. Not static analysis — test code that measures actual response time, query count, or memory under realistic data. See "Performance Test Cases" below.

## Security Test Cases — SEC-xxx as Executable Tests

Every High/Critical SEC-xxx control from `skills/think/threat-model/` becomes at least one runnable test case — not a checklist item, not a "verify manually" note. The test proves the mitigation actually works in the code.

### What a Security Test Looks Like

For each SEC control, test **the attack it mitigates, not just the happy path**:

| SEC control type | Test pattern | Example |
|---|---|---|
| **Authentication** | Unauthenticated request → 401 (not 500, not silent success) | `POST /api/orders` without token → 401 |
| **Authorization / IDOR** | User A's token + user B's resource ID → 403 (not user B's data) | `GET /api/users/B/profile` with A's token → 403 |
| **Input sanitization** | Malicious input stored → retrieved safely | Store `<script>alert(1)</script>` in name → renders as escaped text |
| **SQL injection** | SQL payload in user input → parameterized, no data leak | `' OR 1=1 --` in search → empty result, no error |
| **Rate limiting** | Burst N+1 requests → 429 after threshold | 101 login attempts in 1 minute → 429 on attempt 101 |
| **Crypto/secrets** | Sensitive data at rest → not plaintext | Password stored → bcrypt hash, not plaintext; token in DB → hashed |

```
### TEST-050 — IDOR: user cannot access other user's orders  [class: security]
Proves: SEC-012 (resource-level authorization) · Level: integration
Given: user A authenticated, user B has order ORD-999
When: user A requests GET /api/orders/ORD-999
Then: 403 Forbidden (not 200 with B's data, not 404 pretending it doesn't exist)
```

**A SEC control without a test is a claim without evidence.** The diagnose skill (`skills/prove/diagnose/`) audits code against its checklist; the test plan generates the test that **proves it mechanically**.

## Performance Test Cases — Measure, Don't Just Scan

Static pattern detection (`skills/prove/performance-check/`) catches code-level anti-patterns (N+1, missing index, unbounded cache). That's necessary but insufficient — it doesn't prove the endpoint is actually fast enough. Performance test cases are **executable assertions** against realistic conditions.

### What a Performance Test Looks Like

| Target | Test pattern | What to assert |
|---|---|---|
| **Response time** | Seed DB with realistic data volume (not empty), hit endpoint, measure | p95 < threshold from REQ-NF (or default 200ms for API, 3s for page load) |
| **Query count** | Instrument/count DB queries for a list operation | N items → exactly K queries (not N+K — that's N+1) |
| **Memory** | Process a large dataset (1000+ records), measure heap | Memory stays bounded (no linear growth with input size) |
| **Concurrent load** | Fire N parallel requests to same endpoint | No 500s, no deadlocks, response time stays within 2x of single-request |

```
### TEST-060 — List orders p95 < 200ms with 500 records  [class: performance]
Proves: REQ-NF-003 (API response time) · Level: integration
Given: 500 seeded orders in test DB
When: GET /api/orders?page=1&limit=20 is called 50 times
Then: p95 response time < 200ms; query count = 2 (list + count)
```

**Performance tests need realistic data.** An endpoint that returns in 5ms on an empty database and 5 seconds on 10,000 rows is not fast — it's untested. Seed the test DB with a volume that matches realistic usage (from REQ-NF or discovery).

**When to include**: medium+ tasks that add API endpoints, database queries, list/search operations, or data processing. Micro/small tasks that don't touch performance-sensitive code: skip, but name the skip.

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

Every Must FSD flow → ≥1 happy + relevant edge tests **per actor role** · every High/Critical SEC → ≥1 **executable security test** (not just checklist, actual test code) · every REQ-NF → ≥1 **executable performance test** with realistic data · every ticket's acceptance criteria → the TEST-xxx that verifies it. Any FSD with no test is a red row in the matrix — surface it, don't paper over it.

## Exit Gate

Each Must FSD flow has planned cases across the right classes **and across actor roles** (condition matrix); each High/Critical SEC has an executable security test; performance targets from REQ-NF have executable assertions with realistic data volumes; coverage target + command written; e2e cases exist for Must journeys; the LOCAL-only env is stated. Update `skills/meta/traceability/`, then implementation can begin against these targets.
