# Verification

Multi-layer verification orchestrator. Runs after BUILD phase completes.

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

## Self-Fix on Failure

If any layer fails:
1. Attempt to fix (max 2 attempts).
2. If fixed: re-run that layer to confirm.
3. If still failing after 2 attempts: escalate. Do NOT loop.

## Mode Behavior

| Mode | Layers |
|------|--------|
| prototype | Quick smoke test only (does it run?) |
| vibe | Layers 1-3 silently. Only surface failures. |
| standard | All 4 layers |
| strict | All 4 layers + pause for manual review before proceeding |
| emergency | Quick smoke test (does the fix work?) |

## Graceful Degradation

If the agent environment can't run certain checks (no internet for dependency check, sandbox limitations):
- Skip the check.
- Flag exactly what was skipped and why.
- Recommend manual verification for skipped items.
