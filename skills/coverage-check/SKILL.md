---
name: coverage-check
description: >-
  The verify-gate coverage step — run the test suite with coverage, compare
  against the target (default ≥80% line+branch), and confirm the important paths
  (FSD error flows, High/Critical security controls) are actually exercised, not
  just the easy ones. Use at phase 9 of spec-driven-development, or when the user
  says "check coverage", "are we at 80%", "is this well tested".
---

# coverage-check — enforce the proof, honestly

A coverage number is easy to game and easy to misread. This skill makes it mean
something: it checks the **threshold** *and* the **right lines**.

## Step 1 — run coverage the project's way

Use the command recorded in `docs/sdd/07-test-plan.md`. If none is set, detect
the stack and use the standard tool, e.g.:

- JS/TS: `vitest run --coverage` or `jest --coverage`
- Python: `pytest --cov --cov-branch --cov-report=term-missing`
- Go: `go test ./... -coverprofile=cover.out && go tool cover -func=cover.out`
- Java: JaCoCo report; .NET: `coverlet` / `dotnet test --collect:"XPlat Code Coverage"`
- Rust: `cargo llvm-cov`

Prefer **branch** coverage, not just line — branch is what catches untested
error paths.

## Step 2 — compare to the gate

- Default gate: **≥ 80% line and branch.** Use the threshold in the test plan if
  it differs. Report the actual numbers plainly (overall and, if available,
  per-package), and whether the gate passed.
- If below target, **list the specific uncovered files/functions** (term-missing
  style) so the next tickets are obvious. Don't just say "add more tests".

## Step 3 — the honesty checks (this is the point)

A passing percentage is necessary but not sufficient. Also verify:

1. **Every FSD error/alternate flow has a test that hits it.** Cross-check the
   test plan's edge cases against actual executed lines.
2. **Every High/Critical SEC control has a passing security/regression test.**
   An unmitigated-in-tests security control is a gate failure regardless of the
   coverage number.
3. **No test is fake-passing** — skipped/`.only`/commented-out/always-true
   assertions. Grep for and flag them.
4. **New code isn't dragging coverage down** — if a diff added lines that are
   uncovered, name them even if the global number still clears 80%.
5. **For a UI product, every Must-priority journey is browser-verified** (via
   `browser-qa`) or its gap is explicitly flagged. A high coverage number over
   code that was never exercised through the real UI is false comfort — a green
   unit suite doesn't prove a user can complete the journey in a browser.

## Step 4 — verdict

State one of:

- **PASS** — threshold met, all FSD error flows and High/Critical controls
  exercised, no fake passes. The verify gate's coverage condition is satisfied.
- **FAIL** — with a short, prioritized list of exactly what to test next
  (ideally as new TICKET/TEST IDs so it feeds back into the backlog).

Never round a fail up to a pass to be agreeable. The gate protects the user;
report the real result, including the raw tool output.

## Exit gate

Coverage ≥ target **and** all FSD error flows + High/Critical controls proven,
with no fake passes. This is one of three conditions of the phase-9 verify gate
(alongside `code-review` and a `threat-model` re-check).
