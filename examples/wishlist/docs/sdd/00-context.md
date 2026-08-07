# Context / Ubiquitous Language — Wishlist

> Shared vocabulary. Every PRD/FSD/ticket/test uses these exact terms.

## Glossary
| Term | Definition | Not to be confused with |
|------|------------|-------------------------|
| Wishlist | A shopper's personal, ordered list of products they've saved to consider later | **Cart** — Cart implies intent to buy now; Wishlist does not |
| Wishlist item | One (shopper, product) pair with a saved timestamp | — |
| Share link | An unguessable, revocable URL that grants **read-only** view of one shopper's wishlist | Not an invite to a specific person; anyone with the link can view while it's active |
| Share token | The opaque secret embedded in a share link; identifies the share, not the user | Not the user id; never a sequential number (see SEC-002) |
| Owner | The shopper who created the wishlist | Viewer — someone opening a share link |
| Viewer | Anyone (logged in or not) who opens an active share link | Owner |
| Purchasable product | A product currently in the catalog and orderable | Archived/deleted product |

## Actors / personas
| Actor | Who | Can do |
|-------|-----|--------|
| Shopper (Owner) | authenticated end user | save, view, reorder, remove items; create/revoke a share link |
| Viewer | anyone with an active share link | view the shared wishlist read-only |
| System | the app | persist items, mint/revoke tokens, enforce access |

## Key domain rules (invariants)
- A shopper may save a given product **at most once** (no duplicate items).
- A share link is **read-only**; a Viewer can never modify a wishlist.
- A revoked share link is **permanently dead**; revocation cannot be undone
  (a new link must be created).
- A wishlist is private by default; it is only viewable via an **active** share
  link or by its Owner.
