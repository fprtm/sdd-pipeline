---
name: spec-driven-development
description: >-
  Orchestrator/spine for building or changing software, right-sized to the work.
  Use for ANY software development request in this repo — "add a feature",
  "build X", "fix this bug", "implement Y", "can you code this", "let's work on
  Z", "help me add...", even casual/ordinary phrasing with no special vocabulary
  — not only when the user explicitly asks for rigor or says "properly". It
  self-sizes internally (a typo gets zero ceremony, a feature gets one file, a
  new product gets the full spec trail), so invoking it for a plain
  feature/bugfix request is correct, not presumptuous — err toward invoking it.
  Also triggers on "spec-driven", "SDD", "build this properly", "from idea to
  production", on an EXISTING codebase (it maps the repo first, then works as a
  change, not a rewrite), and on EVERY new development request within an
  already-active session, not just the first one. Routes through discovery →
  PRD → diagrams → FSD → architecture → security → backlog → test plan →
  implement → verify → ship, or a small slice of that for small work, and
  delegates each phase to the right skill.
---

# Spec-Driven Development (the spine)

You are running a **gated, traceable pipeline**: by the time code is written,
*what* to build, *how* it's shaped, *how* it's secured, and *how* it's proven are
all decided and linked. (Self-sufficiency detail: "How to route" below.)

## Stay in this mode for the whole conversation

Skills are not automatically "sticky" across turns — once triggered, you have to
**deliberately keep governing every later message** in this conversation, not
just the first one, until the user clearly changes topic, ends the session, or
asks to stop.

