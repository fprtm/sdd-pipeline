# Traceability Matrix — Wishlist + Shareable Link

> Single source of truth linking every requirement down to its tests. If this
> lies, the pipeline is theater.

**Summary:** 12 requirements tracked (+1 dropped) · planning **complete** ·
**backend + HTTP delivery + SSR shared page + infra-as-code implemented & tested**
(`impl/`: 54 tests, ~99% line / ~96% branch; gate ≥ 80%) · **not built:** owner
interactive SPA, real Postgres/auth/catalog adapters, and actual cloud deploy.

**Status right now:** the domain, application, security controls, and the HTTP
delivery layer are built and proven by passing tests (🟩 below). CI + IaC + the
delivery runbook exist as code. **Ship gate still NOT met** — real adapters and an
actual deploy are outstanding (a deploy is an irreversible action requiring a
human). The pipeline does not paint "shipped" green until it truly is.

> Legend addition: 🟩 **built & tested (not deployed)** — implemented and covered
> by passing tests, including HTTP delivery where applicable, but not yet running
> in a real environment. Full 🟢 requires real adapters + deploy + post-deploy check.

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

## Phase 8–10 result — built & tested (`impl/`, 54 tests)

🟩 **built & tested** (domain + application + HTTP delivery, passing tests):
- REQ-001 → FSD-001/002/003 → TEST-001/002/003/012/013 + HTTP TEST-017 (save, dedupe, cap, errors)
- REQ-002 → FSD-004/005 → TEST-004/005/015/016 (list, archived, empty, placeholder)
- REQ-003 → FSD-006 → TEST-006 + HTTP DELETE (remove, idempotent)
- REQ-005 → FSD-008 → TEST-007/024 + HTTP TEST-018 (share idempotent, token entropy, hash-at-rest)
- REQ-006 → FSD-009/011 → TEST-008/025 + HTTP TEST-031 (revoke terminal, uniform 404, cache-bust)
- REQ-007 → FSD-010/012 → TEST-009/026/027 + SSR TEST-018/030 (resolve, no PII, read-only, XSS-encoded)
- REQ-NF-002 → FSD-007/013 + SEC-001..008 → TEST-010/011/020/021/022/023/028/030/031
  (authn, IDOR guard 404, secure-cookie policy, CSRF, rate-limit, XSS encode, cache-bust, purge)
- REQ-NF-003 → FSD-003 → TEST-003/028 (cap + rate limit)

🟢 **infra as code** (exists + CI runs the gate): Dockerfile, docker-compose,
`.github/workflows/ci.yml` (coverage gate + secret scan), `/healthz`, delivery
runbook (`08-delivery.md`).

🟡 **still not built** (needs a real environment / browser — not faked):
- Owner interactive SPA (TICKET-015/016/017) — Save/Remove/Share UI + a11y (TEST-033)
- Real Postgres adapter (parameterized queries close the SQLi half of SEC-007),
  real auth/session service (cookie-on-login), real catalog client
- Actual cloud provisioning + deploy (irreversible — needs a human), and
  REQ-NF-001 perf load test / REQ-NF-004 availability SLO measured on a live env

## What flips this to green
1. Implement the backlog (phase 8), one ticket at a time, TDD.
2. `coverage-check` (phase 9): all planned TESTs pass, coverage ≥ 80% line+branch,
   every FSD error flow + every High/Critical SEC exercised, no fake passes.
3. `code-review` + `threat-model` re-check clean.
4. Then rows → 🟢 and the ship gate (phase 10) opens.
