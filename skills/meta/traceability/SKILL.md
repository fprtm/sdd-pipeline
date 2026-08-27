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

| REQ | FSD | ADR | SEC | Ticket | Test | Status |
|-----|-----|-----|-----|--------|------|--------|
| REQ-001 | FSD-003.1 | ADR-001 | SEC-004 | TICKET-018 | TEST-030, TEST-041 | 🟢 covered |
| REQ-005 | FSD-004 | ADR-001 | — | TICKET-025 | — | 🔴 no test |

Status legend:
- 🟢 **covered** — has FSD + ticket + ≥1 passing test (and SEC if sensitive)
- 🟠 **not specified** — REQ exists but no FSD yet
- 🟡 **not built** — FSD + ticket exist, no passing test / not implemented
- 🔴 **gap** — a required link missing where it shouldn't be (a Must REQ with no test, a High SEC with no verifying test)
- ⚪ **dropped** — deliberately out of scope; keep the row, strike the ID, never reuse it

## Run the Checker — Don't Eyeball It

A hand-maintained matrix drifts. This skill bundles a zero-dependency validator, `check-traceability.mjs` (in this skill's folder) — copy it into the target project (`tools/check-traceability.mjs`) and run it after updating the matrix; wire it into CI (`enforcement/ci/sdd-check.yml` has the job):

```bash
node tools/check-traceability.mjs docs/sdd
```

It flags: spine IDs (REQ/REQ-NF/FSD/SEC) defined but missing from the matrix; broken references (a matrix ID never defined — typo or rename); tickets/tests that trace to nothing upstream; duplicate ID definitions (a renumbering/copy-paste bug); and dead relative markdown links. It understands the v2 ID spine: file-level IDs from filenames (`specs/003-x-fsd.md` defines FSD-003, `decisions/005-y.md` defines ADR-005) and item-level IDs from headings/table rows. Treat a non-zero exit as a real defect, not a nuisance.

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
