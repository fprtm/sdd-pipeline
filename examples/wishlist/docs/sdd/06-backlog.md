# Implementation Backlog — Wishlist + Shareable Link

> **Plain-language summary:** The work as bite-size tickets. Each says what to do,
> where it fits, and how you know it's done — so a junior dev or a cheap model can
> pick up the easy ones alone, while the tricky security/sharing pieces are marked
> for a senior/strong model.

- **Traces up to:** [FSD](03-fsd.md) · [architecture](04-architecture.md) · [threat model](05-threat-model.md)
- **Tier split:** T1 (junior/cheap-model): 3 · T2 (standard): 13 · T3 (senior/strong-model): 4

## Execution order & parallelism
- **Wave 0 — foundation:** TICKET-001, 002, 003 (003 depends on 001)
- **Wave 1 — domain & adapters (parallel):** 004+005, 006, 007+008
- **Wave 2 — API & access (parallel after Wave 1):** 009, 010, 011, 012, 013, 014
- **Wave 3 — frontend (parallel after contract + relevant routes):** 015, 016, 017, 018
- **Wave 4 — cross-cutting:** 019 (any time), 020 (after schema)

---

### TICKET-001 — Monorepo scaffold
- **Traces to:** ADR-001, ADR-002 · **Tier:** T2
- **Goal:** Set up the monorepo with two apps and shared packages so FE and BE
  share types.
- **Context:** workspaces layout `apps/web`, `apps/api`, `packages/contract`,
  `packages/domain`; TypeScript project references; lint/format/test configured.
- **Acceptance (G/W/T):** Given a fresh clone, when I install and run the test
  task, then both apps build and an example shared type imports across packages.
- **Dependencies:** none · **Files:** repo root, `apps/*`, `packages/*`

### TICKET-002 — Database schema & migrations
- **Traces to:** ADR-003, FSD-002, FSD-014 · **Tier:** T1
- **Goal:** Create the tables the feature stores data in.
- **Context:** `wishlist_items(id, user_id, product_id, created_at)` with
  **unique(user_id, product_id)** and index `(user_id, created_at desc)`;
  `share_links(id, user_id, token_hash, status, created_at, revoked_at)` with
  unique index on `token_hash` and a partial index for `status='active'` per user.
- **Acceptance (G/W/T):** Given the migration runs, when I insert a duplicate
  (user, product), then the DB rejects it; and listing by user is index-backed.
- **Dependencies:** none · **Files:** `apps/api/db/migrations`

### TICKET-003 — Contract package (typed API schemas)
- **Traces to:** ADR-004 · **Tier:** T2
- **Goal:** Define request/response schemas shared by FE and BE.
- **Context:** schemas for save/list/remove/share/revoke/shared-view under `/v1`;
  runtime validation (e.g. Zod) + inferred TS types; both apps import this.
- **Acceptance (G/W/T):** Given an invalid payload, when validated against the
  contract, then it's rejected with a typed error both apps can rely on.
- **Dependencies:** TICKET-001 · **Files:** `packages/contract`

### TICKET-004 — Wishlist domain module (+ ports)
- **Traces to:** FSD-001, FSD-002, FSD-003, FSD-006 · **Tier:** T2
- **Goal:** Pure business rules for saving/removing/listing, framework-free.
- **Context:** `WishlistRepo` port (interface); use cases `addItem`, `removeItem`,
  `listItems`; enforce dedupe (relies on repo uniqueness) and the 500 cap as a
  named constant. No DB/HTTP here — depend only on the port.
- **Acceptance (G/W/T):** Given an in-memory fake repo, when I add the same
  product twice, then there is one item; when I add a 501st, then it's rejected.
- **Dependencies:** TICKET-001 · **Files:** `packages/domain/wishlist`

### TICKET-005 — Postgres wishlist repository adapter
- **Traces to:** ADR-003, FSD-002 · **Tier:** T2
- **Goal:** Implement `WishlistRepo` against Postgres.
- **Context:** parameterized queries/ORM only; upsert that no-ops on the unique
  conflict; owner-scoped reads ordered by `created_at desc`, paginated 50.
- **Acceptance (G/W/T):** Given the adapter (integration test w/ a real DB), when
  I save a duplicate, then no second row is created and no error surfaces to the user.
- **Dependencies:** TICKET-002, TICKET-004 · **Files:** `apps/api/adapters/wishlistRepo`

### TICKET-006 — Catalog client adapter (enrichment + archived handling)
- **Traces to:** FSD-004, FSD-005 · **Tier:** T2
- **Goal:** Enrich items with product name/image/price; handle archived products.
- **Context:** call the existing catalog service; map missing/archived products to
  a "No longer available" marker; never drop an item silently on lookup failure.
