---
name: design
description: Adaptively run architecture analysis and/or spec generation — and, when the work is large, automatically decompose it into vertical-slice tickets. All decided internally, nothing for the user to pick.
disable-model-invocation: true
---

# /sdd-pipeline:design

Manual entry point that adaptively runs `skills/think/arch-analyzer/SKILL.md`, `skills/build/doc-generator/SKILL.md`, and — when needed — `skills/build/ticket-decomposition/SKILL.md`, deciding internally which apply rather than making the user pick.

## What Happens When Called

1. Check whether the task involves an architecture decision (new pattern, module boundary, structural change). If yes, run architecture analysis: detect existing patterns, apply the deletion test and 1-adapter-hypothetical/2-adapter-real heuristics, propose or flag inconsistencies.
2. Check whether the task needs a functional spec (what's being built, acceptance criteria). If yes, generate one.
3. **Check the resulting scope size.** If the designed work is `large` (too big for one implementation pass), automatically decompose it into vertical-slice tickets with blocking edges — the breakdown is shown for granularity confirmation, but the user never has to know or invoke a separate "decompose" step. Small/medium scope: no tickets, straight to a single plan.
4. If several apply, run them all — one invocation covers the whole design phase.

## Output

- Architecture findings → `docs/sdd/design/` or, for multi-candidate decisions, a self-contained HTML report with confidence badges (Strong/Worth exploring/Speculative)
- Specs → `docs/sdd/design/{NNN}-{slug}-fsd.md`, `-sds.md`, or `-prd.md` as applicable — numbered, behavior-focused, each with a compact Mermaid diagram
- Database-touching work → `docs/sdd/erd/{NNN}-{slug}-erd.md`
- Large scope → tickets at `docs/sdd/tickets/{feature-slug}/` with a frontier work order, announced as: "Scope is large — split into N tickets, starting with the unblocked ones."

## Design-Only Is a Complete Deliverable

Specs, architecture, threat model, and tickets **without code** is a legitimate stop point (spec'ing for someone else, buy-in before committing engineering time) — not an unfinished run. When the user wants design only (or invoked this command without an execution signal), **actually stop** after the design artifacts: state plainly "design complete — implementation not started (by request)", and never sneak forward into BUILD. Implementation later starts from these artifacts via `/sdd-pipeline:implement`.

## Full Behavior

See `skills/think/arch-analyzer/SKILL.md`, `skills/build/doc-generator/SKILL.md`, and `skills/build/ticket-decomposition/SKILL.md` for detection signals, heuristics, formats, and slicing rules.
