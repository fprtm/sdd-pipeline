# Traceability Matrix — Wishlist + Shareable Link

> Single source of truth linking every requirement down to its tests. If this
> lies, the pipeline is theater.

**Summary:** 12 requirements tracked (+1 dropped) · planning coverage **complete**
(every requirement has FSD + ticket + planned test) · **passing tests: 0**
(implementation is phase 8, not yet done).

**Status right now:** 🟡 all rows "not built" — the spec trail is complete and
self-consistent, but nothing is proven until code + passing tests exist.
**Ship gate: NOT met** (blocked by phases 8–9: implement + verify).

> This is the honest state of a spec-complete example. When implementation lands
> and each planned TEST is green with coverage ≥ 80%, rows flip 🟡 → 🟢 and the
> ship gate opens. The pipeline never downgrades a gate to look finished.

| REQ | FSD | ADR (constrains) | SEC | Ticket | Test (planned) | Status |
|-----|-----|------------------|-----|--------|----------------|--------|
| REQ-001 | FSD-001 | ADR-001, ADR-003 | SEC-001, SEC-004 | TICKET-004, 005, 011 | TEST-001, 011, 012, 013, 017 | 🟡 not built |
| REQ-002 | FSD-004, FSD-005 | ADR-003, ADR-FE-002 | SEC-001 | TICKET-006, 011, 016 | TEST-004, 005, 015, 016, 017 | 🟡 not built |
| REQ-003 | FSD-006 | ADR-001 | SEC-001, SEC-004 | TICKET-011 | TEST-006, 014 | 🟡 not built |
| REQ-004 | FSD-002 | ADR-003 | — | TICKET-005 | TEST-002 | 🟡 not built |
| REQ-005 | FSD-008 | ADR-004, ADR-005, ADR-FE-001 | SEC-002 | TICKET-007, 008, 012, 017 | TEST-007, 018 | 🟡 not built |
| REQ-006 | FSD-009, FSD-011 | ADR-005 | SEC-002, SEC-008 | TICKET-012, 018 | TEST-008, 019, 025, 031 | 🟡 not built |
| REQ-007 | FSD-010, FSD-012 | ADR-FE-001 | SEC-002, SEC-005, SEC-007 | TICKET-013, 018 | TEST-009, 018, 026, 027, 030 | 🟡 not built |
| REQ-008 | — | — | — | — | — | ⚪ dropped (v2) |
| REQ-NF-001 | FSD-014 | ADR-003, ADR-005 | SEC-006 | TICKET-014 | TEST-032 | 🟡 not built |
| REQ-NF-002 | FSD-007, FSD-012, FSD-013 | ADR-003 | SEC-001…008 | TICKET-009, 010, 020 | TEST-010, 020–031 | 🟡 not built |
| REQ-NF-003 | FSD-003 | ADR-001 | SEC-006 | TICKET-004, 014 | TEST-003, 028 | 🟡 not built |
| REQ-NF-004 | — (design/ops) | ADR-005 | SEC-008 | TICKET-012 | TEST-031 + ops SLO | 🟡 not built |
| REQ-NF-005 | — (a11y, cross-cut) | ADR-FE-001 | — | TICKET-015, 016 | TEST-033 | 🟡 not built |

**Legend:** 🟢 covered (FSD+ticket+**passing** test, +SEC if sensitive) · 🟠 not
specified · 🟡 not built (planned, no passing test yet) · 🔴 gap (required link
missing) · ⚪ dropped.

## Orphan & completeness checks
- **Orphan FSDs (no REQ):** none — every FSD-001…014 names a REQ.
- **Orphan tests (prove nothing traced):** none — every TEST maps to an FSD/SEC.
- **Must REQ without a planned test:** none.
- **High/Critical SEC without a verifying test:** none — SEC-001…008 each map to
  ≥1 TEST (SEC-001→020/021, SEC-002→024/025, SEC-005→026/027, SEC-007→029/030,
  SEC-008→031, SEC-003→022, SEC-004→023, SEC-006→028).
- **Requirements with no FSD, by design:** REQ-NF-004 (availability) and
  REQ-NF-005 (a11y) are satisfied via architecture/ops and cross-cutting UI work
  rather than a single behavior spec — recorded here so it's a decision, not a gap.

## What flips this to green
1. Implement the backlog (phase 8), one ticket at a time, TDD.
2. `coverage-check` (phase 9): all planned TESTs pass, coverage ≥ 80% line+branch,
   every FSD error flow + every High/Critical SEC exercised, no fake passes.
3. `code-review` + `threat-model` re-check clean.
4. Then rows → 🟢 and the ship gate (phase 10) opens.
