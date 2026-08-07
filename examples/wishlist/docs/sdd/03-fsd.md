# FSD — Wishlist + Shareable Link

> **Plain-language summary:** Exactly how the wishlist behaves — saving, viewing,
> removing, sharing, and revoking — including what happens when things go wrong
> (not logged in, product removed, list full, link revoked). Written so a
> developer can build it without re-guessing product intent.

- **Status:** approved · **Traces up to:** [PRD](01-prd.md) · **See:** [diagrams](02-diagrams.md) · [traceability](traceability.md)

---

### FSD-001 — Save a product
- **Traces to:** REQ-001 · **Diagram:** 02-diagrams.md §3
- **Trigger:** authenticated shopper taps "Save" on a purchasable product
- **Preconditions:** valid session; product exists and is purchasable
- **Main flow:** record (userId, productId, now) → item appears in wishlist,
  newest-first → Save control switches to "Saved"
- **Alternate/error flows:**
  - Not authenticated → 401; FE prompts sign-in, preserves the intended save,
    resumes after login (see FSD-007)
  - Product not found / archived → 422 "This product isn't available"; nothing saved
  - Store write fails → 503; FE shows retry, does not lose the user's intent
- **Business rules:** at most one item per (shopper, product) — see FSD-002
- **Data touched:** wishlist_items(user_id, product_id, created_at)
- **Acceptance (G/W/T):** Given logged in, when I save purchasable product P,
  then a wishlist_items row exists for (me, P) and survives reload

### FSD-002 — Duplicate save is a no-op
- **Traces to:** REQ-004 · **Diagram:** 02-diagrams.md §3
- **Trigger:** shopper saves a product already in their wishlist
- **Main flow:** system detects the existing (userId, productId) and does nothing;
  response state is "saved"; no second row; created_at unchanged
- **Business rules:** unique(user_id, product_id) enforced at the DB, not just UI
- **Acceptance (G/W/T):** Given P is already saved, when I save P again, then
  there is still exactly one row and the control shows "Saved"

### FSD-003 — Enforce wishlist size cap
- **Traces to:** REQ-NF-003
- **Trigger:** shopper saves when they already have 500 items
- **Main flow:** reject the save with 409 "Your wishlist is full (500). Remove an
  item to add more."; no row added
- **Business rules:** soft guard at 500; the limit is a named constant, not magic
- **Acceptance (G/W/T):** Given I have 500 items, when I save another, then it is
  rejected with a clear message and count stays 500

### FSD-004 — View my wishlist, newest first
- **Traces to:** REQ-002 · **Diagram:** 02-diagrams.md §1
- **Trigger:** shopper opens their wishlist
- **Main flow:** return the shopper's items ordered by created_at desc, each
  enriched with product name, image, price from the catalog; paginate at 50/page
- **Alternate/error flows:**
  - Empty wishlist → show empty state with a prompt to browse
  - Catalog lookup fails for an item → show the item with a "details
    unavailable" placeholder rather than dropping it silently
- **Data touched:** read wishlist_items (owner-scoped) + catalog read
- **Acceptance (G/W/T):** Given I saved A then B, when I open my wishlist, then I
  see B before A with name/image/price

### FSD-005 — Handle removed/archived products in the list
- **Traces to:** REQ-002 (edge)
- **Trigger:** an item's product was archived/deleted after saving
- **Main flow:** show the item flagged "No longer available" with a Remove
  action; it is not purchasable and not counted in "available" metrics
- **Acceptance (G/W/T):** Given a saved product is later archived, when I view my
  wishlist, then the item shows "No longer available" and I can remove it

### FSD-006 — Remove an item
- **Traces to:** REQ-003
- **Trigger:** shopper removes an item they own
- **Main flow:** delete the (userId, productId) row; item disappears; reload
  confirms it's gone
- **Alternate/error flows:**
  - Item not owned by the requester → 404 (do not reveal existence); nothing deleted
  - Item already removed → treat as success (idempotent)
- **Acceptance (G/W/T):** Given an item is in my wishlist, when I remove it, then
  it's gone after reload and cannot be removed from another user's list

### FSD-007 — Authenticate & authorize every owner action
- **Traces to:** REQ-NF-002 (guards REQ-001, 002, 003, 005, 006)
- **Trigger:** any request to a wishlist-owner endpoint
- **Main flow:** verify session server-side; scope every query to the
  authenticated userId; never accept a userId from the client body
