# Wishlist — architecture map

Short map; the reasoning behind each choice (forces, alternatives rejected)
stays in the ADRs — [`../sdd/04-architecture.md`](../sdd/04-architecture.md) is
the SSOT, this is a pointer to it, not a restatement.

## Style

**Modular monolith, layered, with a hexagonal domain core** (ADR-001) — the
domain layer imports nothing; adapters (HTTP, persistence) depend inward on
ports the domain defines. Business logic lives in `domain/` and `app/`, testable
in isolation with fakes at the seams; `infra/`/`http/` are the outermost, swappable
layer.

## Stack

TypeScript on Node LTS, both sides (ADR-002); PostgreSQL, managed (ADR-003);
versioned REST `/v1` with a shared typed contract package (ADR-004); two
containers behind a CDN, the shared wishlist page cached at the edge (ADR-005).

## Frontend

SSR for the public shared page (crawlable, fast first paint, no PII in the
served HTML); SPA for the authenticated owner app. Server-state via a
query/cache layer; minimal client-only state (ADR-FE-001, ADR-FE-002).

## Where things live

```
impl/
  src/domain/      # pure logic — clearItems, dedupe, etc. No framework imports.
  src/app/         # use cases (WishlistService) — orchestrates domain + ports
  src/adapters/    # persistence + other port implementations
  src/http/        # HTTP delivery (routes, SSR shared page)
  src/contract/    # the shared typed API contract (ADR-004)
  src/lib/         # small framework-agnostic utilities
```

Full run/test instructions: [`README.md`](README.md) →
[`../../impl/README.md`](../../impl/README.md).
