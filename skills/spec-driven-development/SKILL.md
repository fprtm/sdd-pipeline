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
  "Decisions" section inside the `changes/<topic>.md` itself, not a separate file —
  still log it, don't skip it for lack of a dedicated file. This matters most
  in autopilot or an unattended stretch — exactly when no one's watching for
  a missed decision.
- If a follow-up question seems unrelated to the work in progress, don't assume
  the pipeline is over — briefly note you're still in `<mode>`/`<phase>` and
  check whether the user wants to continue there or step away from it.
- **Keep a live task list in your platform's native to-do tool.** Mirror the
  gate board / open tickets into it and update status as you go — phase entered,
  ticket red→green, gate passed. It's the at-a-glance state for you and the user,
  and it survives a context switch better than prose. Derive it from what's
  written (`00-overview.md` / the `changes/<topic>.md`), and keep the two in sync.

## Read state, then ask — don't guess

Before acting, **read the existing state** — this project's `docs/sdd/` if any,
**and the actual code for the specific area under discussion**. `map-codebase`'s
first pass is deliberately shallow outside the touch area; that's no excuse to
stay shallow. **Every time a new topic/file/feature comes up, read its real code
before discussing, deciding, or changing it** — docs and your own earlier summary
both drift from what the code does; the code is ground truth, and guessing wastes
the user's time. Then, for anything **consequential the state doesn't already
answer**, **ask rather than assume** — always in `copilot`; in `autopilot`, for
anything blocking/irreversible (routine unknowns get batched into a recorded
default, but a genuinely consequential unknown still gets asked).

**Whenever you ask, brainstorm, or seek confirmation, use your platform's native
structured question tool** (a multiple-choice / quick-select UI) — not a
plain-text question buried in prose. It's faster to answer, batches cleanly for
autopilot's "ask once" rule, and makes the choice explicit. Only fall back to a
plain question when no such tool exists in the runtime.

For the full team/role narrative, extended topology-placement rules, and the
rationale behind doc-currency enforcement, see [`reference.md`](reference.md) next
to this file — read it only when you need that specific detail (e.g. announcing
roles in autopilot, or adapting doc placement to a non-default topology). Don't
load it for routine runs; everything needed to route and gate correctly is here.

## Project setup (do this once per project, first time you engage here)

Two small, high-leverage setup steps — they're what make later sessions cheap
and reliable:

1. **Point the project's agent-config file at this skill and its memory.** Check
   `CLAUDE.md` (Claude Code) or `AGENTS.md` (other agents) at the repo root. If
   it does **not** already tell the agent to use `spec-driven-development` and to
   read `docs/sdd/memory/INDEX.md` first, **add a short pointer** (create the
   file if absent). This is mandatory — it's the one lever that reliably makes
   the pipeline get used every session instead of only when the description
   happens to match. Tell the user you added it. A minimal pointer:
   > `## Development process` — For any feature/bugfix/dev work, use the
   > `spec-driven-development` skill (it right-sizes itself). At the start of a
   > session on existing work, read `docs/sdd/memory/INDEX.md` and the relevant
   > memory notes, and the current `docs/sdd/` state, before acting.
2. **Read memory first if it exists.** `docs/sdd/memory/INDEX.md` + the few notes
   relevant to the task (see `project-memory`) — cheaper than re-scanning the
   repo. Grow it as you learn.

## Explain what you decide or propose

Whenever you **propose** an approach or **make** a call the user didn't
explicitly specify, say — briefly, in the moment, not buried in a doc — **what**
you're proposing, **why** it's better, and **the main alternative you're not
taking**. "I'll use X because Y; the other option was Z, rejected because W." A
user should never watch a decision go by without being told the reasoning, and
this feeds `decision-log` directly.

## Work efficiently — token / memory / context are first-class

This is a **framework for agentic development**, and an agent's budget is its
context window and token cost. Treat them as a resource to protect, not spend
freely:

