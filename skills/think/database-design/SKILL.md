# Database Design — The Data Model, Designed Before It's Built

The schema is one of the most basic engineering artifacts — every lifecycle has a data-modeling step. **Produce it automatically whenever the app stores data; never wait for the user to ask.** Runs in the design phase the moment a datastore is involved, and again whenever implementation adds or changes a migration. Also on "design the schema / data model / ERD / add a table / migration".

Output: the ERD at `docs/sdd/erd/{NNN}-{slug}-erd.md` (format in `skills/build/doc-generator/formats.md`) — these rules govern what goes *into* it. **A data-persisting feature whose design phase produced no schema doc does not pass the design gate.**

Bad schemas don't start bad — they get **crowded**: one table absorbing every new field because adding a column feels cheaper than modeling a new entity. This skill stops that before it starts.

## Shape: One Entity, One Responsibility

Model around bounded contexts from the domain (`docs/sdd/glossary.md`), not around screens or convenience. A `users` table mixing auth fields, billing fields, preference fields, and a `metadata` JSON blob for "whatever didn't fit" is the crowded-table anti-pattern — split it: `users`, `billing_profiles`, `user_preferences`. If a JSON/blob column is truly needed, name what it's for and cap what goes in it — it's not a place to avoid modeling.

## Normalize by Default; Denormalize With a Written Reason

Default to 3NF. Denormalize (duplicate data for reads, add a summary column) **only** with an explicit reason tied to a real REQ-NF (a specific query's latency target) — record it as an ADR, not a silent shortcut. A fact stored in two places without that justification is the same SSOT violation the constraint set flags in code: the copies will drift.

## Types, Naming, Referential Integrity

- **Narrowest correct type** — not `text`/`json` for everything; enums/check constraints for closed sets.
- **Consistent naming** — one convention for casing and singular/plural, matching what `skills/think/stack-conventions/` set for the stack/ORM.
- **Explicit foreign keys with explicit cascade behavior** (`CASCADE`/`RESTRICT`/`SET NULL` — pick one; don't leave it to app code).
- **Baseline audit columns** (`created_at`/`updated_at`) and an explicit soft-delete vs hard-delete decision per entity — a call, not a default.

## Index for Real Query Patterns, Not Speculatively

Index what the FSD's actual read paths and REQ-NF latency targets need — every foreign key usually needs one; composite index column order matches the query's filter order. An index no query pattern justifies is write-cost with no read benefit.

## Migrations Are Additive-First

Prefer additive, backward-compatible steps (add nullable column → backfill → require it in a later migration) over one destructive change. Never edit a migration that already ran in another environment — write a new one. Multi-tenant isolation is enforced at the schema/query layer, not just the app layer (a `threat-model` SEC concern, not only a modeling one).

## Exit Gate

Every table maps to one clear responsibility; normalization is deliberate and any denormalization has a written reason; naming is consistent; FKs and cascade behavior explicit; indexes trace to real query patterns; migrations additive where possible. Then implementation writes the migration and the PROVE phase checks it against this bar.
