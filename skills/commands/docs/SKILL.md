---
name: docs
description: Generate documentation for an existing codebase that has little or no docs. Scans code to identify features, modules, entities, and flows, then generates a descriptive doc suite (system overview/ERD/UC/flows) per module — with deliberation where decisions are ambiguous. Works on brownfield codebases, not greenfield. Output lives in docs/system/, never docs/sdd/specs/.
disable-model-invocation: true
---

# /sdd-pipeline:docs

Generate retroactive documentation for a codebase that already works but lacks written specs. This is the **onboarding docs** command — it turns implicit knowledge (scattered across code, commit history, and tribal memory) into structured artifacts describing the system **as it actually is**.

## `docs/system/`, Not `docs/sdd/specs/` — Different Purpose, Different Home

`docs/sdd/specs/{NNN}-{slug}/` is where **specs that drive a build** live: an FSD written before code exists, whose spine ID (`FSD-003`) gets cited by tickets, tracked in the traceability matrix, verified against a deliberation ledger. It's the *plan*.

This command produces the opposite thing: a description of code that **already exists**, often written years after the fact, with no ticket ever built "from" it and no deliberation ledger to check fidelity against. Writing that into `specs/` would burn spine numbers on documents that were never specs to begin with, and would corrupt the traceability matrix for any *future* spec-first work in the same project.

**Output goes to `docs/system/{slug}/`** — same document shapes (borrowing FSD/SDS/ERD formats from `skills/build/doc-generator/formats.md` for structure), no spine ID, no `FSD-xxx` framing, no traceability entry. `docs/sdd/specs/` is never touched by this command.

## When to Use

- Existing codebase with no `docs/sdd/specs/` or minimal docs
- Team onboarding — new developer needs to understand the system
- Adopting SDD Pipeline on a brownfield project
- User says "generate docs", "document this codebase", "I need docs for this project"

**When NOT to use**: greenfield projects (use `/sdd-pipeline:discover` → `/sdd-pipeline:spec` instead), or single-feature doc generation during a task (that's doc-generator's normal trigger inside BUILD).

## The Process — Scan, Propose, Deliberate, Write

### Phase 1: Scan

Run `skills/think/context-loader/` fully (all steps including artifact inventory), then perform a deeper code scan:

1. **Identify features/modules** — group by domain, not by file. A "feature" is a user-facing capability or a distinct system concern. Look at:
   - Route definitions / API endpoints → each group of related routes is likely a feature
   - Database models/entities → each entity cluster is a data domain
   - UI pages/screens → each page or flow is a user-facing feature
   - Service classes / modules → each service is an architectural concern
   - Package/directory structure → named directories often map to features

2. **Identify actors/roles** — grep for auth middleware, role checks, permission guards, user types. Count distinct roles to determine if the diagram suite triggers.

3. **Identify entity relationships** — read model definitions, foreign keys, associations, join tables.

4. **Identify flows** — trace key user journeys through routes → controllers → services → models. Note branching logic, validation chains, and error handling.

### Phase 2: Propose

Present the scan results as a **documentation plan** — what will be generated and why:

```
DOCS PLAN — [project name]

Modules identified: [N] (after consolidation — see below)
  1. [module-name] — [1-line description] → overview + DoD-equivalent checklist
  2. [module-name] — [1-line description] → overview + component doc
  ...

Consolidation candidates:
  - [module A], [module B], [module C] are small and share [entity/concern] —
    proposed as ONE combined doc instead of three. Keep separate instead? (y/n)

Entities identified: [N]
  → ERD (field-level, covering all entities)

Actors identified: [N roles]
  → Use Case Spec per role (if ≥3 roles)
  → Process Flow per role (if ≥3 roles)
  → Role Index per role (if ≥3 roles)

Architecture:
  → System overview (how modules connect)

Estimated docs: [N] files across [N] module folders in docs/system/

Proceed? (user can add/remove/reorder/merge)
```

**Wait for user approval.** The user may say "skip ERD", "only do modules 1-3", "add a threat model", "keep 7/8/9 separate instead of merged". Adjust the plan accordingly.

### Consolidation Pass — Before Proposing, Not After

Run this before the plan above is shown, not as an afterthought: group modules that are small (a thin CRUD layer, a single-entity concern) and tightly coupled (share the same entity, one is a trivial extension of another) into a single combined doc candidate. Show the grouping as a proposed merge in the plan, not a silent decision — the user sees the estimated file count *with* consolidation already applied, and can un-merge anything that doesn't fit. This is what keeps a large brownfield codebase from producing one doc per file-system directory when three of those directories are really one concern.

### Phase 3: Deliberate + Write

For each module in the approved (post-consolidation) plan, one doc at a time — announce, write, report, same discipline as `doc-generator`'s loop:

1. **Reuse Gate first** — check if `docs/system/{slug}/` already exists for this module. If yes, update rather than create.

