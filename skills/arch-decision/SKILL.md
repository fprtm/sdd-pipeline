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

For frontend-specific rigor, repo/deployment topology (fullstack/separate/
monorepo), and a full worked ADR example, see [`reference.md`](reference.md) —
read it once there's a UI to decide, or when the FE/BE relationship needs an
explicit call. The steps below are enough for a backend-only or a lite change.

Write to `docs/sdd/04-architecture.md` using `adr.template.md` (bundled with
this skill) for each decision.

## Step 1 — gather the forces (ask, don't assume)

Read the PRD non-functional requirements first, then ask the user only what's
still unknown: scale/load now vs. 12 months out; team size & seniority; client
surfaces (web/mobile/CLI/API-only); deployment target; data shape
(relational/document/time-series); latency & availability targets; constraints
(existing stack, compliance, budget, deadlines); how often requirements churn
(drives how much decoupling is worth paying for).

## Step 2 — decide, with the user in the loop

Present 2–3 viable options per major decision (architecture style, language,
framework, datastore, API style, deployment model, testing stack) with honest
trade-offs and a recommendation.

**Neutral but not passive:**
- If the user has a preference or constraint, follow it.
- **If they say "I don't know / you decide": pick the option that is the most
  robust, scalable, and maintainable *for their actual answers above* — and
  explicitly justify it.** Default toward boring, proven, well-documented
  technology with a large hiring/skill pool. Novelty is a cost you only pay
  when a requirement demands it.
- **Right-size it.** A CRUD app for 50 users doesn't get event sourcing and
  microservices. A payments platform doesn't get one 5000-line file. Match
  ceremony to the forces gathered — over-engineering is as much a failure as
  under-engineering.

## Step 3 — architecture style & boundaries

Pick the lightest that fits: **modular monolith, layered** (default for most
products); **clean/hexagonal** (ports & adapters — when business rules are
complex, long-lived, or must be testable in isolation); **service-oriented /
microservices** (only when independent scaling/deploy/team-autonomy genuinely
demand it — justify the operational tax).

Whatever you pick, state the **dependency rule** (what may import what), name
the **module boundaries** (map to the FSD groupings), and note where the
**seams for testing** are. If a deep-module design skill (`codebase-design`) is
available, use it to shape the key interfaces.

If there's any UI, or the FE/BE topology isn't obvious, go read `reference.md`
now before continuing — those decisions belong in this same gate.

If a datastore was chosen, hand off the actual **schema shape** to
`database-design` (normalization, table boundaries, indexing, migrations) — this
skill decides *which* datastore, that one decides how the data inside it is
modeled so it doesn't turn into crowded, undifferentiated tables.

## Step 4 — record ADRs

One ADR per significant, hard-to-reverse decision, using `adr.template.md`
(status, context, decision, consequences, alternatives considered, what it
constrains). See `reference.md` for a full worked example.

## Exit gate

Architecture style chosen with a written dependency rule; stack decided with an
ADR per significant choice; the user signed off — or, if they deferred, the
agent chose the most robust/scalable/maintainable option **and stated the
reasoning**. Then invoke `traceability` (register ADR IDs and which FSDs they
constrain), run **`stack-conventions`** to capture the chosen stack's official
best practices as enforceable rules (`04-stack-guide.md`), and proceed to the
**security gate** (`threat-model`).
