# Test Plan — Wishlist + Shareable Link

> **Plain-language summary:** How we prove it works and stays safe. Fast unit
> tests for the rules, integration tests where code meets the database and
> catalog, a few end-to-end tests for the real journeys, and a dedicated set of
> security tests for every serious threat. The build fails below 80% coverage,
> and every error path and High/Critical security control must be tested even if
> the number is already green.

- **Coverage gate:** line + branch **≥ 80%**, enforced in CI (TICKET-019)
- **Coverage command:** `<monorepo>: turbo run test -- --coverage` →
  `apps/api`: `vitest run --coverage`, `apps/web`: `vitest run --coverage`
- **Traces up to:** [FSD](03-fsd.md) · [threat model](05-threat-model.md) · [traceability](traceability.md)

## Pyramid target
Many unit tests (pure domain: wishlist + sharing rules) · a solid band of
integration tests at the repository/catalog/route seams · a **small** set of e2e
tests over the Must journeys · plus non-functional (perf, a11y) checks.

## Functional — happy path
| ID | Proves | Level | Given / When / Then |
|----|--------|-------|---------------------|
| TEST-001 | FSD-001 | unit+integration | logged-in shopper saves P → one row for (me,P), survives reload |
| TEST-002 | FSD-002 | unit+integration | P already saved, save again → still one row, state "saved" |
| TEST-003 | FSD-003 | unit | 500 items, save 501st → rejected 409, count stays 500 |
| TEST-004 | FSD-004 | integration | saved A then B → list shows B before A with name/image/price |
| TEST-006 | FSD-006 | integration | item present, remove → gone after reload |
| TEST-007 | FSD-008 | unit+integration | Share twice → same active link; token stored only as hash |
| TEST-008 | FSD-009 | unit+integration | revoke active link → status revoked, subsequent resolve empty |
| TEST-009 | FSD-010 | integration | active token → read-only owner items resolved |
| TEST-010 | FSD-013 | integration | delete account → no wishlist_items/share_links remain |

## Functional — edge / negative
| ID | Proves | Level | Given / When / Then |
|----|--------|-------|---------------------|
| TEST-011 | FSD-001 err | integration | not authenticated, save → 401, FE preserves intent |
| TEST-012 | FSD-001 err | integration | product archived, save → 422, nothing saved |
| TEST-013 | FSD-001 err | integration | store write fails → 503, intent not lost (retry) |
| TEST-005 | FSD-005 | integration | saved product later archived → item flagged "unavailable", not dropped |
| TEST-014 | FSD-006 err | integration | remove another user's item id → 404, nothing deleted |
| TEST-015 | FSD-004 edge | unit | empty wishlist → empty state |
| TEST-016 | FSD-004 edge | integration | catalog lookup fails for an item → placeholder shown, item not dropped |

## E2E — Must journeys (mirror sequence diagrams)
| ID | Proves | Journey |
|----|--------|---------|
| TEST-017 | REQ-001, REQ-002 | shopper saves a product, re-logs in, still sees it (02-diagrams §3) |
| TEST-018 | REQ-005, REQ-007 | shopper shares; anonymous viewer opens `/s/{token}`, sees read-only list, no edit controls (§4) |
| TEST-019 | REQ-006 | shopper revokes; the same link now shows "not available" (§4 alt) |

## Security / regression (one per High/Critical control)
| ID | Proves (SEC) | Given / When / Then |
|----|--------------|---------------------|
| TEST-020 | SEC-001 | user A requests B's item id → 404, no data |
| TEST-021 | SEC-001 | user A deletes B's item id → 404, nothing deleted |
| TEST-022 | SEC-003 | session cookie is HttpOnly/Secure/SameSite; invalid session → 401 |
| TEST-023 | SEC-004 | cross-site POST without CSRF token → rejected |
| TEST-024 | SEC-002 | minted tokens are ≥128-bit, non-sequential; DB stores only the hash |
| TEST-025 | SEC-002 | unknown vs revoked token → identical 404 body, no timing signal |
| TEST-026 | SEC-005 | shared response JSON contains no owner name/email/id/timestamp |
| TEST-027 | SEC-005 | write attempt on a `/shared/*` route → 403/404 |
| TEST-028 | SEC-006 | writes past the rate limit → 429 |
| TEST-029 | SEC-007 | injection-style input is parameterized; no query breakout |
| TEST-030 | SEC-007 | product name containing HTML renders encoded on the shared page (no script runs) |
| TEST-031 | SEC-008 | after revoke, cached shared page is purged; origin returns 404 |

## Non-functional
| ID | Proves | Given / When / Then |
|----|--------|---------------------|
| TEST-032 | REQ-NF-001, FSD-014 | 500-item wishlist at target load → server p95 < 300ms (load test) |
| TEST-033 | REQ-NF-005 | wishlist view + shared page pass automated WCAG 2.1 AA checks + keyboard pass |

## Required coverage (must exist regardless of %)
- [x] Happy-path test for every Must FSD main flow
- [x] Edge/negative test for every FSD alternate/error flow
- [x] E2E test for every Must-priority journey (save, share→view, revoke)
- [x] Security/regression test for every High/Critical SEC control (SEC-001..008)
- [x] Performance test asserting REQ-NF-001
- **REQ-NF-004 (availability)** is validated operationally, not by unit tests: the
  CDN-cached shared view (ADR-005) keeps reads up during backend blips; verified
  in staging via a resilience check + an SLO monitor/alert (ops runbook, not a
  code test). Flagged here so the gap is explicit, not silently "covered".

---

> **Exit gate met:** each Must FSD + each High/Critical SEC has planned cases
> across the right classes; coverage command + 80% threshold recorded; e2e cases
> exist for Must journeys; the one non-code-testable NFR (availability) is called
> out. ID registry: TEST next free 034. Update [traceability.md](traceability.md).
