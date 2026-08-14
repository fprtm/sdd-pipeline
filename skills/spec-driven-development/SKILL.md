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
all decided and linked.

`reference.md` next to this file holds elaboration — the team/role narrative,
per-topology doc placement, doc-currency rationale, the full skill roster, and the
verbatim setup pointer. Read it **on demand only**; everything needed to route and
gate correctly is here.

## Stay engaged the whole conversation

Skills aren't sticky across turns — **keep governing every later message** until
the user clearly changes topic, ends the session, or asks to stop.

- **Your first response must include a one-line cheat-sheet:**
  > *Dials: **autopilot**/**copilot** (who drives) · **quick**/**lite**/**full**
  > (ceremony) · **docs-only**/**spec+review**/**full-build** (how far) — say any
  > of these anytime to change course.*
- **State your phase/mode when there's ambiguity** ("still lite, phase 3 (FSD)…")
  instead of drifting back to generic, unstructured answers.
- **Every new development request re-engages this skill** — even after unrelated
  messages; a plain "now add X" or "also fix Y" is enough. If you've been editing
  code without engaging it, stop and engage retroactively.
- **Log decisions as you go** — self-check each response: did I pick a default,
  cut scope, choose between approaches, or accept a risk? If yes, log it now
  (`decision-log`). In `quick`/`lite` that's a short inline "Decisions" note in the
  `changes/…` file, not skipped for lack of a dedicated file.
- **Keep a live to-do list in your platform's native to-do tool, updated the
  moment state actually changes** (ticket started, criterion green, ticket
  done, new work found) — not batched to end-of-turn. A stale entry is worse
  than none; see `implement`'s "Keep the trail honest as you go".

## Read state, then ask — don't guess

Before acting, **read the existing state**: this project's `docs/sdd/` if any,
**and the actual code for the area under discussion** — every new topic/file/
feature gets its real code read before you discuss, decide, or change it. Docs and
your own earlier summary drift; the code is ground truth, and guessing wastes the
user's time. Then, for anything **consequential the state doesn't answer, ask
rather than assume** — always in `copilot`; in `autopilot` only for blocking/
irreversible points (routine unknowns batch into a recorded default).

**When you ask, brainstorm, or seek confirmation, use your platform's native
structured-question tool** (quick-select UI), not a plain-text question buried in
prose — fall back to plain text only when the runtime has none.

## Project setup (once per project, first time you engage)

1. **Point the repo's `CLAUDE.md`/`AGENTS.md` at this skill + memory.** If it
   doesn't already tell the agent to use `spec-driven-development` and read
   `docs/sdd/memory/INDEX.md` first, **add a short pointer** (create the file if
   absent) and tell the user. Mandatory — it's the one lever that makes the
   pipeline run every session, not only when the description happens to match.
   (Verbatim pointer text: `reference.md`.)
2. **Read memory first if it exists** — `memory/INDEX.md` + the few relevant notes
   (`project-memory`), cheaper than re-scanning the repo.

## Explain what you decide or propose

When you propose an approach or make a call the user didn't specify, say — in the
moment, not buried in a doc — **what**, **why it's better**, and **the main
alternative rejected**. Feeds `decision-log` directly.

## Work efficiently — context / tokens are first-class

- **Read the minimum:** `memory/INDEX.md` + relevant notes + a *targeted* read of
  the code under discussion — not a whole-repo scan, not a whole file when a
  function will do. That's the point of `project-memory`: seed once, stay cheap.
- **Don't re-read** what you already have this session; don't reload `reference.md`
  for routine runs.
- **Right-size output** — `quick`/`lite` exist so a small task doesn't emit a
  15-file trail. Fewer, denser words beat a wall of prose.
- **Long runs:** use `handoff` to compact state for a fresh/cheaper session.

## Make it comfortable — and match depth to the audience

Confirm which "door" the user wants (**just build/fix it** vs **drive it step by
step** — README's "Start here"), state your dials in one line, and get to their
goal. Don't front-load ceremony or make them read docs to proceed — feel like a
teammate, not a form.

**Depth by audience:** basic, plain questions are right for the non-dev "just build
it" door — don't drown them in UX/architecture talk. But on the **developer door**,
or when a change **genuinely touches UI or architecture** (a new screen, a
data-model change, a new integration), proactively raise the UX/architecture
decisions (phase-4 gate) instead of staying basic.

## Prime directive — traceability

Stable IDs linked upward: `REQ → FSD → ADR/SEC → TICKET → TEST`. SSOT is
`docs/sdd/traceability.md` — it must never lie; an untested requirement is a
visible gap, not a hidden one. Run the checker bundled with `traceability`
(`check-traceability.mjs`, copied to `tools/` in the project) after updating it, to
catch drift (untracked ids, broken refs, freelance tickets/tests, dead links).

## Write for the next reader — a different session, human or AI

- **Two-layer:** every artifact opens with a **plain-language summary** (3–6
  sentences a non-developer can read), then technical detail below.
- **Split by concern** — one topic per file, short scannable sections with stable
  IDs; **to the point** (cut restatement and filler); **self-contained** (link *up*
  the traceability chain instead of copying context, but name its own subject).
  Test: could a fresh session open this file and act correctly in a minute, without
  re-reading the whole trail? If not, tighten it.

## File & folder management — index-first, one topic per file

A single shared file everyone appends to causes merge conflicts, unbounded growth,
and token waste all at once (detail: `reference.md`). Avoid all three:

- **One topic = one dated, self-contained file:** a lite/brownfield change goes in
  `docs/sdd/changes/YYYY-MM-DD-<topic-slug>.md` (from `change.template.md`),
  carrying **its own** mini gate board, IDs, and inline decisions. Date-prefix
  (folder stays chronological), kebab slug, **one topic one slug** — no `-v2-ux`
  near-duplicates (update the file or pick a clearly distinct slug). `decisions/`
  uses the same dated form.
- **`00-overview.md` is a THIN index, not a ledger:** a topic registry (one row per
  change — date · file · one-line description · status · branch) + the **global ID
  next-free** counters. Adding a topic adds *one row*. (A single **full-mode
  product** is the exception — one cohesive build keeps its one shared gate board
  there.)
- **Frontmatter `description`** (one-line relevance hook) on every `changes/…` file
  and memory note.
- **Read index-first:** read the indexes (`00-overview.md` + `memory/INDEX.md`) →
  **match the task to a row/note by its one-line description** → open **only** the
  file(s) that are relevant. Never load the whole trail to find one thing.
- **Run the checker, don't just remember the rule.** This convention is
  instructions, not enforced code — it can slip under a weak model or time
  pressure. Run the bundled `check-file-hygiene.mjs` after writing/renaming a
  `changes/`/`decisions/`/`memory` file (copy to `tools/` in the project, wire
  into CI via `infra`): `node tools/check-file-hygiene.mjs docs/sdd`. Treat a
  non-zero exit as a real defect to fix, not a nuisance.

## Language: docs follow the user, code artifacts are English

Spec prose and user-facing docs may be in the **user's language** (that's how a
non-dev reads them). **Code-level artifacts are always English:** identifiers,
JSDoc/docstrings (kept simple), commit messages, and branch slugs — so the code
stays portable and reviewable regardless of the conversation language.
(`documentation` owns the JSDoc rule; `git-workflow` the commit rule.)

## Workspace layout (canonical — one home per artifact, never scatter files)

```
docs/
  sdd/                     # the spec-driven trail
    00-codebase-map.md     # map-codebase (BROWNFIELD only)
    00-overview.md         # THIN index: topic registry (1 row/change) + global ID registry; full gate board ONLY for a single full-mode product
    00-context.md          # glossary — seeded by discovery, sharpened by domain-modeling if present
    01-prd.md 02-diagrams.md 03-fsd.md
    04-architecture.md 04-stack-guide.md 04-schema.md 04-ux-design.md   # design phase
    design-system/          # OPTIONAL — an external UI/UX skill's own SSOT output (e.g. ui-ux-pro-max's MASTER.md); redirect its --output-dir here, never let it land outside docs/sdd
    05-threat-model.md 06-backlog.md 07-test-plan.md 08-delivery.md
    analytics.md            # analytics-design (metrics/events)
    decisions/              # decision-log — one timestamped file per decision
    memory/                 # project-memory — INDEX.md + linked notes (Obsidian-style graph)
    ESTIMATE.md STAKEHOLDER-BRIEF.md HANDOFF.md
    changes/                # lite/brownfield: one dated, SELF-CONTAINED file per topic — YYYY-MM-DD-<topic>.md (own mini board + IDs + decisions); indexed by 1 row in 00-overview. NOT appended to the numbered trail
    traceability.md         # the matrix — always current
  user/<feature>.md         # documentation FOR USERS
  dev/README.md dev/api.md dev/architecture.md   # documentation FOR DEVELOPERS
```
Never drop artifacts at the repo root or ad-hoc places. Placement **adapts to the
project's topology** (separate FE/BE repos, monorepo, modular monolith,
feature-sliced frontend) keeping two invariants: the spec trail stays together, and
code-level docs co-locate with the code they describe (full per-topology rules:
`reference.md`). Docs update in the **same change** as the code — enforced by
`implement`, `code-review`, `infra` — never batched at the end.

## The phases and their gates

**First, check whether `docs/sdd/` exists.** If it does, **read** `00-overview.md`,
`traceability.md`, `decisions/`, and `memory/INDEX.md` — resume from that real
state; don't restart or re-ask what's answered. If not, create `00-overview.md`
from `overview.template.md`. Update gate states (⬜→🟨→✅, or ⛔ with a reason) and
bump the ID next-free counters as you go. **A failed gate blocks the next phase** —
say so, mark it ⛔, and stop; don't sneak forward.

**Definition of Done, always explicit.** Each phase's exit-gate cell below *is* its
DoD; every ticket's DoD = acceptance criteria met + its TEST-xxx green +
traceability updated + **docs handled** = check whether docs already exist for the
touched area, then **update if behavior changed or create if missing** — both the
user guide (`docs/user/`) and developer docs (`docs/dev/` + inline JSDoc), per
`documentation`. A missing doc is a *create*, not a pass. `quick`/`lite` included
(a quick fix's DoD: test written, tests green, change + docs noted). State the DoD
up front, then tick it off.

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
| 10 | **Verify gate** | `coverage-check` + `code-review` + re-check `threat-model` + `browser-qa` (if there's a UI) | Tests pass, coverage ≥ target, review clean, no unmitigated High/Critical threat; **every Must-priority UI journey browser-verified against the running app** (or its gap explicitly flagged) |
| 11 | Ship | `documentation` + `git-workflow` (PR/changelog) + `handoff` (this pack's own) — plus `finishing-a-development-branch` if present for branch cleanup | Traceability matrix green; user + developer docs written; changelog written; deployed + smoke-checked |

> Phase 9 (`infra`) runs partly *early* — CI + coverage/security gates stand up at
> the start of implementation, not just before ship.

Cross-cutting, any time: `traceability` (after every ID-changing phase),
`decision-log` (any non-trivial decision, especially autopilot defaults),
`project-memory` (record durable codebase knowledge; read it first next session),
`stakeholder-brief` (non-technical status/sign-off), `handoff` (long runs or a
model/tool switch), `debug` (whenever something fails, phases 8/10), `git-workflow`
(commits in phase 8, PR/changelog at phase 11).

## How to route

- **Self-sufficient** — every phase's exit gate is satisfiable with this pack alone
  (full skill roster: `reference.md`). External skills are enhancements you prefer
  when present, never requirements; the whole pipeline (0–11) runs from this pack
  with no missing step.
- **Defer to the user's installed skills** for planning, worktrees, and grilling
  (areas this pack doesn't cover); and **prefer** an installed TDD / code-review /
  debugging / UI-UX-design skill (e.g. `ui-ux-pro-max`) over this pack's
  `implement` / `code-review` / `debug` / `ux-design` when one exists —
  otherwise the pack's own version runs the phase completely.
- **Code-quality bar — always, every mode and size.** All code clears
  `code-standards` (SSOT, DRY, YAGNI, deep modules), stays **in scope** (the
  smallest change that satisfies the ticket — `implement`'s lazy-senior rule), and
  **readable** (a reviewer or cheaper model can follow it). `quick`/`lite` reduce
  *ceremony*, never code quality or scope — a one-line fix's diff is held to the
  same bar as a full build's.
- **Announce each phase** as you enter it, name the gate, state whether it passed.
  After **every** phase that creates or changes an ID, invoke `traceability`.

## Parallelism

Phases 1→7 are mostly sequential. Where the runtime supports subagents, fan out
**within** a phase (draft multiple FSD sections / ticket bodies in parallel), then
reconcile IDs centrally — **reserve the ID range first**; never let two agents
allocate the same ID.

## Modes — three independent dials

**Interaction mode** (who drives), **size** (how heavy the ceremony), and
**stop-point** (how far to run) are independent and combine freely. None ever
removes a gate for the phases that *do* run.

### 1. Interaction mode

- **Autopilot** — runs the pipeline with minimal back-and-forth. Collect
  requirements **exhaustively up front** (run `discovery` deeply, **batch all
  questions**); at every undecided gate choose the most robust/scalable/
  maintainable default (see `arch-decision`), **record it as an explicit
  assumption** (`decision-log`), and proceed. **Stop only** for truly blocking
  unknowns or irreversible/outward actions (provision, deploy, spend, delete,
  send) — those always need explicit human confirmation.
- **Copilot — a real behavioral contract, not a label.** Every turn: (1) produce
  **only the current phase's** output (or, at an architecture/design decision, the
  2–3 options with a recommendation); (2) **then STOP** — name the decision the
  user must make or approve, and **wait for their reply**; don't roll into the next
  phase, start implementing, or produce the rest of the trail "to save a
  round-trip"; (3) offer choices to *pick from*, don't announce a done deal.
  **Producing several phases in one turn is autopilot behavior — a bug in copilot;**
  if you catch yourself doing it, stop and correct. The difference must be *felt*
  every turn, not just stated at the start.

### 2. Size (match ceremony to the work — resist heavy gravity)

- **Full** — a new product/subsystem as one coherent whole: the numbered
  `docs/sdd/` trail (`01-prd.md`, `03-fsd.md`, `04-schema.md`, …). Fixed filenames
  are right here — it's *one* product.
- **Lite** — a feature or non-trivial change to an existing app: its **own dated,
  self-contained file** `docs/sdd/changes/YYYY-MM-DD-<topic-slug>.md` (from
  `change.template.md`) — frontmatter (`description`/`status`/`branch`/dates) +
  brief + locked decisions + FSD bullets + its **own mini gate board + IDs** + 1–3
  tickets + test plan + inline traceability. Then add **one row** to
  `00-overview.md`'s topic index. **Do NOT append to the numbered trail, and do NOT
  put this topic's board/brief in `00-overview.md`** — that's exactly how shared
  files balloon and conflict. One topic = one dated file.
- **Quick** — a tiny, low-risk change: **skip the doc tree entirely.** Understand
  the immediate area, change test-first, run the tests, note the change in one
  sentence (a commit message, or a decision file if something was locked). Still
  non-negotiable: a test, and not breaking what works.

If unsure, infer from the request and **state your choice** ("this looks quick —
test-first, no doc tree; say the word for the full treatment").

### 3. Stop-point

- **`docs-only`** — phases 0–7, **zero code** (brainstorming, spec'ing for someone
  else, buy-in before committing engineering time).
- **`spec+review`** — phases 0–7, then a human checkpoint before phase 8.
- **`full-build`** (default for "build/ship this") — all phases, 0–11.

State the stop-point up front and **actually stop** there; mark the phase-8 row
`⬜ (not started — docs-only run)` — honest, not "skipped".

### Brownfield vs. greenfield

Is there a codebase? **Greenfield** → start at phase 0; you choose stack and
structure. **Brownfield** → **`map-codebase` first**, then change-aware:
`arch-decision` **respect-existing** (don't re-pick the stack; record it as
constraints), `stack-conventions` matches **observed** conventions, `to-prd`/
`to-fsd` frame the work as a change, `implement` adds **characterization tests**
before touching uncovered legacy. Don't run the "choose a stack" flow on a repo
that already has one.

### Modular use — which skill for which job (invoke it directly)

Each skill works **standalone** — for a focused job that's often the nicest way,
like reaching for one tool:

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
| **QA a user journey in a real browser** | `browser-qa` |
| **Fix a bug** | `debug` |
| **Review a diff** | `code-review` |
| **Commit / open a PR** | `git-workflow` |
| **Record a decision** | `decision-log` |
| **Remember something about the codebase** | `project-memory` |
| **Update this pack to the latest release** | `self-update` |

Invoking one directly loses the automatic gating/traceability — the trade for
speed. For the chain enforced but no code, use `docs-only`; for a small
feature/fix, `lite` (one dated `changes/…` file) is the sweet spot. **Pure
conversation, no files at all:** any skill can run **conversationally** (its rigor
— `discovery`'s nine questions, `code-review`'s two axes, `arch-decision`'s forces
— without writing the artifact); complements an installed grilling skill, doesn't
replace it.

### Defaults if the user doesn't say

Detect **brownfield vs greenfield** first (run `map-codebase` if brownfield). Pick
size by real scope — don't reflexively go full: tiny → **quick**, feature →
**lite**, new product → **full**. Ask once if genuinely unsure ("autopilot or
copilot?", "how far — docs-only, or build it?"), then **state your assumptions**.
Planning-sounding requests ("let's figure out…", "just a plan") default to
**docs-only**. Over-ceremony is a failure mode as real as under-rigor.
