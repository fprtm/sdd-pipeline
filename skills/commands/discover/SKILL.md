---
name: discover
description: Product discovery — take an idea from fog to settled decisions before anything is written. Opens as conversation when the idea is still vague, then shifts into a seat-by-seat interrogation (why, constraints, what, data, technical) with council review. Absorbs what used to be a separate brainstorm command.
disable-model-invocation: true
---

# /sdd-pipeline:discover

The ASK step of the fixed sequence (`ASK → SPEC → PLAN → BUILD → CHECK`), and the widest part of this framework by design.

**Why it's this big.** AI writes code several times faster than a human can review it, so review is the bottleneck — and you don't beat a bottleneck by reviewing faster. You beat it by making fewer decisions *need* reviewing. A decision settled here costs a sentence. The same decision discovered after code exists costs a migration, a refactor, and a review nobody has capacity for. This command exists to move decisions to where they're cheap.

**What it does not do.** Discovery moves *decision* risk, not *execution* risk. It will not prevent a race condition, an off-by-one, or a hallucinated API — those stay the judgment gate's problem in PROVE. Don't let a thorough discovery become an argument for a thinner CHECK.

## Two Gears — Shifted Automatically, Announced Out Loud

An idea arrives in one of two states, and the user should never have to declare which:

**Gear 1 — DIVERGE** (the idea is still fog). Open conversation, not interrogation. Curious questions one or two at a time, woven into discussion. Research on demand — does this exist, how do others solve it, is it feasible — brought back into the conversation so the user never has to go check something themselves. **Contribute genuine takes**: "this half already exists as X, the novel part is Y", "the hard part will be Z". A partner with no opinions is a mirror. Devil's advocate stays **off** unless asked — attacking a half-formed idea kills it before it has a shape worth attacking. Nothing is written in this gear.

**Gear 2 — CONVERGE** (there's a shape worth deciding about). Seat-by-seat interrogation using the frontier/round mechanic in `skills/think/grill/SKILL.md`, adversarial toward the user's premises *and* its own recommendations, council pass at the end. This gear writes glossary terms and ADRs.

**Shift when**: the idea can be stated in two sentences without hedging, and the open questions have turned from "what even is this" into "which way do we do this". **Announce the shift** — "Oke, idenya udah cukup berbentuk. Mulai masuk keputusan sekarang." That moment used to be an invisible boundary between two separate commands; making it visible is half the point of merging them.

Entering directly in Gear 2 is normal — a user who already knows what they're building shouldn't sit through a warm-up. Dropping *back* to Gear 1 is allowed too: if a seat reveals the idea wasn't as settled as it looked, say so and go back to talking.

## The Five Seats

Gear 2 works through five seats, in dependency order. A seat earns its place by holding decisions that **only the user can supply** and that are **expensive to reverse once code exists**. Anything the agent can look up is not a question — it's research (see grill's Facts vs Decisions rule).

| # | Seat | What gets settled |
|---|------|-------------------|
| 1 | **Why** | The problem, who has it, and **what would count as this working** — the success measure is the operational definition of the goal, so it belongs here, not in a separate analytics conversation |
| 2 | **Constraints** | Budget, deadline, who maintains this at 2am, systems already in place, what data is sensitive and which regulatory regime applies |
| 3 | **What** | Scope: in v1 vs deferred. The main flows. UI direction |
| 4 | **Data** | The entities the business actually distinguishes, and how they're stored |
| 5 | **Technical** | Architecture and stack — the agent recommends from its own decision matrix, the user carries the consequence (team size, familiarity, hosting, cost) |

**A seat is skipped only when the product has no such surface** — no screens, the UI half of seat 3 disappears; no persistent data, seat 4 disappears. Say which seat was skipped and why, in one line. **A seat is never skipped because of mode, task size, or urgency.** Depth per seat scales; coverage does not.

