# Architecture — Wishlist + Shareable Link

> **Plain-language summary:** One codebase (a monorepo) holding two deployable
> parts — a web frontend and a backend API — that share types so they never
> drift. Business rules live in a framework-independent core so they're easy to
> test. Data is in PostgreSQL. These choices favour reliability, easy scaling,
> and low maintenance over novelty. The shopper didn't have a strong preference,
> so the tech lead chose the most boring, proven option that fits the forces
> below and explained why.

- **Architecture style:** modular, layered with a hexagonal core for the domain
- **Dependency rule:** `domain` imports nothing; `application` imports `domain`;
  `infrastructure` (DB, HTTP, catalog client) and `interface` (API routes, UI)
  import `application`/`domain` but never the reverse. Nothing imports outward.
- **Repo/deploy topology:** **monorepo**, two independently-deployable apps
  (`apps/web`, `apps/api`) + shared packages (`packages/contract`, `packages/domain`)
- **FE↔BE contract/seam:** a shared `contract` package (typed request/response
  schemas, e.g. Zod/JSON-schema) generated once and imported by both apps; the
  HTTP API is versioned (`/v1`). This seam is where integration/e2e tests live.
- **Module boundaries (map to FSD groupings):**
  - `wishlist` domain module → FSD-001..006, 014
  - `sharing` domain module → FSD-008..012
  - `access` (authn/authz) cross-cut → FSD-007
  - `account-lifecycle` → FSD-013
- **Test seams:** the domain modules are pure and depend on repository *ports*
  (interfaces); adapters (Postgres, catalog HTTP) are injected, so domain logic
  is unit-testable with in-memory fakes, and adapters are integration-tested.

## Forces gathered (from PRD + one clarifying round)
- **Scale:** ~10k DAU now, read-heavy (viewing ≫ writing); shared views must
  stay up (REQ-NF-004). Data volume small (≤500 items/user).
- **Team:** small full-stack team, mixed seniority; one team owns FE and BE.
- **Surfaces:** responsive web now; a public read-only shared page; native mobile
  is a *maybe* later — keep the API client-agnostic.
- **Latency/availability:** p95 < 300ms (REQ-NF-001), 99.9% reads.
- **Constraints:** must reuse existing auth/session service and product catalog;
  privacy obligations (REQ-NF-002).
- **Change profile:** moderate; sharing rules may evolve → keep domain decoupled.

## Neutral-default note
The shopper/PM deferred technical choices ("you decide, make it solid"). Per the
`arch-decision` rule, the tech lead selected the **most robust, scalable, and
maintainable** option for the forces above, defaulting to boring, proven,
well-staffed technology with a strong testing story. Nothing here is novel for
novelty's sake; each ADR records the alternative and why it lost.

---

## ADR-001 — Style: modular monolith (layered) with a hexagonal domain core
- **Status:** accepted
- **Context:** small team, one bounded feature, moderate scale, sharing rules may
  evolve. Microservices would add ops cost with no scaling need today; a big-ball
  API with logic in controllers would be hard to test and evolve.
- **Decision:** a modular monolith backend; domain logic isolated behind ports
  (hexagonal) so it's testable and framework-independent.
- **Consequences:** fast to build and deploy; trivial local testing of rules;
  clear seam to extract a service later *if* scale ever demands it. Slight upfront
  discipline cost (defining ports).
- **Alternatives:** microservices (rejected: premature ops tax); logic-in-controllers
  (rejected: untestable, decays fast).
- **Constrains:** FSD-001..014

## ADR-002 — Language/runtime: TypeScript on Node (LTS) across FE and BE
- **Status:** accepted
- **Context:** small full-stack team; sharing types between FE and BE eliminates a
  whole class of integration bugs; large hiring pool; excellent test tooling.
- **Decision:** TypeScript everywhere; Node LTS runtime for the API.
- **Consequences:** one language for the team; the `contract` package is
  type-checked on both sides. CPU-bound work isn't a concern here (I/O-bound).
- **Alternatives:** Go/Java API (rejected: no type-sharing with the TS frontend,
  more ceremony than this scope needs); Python (rejected: weaker end-to-end typing
  for the contract seam).
