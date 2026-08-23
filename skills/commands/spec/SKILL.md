---
name: spec
description: Turn a settled decision into written specs — architecture analysis, FSD/SDS/PRD/ERD, threat model, UX, and (when large) vertical-slice tickets. Runs step by step, announcing and confirming each one. This is the SPEC step of the pipeline, not visual/UI design.
disable-model-invocation: true
---

# /sdd-pipeline:spec

Manual entry point to the **SPEC step** of the fixed sequence (`ASK → SPEC → PLAN → BUILD → CHECK`). Adaptively runs `skills/think/arch-analyzer/SKILL.md`, `skills/build/doc-generator/SKILL.md`, `skills/think/threat-model/SKILL.md`, `skills/think/ux-design/SKILL.md` (when there's a UI), and — when needed — `skills/build/ticket-decomposition/SKILL.md`, deciding internally which apply rather than making the user pick.

> **Why this isn't called `/design`.** "Design" reads as *visual/UI design* to most people, and this command's main job is written specs (FSD/SDS/PRD/ERD/threat model). Visual design is one optional part of it, handled by `skills/think/ux-design/` — and when that part runs, it produces its own `docs/sdd/design-system/design.md`, which is what someone asking for "the design doc" actually means. Same-shaped words, two different artifacts; the command name now says which one it is.

## Run It Step by Step — Never One Silent Batch

This command can produce a dozen files. Emitting them all at once and only then showing the user gives them a wall of finished artifacts built on assumptions they never got to correct — every wrong assumption at step 1 is baked into everything after it. **The steps below run one at a time, each announced before it runs and confirmed after it lands.**

Before starting, announce the plan for the run itself:

```
SPEC run — [N] steps for this task:
  1. Architecture analysis        4. Threat model
  2. UX design (has screens)      5. Test-relevant docs (DoD)
  3. Specs: PRD + FSD ×3          6. Ticket decomposition (scope is large)
Starting step 1.
```

Then, for **every** step:

1. **Announce before**: `Step 3/6 — Specs. Writing PRD-001 + FSD-003/004/005.` Say what's about to be written and why that doc type.
2. **Run the step.**
3. **Report after**: what landed (filenames), the decisions the step made that the user didn't explicitly state, and anything it had to assume.
4. **Check in before the next step** — per `skills/think/elicitation/`'s "How to Ask" rule (native question tool first, plain text fallback). Not a ceremonial "shall I continue?": ask about the *specific* forks this step opened. If the step surfaced no real fork, say so in one line and continue without a question — a checkpoint with nothing to decide is ceremony, and this framework doesn't add ceremony for its own sake.

**Ask, don't assume, at the moments that matter.** These are the forks that must reach the user rather than being silently resolved, because getting them wrong invalidates everything downstream:

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

| Mode | Step behavior |
|------|---------------|
| **prototype** | Run straight through, announce steps only, no checkpoints |
| **vibe** | Announce steps, batch the artifacts, one summary at the end; ask only on a fork from the table above |
| **standard** | Full step protocol: announce → run → report → check in on real forks |
| **strict** | Full protocol + explicit approval required between steps, not just a check-in |
| **emergency** | Not applicable — emergency skips SPEC entirely |

## What Happens When Called

0. **If a `/sdd-pipeline:discover` (or an in-conversation grill) session just settled the architecture/scope question this task needs**, this is exactly the hand-off point — build the spec from that shared understanding instead of re-running architecture analysis or scope questions from scratch. Check `docs/sdd/glossary.md` and `docs/sdd/decisions/` for anything the session just wrote; don't re-ask what's already settled.
1. Check whether the task involves an architecture decision (new pattern, module boundary, structural change). If yes, run architecture analysis: detect existing patterns, apply the deletion test and 1-adapter-hypothetical/2-adapter-real heuristics, propose or flag inconsistencies.
2. **Check whether the product has screens.** If yes, run `skills/think/ux-design/SKILL.md` — direction confirmed with a concrete preview *before* anything is written, and the run produces `docs/sdd/design-system/design.md` as the one entry doc for the UI.
3. Check whether the task needs a functional spec (what's being built, acceptance criteria). If yes, generate one.
4. **Check the resulting scope size.** If the designed work is `large` (too big for one implementation pass), automatically decompose it into vertical-slice tickets with blocking edges — the breakdown is shown for granularity confirmation, but the user never has to know or invoke a separate "decompose" step. Small/medium scope: no tickets, straight to a single plan.
5. If several apply, run them all — one invocation covers the whole SPEC step, one step at a time.

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
