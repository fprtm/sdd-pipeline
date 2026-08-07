# Threat Model — Wishlist + Shareable Link

> **Plain-language summary:** The riskiest part of this feature is the share link:
> if tokens were guessable or the shared page leaked who owns the list, strangers
> could snoop. The other big risks are one user reaching another user's list, and
> a revoked link still working because it was cached. Below is what could go wrong
> and exactly how we stop it — each serious risk has a control and a test.

- **Based on DFD:** [02-diagrams.md §2](02-diagrams.md) — trust boundaries:
  `TB: public internet` → `TB: application` → `TB: data zone`
- **Scope:** wishlist owner endpoints, share create/revoke, public shared view.
  Out of scope: the existing auth service internals (consumed, not built).
- **Related:** [PRD](01-prd.md) · [test plan](07-test-plan.md) · [traceability](traceability.md)

## Trust boundaries
| Boundary | From | To | What crosses |
|----------|------|----|--------------|
| TB-1 | public internet | application | session cookie (secret) + productId |
| TB-2 | public internet | application | share token (secret) |
| TB-3 | application | data zone | owner-scoped reads/writes; token hash lookups |

## Threats & controls

### SEC-001 — IDOR / broken access control on owner endpoints  (STRIDE: E, I)
- **Flow:** shopper → API → DB (TB-1, TB-3)
- **Severity:** **Critical** (Likelihood: high if unguarded, Impact: full data access)
- **Response:** Mitigate
- **Controls:** authorize server-side on every request; scope every query by the
  authenticated userId; never trust a userId/itemId from the client to imply
  ownership; return **404** (not 403) for non-owned resources to avoid existence
  disclosure. (Implements FSD-007.)
- **Protects:** REQ-001..006, REQ-NF-002 · **Verified by:** TEST-020, TEST-021

### SEC-002 — Share-token guessing / enumeration  (STRIDE: S, I)
- **Flow:** viewer → API (TB-2)
- **Severity:** **Critical** (Impact: strangers view private lists)
- **Response:** Mitigate
- **Controls:** tokens are ≥128 bits of CSPRNG randomness, URL-safe, opaque
  (never sequential/derived from userId); store only a hash (so a DB leak doesn't
  yield live tokens); **uniform 404** for unknown vs. revoked with constant-time
  comparison and no timing/verbosity difference (implements FSD-011); rate-limit
  `/shared/*` per IP.
- **Protects:** REQ-005, REQ-007, REQ-NF-002 · **Verified by:** TEST-024, TEST-025

### SEC-003 — Session hijacking on owner routes  (STRIDE: S)
- **Flow:** shopper → API (TB-1)
- **Severity:** High
- **Response:** Mitigate (partly Transfer to the existing auth service)
- **Controls:** cookies `HttpOnly`, `Secure`, `SameSite=Lax`; TLS everywhere;
  respect the auth service's session lifetime; re-check session on every request.
- **Protects:** REQ-NF-002 · **Verified by:** TEST-022

### SEC-004 — CSRF on state-changing actions (save/remove/share/revoke)  (STRIDE: T)
- **Flow:** shopper → API (TB-1)
- **Severity:** High
- **Response:** Mitigate
- **Controls:** `SameSite=Lax` cookies + anti-CSRF token (double-submit) or a
  required custom header on all non-GET routes; reject cross-origin writes.
- **Protects:** REQ-001, REQ-003, REQ-005, REQ-006 · **Verified by:** TEST-023

### SEC-005 — Owner-PII disclosure via the shared view  (STRIDE: I)
- **Flow:** share svc → API → viewer (TB-3 → TB-2)
- **Severity:** High
- **Response:** Mitigate
- **Controls:** shared response is a whitelist DTO of product fields only
  (name, image, price); never serialize owner name/email/id or item timestamps;
  the shared route is read-only and rejects writes (implements FSD-012).
- **Protects:** REQ-007, REQ-NF-002 · **Verified by:** TEST-026, TEST-027

### SEC-006 — Resource exhaustion / DoS  (STRIDE: D)
- **Flow:** shopper → API; viewer → API (TB-1, TB-2)
- **Severity:** Medium
- **Response:** Mitigate
- **Controls:** 500-item cap per wishlist (FSD-003); at most one active share link
  per wishlist (FSD-008); pagination (50/page); rate limits on writes and on
  `/shared/*`; DB indexes to keep reads cheap (FSD-014).
- **Protects:** REQ-NF-001, REQ-NF-003, REQ-NF-004 · **Verified by:** TEST-028

### SEC-007 — Injection (SQLi) and stored XSS on the shared page  (STRIDE: T, I)
- **Flow:** any input → DB; product data → shared HTML (TB-3 → TB-2)
- **Severity:** High
- **Response:** Mitigate
- **Controls:** parameterized queries / ORM only (no string-built SQL); validate
  all inputs at the boundary with the `contract` schemas; **output-encode** product
  names/descriptions when rendering the (SSR) shared page — product data is
  untrusted from the shared view's perspective; set a strict `Content-Security-Policy`.
- **Protects:** REQ-007, REQ-NF-002 · **Verified by:** TEST-029, TEST-030

### SEC-008 — Revoked link still served from CDN cache  (STRIDE: E)
- **Flow:** viewer → CDN → shared page (TB-2)  ·  interplay with ADR-005
- **Severity:** High (a revoke that doesn't take effect is a privacy failure)
- **Response:** Mitigate
- **Controls:** short cache TTL on `/s/{token}`; on revoke, **purge/bust** the
  cached entry; origin re-checks token status on every miss; never cache a
  response as "active" longer than the TTL. (Ties FSD-009 to ADR-005.)
- **Protects:** REQ-006, REQ-NF-002 · **Verified by:** TEST-031

## Baseline checklist
- [x] Input validation & output encoding (SEC-007)
- [x] AuthN & session management (SEC-003)
- [x] AuthZ enforced server-side on every action (SEC-001)
- [x] Secrets management — tokens hashed at rest, none in code/URL/logs (SEC-002)
- [x] Transport security — TLS everywhere (SEC-003)
- [ ] Dependency & supply-chain hygiene — **action:** enable lockfile + scanner in
      CI (tracked as TICKET-019); not feature-specific but required before ship
- [x] Logging/monitoring — log share create/revoke with actor+timestamp for
      non-repudiation; **never** log raw tokens, cookies, or PII
- [x] Safe defaults — wishlist private by default; deny by default; 404 over 403

## SSDLC downstream hooks
- [x] Each High/Critical control has a TICKET (see backlog)
- [x] Each High/Critical control has a TEST-xxx (see mapping above)
- [ ] Verify gate (phase 9) re-runs this model against the final DFD and confirms
      no new flow shipped without a threat pass

---

> **Exit gate met:** every boundary-crossing flow STRIDE-examined; all Critical
> (SEC-001, SEC-002) and High threats have controls and verifying tests; baseline
> addressed (one supply-chain action tracked as TICKET-019). ID registry: SEC next
> free 009. Update [traceability.md](traceability.md).
