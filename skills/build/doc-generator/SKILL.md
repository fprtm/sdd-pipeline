# Doc Generator

Generate living project documents adaptively based on task type, domain, and what the task actually needs.

## Trigger Rules

SDD Pipeline auto-determines which documents to generate. User can always skip or add.

**The DoD floor**: every task of size `small` or above gets a DoD, no matter what. A short task gets a short spec — three lines is fine — but a checklist defining "done" always exists. Only `micro` tasks (typo, rename, 1-liner) are exempt. Without a DoD, "done" is whatever the agent felt like stopping at.

| Task Type | Documents Generated |
|-----------|-------------------|
| **New feature** | FSD (Functional Spec) + DoD |
| **Architecture change** | SDS (Software Design Specification) + DoD |
| **Product-facing feature** | PRD (Product Requirements) + FSD + DoD |
| **Database changes** | ERD (Entity Relationship Diagram) + SDS + DoD |
| **API endpoint** | FSD + API contract + DoD |
| **Bug fix** | Minimal spec (3-5 lines: symptom, root cause, fix approach) + DoD |
| **Refactor** | SDS (if architectural) or minimal spec + DoD |
| **Migration** | SDS + Migration plan + DoD |
| **New project** | PRD + SDS + ERD (if DB) + FSD + DoD |
| **Micro task** (typo, rename, 1-liner) | Nothing — announce "micro task, no docs" |

### Diagram Suite — Size-Gated Extras for Complex Products

The base table above covers most tasks. For **large/full products with multi-role complexity** (≥3 distinct actor roles), the following diagram documents trigger in addition to the base docs:

| Doc Type | Trigger | What it captures |
|----------|---------|------------------|
| **Use Case Spec** | Large + multi-role (≥3 actors) | One file per role — PlantUML use case diagram + UC table per actor. Captures WHO does WHAT at system boundary level. |
| **Process Flow** | Large + multi-role (≥3 actors) | Per-role flow + one cross-actor end-to-end flow. Mermaid/PlantUML flowchart showing happy path + decision points. |
| **Sequence Diagram** | Medium+ with multi-service or multi-actor interaction | Mermaid `sequenceDiagram` embedded in markdown. Shows temporal ordering of calls between actors/services. |
| **Activity Diagram** | Medium+ with technical process detail (validation chains, trigger cascades, branching logic) | Mermaid/PlantUML activity diagram. Shows branching, parallel forks, guard conditions. |

**Size gate keeps small tasks lightweight.** Small/medium tasks get FSD+DoD (maybe SDS). The diagram suite only kicks in when the task is genuinely complex enough to need visual documentation — not every endpoint needs a sequence diagram.

**Detection signals for multi-role**: ≥3 distinct named roles in the PRD/FSD user stories, or the user explicitly describes a multi-role product. Sequence/activity diagrams trigger on complexity, not role count — a 2-service integration with 5-step handshake needs a sequence diagram even for a medium task.

### Detection Signals

How SDD Pipeline detects task type:

- **Database changes**: Mentions schema, migration, model, table, column, relation, SQL
- **Product-facing**: Mentions user, customer, UX, UI, flow, experience, page, screen
- **Architecture change**: Mentions pattern, layer, module, service, refactor at system level
- **API endpoint**: Mentions endpoint, route, API, REST, GraphQL, request, response

## Document Formats

All documents are short, focused, and actionable. NOT enterprise bloatware. Full per-document templates (FSD, SDS, PRD, ERD, DoD, Test Plan) live in the companion file `skills/build/doc-generator/formats.md` — read it when actually generating a doc.

Three rules that apply to every format, worth knowing before opening the templates:
- **Durability**: never reference file paths or line numbers in FSD/SDS/PRD — describe behavior and interfaces. The one exception is a short snippet that precisely encodes a decision (a type signature, an example payload).
- **Length**: FSD/PRD max 1 page, SDS max 1.5 pages. Longer means over-specified.
- **Nav header**: every generated doc opens with one line back to its feature's entry point — `[← Back to 00-index.md](00-index.md)` if a `tickets/00-index.md` reading-order guide exists for this feature, otherwise a relative link back to the sibling doc that reads first (per the reading order in doc-generator's "How to Review This Feature", usually `fsd.md`). This is what makes a human navigating the folder directly (not through the pipeline) able to find their way back without guessing.

## File Locations — One Folder Per Feature, Never Append-Forever

Every generated doc for a feature lives inside **one folder**, `docs/sdd/specs/{NNN}-{slug}/` — the folder name carries the number and slug once; the files inside it are bare:

| Doc Type | Location |
|----------|----------|
| FSD | `docs/sdd/specs/{NNN}-{slug}/fsd.md` |
| SDS | `docs/sdd/specs/{NNN}-{slug}/sds.md` |
| PRD | `docs/sdd/specs/{NNN}-{slug}/prd.md` |
| Threat model | `docs/sdd/specs/{NNN}-{slug}/threats.md` |
| UX spec | `docs/sdd/specs/{NNN}-{slug}/ux.md` |
| ERD | `docs/sdd/specs/{NNN}-{slug}/erd.md` |
| Test Plan | `docs/sdd/specs/{NNN}-{slug}/tests.md` |
| DoD | `docs/sdd/specs/{NNN}-{slug}/dod.md` |
| Use Case Spec | `docs/sdd/specs/{NNN}-{slug}/uc-{role}.md` (one per actor role) |
| Process Flow | `docs/sdd/specs/{NNN}-{slug}/flow-{role}.md` + `flow-e2e.md` (cross-actor) |
| Sequence Diagram | `docs/sdd/specs/{NNN}-{slug}/seq-{interaction}.md` |
| Activity Diagram | `docs/sdd/specs/{NNN}-{slug}/activity-{process}.md` |
| Role Index | `docs/sdd/roles/{role}.md` (one per actor, project-wide — see "Per-Role View") |
| Tickets (large scope) | `docs/sdd/specs/{NNN}-{slug}/tickets/{NN}-{ticket-slug}.md` + `00-index.md` |

- **NNN**: zero-padded sequence (`001`, `002`, …) — next number = highest existing feature-folder number + 1
- **slug**: kebab-case of the feature name (e.g., `user-auth`, `payment-flow`), fixed once the folder is created
- Example: `docs/sdd/specs/003-payment-refund/fsd.md`, `docs/sdd/specs/003-payment-refund/sds.md` — same folder, same feature, different doc types

**`specs/`, not `design/`**: this directory holds *written specifications* (FSD/SDS/PRD/threat model, none visual); `docs/sdd/design-system/` holds the actual visual design (tokens, screens, UI patterns). Don't conflate the two.

### Number-First Lookup — Never Regenerate the Slug to Find a Folder

**The rule that keeps this safe**: a feature's folder is looked up by its **number**, never reconstructed from its name.

- **New feature** → allocate the next number from `docs/sdd/traceability.md`'s counter, create `specs/{NNN}-{slug}/`, and the slug used at that moment is **final** — it never changes.
- **Adding a document to an existing feature** (SDS after FSD, ERD after SDS, a ticket after spec) → find the existing folder by globbing `specs/{NNN}-*` for the number already known from context (the FSD-xxx / feature the task refers to). **Never** independently re-derive the slug from the feature name and search by full name — a re-derived slug can drift from the original ("employee-branch-backup" vs "branch-backup-employee") and silently create a second folder for what should be the same feature.
- **`check-file-hygiene.mjs` catches the failure mode mechanically**: two `specs/` folders sharing the same leading `{NNN}` with different slugs is flagged as a duplicate-feature-number collision — almost always this exact bug, caught automatically rather than discovered later by a confused reader.

**Update vs. new folder — the rule**:
- Same feature, still in flight (spec revised before/during its own implementation) → **update files inside the same existing folder** (found by number, per the rule above)
- New feature, even in the same area (auth v2, a second payment flow) → **new folder, new number**. Mark superseded old docs with a `**Status**: SUPERSEDED by {NNN}` line at top — same convention as the decision log.

After generating, update `docs/sdd/index.md` with a link to the feature folder and relationships — the index is how anyone finds the right feature without listing the directory. `index.md` references the **folder**, not each file inside it; the folder's own contents (or its `tickets/00-index.md` reading-order guide, for `large` scope) is where the per-file breakdown lives.

**Metadata header — every design doc, so revision state is readable without opening git log**: FSD/SDS/PRD/ERD/DoD/Test Plan all open with the same four bolded fields (exact shape in `formats.md`), read top-to-bottom before anything else:

```
**Date**: [auto — set once, when the file is first created; never changes]
**Updated**: [auto — bumped to today on every substantive revision]
**Version**: v1 [increment by 1 each time Updated changes; typo/formatting fixes don't count]
**Status**: DRAFT | APPROVED | IMPLEMENTED | SUPERSEDED by {NNN}
```

