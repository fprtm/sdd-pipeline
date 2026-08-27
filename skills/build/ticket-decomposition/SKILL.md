# Ticket Decomposition

Break a large task into independently workable pieces, sized to fit one agent session, ordered by real dependency — not by technical layer.

## When This Runs

Triggered for `large` task size (see orchestrator task-size detection), or when the user explicitly asks to break something down ("split this into tickets", "this is too big for one session").

Skipped for micro/small/medium tasks — those fit in one BUILD pass and don't need decomposition overhead.

## Vertical Slices, Not Layers

The default mistake is splitting by technical layer: "ticket 1: database schema, ticket 2: API endpoints, ticket 3: frontend." This produces tickets that can't be demoed or verified independently — the schema ticket is "done" but proves nothing works end-to-end.

Instead, split into **vertical slices**: each ticket is a narrow but complete path through every layer it touches, demoable and verifiable on its own.

```
❌ Layered split:
  1. Database schema for orders
  2. Order API endpoints
  3. Order UI

✅ Vertical slice split:
  1. Create order (schema + endpoint + minimal UI) — end to end, one order type, no discounts
  2. Apply discount code to order — extends slice 1
  3. Partial refund on order — extends slice 1
```

Each vertical slice should be sized to fit in one agent context window — if a slice feels like it needs multiple sessions, split it further.

## The Exception: Wide/Mechanical Refactors

Blast-radius-fanning changes — renames, retyping, framework migrations — don't fit vertical slicing (there's no "layer" to slice; the same trivial change repeats across many files). For these, use **expand → migrate → contract**:

1. **Expand**: add the new thing alongside the old (new field, new function signature with a default) — non-breaking
2. **Migrate**: batch-convert call sites to the new thing, in small CI-green batches
3. **Contract**: remove the old thing once nothing references it

Sequence tickets by batch, not by feature — keep the build green at every batch boundary.

## Computing Blocking Edges

After drafting slices, determine which tickets block which:

```
Ticket 2 (discount code) blocked by: Ticket 1 (create order)
Ticket 3 (partial refund) blocked by: Ticket 1 (create order)
Ticket 2 and Ticket 3: no edge between them — can proceed in parallel
```

Work the **frontier**: at any point, the workable set is every ticket whose blockers are all resolved. This is the same frontier concept as SDD Grill — compute what's unblocked, work it, recompute.

## Right-Sizing — More Files Isn't More Rigor

Splitting further always *feels* like more thoroughness, but a ticket that exists only to say "wire the thing from ticket N" adds a file to open without adding independent value. Before finalizing the breakdown, check each ticket against:

- **Could this be a step inside an adjacent ticket instead of its own file?** If ticket B is never workable, reviewable, or demoable without ticket A being done first *and* B is small (a helper function, a config change, a one-line wiring), it's a strong candidate to fold into A rather than stand alone.
- **Does the ticket count match the feature's actual seams, or the decomposer's default granularity?** A feature with 3 real vertical slices (distinct user-facing capabilities) shouldn't become 8 tickets because each slice got split by technical layer again inside itself — that's the exact layering mistake this skill's first rule warns against, just recursed one level deeper.
- **Would a solo builder actually want this many separate handoffs?** Vertical-slice tickets exist for independent workability and parallel dispatch. A solo/small-team project (see `sdlc-detector`) gets less benefit from fine slicing than a team parallelizing across agents — bias toward fewer, more substantial tickets when there's no one to parallelize with.

This is a judgment call, not a hard cap — some features genuinely need 8+ tickets (schema + several distinct endpoints + several distinct UI surfaces, each independently demoable). The check is against **padding**, not against genuine complexity: if every ticket in the breakdown is independently demoable and represents real, distinct work, the count is whatever it is.

## Presenting the Breakdown

Show the full decomposition as a numbered list before publishing, and confirm with the user:

