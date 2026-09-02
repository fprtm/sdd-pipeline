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
| Tickets (large scope) | `docs/sdd/specs/{NNN}-{slug}/tickets/{NN}-{ticket-slug}.md` + `00-index.md` |

- **NNN**: zero-padded sequence (`001`, `002`, …) — next number = highest existing feature-folder number + 1
- **slug**: kebab-case of the feature name (e.g., `user-auth`, `payment-flow`), fixed once the folder is created
- Example: `docs/sdd/specs/003-payment-refund/fsd.md`, `docs/sdd/specs/003-payment-refund/sds.md` — same folder, same feature, different doc types

**Why `specs/`, not `design/`**: this directory holds *written specifications* — FSD/SDS/PRD/threat model, none of them visual — while `docs/sdd/design-system/` holds the actual visual design (tokens, screens, UI patterns). Naming both "design" was the same collision the `/design`→`/spec` command rename fixed in v4.0.0, just one level down in the file tree; `specs/` closes it for good.

**Why one folder per feature, not flat numbered files**: `docs/sdd/tickets/{feature-slug}/` already worked this way — grouping by folder made a fitur's ticket set instantly visible as one directory instead of files that merely happened to share a prefix. Extending the same shape to `specs/` means everything tied to one feature's spine number (FSD, SDS, ERD, tickets, tests, DoD) sits in one place a reader can open once, instead of being split across `specs/`, `erd/`, `test-plans/`, `dod/`, and `tickets/{slug}/` as five separate top-level directories that all happen to share a number.

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

This is the same "never delete, mark instead" instinct as the decision log and the traceability matrix's dropped-ID rule, applied to design docs: `Date` answers "how old is this," `Updated`+`Version` answer "has this actually changed since I last read it, and how much" without diffing history, and `Status` answers "is this still the live version" without cross-checking the index. A doc sitting at `v1`/`Status: DRAFT` for months is itself a signal worth noticing.

## The ID Spine — Stable IDs for Traceability

The numbered filenames double as the traceability spine (`skills/meta/traceability/`). The convention is **hybrid**: documents get file-level IDs, fine-grained items get item-level IDs.

| ID | What it names | Where it's defined |
|----|---------------|--------------------|
| `FSD-003` | The FSD *file* `specs/003-{slug}/fsd.md` — the folder's number IS the ID | Folder name + filename |
| `SDS-003` / `PRD-003` / `ERD-003` | Same rule for `sds.md`/`prd.md`/`erd.md` in the same folder | Folder name + filename |
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

## One Doc at a Time — Announce, Write, Report

A task that needs six documents is six steps, not one. Generating the whole suite in a single silent pass and revealing it at the end means every assumption made in doc #1 is already baked into docs #2–6 by the time the user can correct it — and correcting it then costs a rewrite of all six.

For each document, in order:

1. **Announce before writing**: `Writing FSD-004 (catalog management) — the feature has user-facing behavior and acceptance criteria.` Name the doc and why that type applies.
2. **Write it.**
3. **Fidelity check** — if this document followed a deliberation session (spec's domain deliberation, or any grill round that settled specifics before this doc was written), re-read the settled answers against what just got written. Every specific value — names, numbers, cascade rules, status codes, thresholds — must trace back to an actual answer, not a plausible-sounding reconstruction. A document that captures the *gist* of a 20-minute deliberation but drops or rounds off the specifics has failed the document's one job. Fix silent drift immediately; escalate real contradictions to the user instead of picking one side quietly.

   **Genericity check — same step, different failure mode.** Fidelity catches drift from what was decided; this catches prose that's *faithful* to nothing being wrong but says nothing specific either. Before the doc is reported as done, scan it against: (a) **portability test** — would this sentence still make sense pasted into a different feature's doc unchanged? If yes, it's boilerplate — rewrite with this feature's actual specifics (numbers, names, real trade-offs). (b) **claim-without-evidence** — "improves performance", "better UX", "follows best practices" with no number, comparison, or reasoning attached — cut or ground it. (c) Every option/trade-off presented actually reflects a considered alternative from the deliberation, not a template placeholder. Fix inline before the doc is reported as done — this is a silent self-edit, not something to show the user as a draft-then-fix step.
4. **Report after**: filename, plus any decision the doc had to make that the user never stated — entity boundaries, what landed out of scope, a requirement's Must/Should priority. **These are the assumptions worth surfacing; a filename list alone hides them.**
5. **Check in when the doc opened a real fork** (per `skills/commands/spec/SKILL.md`'s fork table — architecture pattern, v1 scope, entity model, UI direction, a Mitigate-vs-Accept control, ticket granularity). Use `skills/think/elicitation/`'s "How to Ask" rule: native question tool first. No real fork → one line and continue; a checkpoint with nothing to decide is ceremony.

**standard/strict** run the full loop (strict requires approval, not just a check-in, between docs); **vibe** announces and batches, asking only on a fork; **prototype/emergency** skip docs entirely, so the question doesn't arise.

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
8. **A document is a transcription of what was settled, not a summary of it.** After a deliberation session, writing "based on our discussion" and reconstructing from memory is how specific values silently drift (a cascade rule becomes the "usual" one, a threshold gets rounded, a status code gets swapped for a more common one). Run the fidelity check (step 3 above) every time a document follows a deliberation — this is not optional polish, it's the step that makes the deliberation worth having had.