- **Acceptance (G/W/T):** Given an item whose product is archived, when the list is
  built, then the item is returned flagged unavailable, not omitted.
- **Dependencies:** TICKET-004 · **Files:** `apps/api/adapters/catalogClient`

### TICKET-007 — Sharing domain module (+ ports)
- **Traces to:** FSD-008, FSD-009, FSD-010 · **Tier:** T3
- **Goal:** Business rules for creating (idempotent), revoking, and resolving a
  share link — the security-sensitive core.
- **Context:** `ShareRepo` port; `createShare` returns the existing **active** link
  or mints a new opaque token (CSPRNG ≥128-bit), returning the raw token once and
  persisting only its hash; `revoke` is terminal; `resolveActive(tokenHash)`
  returns owner scope or nothing. Pair with `tdd`; review required.
- **Acceptance (G/W/T):** Given an active link, when I create again, then I get the
  same link; when I revoke then resolve, then it resolves to nothing.
- **Dependencies:** TICKET-001 · **Files:** `packages/domain/sharing`

### TICKET-008 — Postgres share repository adapter
- **Traces to:** ADR-003, SEC-002 · **Tier:** T2
- **Goal:** Implement `ShareRepo`; store token **hash**, status, timestamps.
- **Context:** hash tokens with a fast, fixed-length hash before storage; lookups
  by `token_hash`; enforce one active link per user via the partial unique index.
- **Acceptance (G/W/T):** Given a stored share, when I query by the raw token's
  hash, then I find it; and the raw token is never persisted.
- **Dependencies:** TICKET-002, TICKET-007 · **Files:** `apps/api/adapters/shareRepo`

### TICKET-009 — Auth/session middleware + owner scoping (authz)
- **Traces to:** FSD-007, SEC-001 · **Tier:** T3
- **Goal:** Make every owner endpoint authenticate and act only on the caller's data.
- **Context:** verify the session via the existing auth service; inject `userId`
  from the session (never from the body); a helper that scopes queries by owner and
  returns **404** for non-owned resources. This is the IDOR defense — get it right.
- **Acceptance (G/W/T):** Given user A's session, when A requests B's item id, then
  404 and no data; when unauthenticated, then 401.
- **Dependencies:** TICKET-003 · **Files:** `apps/api/middleware/auth`, `.../authz`

### TICKET-010 — Secure cookies + CSRF protection
- **Traces to:** SEC-003, SEC-004 · **Tier:** T2
- **Goal:** Protect owner sessions and state-changing requests.
- **Context:** cookies `HttpOnly`/`Secure`/`SameSite=Lax`; anti-CSRF (double-submit
  token or required custom header) on all non-GET routes; reject cross-origin writes.
- **Acceptance (G/W/T):** Given a forged cross-site POST without the CSRF token,
  when it hits a write route, then it is rejected.
- **Dependencies:** TICKET-009 · **Files:** `apps/api/middleware/csrf`, cookie config

### TICKET-011 — Wishlist API routes
- **Traces to:** FSD-001, FSD-003, FSD-004, FSD-006 · **Tier:** T2
- **Goal:** Expose save/list/remove over `/v1`.
- **Context:** `POST /v1/wishlist/items`, `GET /v1/wishlist/items` (paginated),
  `DELETE /v1/wishlist/items/:productId`; validate with the contract; wire domain
  + adapters; map errors to the FSD status codes (401/422/409/503).
- **Acceptance (G/W/T):** Given valid input, when I POST a save, then 200 "saved";
  the error flows return the specified codes.
- **Dependencies:** TICKET-005, TICKET-006, TICKET-009, TICKET-003 · **Files:** `apps/api/routes/wishlist`

### TICKET-012 — Share/Revoke API routes (+ cache-bust on revoke)
- **Traces to:** FSD-008, FSD-009, SEC-008 · **Tier:** T2
- **Goal:** Let owners create and revoke their share link.
- **Context:** `POST /v1/share` (idempotent), `POST /v1/share/revoke`; on revoke,
  trigger a CDN purge for that token's shared page (interplay w/ ADR-005). Owner-scoped.
- **Acceptance (G/W/T):** Given I revoke, when the purge runs, then the shared page
  is no longer served from cache and origin returns 404.
- **Dependencies:** TICKET-008, TICKET-009 · **Files:** `apps/api/routes/share`

### TICKET-013 — Public shared-view route
- **Traces to:** FSD-010, FSD-011, FSD-012, SEC-002, SEC-005 · **Tier:** T3
- **Goal:** Serve a read-only shared wishlist by token, safely.
- **Context:** `GET /shared/:token` (no auth); hash+lookup active share;
  **uniform 404** (constant-time, identical body) for unknown/revoked; return a
  whitelist DTO of product fields only (no owner PII/timestamps); reject writes.
  Security-critical — pair with `tdd`, mandatory review.