```
## Proposed Tickets: [Feature Name]

1. Create order (end-to-end, single item, no discounts) — no blockers
2. Apply discount code to order — blocked by #1
3. Partial refund on order — blocked by #1
4. Order history view — blocked by #1

Granularity look right? Any tickets to merge or split further?
```

Wait for confirmation before writing ticket files. This is a judgment call (how to slice) — always worth a quick check before committing to file.

**The breakdown is also the approval gate for large work** (see orchestrator's "What Gets Approved"): for `large` scope there is no separate plan file, so this list is what the user approves before BUILD. That raises the bar on it — it must be complete enough to reorder, merge, or defer against, not a teaser.

**Confirm, then write, in the same run.** Showing the breakdown and stopping there leaves the work in the worst state available: specs written, every traceability row 🟡 with an empty Ticket column, and no approved work order. If the user confirms, the ticket files get written now. If they don't respond or defer, say explicitly that the run stopped before decomposition and that BUILD has nothing approved to start from — never leave it as a quiet to-do line in `index.md`.

## Ticket Format

**Location**: `docs/sdd/tickets/{feature-slug}/{NN}-{ticket-slug}.md`

**IDs**: the `{NN}` in the filename orders tickets within the feature, but every ticket ALSO gets a **globally unique `TICKET-xxx`** in its heading (counter in `docs/sdd/traceability.md`) — the matrix, commits (`Refs:`), and tests point at that global ID, which must never collide across features.

**Durability exemption**: tickets are exempt from the no-file-paths rule that governs FSD/SDS/PRD — like test plans and DoD checklists, a ticket is inherently tied to the current state of the code and dies at merge. Concrete paths are *required* here: `Files likely touched:` feeds `check-parallel-safety.mjs` (see `skills/agents/parallel-work/`), and naming exact files/functions is what makes a T1 ticket executable by a junior dev or cheap model without inventing anything. Describe *behavior* end-to-end, but *point* at real files.

```markdown
# TICKET-012 — [Title]

**Feature**: [parent feature/epic, if any]
**Refs**: FSD-003 [, SEC-004 if this implements a security control]
**Tier**: T1 | T2 | T3
**Status**: ⬜ todo | 🔨 in progress | 🧪 testing/review | ✅ done | ⛔ blocked
**Dependencies**: TICKET-011 [global IDs that must land first, or "none"]
**Files likely touched:** `src/routes/order.ts`, `src/services/order.ts`
**Claimed by:** _(empty until an agent claims it — `<agent-id>, <worktree path>`; delete when merged)_

## What to Build
[End-to-end behavior this ticket delivers. Not layer-by-layer — describe the
complete slice: what the user/caller can do once this ticket is done.]

## Deliverables
[One glance = what this ticket will create/change — file → the function/component
born there. No implementation code, just the manifest:]
- `src/services/order.ts` → `createOrder()` (new)
- `src/routes/order.ts` → `POST /orders` route wired to it (new)
- `src/services/order.test.ts` → TEST-030, TEST-031 (new)

## Acceptance Criteria (Given/When/Then — test-plan maps these 1:1 to TEST-xxx)
- [ ] Given [precondition], when [action], then [observable outcome]
- [ ] [Testable criterion]

## Out of Scope
- [Explicitly excluded from this ticket — usually deferred to a later ticket]
```

## The Feature Index (`00-index.md`) — The Human's Entry Point

A `large` feature produces a spec bundle of several documents (FSD, SDS, ERD, threats, UX, ux-screens) plus a directory of tickets — easily 10-20 files. Nobody should have to guess which one to open first. `docs/sdd/tickets/{feature-slug}/00-index.md` is the **one required entry point** for the whole feature: written alongside the ticket breakdown, in the same run, never skipped for `large` scope.

```markdown
# [Feature Name] — Work Order

**Spec**: `docs/sdd/specs/{NNN}-{slug}-{sds,fsd,ux,threats}.md` [only the ones that exist]
**ERD**: `docs/sdd/erd/{NNN}-{slug}-erd.md` [if a DB change]
**ADR**: [any decision log entries this feature depends on, if any]
**Next free ticket ID**: TICKET-0NN

## How to Review This Feature
[The reading order, tailored to what actually exists for this feature — skip any row whose doc wasn't generated. Each row states what question that doc answers and an honest read-time estimate, so a reviewer can stop once they have what they need instead of reading everything at equal depth:]

1. **FSD** (~3 min) — what this does, user flows, edge cases. Start here always.
2. **SDS** (~3 min) — the technical shape: architecture, components, key decisions. Read if reviewing the implementation approach.
3. **ERD** (~2 min) — schema, relationships, cascade behavior. Read if reviewing data changes.
4. **Threats** (~1 min) — security controls (SEC-xxx). Read if reviewing anything auth/payment/trust-boundary.
5. **UX spec + ux-screens** (~2 min each) — screens, states, interactions. Read if reviewing UI.
6. **Tickets below** — in the dependency order shown in Frontier/Blocking Order, only the ones relevant to what you're actually doing. A ticket is self-contained (rule #6 below) — you shouldn't need to re-read the full FSD to understand one.

## Status
[Ticket table — ID, title, tier, status, dependencies]

## Frontier / Blocking Order
[Dependency graph — which tickets are unblocked now, which wait on what, which can run in parallel]
```

**Why this file, not a longer `docs/sdd/index.md` entry**: the project-level `index.md` lists every feature in the whole project with a one-line description each — it's a directory, not a reading guide, and it shouldn't try to be one (it would grow unreadable itself). `00-index.md` is scoped to one feature, so it can afford to actually tell a reader what order to go in. `index.md` links to it; it doesn't duplicate it.

**Applies below `large` too, in a lighter form**: medium-scope work that generates 2+ documents (no tickets) doesn't get a `00-index.md` — the spec run's final chat report includes the same "how to review" ordering instead, inline, at the point the run reports what landed. A single-document task (just an FSD, or just a change file) doesn't need either — there's nothing to order.

## Where Do Tickets Live? Ask, Don't Assume

Before writing ticket files, ask — per `skills/think/elicitation/`'s "How to Ask" rule: native question tool first, plain text only as fallback: **local files only** (default — `docs/sdd/tickets/`, no external dependency) or **also mirror to GitHub Issues** (visible on the repo's board, assignable, commentable by the team).

