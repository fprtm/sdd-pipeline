---
name: spec
description: Deliberate each domain with the user, then write it down — architecture, database, UX, app flows, threat model, and (when large) vertical-slice tickets. Each domain is grilled using frontier/round mechanics before its document is written. This is the SPEC step of the pipeline, not visual/UI design.
disable-model-invocation: true
---

# /sdd-pipeline:spec

Manual entry point to the **SPEC step** of the fixed sequence (`ASK → SPEC → PLAN → BUILD → CHECK`). Adaptively runs `skills/think/arch-analyzer/SKILL.md`, `skills/build/doc-generator/SKILL.md`, `skills/think/threat-model/SKILL.md`, `skills/think/ux-design/SKILL.md` (when there's a UI), and — when needed — `skills/build/ticket-decomposition/SKILL.md`, deciding internally which apply rather than making the user pick.

> **Why this isn't called `/design`.** "Design" reads as *visual/UI design* to most people, and this command's main job is written specs (FSD/SDS/PRD/ERD/threat model). Visual design is one optional part of it, handled by `skills/think/ux-design/` — and when that part runs, it produces its own `docs/sdd/design-system/design.md`, which is what someone asking for "the design doc" actually means. Same-shaped words, two different artifacts; the command name now says which one it is.

## Run It Step by Step — Deliberate, Then Document

This command can produce a dozen files. Emitting them all at once and only then showing the user gives them a wall of finished artifacts built on assumptions they never got to correct — every wrong assumption at step 1 is baked into everything after it. **The steps below run one at a time, and every step that produces a document first deliberates its domain with the user.**

### Why Spec Is Not Just Document Writing

The agent's natural defense is: "ERD is formalization, not a decision." Wrong. Choosing between 3NF and denormalization **is** a decision. Choosing cascade behavior **is** a decision. Choosing a code pattern **is** a decision. They're decisions at a more detailed level than discover handles, but they are still decisions with real trade-offs the user should weigh.

The boundary between discover and spec's deliberation:

| | Discover (WHICH) | Spec deliberation (HOW) |
|---|---|---|
| Database | Which entities exist, which DB engine | How entities relate, normalization, indexes, cascades, migration approach |
| Architecture | Which approach (monolith, modular), which stack | Which code patterns, module boundaries, dependency rules, deep stack choices (ORM, auth lib, state management) |
| UI | Which direction (mobile-first, existing system), which flows in v1 | Interaction design per screen, states, error UX, responsive strategy, flow detail with edge cases |
| App flow | Which flows, which are Must/Should/Could | Complete user journeys, edge cases, error paths, business rules, performance requirements |

Discover settles WHICH. Spec's deliberation settles HOW. The document captures what was settled. **A document written without deliberation is the agent making decisions alone while writing.**

### The Step Protocol

Before starting, announce the plan for the run itself:

```
SPEC run — [N] steps for this task:
  1. Architecture (deliberate + SDS)     4. Threat model
  2. Database design (deliberate + ERD)  5. App flows (deliberate + FSD ×3)
  3. UX design (deliberate + design.md)  6. Ticket decomposition (scope is large)
Starting step 1.
```

Then, for **every** step that produces a document:

1. **Announce the domain**: `Step 2/6 — Database design. Deliberating schema before writing ERD.`
2. **Deliberate**: Load the domain's **deliberation agenda** from its think/ skill and run it as a grill session — frontier/round mechanics per `skills/think/grill/SKILL.md` (the "technical domain deliberation" subject type), every question carrying a recommendation, adversarial toward the agent's own defaults. When the frontier is empty, the domain is settled.
3. **Document**: Write the artifact based on what was settled. The document is a record of deliberation, not a creative work done in isolation.
4. **Report**: What landed (filenames), what was settled during deliberation, and anything that was assumed.

Steps that don't produce a document (ticket decomposition) use the existing announce → run → report → check-in protocol.

**Where the deliberation agendas live** — each think/ skill owns its domain's agenda:

| Domain | Skill | Agenda section |
|---|---|---|
| Software architecture | `skills/think/arch-analyzer/` | Code patterns + why, module boundaries, dependency rules, deep stack choices, FE↔BE contract, performance budgets |
| Database design | `skills/think/database-design/` | Entity relationships + cardinality, normalization decisions, cascade behavior, indexing strategy, migration approach, data access patterns |
| UI/UX design | `skills/think/ux-design/` | Interaction design per screen, state management, error UX, responsive strategy, flow detail, navigation model |
| App flows | FSD writing step | User journeys end-to-end, edge cases, error flows, business rules, performance requirements |

### Deliberation Uses Grill Mechanics, Scoped to One Domain

The deliberation is grill's **third subject type** — not a single decision (mid-session) and not a whole product (the five-seat agenda). It's a technical domain being shaped before its document is written. The frontier is seeded by the agenda topics in the think/ skill. Questions enter the frontier as their prerequisites settle. The session ends when every topic is settled and the document can be written from shared understanding.

**Depth check before writing**: before declaring the frontier empty and moving to document writing, verify that each agenda topic was settled at its **depth requirement** level (see the agenda in each think/ skill). A topic discussed at headline level ("we'll use 3NF", "cascade on delete") without going through each entity/endpoint/screen is NOT settled — push it back to the frontier. The depth requirements exist because the agent's natural tendency is to label topics as settled after one sentence and move to writing the document. The document is only as good as the deliberation that preceded it.

**Topics are domain-gated, not mode-gated.** If the product has a database, DB deliberation happens regardless of mode. Mode controls depth:

| Mode | Deliberation behavior |
|------|----------------------|
| **prototype** | One round per topic, recommendations accepted by default unless the user objects. Fast, but every relevant topic still asked. |
| **vibe** | Same as prototype. No council unless a decision is genuinely hard to reverse. |
| **standard** | Full frontier rounds per topic. Council on rule-of-three decisions. |
| **strict** | Full rounds + explicit confirmation per topic before writing the document. |

### The FSD Deliberation — App Flow Before Spec

FSD is the one document whose deliberation agenda isn't in a separate think/ skill — it's here, because the FSD IS the domain:

Before writing each FSD, deliberate — with **depth requirements** enforced per topic:

1. **User journeys — step by step, not summary** — walk through the complete flow from entry to completion. Per step:
   - What screen/page/state is the user on?
   - What data is displayed (and where does it come from)?
   - What actions are available (primary, secondary, destructive)?
   - What happens when the user takes each action? Where do they go next?
   - What conditions change the flow (role, entity state, data presence)?
   
   **Depth requirement**: present the journey as a numbered step list with branches, not "user logs in → sees dashboard." Every conditional branch is named:
   ```
   Flow: Place Order
   1. User is on Cart page (data: cart items from API /cart)
   2. User clicks "Checkout" → redirect to Checkout page
      - If cart is empty → show empty state, disable checkout button
      - If user not logged in → redirect to Login, then back to Checkout
   3. Checkout page shows: shipping address (pre-filled if saved), payment method, order summary
   4. User fills/confirms address → validates (required fields, format)
      - Invalid → inline errors, stay on page
   5. User selects payment → confirms order
      - Payment fails → show error, allow retry
      - Payment succeeds → redirect to Order Confirmation
   6. Order Confirmation shows: order number, estimated delivery, "continue shopping" link
   ```

2. **Edge cases** — what happens at boundaries: empty data, max limits, concurrent access, partial failures, timeout. Per edge case, name the trigger and the expected behavior.
   
   **Depth requirement**: list specific scenarios, not just categories. Not "handle empty data" — but "cart page with 0 items: show illustration + 'Your cart is empty' + 'Browse Products' button."

3. **Error flows** — every error path the flow can hit: what triggers it, what the user sees, how they recover. These become the negative test cases in `build/test-plan`.
   
   **Depth requirement**: per error, name: the trigger condition, the error message/screen, the recovery path. Present as a table:
   ```
   | Trigger | User sees | Recovery |
   |---------|-----------|----------|
   | Payment gateway timeout | "Payment could not be processed. Try again." + retry button | Retry or choose different payment |
   | Out of stock (after cart) | "Some items are no longer available" + list affected items | Remove items or go back to cart |
   ```

4. **Business rules** — the logic that governs decisions within flows: pricing rules, validation rules, access rules, rate limits. Each one a question to the user, not an assumption.
   
   **Depth requirement**: present each rule as an if/then statement the user can confirm or correct. "If order total > 100, free shipping" — not "we'll handle shipping logic."

5. **Performance requirements** — what needs to be fast and how fast, what can be lazy-loaded, what's the acceptable latency for each operation.
   
   **Depth requirement**: per operation, name the target. "Product list page loads in < 2s with 1000 products" — not "should be fast."

**Ask, don't assume, at the moments that matter.** Deliberation surfaces most forks naturally, but these specific forks must *always* reach the user even if the deliberation round didn't surface them — because getting them wrong invalidates everything downstream:

| Fork | When it appears |
|---|---|
| Architecture pattern / module boundaries | arch-analyzer has 2+ viable candidates |
| Scope: what's in v1 vs deferred | the requirement list is longer than the stated ask |
| UI direction | there are screens and no existing design system (→ `ux-design` §0, with a concrete preview) |
| Entity model — one entity or two | the domain has near-twin concepts (Product vs Service, User vs Account) |
| A control rated High/Critical, response Mitigate vs Accept | threat model produces one |
| Ticket granularity | scope is large enough to decompose |

Anything **not** on that list — filenames, numbering, doc formats, diagram shapes, which template applies — is decided internally. The user picks direction, never bookkeeping.

**Mode dial** — the ceremony scales like everything else in this framework:

| Mode | Deliberation | Document writing |
|------|-------------|-----------------|
| **prototype** | One round per topic, recommendations accepted by default | Run straight through, announce only |
| **vibe** | Same as prototype, no council unless genuinely hard to reverse | Batch artifacts, one summary at end |
| **standard** | Full frontier rounds, council on rule-of-three | Full protocol: announce → deliberate → write → report |
| **strict** | Full rounds + explicit confirmation per topic | Full protocol + explicit approval before writing |
| **emergency** | Not applicable — emergency skips SPEC entirely | — |

## What Happens When Called

0. **If a `/sdd-pipeline:discover` (or an in-conversation grill) session just settled the architecture/scope question this task needs**, this is exactly the hand-off point — build the spec from that shared understanding instead of re-running architecture analysis or scope questions from scratch. Check `docs/sdd/glossary.md` and `docs/sdd/decisions/` for anything the session just wrote; don't re-ask what's already settled.
1. Check whether the task involves an architecture decision (new pattern, module boundary, structural change). If yes, run architecture analysis: detect existing patterns, apply the deletion test and 1-adapter-hypothetical/2-adapter-real heuristics, propose or flag inconsistencies.
2. **Check whether the product has screens.** If yes, run `skills/think/ux-design/SKILL.md` — direction confirmed with a concrete preview *before* anything is written, and the run produces `docs/sdd/design-system/design.md` as the one entry doc for the UI.
3. Check whether the task needs a functional spec (what's being built, acceptance criteria). If yes, generate one.
4. **Check the resulting scope size.** If the designed work is `large`, decompose it into vertical-slice tickets with blocking edges — show the breakdown, get granularity confirmation, **write the ticket files in this run**. Small/medium scope: no tickets; the `changes/{date}-{slug}.md` file carries the record.
5. If several apply, run them all — one invocation covers the whole SPEC step, one step at a time.

**Decomposition is not homework for the next session.** Ending a large run with "next: confirm the ticket breakdown" is a failure, not a hand-off: it leaves every traceability row 🟡 with an empty Ticket column, and it means the artifact the user is supposed to *approve before BUILD* was never produced. If scope is large, either the tickets get written before this run closes, or the run states plainly that it stopped early and why. Silence plus a to-do line in `index.md` is neither.

## Output

- Architecture findings → `docs/sdd/design/` or, for multi-candidate decisions, a self-contained HTML report with confidence badges (Strong/Worth exploring/Speculative)
- Specs → `docs/sdd/design/{NNN}-{slug}-fsd.md`, `-sds.md`, or `-prd.md` as applicable — numbered, behavior-focused, each with a compact Mermaid diagram
- Threat model → `docs/sdd/design/{NNN}-{slug}-threats.md` (note the suffix: `-threats`, not `-threat-model` — `check-file-hygiene.mjs` enforces it)
- UI work → `docs/sdd/design-system/design.md` (the entry doc) + `docs/sdd/design/{NNN}-{slug}-ux.md` + one file per flow in `docs/sdd/ux-screens/`
- Database-touching work → `docs/sdd/erd/{NNN}-{slug}-erd.md`
- Large scope → tickets at `docs/sdd/tickets/{feature-slug}/` with a frontier work order, announced as: "Scope is large — split into N tickets, starting with the unblocked ones."

**Run `check-file-hygiene.mjs` before declaring the run complete.** This command writes more files in one pass than any other, which makes it the most likely place for a filename to drift from convention — and a convention followed "probabilistically" is exactly what the mechanical checker exists to catch. A run that ends without the checker passing isn't finished.

## Spec-Only Is a Complete Deliverable

Specs, architecture, threat model, and tickets **without code** is a legitimate stop point (spec'ing for someone else, buy-in before committing engineering time) — not an unfinished run. When the user wants specs only (or invoked this command without an execution signal), **actually stop** after the artifacts: state plainly "spec complete — implementation not started (by request)", and never sneak forward into BUILD. Implementation later starts from these artifacts via `/sdd-pipeline:implement`.

## Full Behavior

See `skills/think/arch-analyzer/SKILL.md`, `skills/think/ux-design/SKILL.md`, `skills/build/doc-generator/SKILL.md`, and `skills/build/ticket-decomposition/SKILL.md` for detection signals, heuristics, formats, and slicing rules.
