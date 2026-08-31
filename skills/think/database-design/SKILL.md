# Database Design — The Data Model, Designed Before It's Built

The schema is one of the most basic engineering artifacts — every lifecycle has a data-modeling step. **Produce it automatically whenever the app stores data; never wait for the user to ask.** Runs in the design phase the moment a datastore is involved, and again whenever implementation adds or changes a migration. Also on "design the schema / data model / ERD / add a table / migration".

Output: the ERD at `docs/sdd/specs/{NNN}-{slug}/erd.md` — inside the same feature folder as its FSD/SDS (found by number, per doc-generator's "Number-First Lookup" rule), format in `skills/build/doc-generator/formats.md` — these rules govern what goes *into* it. **A data-persisting feature whose design phase produced no schema doc does not pass the design gate.**

Bad schemas don't start bad — they get **crowded**: one table absorbing every new field because adding a column feels cheaper than modeling a new entity. This skill stops that before it starts.

## Deliberation Agenda — Discuss Before the ERD Is Written

When spec reaches the database step, these topics seed the grill frontier (see `skills/think/grill/SKILL.md`, "technical domain deliberation" subject type). Each topic carries a recommendation; the user settles it. The ERD document is written only after the frontier is empty.

**Granularity rule: deliberation at the topic level is not deliberation.** "Entity relationships: User has many Orders, 1:N" is a sentence, not a discussion. Each topic below has a **depth requirement** — the minimum granularity before the topic counts as settled. An agenda topic answered at headline-level ("we'll use 3NF", "cascade on delete") without going through each entity is not settled.

1. **Entity table-by-table** — present every entity as a table with its columns. Per entity:
   - Name every column, its type (narrowest correct — not `text` for everything), required/nullable, default value
   - State the entity's single responsibility (what it represents, what it doesn't)
   - Name the primary key and any natural keys / unique constraints
   
   **Depth requirement**: the user sees a concrete table for EACH entity (not just entity names) and confirms the columns are right. Present as a markdown table per entity with a recommendation, get confirmation or correction.

   ```
   Recommendation for `orders` table:
   | Column | Type | Required | Default | Notes |
   |--------|------|----------|---------|-------|
   | id | UUID | yes | gen_random_uuid() | PK |
   | user_id | UUID | yes | — | FK → users.id |
   | status | ENUM('pending','paid','shipped','cancelled') | yes | 'pending' | |
   | total_amount | DECIMAL(12,2) | yes | — | |
   | created_at | TIMESTAMPTZ | yes | now() | |
   | updated_at | TIMESTAMPTZ | yes | now() | |
   
   Is this right, or should we add/remove/change columns?
   ```

2. **Relationships + cardinality** — per pair of related entities, explicitly:
   - Which entity owns which (parent → child direction)
   - Cardinality: 1:1, 1:N, M:N (and if M:N, the join table with its own columns)
   - The FK column name and which table it lives on
   - Whether the relationship is required (FK NOT NULL) or optional (FK nullable)
   
   **Depth requirement**: present a relationship list with every FK named. Not "User has Orders" — but "`orders.user_id` → `users.id`, 1:N, NOT NULL, CASCADE on delete."

3. **Cascade behavior** — per FK, explicitly: CASCADE / RESTRICT / SET NULL / SET DEFAULT. What happens when a parent is deleted? What happens when a parent's PK is updated? This is a domain decision (does deleting a user delete their orders?) that the user must answer.
   
   **Depth requirement**: every FK from topic 2 gets an explicit cascade decision. Present as a table:
   ```
   | FK | On Delete | On Update | Reason |
   |----|-----------|-----------|--------|
   | orders.user_id → users.id | RESTRICT | CASCADE | Can't delete user with orders |
   | order_items.order_id → orders.id | CASCADE | CASCADE | Items die with the order |
   ```

4. **Normalization decisions** — which relationships are 3NF (the default) and which are deliberately denormalized. Every denormalization gets a written reason tied to a specific query pattern — "it's faster" without naming which query is not a reason.
   
   **Depth requirement**: if recommending denormalization, name the specific query it speeds up and the trade-off (data can drift).

5. **Soft delete vs hard delete** — per entity type. What's the retention requirement? Is there a legal/compliance reason to hard-delete? Is there a UX reason to undo? Different entities often have different answers.
   
   **Depth requirement**: answer per entity (users: soft delete because account recovery; sessions: hard delete because no retention need).

6. **Indexing strategy** — which queries are performance-critical (from the FSD's read paths and REQ-NF targets), what composite indexes are needed, column order matching filter order.
   
   **Depth requirement**: present each index with the query it serves:
   ```
   | Index | Columns | Serves query |
   |-------|---------|-------------|
   | idx_orders_user_status | (user_id, status) | "list my pending orders" — FSD-003 |
   | idx_products_category | (category_id, created_at DESC) | "browse by category" — FSD-007 |
   ```

7. **Migration approach** — additive-first or destructive? Zero-downtime requirement? Multi-tenant isolation at schema or query layer?

8. **Data access patterns** — the most common queries: list/filter/search/aggregate. Which need pagination? Which might hit N+1? Which are write-heavy vs read-heavy? These shape the schema as much as the entities do.
   
   **Depth requirement**: list the top 5-10 queries the app will run most, each mapped to an FSD flow.

**Topic skipped only when the product has no such surface** — no persistent data means no DB deliberation. Mode controls depth (one round vs full rounds), not whether the topic is raised.

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
