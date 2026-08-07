---
name: arch-decision
description: >-
  The architecture gate — decide architecture style, stack, and boundaries
  BEFORE implementation, and record each choice as an ADR. Use when starting a
  build, when the user says "choose the stack / architecture", "should this be
  clean architecture?", or as phase 4 of spec-driven-development. Neutral by
  default: the agent asks, the user decides; if the user is unsure, the agent
  picks the most robust, scalable, maintainable option for their needs and says
  why.
---

# arch-decision — the architecture gate

This gate exists because the most expensive mistakes are structural and get
locked in on day one. Do **not** let implementation start until architecture is
decided and written down.

Write to `docs/sdd/04-architecture.md` using `templates/adr.template.md` for
each decision.

## Step 1 — gather the forces (ask, don't assume)

Read the PRD non-functional requirements first, then ask the user only what's
still unknown:

- **Scale & load** — users/requests now vs. 12 months out; read-heavy or
  write-heavy; data volume.
- **Team** — who maintains it, how many, how senior; solo/junior/mixed? Are
  frontend and backend the same people or different teams?
- **Surfaces** — what clients exist? Web, mobile (native/cross-platform),
  desktop, CLI, public API for third parties, or a backend with no UI at all?
- **Deployment target** — serverless, container, VM, edge, on-prem, mobile,
  desktop? Any existing platform to fit into?
- **Data** — relational, document, time-series, graph? Transactions? Analytics?
- **Latency & availability** — p95 target, uptime expectation, offline needs.
- **Constraints** — existing stack the org standardizes on, compliance
  (PCI/HIPAA/GDPR), budget, hard deadlines.
- **Change profile** — how often will requirements churn? (drives how much
  decoupling is worth paying for.)

## Step 2 — decide, with the user in the loop

Present 2–3 viable options per major decision with honest trade-offs, and a
recommendation. Major decisions usually include: **architecture style**,
**language/runtime**, **framework**, **datastore**, **API style**, **deployment
model**, **testing stack**.

### The neutral-but-not-passive rule

- If the user has a preference or constraint, follow it.
- **If the user says "I don't know / you decide": pick the option that is the
  most robust, scalable, and maintainable *for their actual answers above* — and
  explicitly justify it.** Default toward *boring, proven, well-documented*
  technology with a large hiring/skill pool and a strong testing story. Novelty
  is a cost you only pay when a requirement demands it.
- Right-size it. A CRUD app for 50 users does **not** get event sourcing and
  microservices. A payments platform does not get a single 5000-line file.
  Match ceremony to the forces you gathered — over-engineering is as much a
  failure as under-engineering.

## Step 3 — architecture style & boundaries

Decide the internal shape and *write down the dependency rule*. Typical ladder,
pick the lightest that fits:

1. **Modular monolith, layered** — default for most products. Clear layers
   (domain / application / infrastructure / interface), one deployable.
2. **Clean / Hexagonal (ports & adapters)** — when business rules are complex,
   long-lived, or must be testable in isolation from frameworks/DB. Core domain
   depends on nothing; adapters depend inward.
3. **Service-oriented / microservices** — only when independent scaling,
   independent deploy, or team autonomy genuinely demand it. Justify the
   operational tax.

Whatever you pick, state the **dependency rule** (what may import what),
name the **module boundaries** (map them to the FSD groupings), and note where
the **seams for testing** are. If a deep-module design skill (`codebase-design`)
is available, use it to shape the key interfaces.

## Step 3b — frontend / client architecture (don't forget the UI)

Architecture is **not backend-only**. If there is any UI, decide it with the
same rigor:

- **Rendering & framework** — SPA, SSR, SSG, or hybrid; which framework; when
  each is appropriate (SEO/first-paint needs → SSR/SSG; rich app-like
  interactivity → SPA/hybrid).
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

## Step 3c — repository & deployment topology (decide explicitly)

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

## Step 4 — record ADRs

One ADR per significant, hard-to-reverse decision:

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

## Exit gate

Architecture style chosen with a written dependency rule; stack decided with an
ADR per significant choice; the user signed off — or, if they deferred, the
agent chose the most robust/scalable/maintainable option **and stated the
reasoning**. Then invoke `traceability` (register ADR IDs and which FSDs they
constrain) and proceed to the **security gate** (`threat-model`).