A doc sitting at `v1`/`Status: DRAFT` for months is itself a signal worth noticing.

## The ID Spine — Stable IDs for Traceability

The numbered filenames double as the traceability spine (`skills/meta/traceability/`). The convention is **hybrid**: documents get file-level IDs, fine-grained items get item-level IDs.

| ID | What it names | Where it's defined |
|----|---------------|--------------------|
| `FSD-003` | The FSD *file* `specs/003-{slug}/fsd.md` — the folder's number IS the ID | Folder name + filename |
| `SDS-003` / `PRD-003` / `ERD-003` | Same rule for `sds.md`/`prd.md`/`erd.md` in the same folder | Folder name + filename |
| `FSD-003.2` | Flow/behavior #2 *inside* FSD-003 — use when the matrix needs a finer link | `### FSD-003.2 — …` heading in the file |
| `UC-003-perusahaan` | Use case spec for role "perusahaan" in feature 003 | `uc-perusahaan.md` filename |
| `FLOW-003-e2e` | Cross-actor end-to-end flow for feature 003 | `flow-e2e.md` filename |
| `ADR-005` | Decision file `decisions/005-{slug}.md` (see `skills/meta/decision-log/`) | Filename |
| `REQ-001` / `REQ-NF-001` | A single requirement (item-level, global counter) | Table row in a PRD |
| `FR-001` (or whatever prefix the project declares) | Same as `REQ`, under a project's own pre-existing convention — set `req-prefix:` in `docs/sdd/config.md` if this project used a different requirement prefix before adopting SDD Pipeline. Default `REQ` needs no config. | Table row in a PRD |
| `SEC-004` | A security control (item-level, global counter) | `### SEC-004 — …` heading in a threat model |
| `TICKET-012` | A ticket (item-level, **global** counter — NOT per-feature) | Ticket file heading |
| `TEST-030` | A test case (item-level, global counter) | `### TEST-030 — …` heading in a test plan |

Rules:
- **Global counters for REQ/SEC/TICKET/TEST live in `docs/sdd/traceability.md`** (a "next free" line at the top). Bump when allocating; reserve a range first before parallel work so two agents never allocate the same ID.
- **IDs are stable and never reused.** A dropped item keeps its row in the matrix with the ID struck through — renumbering breaks every reference below it.
- Cite IDs upward (`Refs: TICKET-012, FSD-003`), don't copy content downward.

## Product Documentation — Two Audiences, Same Change

Pipeline docs (FSD/SDS/plans) describe the *work*; the product also needs docs about *itself*, split by audience:

- **`docs/user/`** — for end users: plain language, a simple flow diagram where it helps, an FAQ for the sharp edges. No implementation talk.
- **`docs/dev/`** — for developers: architecture notes, how to run/test, API reference. Plus **JSDoc/docstrings on every public interface** in the code itself.
- **Code-level docs are always English** (JSDoc, comments), whatever language the conversation and specs use.

Rules that make this real rather than aspirational:
- **Doc-as-you-go, in the same change as the code** — never batched to the end. A ticket's DoD includes "docs handled for the touched area".
- **A missing doc is a create, not a skip.** If the touched area has no doc yet, the ticket creates one — "there was nothing to update" doesn't pass.
- Behavior changed → update the user doc; interface changed → update the dev doc + JSDoc, same diff.

## Per-Role View — One Entry Point Per Actor

For products with ≥3 actor roles, generate `docs/sdd/roles/{role}.md` — one file per role. This is an **index with links**, not content duplication.

Each role file contains:
- **Role summary**: who this actor is, their primary goals (1-2 sentences)
- **Use cases**: links to all `uc-{role}.md` files across features that involve this role
- **Flows**: links to all `flow-{role}.md` files
- **Specs**: links to FSD/SDS sections that mention this role
- **Tickets**: links to tickets that touch this role's functionality
- **ERD entities**: which entities this role owns or interacts with

**Rules**:
- Role files are **Evergreen** (lifecycle tier) — update whenever a new feature adds a UC or flow for that role.
- Role files link by ID (`UC-003-perusahaan`, `FSD-003.2`), not by prose summary. If the source file changes, the link still works.
- Only generate role files when the diagram suite triggers (large + multi-role). For 2-role products, the FSD user stories are sufficient.
- Role slugs are kebab-case of the role name as used in the product, not translated: `perusahaan`, `job-seeker`, `admin`, `mentor`.

## Cross-Reference Enforcement

Every document must cite its upstream sources. This is not optional — orphan references are treated as warnings by health-check.