2. **Deliberate where ambiguous** — retroactive docs describe what EXISTS, so most decisions are already made by the code. But some things are ambiguous:
   - Business rules that are implicit in code but not documented → ask the user: "The code does X when Y happens — is this intentional behavior or a bug?"
   - Entity relationships where the code has no explicit FK/constraint → ask: "Is this a required relationship or optional?"
   - Flows where error handling is absent → note as a gap, don't invent behavior

   **The bar for deliberation is higher here than in `/spec`** — most things are observable from the code. Only deliberate when the code genuinely doesn't answer the question.

3. **Write the doc** — borrow structure from `skills/build/doc-generator/formats.md`'s templates, but as a **descriptive document, not a spec artifact**:
   - Metadata header uses Date/Updated/Version like other docs, but **no `Status: DRAFT|APPROVED|IMPLEMENTED`** (that field means "where is this in the build lifecycle" — meaningless for something describing already-shipped code) and **no `FSD-xxx`/`SDS-xxx`/`ERD-xxx` ID** (no spine, no traceability entry, no ticket ever cites it)
   - Cross-references (`Refs:`) point to other `docs/system/` files, never to `docs/sdd/specs/`
   - Mermaid diagram where it clarifies structure or flow

4. **Fidelity check against the code, not a ledger** — since there's no deliberation ledger (the code IS the source of truth), the fidelity check compares the document against the actual code behavior. Every claim in the doc must be verifiable by reading the code.

5. **Report** — filename + any ambiguities surfaced + any gaps found (missing validation, undocumented behavior, dead code discovered).

### Phase 4: Stitch

After all module docs are written:

1. **Generate/update `docs/system/index.md`** — link every module doc with relationships (separate from `docs/sdd/index.md`, which indexes `specs/`)
2. **Generate role indexes** (if ≥3 roles) — `docs/system/roles/{role}.md` per actor
3. **Run cross-reference check** — verify all `Refs:` resolve, all ERD entities are cited, no orphans
4. **Bootstrap `docs/sdd/config.md`** if it doesn't exist — detected mode, domain, SDLC, stack (this one file IS shared with the main pipeline, since mode/domain/SDLC detection applies project-wide regardless of which doc tree is active)

**No traceability.md bootstrap** — that matrix tracks REQ→FSD→TICKET→TEST for spec-driven work; retroactive documentation has none of those, so seeding it here would create empty or fabricated rows. If the project later adopts spec-first work via `/sdd-pipeline:spec`, traceability bootstraps naturally at that point.

## Scope Control — Don't Boil the Ocean

For large codebases, documenting everything in one session is impractical. The user controls scope:

- **"docs for the whole project"** → scan everything, propose a full plan, but write in batches. After each batch (3-5 features), check in: "Continue with the next batch?"
- **"docs for [specific area]"** → scan only that area, generate docs for it
- **"just ERD"** or **"just the API docs"** → generate only that doc type across the codebase
- **"docs for onboarding"** → prioritize: system-level SDS first, then the 3-5 most important features, then ERD. Skip niche/internal modules.

## What This Command Does NOT Do

- **Rewrite or refactor code** — it documents what exists, gaps and all
- **Generate test plans** — tests should be written alongside code changes, not retroactively bolted on. If the user wants retroactive tests, that's a separate task.
- **Run the full THINK→BUILD→PROVE pipeline** — no tickets, no implementation, no verification. This is a documentation pass only.
- **Invent behavior** — if the code doesn't do something, the doc doesn't claim it does. Gaps are noted as gaps.

## Output

| Artifact | Location |
|----------|----------|
| Module overview (FSD-shaped, no spine ID) | `docs/system/{slug}/overview.md` |
| Component doc (SDS-shaped, no spine ID) | `docs/system/{slug}/component.md` |
| ERD | `docs/system/{slug}/erd.md` (grouped by domain), or `docs/system/erd.md` if project-wide |
| Use Case Specs | `docs/system/{slug}/uc-{role}.md` (if ≥3 roles) |
| Process Flows | `docs/system/{slug}/flow-{role}.md` (if ≥3 roles) |
| Sequence Diagrams | `docs/system/{slug}/seq-{interaction}.md` (if multi-service) |
| Role Indexes | `docs/system/roles/{role}.md` (if ≥3 roles) |
| System overview | `docs/system/overview.md` (always, written first) |
| Index | `docs/system/index.md` |
| Config (shared) | `docs/sdd/config.md` |

**Never written by this command**: anything under `docs/sdd/specs/`, `docs/sdd/traceability.md`. Those belong to spec-first work only.

## Mode Behavior

Mode controls deliberation depth on ambiguous points, not scan coverage:

| Mode | Behavior |
|------|----------|
| **prototype** | Scan + write, minimal deliberation. Accept code behavior as-is, note gaps inline. |
| **vibe** | Same as prototype. No check-ins between docs. |
| **standard** | Scan + deliberate ambiguities + write. Check in after each feature batch. |
| **strict** | Full deliberation on every ambiguity. User approval required per document before proceeding. |
| **emergency** | Not applicable — documenting a codebase is not an emergency activity. |
