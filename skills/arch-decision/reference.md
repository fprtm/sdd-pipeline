# arch-decision — reference (read on demand)

Read this when there's a UI to decide, when the FE/BE topology isn't obvious, or
when you want a worked ADR example. The core `SKILL.md` is enough without it for
a backend-only build or a lite change confirming an existing architecture.

## Frontend / client architecture (don't forget the UI)

Architecture is not backend-only. If there's any UI, decide it with the same
rigor:

- **Rendering & framework** — SPA, SSR, SSG, or hybrid; which framework; when
  each fits (SEO/first-paint needs → SSR/SSG; rich app-like interactivity →
  SPA/hybrid).
- **State & data** — server-state (fetch/cache layer) vs. client-state; how the
  UI talks to the backend (REST/GraphQL/RPC — keep in sync with the API-style
  decision).
- **Component structure & design system** — layering (design system → features
  → pages), and where business rules must NOT leak (keep domain logic out of
  components; the clean/hexagonal dependency rule applies to the frontend too).
- **Cross-cutting** — auth on the client, routing, accessibility (from REQ-NF),
  i18n, error/loading states. These become FSD behaviors and e2e tests.

Record these as their own ADRs (`ADR-FE-xxx`) so frontend decisions are as
traceable as backend ones.

## Repository & deployment topology (decide explicitly)

The FE/BE relationship is its own decision — ask and record it, because it
shapes tooling, CI, and how tickets are sliced:

| Topology | When it fits | Notes |
|----------|--------------|-------|
| **Fullstack, unified** (FE+BE one app, e.g. Next.js/Rails/Django+templates) | small team, tight FE↔BE coupling, one deploy | simplest ops; API is internal |
| **FE + BE separate repos** | independent teams/release cadence, public API, multiple clients | clear contract needed (OpenAPI/GraphQL schema) as the seam |
| **BE-only** | headless service / API product / no UI | contract-first; consumers are external |
| **FE-only** | static site, or client against an existing/third-party API | the API is a fixed external dependency |
| **Monorepo (FE + BE + shared packages)** | separate deployables but shared types/utilities, one team or coordinated teams | shared contract/type packages; needs a monorepo tool (workspaces/turbo/nx) and clear package boundaries |

Whatever the topology: name the **contract/seam between FE and BE** (schema,
types, API version) explicitly — it is where most integration bugs and most
integration/e2e tests live. If separate deployables, note **independent
deploy/versioning** in an ADR.

The topology you pick here also sets **where docs live** (see the
orchestrator's placement rules): a modular monolith with clean architecture
gets a co-located `README.md` per module (documenting its public ports); a
feature-sliced frontend gets a README + user doc per slice; separate repos /
monorepo each keep their own `docs/dev/`. Record the chosen shape so
`documentation` and `implement` follow it.

## Worked ADR example

```
### ADR-003 — Datastore: PostgreSQL
Status: accepted
Context: relational data, transactional wishlist + orders, team knows SQL,
         p95 < 200ms at ~10k DAU (REQ-NF-002).
Decision: PostgreSQL (managed).
Consequences: strong consistency & transactions; vertical-scale first, add read
              replicas later; not ideal for future full-text search (revisit
              with a search index if REQ-014 lands).
Alternatives considered: MongoDB (rejected: relational integrity matters),
                         SQLite (rejected: concurrent write ceiling).
Constrains: FSD-012, FSD-020
```
