---
name: database-design
description: >-
  Schema design principles — normalize to avoid crowded/god tables, one entity
  one responsibility, naming conventions, indexing tied to real query patterns
  (not speculative), explicit referential integrity, and safe additive
  migrations. Use when arch-decision picks a datastore (phase 4), whenever
  implement is about to add or change a migration, or when the user says
  "design the schema / database design / add a table / migration".
---

# database-design — schemas that stay clean as they grow

Bad schemas don't start bad — they get **crowded**: one table absorbing every
new field because adding a column feels cheaper than modeling a new entity.
This skill exists to stop that before it starts.

## Shape: one entity, one responsibility

Model the schema around **bounded contexts from the domain** (`00-context.md`),
not around screens or convenience. A table mixing unrelated concerns (a `users`
table with auth fields, billing fields, preference fields, and a `metadata`
JSON blob for "whatever didn't fit") is the crowded-table anti-pattern — split
it: `users`, `billing_profiles`, `user_preferences`. If a JSON/blob column is
truly needed, name what it's for and cap what goes in it — it's not a place to
avoid modeling.

## Normalize by default; denormalize with a written reason

Default to 3NF. Denormalize (duplicate data for read performance, add a
materialized/summary column) **only** with an explicit reason tied to a real
NFR (a specific query's latency target) — record it as an ADR, not a silent
shortcut. A fact stored in two places without that justification is the same
SSOT violation `code-standards` flags in code — it's a future bug (the copies
drift).

## Types, naming, and referential integrity

- **Narrowest correct type** — not `text`/`json` for everything to dodge
  modeling; use enums/check constraints for closed sets.
- **Consistent naming** — one convention for table/column casing and singular
  vs. plural, matching what `stack-conventions` already set for the stack/ORM.
- **Explicit foreign keys with an explicit cascade behavior** (`CASCADE`,
  `RESTRICT`, `SET NULL` — pick one, don't leave it to app code to enforce
  silently).
- **Baseline audit columns** (`created_at`/`updated_at`) and an explicit
  soft-delete vs. hard-delete decision per entity — not a default, a call.

## Index for real query patterns, not speculatively

Index what the FSD's actual read paths and NFR latency targets need — every
foreign key usually needs one, composite index column order should match the
query's filter order. An index nobody's query patterns justify is write-cost
with no read benefit; don't add it "just in case."

## Migrations are additive-first

Prefer additive, backward-compatible steps (add a nullable column, backfill,
then make it required in a later migration) over one destructive change. Never
edit a migration that's already run in another environment — write a new one.
Multi-tenant data needs isolation enforced at the schema/query layer, not just
the app layer (this is a `threat-model` SEC concern, not only a modeling one).

## Exit gate

Every table maps to one clear responsibility; normalization level is
deliberate and any denormalization has a written reason; naming is consistent;
foreign keys and cascade behavior are explicit; indexes trace to a real query
pattern; the migration is additive where possible. Then `implement` writes the
migration and `code-review` checks it against this bar.
