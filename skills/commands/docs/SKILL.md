---
name: docs
description: Generate documentation for an existing codebase that has little or no docs. Scans code to identify features, modules, entities, and flows, then generates the appropriate doc suite (FSD/SDS/ERD/UC/flows) per feature — with deliberation where decisions are ambiguous. Works on brownfield codebases, not greenfield.
disable-model-invocation: true
---

# /sdd-pipeline:docs

Generate retroactive documentation for a codebase that already works but lacks written specs. This is the **onboarding docs** command — it turns implicit knowledge (scattered across code, commit history, and tribal memory) into the same structured artifacts the pipeline would have produced if it had been there from the start.

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

Features identified: [N]
  1. [feature-name] — [1-line description] → FSD + DoD
  2. [feature-name] — [1-line description] → FSD + SDS + DoD
  ...

Entities identified: [N]
  → ERD (field-level, covering all entities)

Actors identified: [N roles]
  → Use Case Spec per role (if ≥3 roles)
  → Process Flow per role (if ≥3 roles)
  → Role Index per role (if ≥3 roles)

Architecture:
  → SDS (system-level: how modules connect)

Estimated docs: [N] files across [N] feature folders

Proceed? (user can add/remove/reorder)
```

**Wait for user approval.** The user may say "skip ERD", "only do features 1-3", "add a threat model". Adjust the plan accordingly.

### Phase 3: Deliberate + Write

For each feature in the approved plan, follow doc-generator's "One Doc at a Time" flow:

1. **Reuse Gate first** — check if any `docs/sdd/specs/` folders already exist for this feature (context-loader's artifact inventory). If yes, update rather than create.

2. **Deliberate where ambiguous** — retroactive docs describe what EXISTS, so most decisions are already made by the code. But some things are ambiguous:
   - Business rules that are implicit in code but not documented → ask the user: "The code does X when Y happens — is this intentional behavior or a bug?"
   - Entity relationships where the code has no explicit FK/constraint → ask: "Is this a required relationship or optional?"
   - Flows where error handling is absent → note as a gap, don't invent behavior

   **The bar for deliberation is higher here than in `/spec`** — most things are observable from the code. Only deliberate when the code genuinely doesn't answer the question.

3. **Write the doc** — using the templates from `skills/build/doc-generator/formats.md`. Every doc includes:
   - Metadata header (Date, Updated, Version, Status — status is `IMPLEMENTED` since the code exists)
   - Cross-references (`Refs:` to other docs in the suite)
   - Mermaid diagram where required (FSD flowchart, SDS component diagram, ERD)

4. **Fidelity check against the code, not a ledger** — since there's no deliberation ledger (the code IS the source of truth), the fidelity check compares the document against the actual code behavior. Every claim in the doc must be verifiable by reading the code.

5. **Report** — filename + any ambiguities surfaced + any gaps found (missing validation, undocumented behavior, dead code discovered).

### Phase 4: Stitch

After all feature docs are written:

1. **Generate/update `docs/sdd/index.md`** — link every new feature folder with relationships
2. **Generate role indexes** (if ≥3 roles) — `docs/sdd/roles/{role}.md` per actor
3. **Run cross-reference check** — verify all `Refs:` resolve, all ERD entities are cited, no orphans
4. **Bootstrap `docs/sdd/config.md`** if it doesn't exist — detected mode, domain, SDLC, stack
5. **Bootstrap `docs/sdd/traceability.md`** — allocate ID counters based on what was generated

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
| Feature specs (FSD/SDS/DoD) | `docs/sdd/specs/{NNN}-{slug}/` |
| ERD | `docs/sdd/specs/{NNN}-{slug}/erd.md` (grouped by domain) |
| Use Case Specs | `docs/sdd/specs/{NNN}-{slug}/uc-{role}.md` (if ≥3 roles) |
| Process Flows | `docs/sdd/specs/{NNN}-{slug}/flow-{role}.md` (if ≥3 roles) |
| Sequence Diagrams | `docs/sdd/specs/{NNN}-{slug}/seq-{interaction}.md` (if multi-service) |
| Role Indexes | `docs/sdd/roles/{role}.md` (if ≥3 roles) |
| System SDS | `docs/sdd/specs/001-system-architecture/sds.md` (always, as first doc) |
| Index | `docs/sdd/index.md` |
| Config | `docs/sdd/config.md` |
| Traceability | `docs/sdd/traceability.md` |

## Mode Behavior

Mode controls deliberation depth on ambiguous points, not scan coverage:

| Mode | Behavior |
|------|----------|
| **prototype** | Scan + write, minimal deliberation. Accept code behavior as-is, note gaps inline. |
| **vibe** | Same as prototype. No check-ins between docs. |
| **standard** | Scan + deliberate ambiguities + write. Check in after each feature batch. |
| **strict** | Full deliberation on every ambiguity. User approval required per document before proceeding. |
| **emergency** | Not applicable — documenting a codebase is not an emergency activity. |
