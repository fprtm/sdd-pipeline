---
name: traceability
description: >-
  Maintain the single source of truth that links requirements → functional specs
  → architecture → security controls → tickets → tests, and flag any broken
  link. Invoke after any phase that creates or changes an ID, or when the user
  asks "is everything covered / traced", "show the traceability matrix", "what's
  untested/unbuilt". Core to spec-driven-development.
---

# traceability — keep the chain honest

This skill owns `docs/sdd/traceability.md`. Its job is to make gaps *visible*:
a requirement with no test, an FSD nobody built, a security control never
verified. If the matrix is green, the work is genuinely coherent; if it lies,
the whole pipeline is theater.

## The matrix

One row per **REQ**, expanded to the leaves. Keep it as a Markdown table so it
diffs in review:

| REQ | FSD | ADR (constrains) | SEC | Ticket | Test | Status |
|-----|-----|------------------|-----|--------|------|--------|
| REQ-001 | FSD-012 | ADR-001, ADR-003 | SEC-004 | TICKET-018 | TEST-030, TEST-041 | 🟢 covered |
| REQ-005 | FSD-020 | ADR-001 | — | TICKET-025 | — | 🔴 no test |
| REQ-009 | — | — | — | — | — | 🟠 not specified |

Status legend:
- 🟢 **covered** — has FSD + ticket + ≥1 passing test (and SEC if sensitive).
- 🟠 **not specified** — REQ exists but no FSD yet.
- 🟡 **not built** — FSD + ticket exist, no passing test / not implemented.
- 🔴 **gap** — a required link is missing where it shouldn't be (e.g. a Must REQ
  with no test, a High SEC with no verifying test).
- ⚪ **dropped** — deliberately out of scope; keep the row, strike the ID.

## Checks to run each time

1. **Every Must/Should REQ** reaches a passing test. If not → 🔴.
2. **No orphan FSD** (FSD with no REQ) and **no orphan test** (test proving
   nothing traced). Flag both.
3. **Every High/Critical SEC** has a verifying test. If not → 🔴.
4. **Every code-bearing ticket** has a test and an FSD parent.
5. IDs are **stable and unique** — nothing renumbered; dropped IDs struck, not
   reused.

## Output

After updating, report a one-line **coverage summary** the user can act on:

> Traceability: 18 REQ · 🟢 14 covered · 🟡 2 not built · 🔴 1 gap (REQ-005 has
> no test) · 🟠 1 unspecified (REQ-009). Ship gate is **not** met until the 🔴 is
> resolved.

## Ship gate (phase 10)

The pipeline may not "ship" while any Must/Should row is 🔴 or 🟡. That is the
contract: spec-driven means nothing merges unproven. Surface the blocking rows;
never quietly downgrade the gate to make the run look finished.