| Document type | Must cite |
|---------------|-----------|
| ERD entity | At least one UC or FSD that uses it |
| Flow step | The FSD or UC it implements |
| Sequence participant | The SDS component or FSD actor it represents |
| Activity branch | The FSD error/alternate flow or business rule it encodes |
| Decision (ADR) | The spec or ticket that triggered it |
| Ticket | Its parent FSD/SDS/PRD by ID |

**How to cite**: inline `(Refs: FSD-003, UC-003-perusahaan)` at the end of the relevant section or table row. Same convention as the existing ID spine.

**Mechanical check**: health-check's cross-reference orphan scan (see `skills/meta/health-check/`) greps for entities/flows/decisions that cite nothing, and for cited IDs that don't resolve to an existing file. This turns "did we connect everything?" from a judgment call into a grep.

## Mermaid Diagram — Required in Every FSD and SDS

Every FSD and SDS must include one compact Mermaid diagram giving the user a visual at a glance:

- **FSD** → a `flowchart` of the user/data flow (what goes in, what happens, what comes out)
- **SDS** → a component/`flowchart` diagram of module relationships, or a `sequenceDiagram` if the interesting part is the interaction order
- **ERD** → already Mermaid `erDiagram` (existing rule)

Keep it small: if the diagram needs more than ~12 nodes, it's covering too much — split it or simplify. A diagram that needs a paragraph to explain should be redrawn, not explained.

## Reuse Gate — Check Before Create

Before allocating a new feature number or creating any spec file, match the current task against the artifact inventory from context-loader (step 5). This gate runs once per task, before the "One Doc at a Time" flow below.

1. **Read the inventory.** If context-loader produced an artifact inventory, use it. If not (bare project, first run), skip this gate — there's nothing to match against.
2. **Match by semantics, not exact slug.** Compare the task's subject to each existing spec folder and in-progress change file. Match on meaning: "payment refund" matches `003-payment-refund`, "refund flow" matches `003-payment-refund`, "add refund endpoint" matches `003-payment-refund`. Don't require exact string equality.
3. **Decide**:
   - **Match found, status DRAFT or APPROVED** → this is an update to existing work. Use that folder (`specs/{NNN}-*/`), update the relevant files inside it. Do NOT allocate a new number.
   - **Match found, status IMPLEMENTED** → the feature shipped. If the task is a revision/enhancement of the same feature, update in-place and bump Version/Updated. If it's a genuinely different feature in the same area, allocate a new number and link back.
   - **Match found, status SUPERSEDED** → ignore it, treat as no match.
   - **Match found in `changes/` with status `in-progress`** → this task may be a continuation. Read the change file to confirm, then update it instead of creating a new one.
   - **No match** → new feature. Allocate next number per normal rules.
4. **Announce the decision.** Always state which path was taken: `Updating existing FSD-003 (payment-refund, DRAFT)` or `No existing spec matches — allocating 007.` This makes the reuse/create decision visible and auditable.

**The failure this gate prevents**: session 1 creates `003-payment-refund/fsd.md`. Session 2 gets the same task, doesn't check, creates `007-payment-refund/fsd.md`. Now two specs describe the same feature with diverging content.

## One Doc at a Time — Announce, Write, Report

A task that needs six documents is six steps, not one — never generate the whole suite in a single silent pass.

For each document, in order:

1. **Announce before writing**: `Writing FSD-004 (catalog management) — the feature has user-facing behavior and acceptance criteria.` Name the doc and why that type applies.
2. **Write it.**
3. **Fidelity check** — if this document followed a deliberation session (spec's domain deliberation, or any grill round that settled specifics before this doc was written), re-read the settled answers against what just got written. Every specific value — names, numbers, cascade rules, status codes, thresholds — must trace back to an actual answer, not a plausible-sounding reconstruction. A document that captures the *gist* of a 20-minute deliberation but drops or rounds off the specifics has failed the document's one job. Fix silent drift immediately; escalate real contradictions to the user instead of picking one side quietly.

   **Genericity check — same step, different failure mode.** Fidelity catches drift from what was decided; this catches prose that's *faithful* to nothing being wrong but says nothing specific either. Before the doc is reported as done, scan it against: (a) **portability test** — would this sentence still make sense pasted into a different feature's doc unchanged? If yes, it's boilerplate — rewrite with this feature's actual specifics (numbers, names, real trade-offs). (b) **claim-without-evidence** — "improves performance", "better UX", "follows best practices" with no number, comparison, or reasoning attached — cut or ground it. (c) Every option/trade-off presented actually reflects a considered alternative from the deliberation, not a template placeholder. Fix inline before the doc is reported as done — this is a silent self-edit, not something to show the user as a draft-then-fix step.
4. **Report after**: filename, plus any decision the doc had to make that the user never stated — entity boundaries, what landed out of scope, a requirement's Must/Should priority. **These are the assumptions worth surfacing; a filename list alone hides them.**
5. **Check in when the doc opened a real fork** (per `skills/commands/spec/SKILL.md`'s fork table — architecture pattern, v1 scope, entity model, UI direction, a Mitigate-vs-Accept control, ticket granularity). Use `skills/think/elicitation/`'s "How to Ask" rule: native question tool first. No real fork → one line and continue; a checkpoint with nothing to decide is ceremony.

**standard/strict** run the full loop (strict requires approval, not just a check-in, between docs); **vibe** announces and batches, asking only on a fork; **prototype/emergency** skip docs entirely, so the question doesn't arise.

## Mode Behavior

**Mode behavior**: see unified mode matrix in `skills/orchestrator/SKILL.md`.

## Artifact Lifecycle Tiers

| Tier | Artifacts | Rule |
|------|-----------|------|
| Evergreen | config.md, glossary.md, index.md, traceability.md, design-system/design.md, stack-guide.md, spec docs (FSD/SDS/ERD) | Update in-place. Live as long as the feature lives. |
| Transactional | Tickets (done), change files (done + merged), verification reports, deliberation ledgers (after doc verified) | Archive or delete after purpose fulfilled. Tickets → `archive/`. Change files older than 14 days with `status: done` → delete. Reports → keep only the latest per feature. Ledgers → move to `archive/` after fidelity check passes. |
| Accumulating | decisions/, memory/, mockup PNGs | Review periodically — every 5 new features or quarterly, whichever comes first. Prune superseded ADRs, stale memories, outdated mockups. |

## Rules

1. **Short over complete** — 1-page FSD > 10-page FSD. If it's over 2 pages, you're over-engineering the doc.
2. **Skip irrelevant docs** — Bug fix doesn't need a PRD. Don't generate for the sake of generating.
3. **One numbered doc per feature** — same feature still in flight: update its file. New feature (even same area): new numbered file, mark the old one SUPERSEDED. See "File Locations" above — never let one filename become an ever-growing accretion.
4. **User can always skip** — "skip docs" or "no docs for this" = comply immediately, but say that docs were skipped and why.
5. **Mermaid for diagrams** — Use Mermaid syntax for all diagrams. FSD/SDS must each carry one compact diagram (see "Mermaid Diagram" section).
6. **Elicitation answered = spec written** — if elicitation/grill questions were asked and answered, a spec (at minimum) MUST be generated before BUILD. Questions without a written spec is a broken contract: the user spent effort answering, the answers must land somewhere durable, not evaporate into the conversation.
7. **Always announce what was (not) generated** — "Generated: 003-payment-refund-fsd.md, 002-payment-refund-dod.md" or "No docs — bug fix, report only." Never leave the user guessing why a doc did or didn't appear.
8. **No file paths or line numbers in durable docs** (FSD, SDS, PRD) — they go stale before the doc does. Describe behavior and interfaces instead. Test plans and DoD checklists are exempt since they're inherently tied to the current state of the code.
9. **Use glossary terms** — reference `docs/sdd/glossary.md` (see `skills/meta/glossary/`) for canonical terminology. Don't introduce a new synonym for a term that's already defined.
10. **A document is a transcription of what was settled, not a summary of it.** Run the fidelity check (step 3 above) every time a document follows a deliberation.
12. **Cross-references are mandatory** — every ERD entity cites a UC/FSD, every flow cites a spec, every decision cites its trigger. An orphan entity (no upstream ref) or a dangling cite (ID doesn't resolve) is a defect, not a style issue. See "Cross-Reference Enforcement" above.
13. **Ledger traceability** — every decided value in a generated document must either (a) trace to a `settled` row in the deliberation ledger (`docs/sdd/specs/{NNN}-{slug}/deliberation.md` or `docs/sdd/changes/deliberation-{slug}.md`), or (b) be explicitly marked `[ASSUMED — reason]` inline in the document and have a corresponding `assumed` row appended to the ledger. A value that appears in the document with no ledger row and no `[ASSUMED]` annotation is an unmarked assumption — `check-file-hygiene.mjs` may flag documents with unmarked values that have no ledger row.