- **Alternate/error flows:** missing/invalid session → 401; valid session acting
  on another user's resource → 404 (not 403, to avoid existence disclosure)
- **Acceptance (G/W/T):** Given I'm user A, when I request user B's item by id,
  then I get 404 and no data

### FSD-008 — Create a read-only share link
- **Traces to:** REQ-005 · **Diagram:** 02-diagrams.md §6
- **Trigger:** shopper chooses "Share"
- **Main flow:** if an active link exists, return it (idempotent — at most one
  active link per wishlist); else mint a cryptographically-random opaque token,
  store only its hash with status=active, return the full link once
- **Alternate/error flows:** not authenticated → 401; DB failure → 503 retry
- **Business rules:** raw token is shown to the owner but never stored in the
  clear; no userId/PII in the URL (path is /s/{token})
- **Acceptance (G/W/T):** Given I have a wishlist, when I Share, then I receive an
  unguessable link and a second Share returns the same active link

### FSD-009 — Revoke a share link
- **Traces to:** REQ-006 · **Diagram:** 02-diagrams.md §6
- **Trigger:** shopper revokes their active link
- **Main flow:** set status=revoked, revoked_at=now; the token is now permanently
  dead; Share can mint a fresh one afterward
- **Alternate/error flows:** no active link → success no-op; not owner → 404
- **Business rules:** revocation is terminal and irreversible
- **Acceptance (G/W/T):** Given an active link, when I revoke it, then opening
  that link no longer shows my wishlist and a new Share yields a different token

### FSD-010 — Resolve and view a shared wishlist by token
- **Traces to:** REQ-007 · **Diagram:** 02-diagrams.md §4
- **Trigger:** anyone opens /s/{token}
- **Main flow:** hash the token, look up an **active** share, load the owner's
  items read-only, render without any edit controls and without owner PII
- **Alternate/error flows:** unknown/revoked token → generic 404 (see FSD-011)
- **Acceptance (G/W/T):** Given an active link, when an anonymous viewer opens it,
  then they see the read-only list and no sign-in is required

### FSD-011 — Uniform not-found for bad/revoked tokens
- **Traces to:** REQ-006, REQ-007 (error) · relates to SEC-002
- **Trigger:** token is unknown, malformed, or revoked
- **Main flow:** respond 404 with an identical body and timing profile regardless
  of which case it is; do not reveal whether a token ever existed
- **Acceptance (G/W/T):** Given a revoked token and a never-issued token, when
  each is opened, then responses are indistinguishable to the caller

### FSD-012 — Shared view is strictly read-only, no owner identity
- **Traces to:** REQ-007, REQ-NF-002
- **Trigger:** rendering a shared wishlist
- **Main flow:** expose only product info (name, image, price); never the owner's
  name, email, id, or item timestamps; server rejects any write on a shared route
- **Acceptance (G/W/T):** Given a shared view, when a viewer inspects the response,
  then it contains no owner PII and any write attempt returns 403/404

### FSD-013 — Account deletion purges wishlist data
- **Traces to:** REQ-NF-002 (GDPR)
- **Trigger:** a shopper's account is deleted
- **Main flow:** delete their wishlist_items and share_links (which also kills any
  live links) as part of the account-deletion transaction
- **Acceptance (G/W/T):** Given I delete my account, when deletion completes, then
  no wishlist_items or share_links remain for me and prior links 404

### FSD-014 — Meet performance target for wishlist view
- **Traces to:** REQ-NF-001
- **Trigger:** wishlist view request under load
- **Main flow:** server-side p95 < 300ms at 10k DAU; achieved via an index on
  (user_id, created_at) and a bounded page size (50)
- **Acceptance (G/W/T):** Given a 500-item wishlist at target load, when it is
  fetched, then server p95 < 300ms

---

> **Coverage self-check:** REQ-001..007 and REQ-NF-001..003 each map to ≥1 FSD;
> REQ-NF-004/005 are validated in the test plan (availability, a11y); REQ-008 is
> Won't (no FSD, by design); every FSD names a REQ (no orphans); error/alternate
> flows enumerated. Update [traceability.md](traceability.md).