- **Read the minimum that answers the question.** `memory/INDEX.md` + the few
  relevant notes, then a *targeted* read of only the code under discussion — not
  a whole-repo scan, not a whole file when a function will do. That is the entire
  point of `project-memory`: pay once to seed it, then stay cheap.
- **Don't re-read what you already have** this session, and don't reload a
  companion `reference.md` for routine runs — only when its specific detail is
  needed.
- **Right-size the output.** `quick`/`lite` exist so a small task doesn't emit a
  15-file trail; honor them. Fewer, denser words beat a wall of prose.
- **On long runs**, use `handoff` to compact state so a fresh (or cheaper)
  session continues from a small snapshot instead of re-deriving everything.

Cheap-and-correct beats thorough-but-wasteful; a lean context is also a more
reliable one.

## Make it comfortable to use, not just correct

Ease-of-use is a feature, not an afterthought — it's why the pack gets adopted.
On first engagement: confirm which "door" the user wants (**just build/fix it**
vs **drive it step by step** — see the README's "Start here"), state your dials
in one line, and get to their goal. Don't front-load ceremony, don't make them
read docs to proceed. Keep turns focused and human — the experience should feel
like a capable teammate, not a form to fill in.

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

## Write for the next reader — a different session, human or AI

Specs are read far more than written, usually by **someone without your current
context** (a later session, a cheaper model, a teammate). Write for them:

- **Split by concern — never one giant file.** One topic per file (topic-scoping
  / `changes/<topic>.md`); within a file, short scannable sections with stable
  IDs. A reader should find the one thing they need without reading the rest.
- **To the point.** State the spec/decision and its *why*; cut restatement and
  filler. Dense and skimmable beats long. Drop any section that isn't load-bearing.
- **Self-contained.** Each file makes sense cold — link *up* the traceability
  chain instead of copying context, but name its own subject so a reader landing
  there isn't lost.

Test: could a fresh session open this file and act correctly in a minute, without
re-reading the whole trail? If not, tighten it.

## Workspace layout (canonical — one home per artifact, never scatter files)

```
docs/
  sdd/                     # the spec-driven trail
    00-codebase-map.md     # map-codebase (BROWNFIELD only)
    00-overview.md         # gate board + ID registry (this skill)
    00-context.md          # glossary — seeded by discovery, sharpened by domain-modeling if present
    01-prd.md 02-diagrams.md 03-fsd.md
    04-architecture.md 04-stack-guide.md 04-schema.md 04-ux-design.md   # design phase
    05-threat-model.md 06-backlog.md 07-test-plan.md 08-delivery.md
    analytics.md            # analytics-design (metrics/events)
    decisions/              # decision-log — one timestamped file per decision
    memory/                 # project-memory — INDEX.md + linked notes (Obsidian-style graph)
    ESTIMATE.md STAKEHOLDER-BRIEF.md HANDOFF.md
    changes/                # lite mode: one <topic>.md per feature/fix (NOT appended to the numbered trail)
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

**Before anything else, check whether `docs/sdd/` already exists.** If it does,
**read** `00-overview.md` (gate board), `traceability.md`, `decisions/`, and
`memory/INDEX.md`
first — that's the real state of the project. Resume from there; don't restart,
re-ask what's already answered, or assume phase 0 just because a new session
started. If nothing exists yet, **then** create `docs/sdd/00-overview.md` from
`overview.template.md` (bundled with this skill): the feature brief, the **gate
board**, and the **ID registry**. Update the gate board's state (⬜→🟨→✅, or ⛔
with a reason) as you enter/exit each phase, and bump the ID registry's
"next free" counters whenever you allocate an ID.

Run phases in order. **A gate that fails blocks the next phase** — say so
plainly, mark it ⛔, and stop; do not sneak forward.

**Definition of Done is explicit, always.** Every phase's exit-gate cell below
*is* its DoD; every ticket carries its own (acceptance criteria met + its
TEST-xxx green + traceability + docs updated). Nothing is "done" until its DoD is
checked — `quick`/`lite` included (a quick fix's DoD: test written, tests green,
change noted). State the DoD up front, then tick it off; don't leave "done" to feel.

| # | Phase | Skill to invoke | Exit gate (must be true to proceed) |
|---|-------|-----------------|-------------------------------------|
| pre‑0 | Map existing code (brownfield only) | `map-codebase` | Stack, structure, conventions, tests, and seams understood before anything is touched |
| 0 | Discover | `discovery` (+ `grill-me`/`brainstorming` if present) | Problem stated in one sentence the user agrees with; the 9 discovery questions answered (gaps recorded as assumptions) |
| 1 | Product spec | `to-prd` (+ `analytics-design` for success metrics) | Every REQ has a user, a why, and acceptance criteria |
| 2 | Model & visualize | `to-diagrams` (glossary from phase 0 stands; sharpen with `domain-modeling` if present) | Glossary agreed; context + DFD + key sequence diagrams exist |
| 3 | Functional spec | `to-fsd` | Every REQ maps to ≥1 FSD; no FSD is orphaned |
| 4 | **Architecture & Design gate** | `arch-decision` → `stack-conventions` → `database-design` (whenever data is persisted — mandatory, not optional) → `ux-design` (whenever there's a UI) | Arch/stack/topology chosen with ADRs; **data model** written to `04-schema.md` if the app stores data; **UI/UX design** (tokens, key screens, states, a11y) in `04-ux-design.md` if there's a UI. A data app with no schema, or a UI product with no design, does NOT pass this gate. |
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
`project-memory` (record durable codebase knowledge as you learn it; read it
first next session), `stakeholder-brief` (non-technical status/sign-off),
`handoff` (long runs or a model/tool switch), `debug` (whenever something fails,
phases 8/10), `git-workflow` (committing during phase 8, PR/changelog at
phase 11).

## How to route

- This pack is **self-sufficient** — it ships `map-codebase`, `discovery`,
  `to-prd`, `analytics-design`, `to-diagrams`, `to-fsd`, `arch-decision`,
  `stack-conventions`, `database-design`, `ux-design`, `threat-model`,
  `backlog-leveling`, `test-plan`, `code-standards`, `implement`, `code-review`,
  `debug`, `infra`, `coverage-check`, `documentation`, `traceability`,
  `decision-log`, `project-memory`, `handoff`, `stakeholder-brief`,
  `git-workflow`. Every phase's exit gate above is satisfiable with this pack
  alone — external skills below are **enhancements you prefer when present,
  never requirements**.
- For planning, worktrees, and grilling — areas this pack doesn't cover —
  **defer to the user's installed skills** (e.g. mattpocock/skills, superpowers)
  when present. Also **prefer** an installed TDD / code-review / debugging skill
  over this pack's `implement` / `code-review` / `debug` if one exists — but if
  none is installed, this pack's own version runs the phase completely on its own.
  If nothing else is installed, the entire pipeline (phases 0–11) runs from this
  pack alone, with no missing step.
- **Code-quality bar — always, every mode and size.** All code must clear
  `code-standards` (SSOT, DRY, YAGNI, deep modules) and stay **in scope** (the
  smallest change that satisfies the ticket — the "lazy-senior" rule in
  `implement`) and **readable** (a reviewer or a cheaper model can follow it).
  `quick`/`lite` reduce *ceremony*, never *code quality or scope discipline* —
  a one-line-fix's diff is held to the same bar as a full build's.
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

- **Copilot — this is a real behavioral contract, not a label you announce
  once.** It means: do **one phase (or one gate's worth of decisions) at a time,
  then STOP and hand control back.** Concretely, every turn in copilot:
  1. Produce **only the current phase's** output (or, at an architecture/design
     decision, present the 2–3 options with a recommendation).
  2. **Then stop.** End your turn by naming the decision the user needs to make
     or approve, and **wait for their reply.** Do **not** roll on into the next
     phase, do not start implementing, do not produce the rest of the trail "to
     save a round-trip." Producing several phases in one turn is autopilot
     behavior — it is a bug in copilot.
  3. Offer choices to *pick from*, don't announce a choice already made. "Here
     are the options / here's my recommendation — which do you want?" not "I've
     decided X, moving on."

  If you catch yourself having generated more than the current phase without the
  user replying in between, you've slipped into autopilot — stop and correct.

Both cover all phases 0–11 that run; the difference is **who is driving each
step** — autopilot drives itself and reports; copilot produces one step and
waits. That difference must be *felt* every turn, not just stated at the start.

### 2. Size

Match ceremony to the work. **Default gravity is heavy — resist it for small
tasks.** A one-line fix does not need a 15-file doc tree.

- **Full** — a new product/subsystem, built as one coherent whole: the numbered
  `docs/sdd/` trail (`01-prd.md`, `03-fsd.md`, `04-schema.md`, …). Fixed
  filenames are right here because it's *one* product.
- **Lite** — a feature or non-trivial change to an existing app: **its own
  topic-scoped file**, `docs/sdd/changes/<topic-slug>.md` (e.g.
  `changes/bter-reminder.md`) — a self-contained mini-trail (one-paragraph PRD,
  one sequence diagram, an FSD bullet list, confirm existing architecture, a
  quick threat check, 1–3 tickets, test plan). **Do NOT append to the global
  numbered trail for per-feature work** — appending each feature's spec into a
  shared `03-fsd.md` is exactly how those files balloon. One topic = one file in
  `changes/`. Update `traceability.md` only if the project keeps one.
- **Quick** — a tiny, low-risk change: **skip the doc tree entirely.** Understand
  the immediate area, change test-first, run the tests, note the change in one
  sentence (a commit message, or a decision file if something was locked).
  Non-negotiable even here: a test, and not breaking what works.

**Topic-scoping (why `changes/` and `decisions/` are folders):** anything that
recurs — features, fixes, decisions, memory notes — lives as **one file per
topic in a folder**, not appended to an ever-growing shared file. The numbered
trail is the exception, reserved for a single cohesive product build.

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

### Modular use — which skill for which job (invoke it directly)

You don't have to run the whole pipeline. Each skill works **standalone**, and
for a focused job that's often the nicest way — point the agent at exactly the
one you want, like reaching for a single tool. Clear map:

| You want to… | Use (standalone) |
|--------------|------------------|
| **Brainstorm / pressure-test an idea** | `discovery` conversationally, or an installed grilling skill |
| **Understand an unfamiliar repo** | `map-codebase` |
| **Write just the requirements** | `to-prd` |
| **Draw the flows/diagrams** | `to-diagrams` |
| **Write just the functional spec** | `to-fsd` |
| **Decide architecture / stack / structure** | `arch-decision` |
| **Design the DB schema** | `database-design` |
| **Design the UI / design system** | `ux-design` |
| **Threat-model a flow** | `threat-model` |
| **Break work into tickets / estimate** | `backlog-leveling` |
| **Write the test plan** | `test-plan` |
| **Implement a ticket, test-first** | `implement` (or an installed TDD skill) |
| **Fix a bug** | `debug` |
| **Review a diff** | `code-review` |
| **Commit / open a PR** | `git-workflow` |
| **Record a decision** | `decision-log` |
| **Remember something about the codebase** | `project-memory` |
| **Update this pack to the latest release** | `self-update` |

Invoking one directly loses the automatic gating/traceability wiring — that's
the trade for speed. If you want the chain enforced but no code, use `docs-only`
instead. For a small feature/fix, `lite` (one `changes/<topic>.md`) is usually
the sweet spot between "one raw skill" and "the full trail."

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
