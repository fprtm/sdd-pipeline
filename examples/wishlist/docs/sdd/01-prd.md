# PRD — Wishlist + Shareable Link

> **Plain-language summary:** Shoppers can save products they like to a personal
> wishlist, come back to it later, tidy it up, and — if they want — share a
> read-only link so a friend can see it. The goal is to bring undecided shoppers
> back and let word-of-mouth do some marketing. Sharing is private by default and
> off unless the shopper turns it on.

- **Status:** approved
- **Owner:** A. Rahman (PM)
- **Last updated:** 2026-08-07
- **Related:** [diagrams](02-diagrams.md) · [FSD](03-fsd.md) · [traceability](traceability.md)

## 1. Problem & goal
- **Problem:** Shoppers who aren't ready to buy have no lightweight way to
  remember products, and no way to share them. They bounce and rarely return.
- **Who has it:** Logged-in shoppers in the browse/consider stage.
- **If we do nothing:** We keep losing high-intent-but-not-now shoppers and the
  organic reach that sharing would create.
- **Goal (one sentence):** Let shoppers save, manage, and optionally share
  products so they return more often and bring others.

## 2. Success metrics
| Metric | Baseline | Target | How measured |
|--------|----------|--------|--------------|
| Return-visit rate of savers (7-day) | 22% | ≥ 35% | analytics cohort: users with ≥1 save |
| Wishlist → purchase conversion (30-day) | — | ≥ 8% | order attribution to a wishlisted product |
| Share links created / 1k savers | 0 | ≥ 40 | count of active share tokens |
| Viewer → signup rate | — | ≥ 5% | signups attributed to a share-link visit |

## 3. Scope
- **In scope (v1):** save/remove items; view own wishlist (auto-ordered
  newest-first); create one read-only share link; revoke it; view a shared
  wishlist (no login required). _(Manual reorder was considered and cut — no
  acceptance criteria, would be an untraceable orphan; revisit in v2.)_
- **Out of scope (v1):** multiple named lists; collaborative editing; price-drop
  alerts; moving items to cart in bulk; comments on shared lists. _(Recorded, not
  forgotten — see REQ-008 marked Won't.)_

## 4. Functional requirements
| ID | Requirement | User/persona | Why (value) | Priority | Acceptance criteria (Given/When/Then) |
|----|-------------|--------------|-------------|----------|----------------------------------------|
| REQ-001 | Save a product to my wishlist | Shopper | Remember it for later | Must | Given I'm logged in, when I tap Save on a purchasable product, then it appears in my wishlist and persists across sessions |
| REQ-002 | See my wishlist, newest first | Shopper | Find saved items quickly | Must | Given I have saved items, when I open my wishlist, then I see them ordered most-recent first with product name, image, price |
| REQ-003 | Remove an item from my wishlist | Shopper | Keep it relevant | Must | Given an item is in my wishlist, when I remove it, then it disappears and does not return on reload |
| REQ-004 | Prevent duplicate saves | Shopper | Avoid clutter | Should | Given a product is already saved, when I tap Save again, then nothing is duplicated and the control shows "Saved" |
| REQ-005 | Create a read-only share link | Shopper | Show friends what I like | Must | Given I have a wishlist, when I choose Share, then I get an unguessable link that shows my wishlist read-only to anyone who opens it |
| REQ-006 | Revoke a share link | Shopper | Stop sharing / protect privacy | Must | Given an active share link, when I revoke it, then opening that link no longer shows my wishlist |
| REQ-007 | View a shared wishlist without an account | Viewer | Low-friction sharing | Must | Given an active share link, when a viewer opens it, then they see the read-only wishlist without logging in and cannot modify it |
| REQ-008 | Multiple named wishlists | Shopper | Organize by theme | Won't (v1) | _Deferred to v2; recorded for scope discipline_ |

## 5. Non-functional requirements
| ID | Category | Requirement / target |
|----|----------|----------------------|
| REQ-NF-001 | Performance | Wishlist view responds p95 < 300ms server-side at 10k DAU |
| REQ-NF-002 | Security/Privacy | Wishlist is private by default; share tokens are unguessable and revocable; no user id or PII in any URL; a user's data is deletable on account deletion (GDPR) |
| REQ-NF-003 | Scale | Support up to 500 items per wishlist (soft guard; reject beyond with a clear message) |
| REQ-NF-004 | Availability | 99.9% monthly for read paths (shared views must stay up) |
| REQ-NF-005 | Accessibility | WCAG 2.1 AA: keyboard-operable Save/Remove/Share; screen-reader labels; visible focus |

## 6. Assumptions & open questions
- Auth already exists (login/session) — this feature consumes it, doesn't build it.
- A product catalog with stable product ids exists.
- Anonymous viewers are acceptable for shared links (confirmed with legal:
  no PII is exposed beyond product choices the owner chose to share).
