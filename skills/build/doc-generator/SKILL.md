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

### Detection Signals

How SDD Pipeline detects task type:

- **Database changes**: Mentions schema, migration, model, table, column, relation, SQL
- **Product-facing**: Mentions user, customer, UX, UI, flow, experience, page, screen
- **Architecture change**: Mentions pattern, layer, module, service, refactor at system level
- **API endpoint**: Mentions endpoint, route, API, REST, GraphQL, request, response

## Document Formats

All documents are short, focused, and actionable. NOT enterprise bloatware. Full per-document templates (FSD, SDS, PRD, ERD, DoD, Test Plan) live in the companion file `skills/build/doc-generator/formats.md` — read it when actually generating a doc.

Two rules that apply to every format, worth knowing before opening the templates:
- **Durability**: never reference file paths or line numbers in FSD/SDS/PRD — describe behavior and interfaces. The one exception is a short snippet that precisely encodes a decision (a type signature, an example payload).
- **Length**: FSD/PRD max 1 page, SDS max 1.5 pages. Longer means over-specified.

## File Locations — Numbered, One Doc Per Feature, Never Append-Forever

All generated docs go to the structured docs/sdd/ directory, **with a sequence number prefix**:

| Doc Type | Location |
|----------|----------|
| FSD | `docs/sdd/design/{NNN}-{slug}-fsd.md` |
| SDS | `docs/sdd/design/{NNN}-{slug}-sds.md` |
| PRD | `docs/sdd/design/{NNN}-{slug}-prd.md` |
| ERD | `docs/sdd/erd/{NNN}-{slug}-erd.md` |
| DoD | `docs/sdd/dod/{NNN}-{slug}-dod.md` |
| Test Plan | `docs/sdd/test-plans/{NNN}-{slug}-tests.md` |

- **NNN**: zero-padded sequence per directory (`001`, `002`, …) — next number = highest existing + 1
- **slug**: kebab-case of the feature name (e.g., `user-auth`, `payment-flow`)
- Example: `docs/sdd/design/003-payment-refund-fsd.md`

**Why numbered**: a bare `{slug}-fsd.md` convention means the 100th feature touching "auth" appends to or overwrites the same file, and the file bloats until reading one small section requires reading everything. One numbered file per feature keeps every doc small, scoped, and individually readable — an AI (or human) looking for the refund spec opens exactly one short file, not a 2000-line accretion.

**Update vs. new file — the rule**:
- Same feature, still in flight (spec revised before/during its own implementation) → **update the same numbered file**
- New feature, even in the same area (auth v2, a second payment flow) → **new numbered file**. Mark superseded old docs with a `**Status**: SUPERSEDED by {NNN}` line at top — same convention as the decision log.

After generating, update `docs/sdd/index.md` with links and relationships — the index is how anyone finds the right numbered doc without listing the directory.

**Metadata header — every design doc, so revision state is readable without opening git log**: FSD/SDS/PRD/ERD/DoD/Test Plan all open with the same four bolded fields (exact shape in `formats.md`), read top-to-bottom before anything else:

```
**Date**: [auto — set once, when the file is first created; never changes]
**Updated**: [auto — bumped to today on every substantive revision]
**Version**: v1 [increment by 1 each time Updated changes; typo/formatting fixes don't count]
**Status**: DRAFT | APPROVED | IMPLEMENTED | SUPERSEDED by {NNN}
```

This is the same "never delete, mark instead" instinct as the decision log and the traceability matrix's dropped-ID rule, applied to design docs: `Date` answers "how old is this," `Updated`+`Version` answer "has this actually changed since I last read it, and how much" without diffing history, and `Status` answers "is this still the live version" without cross-checking the index. A doc sitting at `v1`/`Status: DRAFT` for months is itself a signal worth noticing.

## The ID Spine — Stable IDs for Traceability

The numbered filenames double as the traceability spine (`skills/meta/traceability/`). The convention is **hybrid**: documents get file-level IDs, fine-grained items get item-level IDs.

| ID | What it names | Where it's defined |
|----|---------------|--------------------|
| `FSD-003` | The FSD *file* `design/003-{slug}-fsd.md` — the number IS the ID | Filename |
| `SDS-003` / `PRD-003` / `ERD-003` | Same rule for SDS/PRD/ERD files | Filename |
| `FSD-003.2` | Flow/behavior #2 *inside* FSD-003 — use when the matrix needs a finer link | `### FSD-003.2 — …` heading in the file |
| `ADR-005` | Decision file `decisions/005-{slug}.md` (see `skills/meta/decision-log/`) | Filename |
| `REQ-001` / `REQ-NF-001` | A single requirement (item-level, global counter) | Table row in a PRD |
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

## Mermaid Diagram — Required in Every FSD and SDS

Every FSD and SDS must include one compact Mermaid diagram giving the user a visual at a glance — most users grasp a 10-node flowchart faster than 10 paragraphs:

- **FSD** → a `flowchart` of the user/data flow (what goes in, what happens, what comes out)
- **SDS** → a component/`flowchart` diagram of module relationships, or a `sequenceDiagram` if the interesting part is the interaction order
- **ERD** → already Mermaid `erDiagram` (existing rule)

Keep it small: if the diagram needs more than ~12 nodes, it's covering too much — split it or simplify. A diagram that needs a paragraph to explain should be redrawn, not explained.

## Mode Behavior

| Mode | Doc Generation |
|------|---------------|
| **prototype** | Skip all docs. Speed first. |
| **vibe** | Generate docs silently. Don't show to user. Available in docs/sdd/ for later review. |
| **standard** | Generate relevant docs. Show summary of what was created. |
| **strict** | Generate all applicable docs. Require user review of FSD/SDS before BUILD proceeds. |
| **emergency** | Skip docs. Generate post-fix report only. |

## Rules

1. **Short over complete** — 1-page FSD > 10-page FSD. If it's over 2 pages, you're over-engineering the doc.
2. **Skip irrelevant docs** — Bug fix doesn't need a PRD. Don't generate for the sake of generating.
3. **One numbered doc per feature** — same feature still in flight: update its file. New feature (even same area): new numbered file, mark the old one SUPERSEDED. See "File Locations" above — never let one filename become an ever-growing accretion.
4. **User can always skip** — "skip docs" or "no docs for this" = comply immediately, but say that docs were skipped and why.
5. **Mermaid for diagrams** — Use Mermaid syntax for all diagrams. FSD/SDS must each carry one compact diagram (see "Mermaid Diagram" section).
6. **Elicitation answered = spec written** — if elicitation/grill questions were asked and answered, a spec (at minimum) MUST be generated before BUILD. Questions without a written spec is a broken contract: the user spent effort answering, the answers must land somewhere durable, not evaporate into the conversation.
7. **Always announce what was (not) generated** — "Generated: 003-payment-refund-fsd.md, 002-payment-refund-dod.md" or "No docs — bug fix, report only." Never leave the user guessing why a doc did or didn't appear.
6. **No file paths or line numbers in durable docs** (FSD, SDS, PRD) — they go stale before the doc does. Describe behavior and interfaces instead. Test plans and DoD checklists are exempt since they're inherently tied to the current state of the code.
7. **Use glossary terms** — reference `docs/sdd/glossary.md` (see `skills/meta/glossary/`) for canonical terminology. Don't introduce a new synonym for a term that's already defined.