- **Acceptance (G/W/T):** Given a revoked token and an unissued token, when each is
  fetched, then responses are indistinguishable; given an active token, then a
  read-only list with no owner PII.
- **Dependencies:** TICKET-008 · **Files:** `apps/api/routes/shared`

### TICKET-014 — Rate limiting
- **Traces to:** SEC-006 · **Tier:** T2
- **Goal:** Prevent abuse/exhaustion.
- **Context:** per-IP + per-user limits on write routes; per-IP limits on
  `/shared/*`; return 429 with retry hints.
- **Acceptance (G/W/T):** Given rapid repeated writes past the limit, when the next
  request arrives, then 429.
- **Dependencies:** TICKET-011, TICKET-013 · **Files:** `apps/api/middleware/rateLimit`

### TICKET-015 — Save/Remove UI (optimistic + reconcile)
- **Traces to:** FSD-001, FSD-006, ADR-FE-002 · **Tier:** T2
- **Goal:** Let shoppers save/remove with instant feedback.
- **Context:** optimistic "Saved" state, reconcile with the server response, roll
  back on error (e.g. 503 retry); keyboard-operable, ARIA labels (REQ-NF-005).
- **Acceptance (G/W/T):** Given I tap Save, when the request fails, then the UI
  rolls back and shows a retry.
- **Dependencies:** TICKET-011, TICKET-003 · **Files:** `apps/web/features/wishlist`

### TICKET-016 — Wishlist view (list/empty/unavailable/pagination/a11y)
- **Traces to:** FSD-004, FSD-005, REQ-NF-005 · **Tier:** T2
- **Goal:** Render the shopper's wishlist well.
- **Context:** newest-first list w/ name/image/price; empty state; "No longer
  available" placeholder; paginate 50; WCAG 2.1 AA (focus, labels, keyboard).
- **Acceptance (G/W/T):** Given saved items incl. an archived one, when I open the
  wishlist, then all show correctly and the page passes an a11y check.
- **Dependencies:** TICKET-011, TICKET-003 · **Files:** `apps/web/features/wishlist`

### TICKET-017 — Share/Revoke UI
- **Traces to:** FSD-008, FSD-009 · **Tier:** T1
- **Goal:** Let shoppers get a link, copy it, and revoke it.
- **Context:** "Share" shows the link + copy button; "Revoke" confirms then calls
  the API; reflect active/none state.
- **Acceptance (G/W/T):** Given no link, when I tap Share, then I get a copyable
  link; when I revoke, then the UI shows sharing is off.
- **Dependencies:** TICKET-012, TICKET-003 · **Files:** `apps/web/features/share`

### TICKET-018 — SSR shared page `/s/{token}` (encode + CSP + no-PII + caching)
- **Traces to:** FSD-010, FSD-012, SEC-005, SEC-007, SEC-008 · **Tier:** T3
- **Goal:** Public, fast, safe shared page.
- **Context:** server-render the shared list; **output-encode** product text
  (treat as untrusted), strict CSP, no owner identity in markup; short cache TTL,
  invalidated on revoke (with TICKET-012). Security-critical — review required.
- **Acceptance (G/W/T):** Given a product name containing HTML, when the shared
  page renders, then it is encoded (no script executes) and no owner PII appears.
- **Dependencies:** TICKET-013 · **Files:** `apps/web/routes/shared`

### TICKET-019 — CI: dependency scanning + coverage gate
- **Traces to:** SEC baseline (supply chain), coverage-check · **Tier:** T1
- **Goal:** Enforce dependency hygiene and the ≥80% coverage gate in CI.
- **Context:** commit a lockfile; add a dependency vulnerability scan; wire the
  test+coverage command from the test plan and fail the build below 80% line+branch.
- **Acceptance (G/W/T):** Given a PR with coverage < 80%, when CI runs, then it fails.
- **Dependencies:** TICKET-001 · **Files:** CI config

### TICKET-020 — Account-deletion purge hook
- **Traces to:** FSD-013, REQ-NF-002 · **Tier:** T2
- **Goal:** Delete a user's wishlist data on account deletion (GDPR).
- **Context:** subscribe to the account-deletion transaction; delete
  `wishlist_items` and `share_links` for that user atomically (kills live links too).
- **Acceptance (G/W/T):** Given I delete my account, when it completes, then no
  wishlist rows or share links remain and prior links 404.
- **Dependencies:** TICKET-002 · **Files:** `apps/api/account/onDelete`

---

> **Exit gate met:** every FSD and every code-bearing SEC control has ≥1 ticket;
> each ticket is tiered, has acceptance criteria + a definition of done implied by
> the acceptance + coverage gate, and passes the self-containment test; waves mark
> parallelism. ID registry: TICKET next free 021. Update [traceability.md](traceability.md).