- **Constrains:** the contract seam, all modules

## ADR-003 — Datastore: PostgreSQL (managed)
- **Status:** accepted
- **Context:** relational, low-volume, needs a uniqueness constraint
  (one item per shopper/product), transactional account-deletion purge (FSD-013),
  and a simple index for the p95 target (FSD-014).
- **Decision:** managed PostgreSQL.
- **Consequences:** strong consistency and constraints do the heavy lifting
  (DB-enforced uniqueness backs FSD-002); vertical scale first, read replicas
  later for shared-view load if needed; well understood by the team.
- **Alternatives:** MongoDB (rejected: relational integrity + uniqueness matter),
  DynamoDB (rejected: over-engineered for this scale, weaker ad-hoc queries).
- **Constrains:** FSD-002, FSD-013, FSD-014

## ADR-004 — API style: versioned REST (`/v1`) with a shared typed contract
- **Status:** accepted
- **Context:** simple resource-shaped operations; multiple future clients possible.
- **Decision:** REST under `/v1`; request/response schemas live in `packages/contract`
  and are imported by both apps; validate inputs at the boundary.
- **Consequences:** cache-friendly reads (helps REQ-NF-001/004); clear public
  surface for a future mobile client; no GraphQL server to operate.
- **Alternatives:** GraphQL (rejected: needless flexibility/ops cost at this
  scope), untyped REST (rejected: reintroduces drift the monorepo avoids).
- **Constrains:** the FE↔BE seam, all endpoints

## ADR-005 — Deployment: two containers behind a CDN; shared page cached at edge
- **Status:** accepted
- **Context:** 99.9% reads; shared views are public and read-only, so cacheable.
- **Decision:** `apps/api` and `apps/web` deploy as separate containers; static
  web assets and the public shared view are served through a CDN; owner API paths
  bypass cache.
- **Consequences:** shared views stay fast and survive backend blips (REQ-NF-004);
  independent deploy/rollback per app; cache invalidation needed on revoke
  (short TTL + revoke busts the entry — see SEC interplay).
- **Alternatives:** single fullstack app (rejected: couples deploy of a
  high-availability public read path to the owner API), serverless (viable; chosen
  containers for the team's existing ops familiarity — revisit if traffic spikes).
- **Constrains:** REQ-NF-004, FSD-010, FSD-011

## ADR-FE-001 — Frontend rendering: SSR for the shared page, SPA for the owner app
- **Status:** accepted
- **Context:** the shared page benefits from fast first paint + link previews (SEO
  is minor but social unfurling matters); the owner-facing wishlist is app-like.
- **Decision:** server-render `/s/{token}` (cacheable, no client auth); render the
  authenticated wishlist as a client app hitting `/v1`. Keep domain logic **out**
  of components — the FE calls the contract, it does not re-implement rules.
- **Consequences:** great shared-link UX and cacheability; clean split of public
  vs. authenticated rendering; a11y (REQ-NF-005) handled in the component layer.
- **Alternatives:** all-SPA (rejected: slow/blank shared page, no unfurl), all-SSR
  (rejected: heavier for the interactive owner app than needed).
- **Constrains:** FSD-010, FSD-012, REQ-NF-005

## ADR-FE-002 — Frontend state: server-state via a query/cache layer; minimal client state
- **Status:** accepted
- **Context:** the wishlist is server-owned data; over-storing it on the client
  invites staleness bugs (e.g. after revoke).
- **Decision:** use a data-fetching/cache library for server-state (wishlist,
  share status); keep local UI state (dialogs, optimistic "Saved") minimal and
  reconcile with the server response.
- **Consequences:** consistent data, easy optimistic Save with rollback on error
  (FSD-001 error flow); little bespoke state code.
- **Constrains:** FSD-001, FSD-004

---

> **Exit gate met:** style + dependency rule defined; stack chosen with an ADR per
> significant decision; FE architecture + topology (monorepo, two deployables)
> decided; user deferred → most robust/maintainable defaults chosen with reasons.
> ID registry bumped (ADR next free 006, ADR-FE next free 003). Proceed to the
> **security gate**. Update [traceability.md](traceability.md).
