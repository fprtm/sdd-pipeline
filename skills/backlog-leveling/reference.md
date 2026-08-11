# backlog-leveling — reference (read on demand)

## Anatomy of a ticket (worked example)

```
### TICKET-018 — Persist wishlist item
Traces to: FSD-012 · Constrained by: ADR-003 (Postgres), ADR-001 (layered)
Tier: T1
Plain-language goal: When a logged-in user saves a product, remember it so it's
  still there next visit.
Context an executor needs:
  - Table `wishlist_items(user_id, product_id, created_at)`, unique (user_id, product_id)
  - Lives in the persistence/adapter layer; call it from the application service
Steps (high level, not prescriptive):
  1. Add migration for wishlist_items
  2. Add repository method saveItem(userId, productId)
  3. Wire it into the AddToWishlist use case
Acceptance criteria (Given/When/Then):
  - Given a logged-in user, when they save a product, then a row exists and a
    second save of the same product does not create a duplicate
Definition of done: code + unit test (TEST-030) green, coverage not reduced,
  lint/type-check pass, no secret added, PR references TICKET-018
Dependencies: TICKET-017 (migration tooling) must merge first
Files likely touched: /db/migrations, /adapters/wishlistRepo, /app/addToWishlist
```

## Estimate formula

- **Count by tier**, apply a size band (state it, let the user override): T1
  ~0.5–1 unit, T2 ~1–3, T3 ~3–8 (1 unit ≈ a focused half-day of a competent dev).
- **Add overhead** ~25–40% (review, integration, infra, fixing findings) — state
  the %.
- **Effort vs. calendar:** effort is total work; calendar is shorter when the
  backlog's parallel waves let tickets run at once. Show both + the parallelism
  assumed.
- **Cost shape by executor tier:** T1 → cheap/small model or junior (low cost),
  T2 → mid, T3 → senior/strong (cost concentrates here — don't skimp). If the
  user gives rates, compute a rough figure; else keep it relative (low/med/high).
- **Headline in plain language** for non-IT, e.g. "~3–5 dev-weeks; ~2–3 weeks
  calendar with 2 people; most work is routine, ~4 tickets need a senior."
