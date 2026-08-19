# Coverage Check — Enforce the Proof, Honestly

A coverage number is easy to game and easy to misread. This gate makes it mean something: it checks the **threshold** *and* the **right lines**. Called by `skills/prove/verification/` (Layer 2) at medium+ sizes, and standalone when the user asks "check coverage", "are we at 80%", "is this well tested".

**Environment safety first**: the LOCAL-only hard stop from `skills/build/test-plan/` applies — confirm the test target is local/ephemeral before running anything.

## Step 1 — Run Coverage the Project's Way

Use the command recorded in the test plan (`docs/sdd/test-plans/…`). If none is set, detect the stack:

- JS/TS: `vitest run --coverage` or `jest --coverage`
- Python: `pytest --cov --cov-branch --cov-report=term-missing`
- Go: `go test ./... -coverprofile=cover.out && go tool cover -func=cover.out`
- Java: JaCoCo · .NET: `dotnet test --collect:"XPlat Code Coverage"` · Rust: `cargo llvm-cov`

Prefer **branch** coverage, not just line — branch is what catches untested error paths.

## Step 2 — Compare to the Gate

- Default gate: **≥ 80% line and branch** (use the test plan's threshold if it differs). Report actual numbers plainly — overall and per-package if available — and whether the gate passed.
- If below target, **list the specific uncovered files/functions** (term-missing style) so the next tickets are obvious. Never just "add more tests".

## Step 3 — The Honesty Checks (This Is the Point)

A passing percentage is necessary but not sufficient:

1. **Every FSD error/alternate flow has a test that hits it.** Cross-check the plan's edge cases against actually-executed lines.
2. **Every High/Critical SEC control has a passing security/regression test.** Failing this = gate failure *regardless of the percentage*.
3. **No fake passes** — grep for skipped/`.only`/commented-out/always-true assertions; flag them.
4. **New code isn't dragging coverage down** — if the diff added uncovered lines, name them even when the global number still clears the gate.
5. **UI product: every Must-priority journey is browser-verified** (via `skills/prove/browser-qa/`) or its gap explicitly flagged. A green unit suite doesn't prove a user can complete the journey in a browser.

## Step 4 — Verdict

- **PASS** — threshold met, all FSD error flows + High/Critical controls exercised, no fake passes.
- **FAIL** — with a short, prioritized list of exactly what to test next (as new TICKET/TEST IDs so it feeds the backlog).

**Never round a fail up to a pass to be agreeable.** The gate protects the user; report the real result including raw tool output. The user can override (inform-then-comply) — log it.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Skip — note "coverage unchecked" |
| vibe | Run silently at medium+; surface only a FAIL |
| standard | Full gate at medium+; small tasks: run tests, skip the percentage gate |
| strict | Full gate at small+ · FAIL blocks until resolved or explicitly overridden |
| emergency | Post-fix only: run the suite, note gaps for the calm follow-up |