**Every question carries a recommendation** (grill's `➡️` format). This is what makes five seats survivable rather than an interrogation: when the user agrees, answering is one keystroke; when they don't, that's exactly where the conversation was worth having. A seat with no recommendations is an intake form.

**Order is dependency, not ceremony**: *why → limited by what → what → what data → built how*. A question whose answer depends on an unsettled earlier seat waits for a later round.

## Council — Twice, For Different Reasons

1. **Per decision**, as today: any decision passing the rule-of-three bar (hard to reverse + surprising + real trade-off) gets the five council seats (devil's advocate · maintainer-a-year-later · security · the bill · the end user) before it closes. See grill's Council section.
2. **Once over the whole picture**, before the session ends. Per-decision councils never see how decisions *interact* — each one can be individually sensible while the combination is a v1 twice the size anyone intended. This pass asks one question: *given everything settled above, is this shape actually buildable by whoever is building it, in the time and budget from seat 2?* An objection here reshapes scope or gets an explicit, logged acceptance.

## Output

- New domain terms → `docs/sdd/glossary.md`, written live, not batched
- Decisions passing the rule-of-three gate → `docs/sdd/decisions/{NNN}-{slug}.md`
- **Optional idea brief**, only if the user wants to keep a Gear-1 result: `docs/sdd/specs/{NNN}-{slug}/idea.md` (the idea in two sentences · what makes it interesting · prior art found · fog that remains · hard parts spotted early). Unprompted, produce nothing.
- **No plan, no spec, no FSD.** Those belong to `/sdd-pipeline:spec`.

**Nothing is forced.** A session that ends "this idea isn't worth it," or just trails off, succeeded. Never steer toward "so, ready to build?" — the ADRs and glossary that already passed their gates persist either way.

## Boundary — WHICH, Not HOW

Discover settles **WHICH**: which entities exist, which architecture approach, which stack, which flows are in v1. It does **not** settle **HOW**: how entities relate in detail, which code patterns apply, what cascade behavior to use, what interaction states each screen has. Those are design decisions that belong to the SPEC step's deliberation — where each think/ skill has a deliberation agenda that gets grilled before its document is written.

The reason for the split: discover operates before the shape is firm enough to make detailed design decisions. Choosing cascade behavior when the entity model isn't settled yet is premature. But by the time spec runs, the entities, the stack, and the scope are settled — and now detailed design decisions have enough foundation to be meaningful.

**This means discover is not the only place decisions get made.** Spec's deliberation is equally rigorous — same grill mechanics, same recommendations, same council on hard decisions. The difference is scope: discover settles the product's shape, spec's deliberation settles each domain's design detail within that shape.

## Hand-off

When the user signals they want to build ("oke gua mau seriusin ini", "let's do it"), the next step is `/sdd-pipeline:spec` — where settled decisions become PRD/SDS/FSD/ERD and, for large work, tickets. Never suggest `/sdd-pipeline:implement` from here: discover produces decisions, not a plan or spec, and jumping there skips the step spec exists for.

**Everything settled here is not re-asked.** `spec` and `elicitation` read `docs/sdd/glossary.md` and `docs/sdd/decisions/` and build from what's already agreed. A user answering the same question twice is a bug.

## Mode Interaction

Mode dials **how deep each seat goes**, never **which seats exist**:

| Mode | Behavior |
|------|----------|
| **prototype** | One round per relevant seat, recommendations accepted by default unless the user objects. Fast, but every seat still gets asked. |
| **vibe** | Same as prototype, plus: no council unless a decision is genuinely hard to reverse. |
| **standard** | Full frontier rounds per seat, both council passes. |
| **strict** | Full rounds + explicit confirmation per seat before moving to the next. |
| **emergency** | Not applicable — an outage is not the time for discovery. Fix first; run this afterward if the fix revealed a real design question. |

## Full Behavior

`skills/think/grill/SKILL.md` — the frontier/round mechanic, adversarial stance, recommendation sources, council seats, and the facts-vs-decisions rule.
