# Coverage Check — Enforce the Proof, Honestly

A coverage number is easy to game and easy to misread. This gate makes it mean something: it checks the **threshold** *and* the **right lines**. Called by `skills/prove/verification/` (Layer 2) at medium+ sizes, and standalone when the user asks "check coverage", "are we at 80%", "is this well tested".

**Environment safety first**: the LOCAL-only hard stop from `skills/build/test-plan/` applies — confirm the test target is local/ephemeral before running anything.

## Step 1 — Run Coverage the Project's Way

Use the command recorded in the test plan (`docs/sdd/specs/{NNN}-{slug}/tests.md`). If none is set, detect the stack:

- JS/TS: `vitest run --coverage` or `jest --coverage`
- Python: `pytest --cov --cov-branch --cov-report=term-missing`
- Go: `go test ./... -coverprofile=cover.out && go tool cover -func=cover.out`
- Java: JaCoCo · .NET: `dotnet test --collect:"XPlat Code Coverage"` · Rust: `cargo llvm-cov`

Prefer **branch** coverage, not just line — branch is what catches untested error paths.

**Report only what actually ran.** Every number in this gate's output traces to real tool output from this run — include the raw summary line. Never infer a percentage from how thorough the tests *look*, never carry forward a number from an earlier run, and never report a gate result for a command that failed to execute (missing runner, misconfigured coverage, no test script). A gate that couldn't run is `SKIPPED — <reason>`, which is a gap, not a pass. Stating a coverage figure that no command produced is fabrication, and it defeats the entire purpose of having a gate.

## Step 2 — Compare to the Gate

- Gate: **≥ 80% line and branch** (use the test plan's threshold if it differs). Report actual numbers plainly — overall and per-package if available — and whether the gate passed.
- If below target, **list the specific uncovered files/functions** (term-missing style) so the next tickets are obvious. Never just "add more tests".
- **The gate is measured in every mode and at every size above `micro`.** Mode changes how loudly it's narrated and whether a FAIL blocks — never whether the measurement happens. "Coverage unchecked" is not an acceptable end state for a task that added logic.
- **What the 80% is measured *over* scales with size**, because "the whole repo hits 80%" is the wrong ask for a two-file bugfix in a repo sitting at 40%:
  - **small** → **≥80% of the lines this change touched**, plus the existing suite green. The code you just wrote is covered; you're not held responsible for the repo's history.
  - **medium / large** → **≥80% overall** (line + branch) *and* the honesty checks below.
  Either way the target is the same number and it is genuinely enforced — what changes is the denominator, not the bar.

## Step 3 — The Honesty Checks (This Is the Point)

A passing percentage is necessary but not sufficient:

1. **Every FSD error/alternate flow has a test that hits it.** Cross-check the plan's edge cases against actually-executed lines.
2. **Every flow has both a positive and a negative case.** Per `skills/build/test-plan/`'s positive-AND-negative rule: a flow whose FSD defines an error path but whose suite only proves the happy path is a **gate failure**, not a rounding error. An all-green suite of exclusively passing-input tests is the most common way an 80% number means nothing.
3. **Multi-perspective coverage is not optional.** If the FSD defines multiple actors/roles (admin, user, anonymous), tests from only one role's perspective = gate failure. Check the plan's condition matrix against executed tests — a flow with a 5-row matrix but only 1 test is undertested.
4. **Every High/Critical SEC control has a passing executable security test** (not just a checklist pass — an actual test function). Failing this = gate failure *regardless of the percentage*.
5. **Performance test cases exist for endpoints/queries with REQ-NF targets.** A list endpoint tested only with an empty database and no response-time assertion is untested.
6. **No fake passes** — grep for skipped/`.only`/commented-out/always-true assertions; flag them.
7. **New code isn't dragging coverage down** — if the diff added uncovered lines, name them even when the global number still clears the gate.
8. **UI product: every Must-priority journey is browser-verified** (via `skills/prove/browser-qa/`) or its gap explicitly flagged. A green unit suite doesn't prove a user can complete the journey in a browser.

## Step 4 — Verdict

- **PASS** — threshold met, all FSD error flows + High/Critical controls exercised, no fake passes.
- **FAIL** — with a short, prioritized list of exactly what to test next (as new TICKET/TEST IDs so it feeds the backlog).

**Never round a fail up to a pass to be agreeable.** The gate protects the user; report the real result including raw tool output. The user can override (inform-then-comply) — log it.

## Mode Behavior

**The gate always runs.** Mode dials *narration* and *whether a FAIL blocks* — never whether coverage is measured. (Same rule as everywhere else in this framework: mode controls depth and visibility, not coverage.)

| Mode | Measured? | Narrated | FAIL behavior |
|------|-----------|----------|---------------|
| prototype | ✅ always | one line: the number + pass/fail | Reported, doesn't block |
| vibe | ✅ always | silent on PASS, surfaced on FAIL | Reported, doesn't block |
| standard | ✅ always | full gate output | **Blocks** until resolved or explicitly overridden (logged) |
| strict | ✅ always | full gate output | **Blocks**; override requires explicit user confirmation |
| emergency | deferred | — | Run the suite post-fix; gaps go to the calm follow-up, named not forgotten |

A user can always override an unmet gate — inform-then-comply, and log it. What's not available is the gate quietly not happening.
