---
title: Clear my wishlist
description: add a one-action "clear whole wishlist" capability, owner-scoped, no new arch
status: shipped
size: lite
branch: feat/clear-wishlist
created: 2026-08-09
updated: 2026-08-09
---

# Change — Clear my wishlist

> **Lite-mode change** (brownfield, existing `impl/` codebase). One collapsed file,
> not the full spec tree — the change is small and low-risk.

- **Type:** change to existing behavior (add a capability to the wishlist feature)
- **Traces to:** REQ-002/REQ-003 (managing the wishlist) · builds on FSD-006 (remove)

## Map (respect-existing)
Read the area first: `WishlistRepo` already has `deleteAllForUser(userId)` (used by
account deletion, FSD-013). The clean-architecture layering is domain → app →
adapters/http. So the change plugs into the existing seams — **no new dependency,
no arch decision**, just a new use case + service method + one route.

## The change
Let a logged-in shopper clear their whole wishlist in one action.

- **Domain:** `clearItems(repo, userId)` → `repo.deleteAllForUser(userId)`.
- **App:** `WishlistService.clearMine(session)` → `requireAuth` then `clearItems`.
- **HTTP:** `DELETE /v1/wishlist/items` (the collection, no `productId`) → 204.
  Existing `DELETE /v1/wishlist/items/:productId` (single remove) is unchanged.

## Acceptance (Given/When/Then)
- Given I have items, when I clear my wishlist, then it is empty and stays empty on reload.
- Given I clear, then **another user's** wishlist is untouched (owner-scoped).
- Given I'm not authenticated, when I clear, then 401.
- Clearing an already-empty wishlist is a success no-op.

## Tests (regression-safe)
- Existing tests are the characterization net for current behavior (remove, list,
  save) — they must stay green (proves we didn't break anything).
- New: `TEST-034` clear empties own list; `TEST-035` clear is owner-scoped;
  HTTP: unauth clear → 401, clear → 204 then list empty.

## Status
✅ implemented, test-first; full suite green; coverage still ≥ 80%. (See impl/.)
