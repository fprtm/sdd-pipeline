# Wishlist — runnable backend proof (phases 8–9)

This is the **implement + verify** phases of the SDD Pipeline, run for real on the
wishlist spec in `../docs/sdd/`. It proves the pipeline goes past paper: the
security-critical and domain logic is implemented, tested, and measured.

## Run it

```bash
cd examples/wishlist/impl
npm test          # node --test --experimental-test-coverage
npm run test:ci   # same, but fails under 80% line & branch coverage
```

**No dependencies to install.** TypeScript runs directly under Node ≥ 23.6 (type
stripping); tests use the built-in `node:test` runner and coverage. (Production
would use the ADR-002 toolchain — TS build + Vitest — this proof stays
dependency-free so it runs anywhere Node does.)

## Result

- **31 tests, all passing**
- **Coverage: 100% line / 100% branch / 100% functions** on implemented modules
  (gate is ≥ 80% — see `07-test-plan.md`)

## What each test proves (traces to the plan)

| Test | Proves | Spec |
|------|--------|------|
| TEST-001/002/003 | save persists, duplicate no-op, 500-cap | FSD-001/002/003 |
| TEST-004/005/015/016 | list newest-first, archived flagged, empty, catalog-fail placeholder | FSD-004/005 |
| TEST-006 | remove (idempotent) | FSD-006 |
| TEST-011/012/013 | 401 unauth, 422 unavailable, 503 store-fail | FSD-001/007 |
| TEST-007/008/009 | share idempotent, revoke terminal, resolve active | FSD-008/009/010 |
| TEST-024 | token ≥128-bit, non-sequential, **hash-at-rest** | SEC-002 |
| TEST-025 | **uniform 404** unknown vs revoked | SEC-002 / FSD-011 |
| TEST-026/027 | shared DTO has **no owner PII**; view is **read-only** | SEC-005 / FSD-012 |
| TEST-020/021 | **IDOR guard** returns 404 not 403 | SEC-001 / FSD-007 |
| TEST-010 | account deletion purges data + kills links | FSD-013 |

## Honest scope — what is and isn't here

**Implemented & proven (backend logic):** domain (wishlist, sharing), application
services, in-memory adapters (mirroring the Postgres constraints), access control
(authn + IDOR guard), contract validation, account-deletion purge, and the
security behaviors above.

**Deliberately NOT built in this proof** (would need a running stack/infra to be
meaningful, so faking them would be dishonest):
- HTTP routing layer, real Postgres adapter (TICKET-005/008/011/012/013 wiring)
- CSRF, secure-cookie config, rate limiting (SEC-003/004/006 → TICKET-010/014)
- CDN cache-bust on revoke (SEC-008 → TICKET-012/018)
- Frontend: owner SPA + SSR shared page + a11y (TICKET-015..018)
- Performance load test, availability/SLO (TEST-032, REQ-NF-004)

These stay 🟡 in the traceability matrix — the pipeline does not paint them green.

## A finding surfaced during implementation

**FSD-008 idempotency vs. hash-at-rest (SEC-002) conflict.** The spec said a
second "Share" should "return the same active link." But we persist only the
token *hash* (so a DB leak yields no live tokens), which means an already-active
link's raw URL **cannot be re-derived** server-side. Security won: `createShare`
returns the raw token only on actual creation; a second call reports
`alreadyActive` without minting a new link (still one active link per wishlist).
The FSD acceptance was refined to match this secure reality. This is the pipeline
feeding implementation reality back into the spec — exactly the loop it's for.