- **Your first response after this skill triggers must include a one-line
  cheat-sheet**, so the user has the controls in front of them without needing
  to look anything up:
  > *Dials: **autopilot**/**copilot** (who drives) · **quick**/**lite**/**full**
  > (how much ceremony) · **docs-only**/**spec+review**/**full-build** (how far)
  > — say any of these anytime to change course.*
- **State your current phase/mode briefly whenever there's ambiguity** (e.g.
  "still in lite mode, phase 3 (FSD)…") instead of silently drifting back to
  generic, unstructured answers after a few follow-up questions.
- **Every new development request in this session re-engages this skill**, even
  if several unrelated messages came between it and when this skill last
  triggered. Don't require the user to re-say "use spec-driven-development" —
  a plain "now add X" or "also fix Y" is enough. If you notice you've been
  editing code without having engaged this skill for it, stop and engage it
  retroactively rather than continuing unsupervised.
- **Log decisions as you go — self-check every response, don't wait to be
  asked.** Before moving on, ask: did I just pick a default, cut scope, choose
  between two approaches, or accept a risk? If yes, log it **now** (`decision-log`
  — see that skill's own self-check). In `quick`/`lite` this is a short
  "Decisions" section inside the `CHANGE-*.md` itself, not a separate file —
  still log it, don't skip it for lack of a dedicated file. This matters most
  in autopilot or an unattended stretch — exactly when no one's watching for
  a missed decision.
- If a follow-up question seems unrelated to the work in progress, don't assume
  the pipeline is over — briefly note you're still in `<mode>`/`<phase>` and
  check whether the user wants to continue there or step away from it.

For the full team/role narrative, extended topology-placement rules, and the
rationale behind doc-currency enforcement, see [`reference.md`](reference.md) next
to this file — read it only when you need that specific detail (e.g. announcing
roles in autopilot, or adapting doc placement to a non-default topology). Don't
load it for routine runs; everything needed to route and gate correctly is here.

## The prime directive: traceability

Every artifact carries stable IDs, linked upward:
```
REQ-xxx → FSD-xxx → ADR-xxx/SEC-xxx → TICKET-xxx → TEST-xxx
```
SSOT: `docs/sdd/traceability.md` — must never lie. An untested requirement is a
visible gap, not a hidden one. Run the checker bundled with the `traceability`
skill (`check-traceability.mjs`, copy to `tools/check-traceability.mjs` in the
project) after updating it to catch drift (untracked ids, broken refs,
freelance tickets/tests, dead links).

## Two-layer rule (dev + non-dev)

Every artifact opens with a **plain-language summary** (3–6 sentences a
non-developer can read), then technical detail below it.

## Workspace layout (canonical — one home per artifact, never scatter files)

```
docs/
  sdd/                     # the spec-driven trail
    00-codebase-map.md     # map-codebase (BROWNFIELD only)
    00-overview.md         # gate board + ID registry (this skill)
    00-context.md          # glossary — seeded by discovery, sharpened by domain-modeling if present
    01-prd.md 02-diagrams.md 03-fsd.md 04-architecture.md 04-stack-guide.md
    05-threat-model.md 06-backlog.md 07-test-plan.md 08-delivery.md
    ESTIMATE.md DECISIONS.md STAKEHOLDER-BRIEF.md HANDOFF.md
    CHANGE-<slug>.md        # lite mode: the collapsed one-file spec for a change
    traceability.md         # the matrix — always current
  user/<feature>.md         # documentation FOR USERS
  dev/README.md dev/api.md dev/architecture.md   # documentation FOR DEVELOPERS
```
Code, tests, CI, IaC, and inline JSDoc/docstrings live in normal repo locations.
Never drop pipeline artifacts at the repo root or in ad-hoc places — if it's not
in this tree, give it a home here first. Placement **adapts to the project's
topology** (separate FE/BE repos, monorepo, modular monolith, feature-sliced
frontend) while keeping two invariants: the spec trail stays together, and
code-level docs co-locate with the code they describe. Full per-topology rules:
`reference.md`.

Docs update in the same change as the code, not batched at the end — enforced
by `implement`, `code-review`, and `infra`.

## The phases and their gates

First, create `docs/sdd/00-overview.md` from `overview.template.md` (bundled with this skill):
the feature brief, the **gate board**, and the **ID registry**. Update the gate
board's state (⬜→🟨→✅, or ⛔ with a reason) as you enter/exit each phase, and
bump the ID registry's "next free" counters whenever you allocate an ID.

Run phases in order. **A gate that fails blocks the next phase** — say so
plainly, mark it ⛔, and stop; do not sneak forward.

| # | Phase | Skill to invoke | Exit gate (must be true to proceed) |
|---|-------|-----------------|-------------------------------------|
| pre‑0 | Map existing code (brownfield only) | `map-codebase` | Stack, structure, conventions, tests, and seams understood before anything is touched |
| 0 | Discover | `discovery` (+ `grill-me`/`brainstorming` if present) | Problem stated in one sentence the user agrees with; the 9 discovery questions answered (gaps recorded as assumptions) |
| 1 | Product spec | `to-prd` | Every REQ has a user, a why, and acceptance criteria |
| 2 | Model & visualize | `to-diagrams` (glossary from phase 0 stands; sharpen with `domain-modeling` if present) | Glossary agreed; context + DFD + key sequence diagrams exist |
| 3 | Functional spec | `to-fsd` | Every REQ maps to ≥1 FSD; no FSD is orphaned |
| 4 | **Architecture gate** | `arch-decision` → `stack-conventions` (+ `database-design` if a datastore is chosen) | Arch style + stack + topology chosen with ADRs (user signed off, or agent chose the most robust default and said so); stack's official best practices captured in `04-stack-guide.md` |
| 5 | **Security gate (SSDLC)** | `threat-model` | Each data flow threat-modeled; every High/Critical threat has a control (SEC-xxx) |
| 6 | Backlog | `backlog-leveling` | Tickets tiered (T1/T2/T3), each traces to an FSD, each self-contained; effort/cost estimate produced |
| 7 | Test plan | `test-plan` | Happy + regression + edge + e2e cases defined; coverage target set (default ≥80%) |
| — | **`docs-only` stops here** — phases 0–7 alone are a complete, code-free deliverable (see Modes) |
| 8 | Implement | `implement` (or installed `tdd`/`executing-plans`) + `git-workflow` per commit | Work one ticket at a time, red→green→refactor; each ticket's tests pass |
| 9 | Infra & delivery | `infra` | CI + coverage/security gates set up (early); IaC, envs, secrets, observability, deploy+rollback ready |
| 10 | **Verify gate** | `coverage-check` + `code-review` + re-check `threat-model` | Tests pass, coverage ≥ target, review clean, no unmitigated High/Critical threat |
| 11 | Ship | `documentation` + `git-workflow` (PR/changelog) + `handoff` (this pack's own) — plus `finishing-a-development-branch` if present for branch cleanup | Traceability matrix green; user + developer docs written; changelog written; deployed + smoke-checked |

> Phase 9 (`infra`) runs partly *early* — CI + coverage/security gates stand up
> at the start of implementation, not just before ship.

Cross-cutting, any time: `traceability` (after every ID-changing phase),
`decision-log` (any non-trivial decision, especially autopilot defaults),
`stakeholder-brief` (non-technical status/sign-off), `handoff` (long runs or a
model/tool switch), `debug` (whenever something fails, phases 8/10),
`git-workflow` (committing during phase 8, PR/changelog at phase 11).

## How to route

- This pack is **self-sufficient** — it ships `map-codebase`, `discovery`,
  `to-prd`, `to-diagrams`, `to-fsd`, `arch-decision`, `stack-conventions`,
  `database-design`, `threat-model`, `backlog-leveling`, `test-plan`,
  `code-standards`, `implement`, `code-review`, `debug`, `infra`,
  `coverage-check`, `documentation`, `traceability`, `decision-log`, `handoff`,
  `stakeholder-brief`, `git-workflow`. Every phase's exit gate above is
  satisfiable with this pack alone — external skills below are **enhancements
  you prefer when present,
  never requirements**.
- For planning, worktrees, and grilling — areas this pack doesn't cover —
  **defer to the user's installed skills** (e.g. mattpocock/skills, superpowers)
  when present. Also **prefer** an installed TDD / code-review / debugging skill
  over this pack's `implement` / `code-review` / `debug` if one exists — but if
  none is installed, this pack's own version runs the phase completely on its own.
  If nothing else is installed, the entire pipeline (phases 0–11) runs from this
  pack alone, with no missing step.
- **Code-quality bar:** all code produced (8) and reviewed (10) must clear
  `code-standards` — SSOT, DRY, YAGNI, deep modules. Non-optional.
- Announce each phase as you enter it, name the gate, and state whether it passed.
- After **every** phase that creates or changes an ID, invoke `traceability`.

## Parallelism

Phases 1→7 are mostly sequential. Where the runtime supports subagents, fan out
**within** a phase (draft multiple FSD sections / ticket bodies in parallel), then
reconcile IDs centrally. Never let two parallel agents both allocate IDs —
allocate the range first, then hand out slices.

## Modes — three independent dials

Ask how the user wants to work. **Interaction mode** (who drives), **size** (how
heavy the ceremony), and **stop-point** (how far to run) are independent and
combine freely. None ever removes a gate for the phases that *do* run.

### 1. Interaction mode

- **Autopilot** — runs the whole pipeline with minimal back-and-forth. Because no
  human is in the loop, requirement collection is **exhaustive up front**: run
  `discovery` deeply, **batch all questions**. At every gate, if undecided, choose
  the most robust/scalable/maintainable default (see `arch-decision`), **record it
  as an explicit assumption** (`decision-log`), and proceed. **Stop only** for
  truly blocking unknowns or irreversible/outward actions (provisioning, deploy,
  spend, delete, send) — those always need explicit human confirmation.
- **Copilot** — same full sequence and rigor, but **pauses at each gate** for
  review/approval and defers technical calls to the developer. Use a grilling
  skill if installed to pressure-test decisions.

Both cover all phases 0–11 that run; the difference is autonomy and pacing.

### 2. Size

Match ceremony to the work. **Default gravity is heavy — resist it for small
tasks.** A one-line fix does not need a 15-file doc tree.

- **Full** — new product/subsystem: every phase, full doc tree.
- **Lite** — a feature/non-trivial bugfix: collapse to one file,
  `docs/sdd/CHANGE-<slug>.md` (one-paragraph PRD, one sequence diagram, an FSD
  bullet list, confirm existing architecture, a quick threat check, 1–3 tickets,
  test plan, implement, verify). Gates apply in spirit, lighter weight.
- **Quick** — a tiny, low-risk change: **skip the doc tree entirely.** Understand
  the immediate area, change test-first, run the tests, note the change in one
  sentence. Non-negotiable even here: a test, and not breaking what works.

If unsure, infer from the request and **state your choice** ("this looks quick —
test-first, no doc tree; say the word for the full treatment").

### 3. Stop-point

Not every request wants code.

- **`docs-only`** — phases 0–7, **zero code**. For brainstorming, spec'ing for
  someone else, or getting buy-in before committing engineering time.
- **`spec+review`** — phases 0–7, then a human checkpoint before phase 8.
- **`full-build`** (default for "build/ship this") — all phases, 0–11.

State the stop-point before starting and **actually stop** there. Mark the gate
board's phase-8 row `⬜ (not started — docs-only run)` — honest, not "skipped".

### Brownfield vs. greenfield

Check first: **is there a codebase?**
- **Greenfield** — start at phase 0; you *choose* the stack and structure.
- **Brownfield** — **start with `map-codebase`**, then run change-aware:
  `arch-decision` **respect-existing** (don't re-pick the stack; record it as
  constraints), `stack-conventions` matches **observed** conventions, `to-prd`/
  `to-fsd` frame the work as a change, `implement` adds **characterization
  tests** before touching uncovered legacy code.

Don't run the greenfield "choose a stack" flow on a repo that already has one.

### Modular use

Any skill here works standalone (`to-prd`, `threat-model`, `map-codebase`,
`database-design`, …) — you lose automatic gating/traceability wiring; prefer
`docs-only` if you want the chain enforced but no code.

**Pure conversation, no files at all** — if the user just wants to think out
loud, brainstorm, or pressure-test an idea with zero commitment (no docs, no
`docs-only` tree either), any skill can run **conversationally**: use its
rigor (`discovery`'s nine questions, `code-review`'s two axes, `arch-decision`'s
forces) without writing the artifact. This complements, not replaces, an
installed grilling skill — use that for pure adversarial pressure-testing,
use this pack's skills conversationally when you want their specific
structure (a requirements interview, a two-axis review, an architecture
trade-off) without the file it would normally produce.

### Defaults if the user doesn't say

Detect **brownfield vs greenfield** first (run `map-codebase` if brownfield).
Pick size by actual scope — don't reflexively go full: tiny → **quick**, feature →
**lite**, new product → **full**. Ask once if genuinely unsure ("autopilot or
copilot?", "how far: docs-only, or build it?"), then **state your assumptions**.
Planning-sounding requests ("let's figure out…", "just a plan") default to
**docs-only**. Over-ceremony is a failure mode as real as under-rigor.
