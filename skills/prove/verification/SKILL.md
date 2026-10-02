# Verification

Multi-layer verification orchestrator. Runs after BUILD phase completes.

## Context Independence

The agent that wrote the code should not be the sole verifier of its own work — same principle as `prove/judgment`'s gate, applied one layer earlier.

- **Dispatch available** (Claude Code Agent tool, or equivalent): run verification as a separate sub-agent per `skills/agents/subagent-patterns/`'s Pattern 1 — give it the spec, the diff, and the commands to run; it has not seen the implementation reasoning.
- **Single-agent environments**: re-run and re-read the results cold, but label
  the result `degraded independence`. Medium+ and security-sensitive work must
  list explicit human-review items. A cold self-read is not independent.
- This does not replace `prove/judgment`'s independence requirement — judgment still runs in a fresh context after verification completes. Verification independence catches issues before judgment even starts.

## Every Result Comes From a Command That Actually Ran

This is the rule the whole PROVE phase rests on. A verification report is worthless — worse than absent, because it manufactures confidence — if any line in it was inferred rather than observed.

- **Run the command. Read its output. Report that.** Never report PASS because the code looks correct, because the tests were written carefully, or because it passed earlier in the session.
- **Include the real output** — the summary line at minimum (`Tests: 24 passed, 2 failed`, the coverage table row). A verdict with no tool output behind it is an opinion.
- **A command that didn't run is `SKIPPED — <reason>`, never PASS.** No test script, runner not installed, coverage misconfigured, sandbox blocked it: all are skips, all are gaps, none are passes.
- **A failing layer is reported as failing**, including when the fix attempts ran out. "Mostly passing" is not a verdict — give the count and name the failures.

Writing tests and running tests are different acts, and only the second one is evidence. An agent that generated a beautiful suite and never executed it has proven nothing at all.

## 4 Verification Layers

Run these in parallel when multi-agent is available. Sequential otherwise.

### Layer 1: Type Safety
- Run the project's type checker: `tsc`, `mypy`, `cargo check`, etc.
- Zero type errors required.
- If no type checker configured: skip this layer, note in report.

### Layer 2: Tests
- **Environment safety first — LOCAL only, hard stop.** Before running any suite, confirm the target is local/ephemeral (`NODE_ENV` test/dev; datastore on localhost / `*_test` / in-memory, loaded from a test env file). If anything points at production, a shared host, or you can't tell — STOP and ask; never guess, never "just try it". Full rule in `skills/build/test-plan/`.
- Run the existing test suite: `npm test`, `pytest`, `go test`, etc.
- All existing tests must pass.
- New code should have tests. If it doesn't: flag as gap in report.
- At medium+ size, run the coverage gate via `skills/prove/coverage-check/` (threshold + honesty checks); its PASS/FAIL rolls into this layer's result.
- If test command fails to run (not installed, misconfigured): note in report, don't block.

### Layer 3: Lint
- Run the project's linter: `eslint`, `ruff`, `golangci-lint`, etc.
- Auto-fix what's auto-fixable.
- Report remaining lint errors.
- If no linter configured: skip, note in report.

### Layer 4: Spec Conformance
- **Quality Contract, when opted in:** locate the canonical feature Markdown
  that contains the sole `quality-contract-json` block and run
  `node skills/meta/quality-contract/quality-contract.mjs <canonical.md> --json`.
  Preserve the emitted JSON and process exit code in the report. This is a
  read-only canonical-envelope check only: it cannot validate a ticket
  projection, verify external authority/review/evidence events, dispatch a
  gateway operation, or establish `may_accept`. Verify those claims with their
  corresponding projection, trusted-event, gateway, and sealed-evidence tests;
  never turn a facade PASS, unknown, or unavailable result into approval.
- **vNext delivery evidence:** evaluate the current exact-subject packet with
  `skills/meta/quality-contract/rules/delivery.mjs`. Treat missing, stale,
  self-reported/self-verified A2/A3 evidence and open defects as BLOCKED or
  REWORK exactly as emitted. Its shadow `DELIVERY_VALID` result still has
  `may_accept: false`; only the authorized lifecycle transition can accept.
- **vNext engineering profile:** evaluate all six explicit engineering
  dimensions with `skills/meta/quality-contract/rules/engineering.mjs`.
  Missing dimensions, false `not-required` states, failed criteria,
  below-floor evidence, unbound E5/E6 claims, and A2/A3 self-verification are
  failures or blockers exactly as emitted. `ENGINEERING_PROFILE_VALID` is
  shadow evidence and never acceptance authority.
- **If `docs/sdd/traceability.md` exists, run the mechanical check first** — `node tools/check-traceability.mjs docs/sdd` (bundled with `skills/meta/traceability/`) — instead of re-tracing by hand; its findings (orphans, broken refs, freelance tickets/tests) are this layer's findings.
- Then trace each requirement identified in the THINK phase to at least one test or verifiable check (covers work the matrix doesn't, e.g. small tasks with no matrix).
- Requirements with no corresponding test = **red flag**. List them explicitly.
- **Existence of a test is not conformance — correctness of the test against the spec's decided values is.** A requirement with a passing test still fails this layer if the test (or the code) doesn't match the *specific* value the FSD/SDS/ERD settled on: the actual status code, the actual cascade rule, the actual threshold number, the actual error message, the actual role check. Check the code and its tests against the document's specifics, not just against its topic. "There's a test for order cancellation" is not the same claim as "the test asserts cancellation is blocked after shipping, per FSD-003.4."
- **Cross-reference the ERD's cascade table against actual migrations** when a DB change is in scope — a migration that used `CASCADE` where the ERD settled on `RESTRICT` is a spec-conformance FAIL, not a style nit, even if every test passes (the tests may have been written against the same wrong assumption).
- **Cross-reference the arch deliberation's FE↔BE contracts against actual endpoint code** — request/response shape, status codes, error bodies. A contract drift here breaks the FE without either side's tests necessarily catching it if both were written from the same drifted understanding.
- This is the most judgment-heavy layer — if multi-model is available, route to STRONG tier.

## Aggregation

Combine results into a verification summary:

```
Layer 1 (Types): [PASS/FAIL/SKIPPED — reason]
Layer 2 (Tests): [PASS/FAIL/SKIPPED — reason] [N/M passed]
Layer 3 (Lint):  [PASS/FAIL/SKIPPED — reason] [N issues, M auto-fixed]
Layer 4 (Spec):  [PASS/FAIL/SKIPPED — reason] [N/M requirements traced]
```

## Failure Loop

If any layer fails:
1. The verifier records a defect with evidence; it does not edit the work it
   will approve.
2. The implementer fixes it (max 2 attempts).
3. The same independent verifier re-runs the failed layer.
4. If it still fails after 2 implementation attempts, escalate. Do not loop.

## Mode Behavior

Defer to orchestrator matrix on conflict. Skill-specific additions:

| Mode | Layers |
|------|--------|
| prototype | Quick smoke test plus the applicable small+ coverage gate; micro work remains smoke-only. |
| vibe | Layers 1-3 plus the applicable coverage gate silently. Only surface failures. |
| standard | All 4 layers |
| strict | All 4 layers + pause for manual review before proceeding |
| emergency | Quick smoke during mitigation; run the applicable coverage gate in the mandatory post-fix follow-up before ordinary acceptance. |

## Graceful Degradation

If the agent environment can't run certain checks (no internet for dependency check, sandbox limitations):
- Skip the check.
- Flag exactly what was skipped and why.
- Recommend manual verification for skipped items.
