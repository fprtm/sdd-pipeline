# Traceability — Keep the Chain Honest

Maintain the single source of truth linking requirements → specs → decisions/security controls → tickets → tests, and make every broken link *visible*: a requirement with no test, an FSD nobody built, a security control never verified. If the matrix is green, the work is genuinely coherent; if it lies, the whole pipeline is theater.

This skill owns `docs/sdd/traceability.md`. Run it after any phase that creates or changes an ID, or when the user asks "is everything covered / traced", "what's untested/unbuilt".

## When the Matrix Applies — Gated by Size (Not Always-On)

The matrix is powerful and expensive. Match it to the work (same philosophy as pipeline depth):

| Task size | Traceability form |
|-----------|-------------------|
| **large / full product** | Full matrix in `docs/sdd/traceability.md`, checker in CI, ship gate active |
| **medium** | Lite: an inline `Refs:` trail in the feature's FSD/change file (REQ→FSD→TICKET→TEST as a short list), no separate matrix row required — but IDs still come from the global counters |
| **small / micro** | Skip the matrix. The DoD floor still applies (see doc-generator) |

**strict mode** promotes one level (medium gets full rows); **prototype/vibe** demote (vibe medium = lite optional; prototype skips entirely). Never silently: if the matrix is skipped, say why in one line.

## The Matrix

One row per **REQ**, expanded to the leaves. Keep it a Markdown table so it diffs in review. The file header also holds the **global ID counters** (next free REQ/SEC/TICKET/TEST — see doc-generator's ID Spine section).

| REQ | FSD | ADR | SEC | Ticket | Test | Status | Evidence |
|-----|-----|-----|-----|--------|------|--------|----------|
| REQ-001 | FSD-003.1 | ADR-001 | SEC-004 | TICKET-018 | TEST-030, TEST-041 | 🟢 covered | `pnpm test order.test.ts` → 2/2 pass, 2026-09-11 |
| REQ-005 | FSD-004 | ADR-001 | — | TICKET-025 | — | 🔴 no test | — |

Status legend:
- 🟢 **covered** — has FSD + ticket + ≥1 passing test (and SEC if sensitive)
- 🟠 **not specified** — REQ exists but no FSD yet
- 🟡 **not built** — FSD + ticket exist, no passing test / not implemented
- 🔴 **gap** — a required link missing where it shouldn't be (a Must REQ with no test, a High SEC with no verifying test)
- ⚪ **dropped** — deliberately out of scope; keep the row, strike the ID, never reuse it

### Evidence Column — A Claim, Not Just a Status

A status glyph alone is an assertion; the Evidence column is what makes it checkable. **Every row marked 🟢 must carry a one-line Evidence entry**: the actual command that ran, its result summary, and the date — the same discipline `prove/verification`'s "Every Result Comes From a Command That Actually Ran" rule already requires at run time, just persisted instead of said once and forgotten.

- **Format**: `` `command` `` → result (N/M pass, or the specific measured value) `,` date. Keep it to one line — this is a pointer to evidence, not a copy of the test output.
- **A 🟢 row with an empty or stale Evidence cell is itself a defect** — `check-traceability.mjs` should treat it the same as a missing test link, since an unverifiable "covered" claim is functionally identical to an uncovered requirement.
- **Stale evidence**: if the code touching a REQ changed after the Evidence date, the row demotes to 🟡 until re-verified — a passing test from three refactors ago proves nothing about the current code.
- Skip this column entirely at `small`/`micro` sizes where the full matrix doesn't apply (per the gating table above) — the DoD floor's own verification section covers that ground more cheaply.

## Run the Checker — Don't Eyeball It

A hand-maintained matrix drifts. This skill bundles a zero-dependency validator, `check-traceability.mjs` (in this skill's folder) — copy it into the target project (`tools/check-traceability.mjs`) and run it after updating the matrix; wire it into CI (`enforcement/ci/sdd-check.yml` has the job):

```bash
node tools/check-traceability.mjs docs/sdd
```

It flags: spine IDs (REQ/REQ-NF/FSD/SEC) defined but missing from the matrix; broken references (a matrix ID never defined — typo or rename); tickets/tests that trace to nothing upstream; duplicate ID definitions (a renumbering/copy-paste bug, or two `specs/` feature folders sharing the same number with different slugs); and dead relative markdown links. It understands the v3 ID spine: file-level IDs from folder + bare filename (`specs/003-x/fsd.md` defines FSD-003, the number from the folder) and item-level IDs from headings/table rows; `decisions/005-y.md` still defines ADR-005 the flat way. Treat a non-zero exit as a real defect, not a nuisance.

## Checks Each Run (the script automates most)

1. Every **Must/Should REQ** reaches a passing test. If not → 🔴.
2. **No orphan FSD** (no REQ) and **no orphan test** (proves nothing traced).
3. Every **High/Critical SEC** has a verifying test. If not → 🔴.
4. Every code-bearing ticket has a test and an FSD parent.
5. IDs are **stable and unique** — nothing renumbered; dropped IDs struck, not reused.

## Output

A one-line coverage summary the user can act on:

> Traceability: 18 REQ · 🟢 14 covered · 🟡 2 not built · 🔴 1 gap (REQ-005 has no test) · 🟠 1 unspecified. Ship gate is **not** met until the 🔴 is resolved.

## Ship Gate

Where the matrix applies (large/full — see the gating table), the work may not "ship" while any Must/Should row is 🔴 or 🟡. That is the contract: spec in front, judgment behind — nothing merges unproven. Surface the blocking rows; **never quietly downgrade the gate** to make the run look finished. The user can override (orchestrator's inform-then-comply rule) — state what ships unproven, log it, proceed.