- **The local ticket files are always the traceability SSOT — GitHub Issues, if chosen, is a mirror, never a replacement.** The matrix and `Refs:` point at `TICKET-xxx`; an issue is an additional linked surface, not a second source of truth.
- **Check the capability actually exists before promising it**: `gh auth status` and `gh repo view`. If either fails, say so and fall back to local-only — don't fake it.
- **Creating issues is a visible, external action — confirm before doing it** (same native-tool-first rule): show what will be created (titles + count) and get a yes, especially for the first batch.
- Per mirrored ticket: `gh issue create` with the ticket's title, its **full self-contained body** (same content as the local file, so the issue alone is usable), a tier label (`T1`/`T2`/`T3`), and `Refs: TICKET-xxx, FSD-xxx` in the body. **Record the issue number back in the local ticket** (`GitHub Issue: #42`) — the link goes both ways, never dangles. Commits closing the ticket may then also say `Closes #42` (see `skills/build/git-workflow/`).

## Tiers — Allocate Skill and Cost Deliberately

Tier by the ticket's **intrinsic difficulty and blast radius**, not its size in lines:

- **T1 — trivial/mechanical.** Well-bounded, one obvious way to do it, low blast radius: CRUD glue, a migration, a pure function with clear I/O, wiring an existing pattern. Safe for a junior dev or a **cheap/small model** (pairs with `skills/build/model-router/`'s CHEAP tier). A T1 ticket should read almost paint-by-numbers.
- **T2 — standard.** Some judgment, touches 2–3 components, a couple of edge cases. Most tickets land here.
- **T3 — complex/risky.** Cross-cutting, concurrency, security-sensitive, ambiguous, or hard to reverse. Senior dev or strong model, usually test-first with extra design attention. **Never hand a T3 to a cheap model unattended.** Security-control tickets (SEC-xxx) are usually T2/T3 — tier them honestly.

Summarize the tier split at the top of the breakdown (counts per tier) so the user can plan cost/staffing. When asked "how long / how much", derive a transparent estimate from the tiers — **always ranges with stated assumptions, never false precision** — and re-estimate when the tickets change.

## Working the Tickets — The Status Flow Is a Kanban

```
⬜ todo → 🔨 in progress → 🧪 testing/review → ✅ done      (⛔ blocked from anywhere)
```

1. Claim the next frontier ticket (all blockers resolved) → set 🔨.
2. Run it through the normal SDD pipeline (THINK/BUILD/PROVE) as its own task.
3. When the code + tests are written and the branch/PR is open → set 🧪. **This is the handoff state**: a review agent (or the human) picks up 🧪 tickets — the PROVE pass and review happen here, concurrent with other agents' 🔨 work.
4. Review + gates pass and the branch merges → set ✅, recompute the frontier — newly-unblocked tickets become available. Hit a real blocker → set ⛔ with a one-line reason next to it, don't sit on 🔨 silently.
5. **Update the status the moment it changes, not batched at the end** — the board (see `check-parallel-safety.mjs --board`) is only trustworthy if statuses are live. Also update the feature's status counts row in `index.md`.
6. Never work more than one ticket at a time per agent session, unless tickets are explicitly parallel-safe (no shared files, no blocking edge) and multi-agent dispatch is available.

**If mirrored to GitHub Issues**, sync status on every local change: apply a status label (`status:in-progress` / `status:testing` / `status:blocked`) and close the issue when the ticket hits ✅ (the `Closes #42` commit does this automatically at merge). The local file stays the SSOT — the labels are a mirror, updated in the same breath as the local edit, never a substitute.

## Mode Behavior

| Mode | Ticket Decomposition |
|------|----------------------|
| **prototype** | For genuinely small scope: build in one pass, no tickets. For `large` scope (new system, multi-component): still decompose into vertical slices — speed-first doesn't mean losing the ability to parallelize or track what's done vs. what's left. Tickets can be lightweight (title + one-line "what to build" + files + blockers, skip DoD/tier/traceability refs), but they exist. |
| **vibe** | Decompose silently if task is genuinely large; work tickets in sequence without showing the breakdown unless asked |
| **standard** | Show the breakdown, confirm granularity, then work tickets one at a time with progress updates |
| **strict** | Show the breakdown, require explicit approval per ticket before starting, full DoD per ticket |
| **emergency** | Skip — fix first, decompose the follow-up work later if needed |

## Rules

1. Vertical-slice by default. Layer-splitting is the exception, reserved for mechanical/wide refactors.
2. Every ticket must be independently demoable when done — if it isn't, it's not a real slice.
3. Compute and show blocking edges explicitly — don't leave dependency order implicit.
4. Confirm granularity with the user before writing ticket files — this is a judgment call, not a mechanical process.
5. Tickets are **exempt** from the no-file-paths durability rule (they die at merge) — `Files likely touched:` is required, and steps should name real files/functions. FSD/SDS/PRD keep the rule.
6. **Self-containment test**: could someone who never read the PRD finish this ticket from the ticket alone? Point at the exact spec sections that define every shape ("use the payload from FSD-003.2, don't invent it") — if executing the ticket would require guessing a field, a path, or a contract, it isn't ready.
7. Every ticket traces upward (`Refs:` an FSD, SEC, or ADR) — no freelance tickets; `check-traceability.mjs` flags them.
