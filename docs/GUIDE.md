# SDD Pipeline — How to use it (the manual)

Your one-stop guide so you never have to remember the details. Skim the tables;
read a recipe when you have a specific job.

- [30-second version](#30-second-version)
- [The 3 dials](#the-3-dials-size--mode--stop-point) — size · mode · stop-point
- [How to invoke it](#how-to-invoke-it)
- [How the agent picks defaults](#how-the-agent-picks-defaults)
- [Recipes](#recipes-copy-a-phrasing) — copy a phrasing for your situation
- [The phases (0–11)](#the-phases-0-11)
- [All 27 skills](#all-27-skills-reference)
- [Where files go](#where-files-go)
- [What it guarantees](#what-it-guarantees)
- [FAQ](#faq)

---

## 30-second version

It's a "full software team in a box" made of skills. You describe what you want;
it runs a gated, traceable process — understand → spec → design → secure → plan →
build (test-first) → verify → ship — and writes tidy docs as it goes. You can dial
it from a one-liner fix (no docs) up to a whole new product, and from "just give
me a plan" up to "build and deploy it".

**You don't need to learn the whole pack. Two ways in:**

- **Just want it built/fixed** (non-developers too): describe it and let
  **`spec-driven-development`** handle everything — it right-sizes, so it's never
  "too much" even for a one-line fix. *"build me a booking app" · "add CSV
  export" · "fix the date bug".*
- **A developer who wants to drive one step at a time:** reach for the one skill
  that matches your need (below). That's the modular, tool-off-the-shelf way.

| I just want to… | Reach for |
|---|---|
| Build/change something, end to end | **`spec-driven-development`** (right-sizes — fine for a 1-line fix) |
| Brainstorm / pressure-test an idea | **`discovery`** (or a grilling skill) |
| Understand an unfamiliar repo | **`map-codebase`** |
| Write requirements / functional spec | **`to-prd`** / **`to-fsd`** |
| Decide architecture / stack / structure | **`arch-decision`** |
| Design the DB schema / the UI | **`database-design`** / **`ux-design`** |
| Threat-model a flow | **`threat-model`** |
| Break work into tickets + estimate | **`backlog-leveling`** |
| Write the test plan / implement / fix a bug | **`test-plan`** / **`implement`** / **`debug`** |
| Review a diff / commit / open a PR | **`code-review`** / **`git-workflow`** |

The rest (traceability, coverage, code-quality bar, decision log, project
memory, CI) is **machinery the pipeline runs for you** — you rarely call it
directly. Full per-skill detail is in [All 27 skills](#all-27-skills-reference).

---

## The 3 dials (size · mode · stop-point)

These are **independent**. You (or the agent) set all three. Mixing them is normal.

### 1. Size — *how much ceremony/documentation*
| Size | For | Docs produced | Example |
|------|-----|---------------|---------|
| **quick** | tiny, low-risk change | **0 docs** — just code + a test | fix a typo, change a label, an obvious one-liner |
| **lite** | one feature or bugfix | **1 file** (`changes/<topic>.md`) | add "share wishlist", fix a real bug |
| **full** | new product / subsystem | the whole `docs/sdd/` trail (~11 files) | build a new app from scratch |

Quality never drops with size — a test is always written and working code is never
broken. Only the paperwork shrinks.

### 2. Mode — *who drives*
| Mode | Behaviour | Good for |
|------|-----------|----------|
| **autopilot** | Agent runs the whole thing itself; collects everything up front; picks robust defaults where you don't decide; stops only for blockers or risky/irreversible actions (deploy, spend, delete). | non-devs, or when you trust it to just do it |
| **copilot** | Produces **one phase (or one decision) at a time, then STOPS and waits for you** — offering options to pick, not announcing a done deal. It should *feel* like a pair, turn by turn, not a monologue. | developers who want control at each step |

> **If copilot feels the same as autopilot** (it asked at the start, then ran
> the whole thing), that's the skill not being followed — say "one phase at a
> time, wait for me" to re-anchor it. Weaker/cheaper models hold this behavioral
> nuance less reliably (see the model note in the FAQ).

### 3. Stop-point — *how far it goes*
| Stop-point | Runs | Result |
|------------|------|--------|
| **docs-only** | phases 0–7 | Full spec, **no code**. For brainstorming / handing a plan to someone. |
| **spec+review** | 0–7 + a checkpoint | Spec, then it asks before writing any code. |
| **full-build** | 0–11 | All the way through implement, verify, ship. (default when you say "build") |

**They combine.** e.g. `autopilot + quick + full-build` = "just fix this bug and be
done". `copilot + full + docs-only` = "let's carefully spec a new product together,
no code yet".

---

## How to invoke it

**Claude Code (installed as a plugin):** just talk to it.
```
use spec-driven-development to add a "clear wishlist" button
```
It figures out size/mode/stop-point, states them, and proceeds.

**Say the dials explicitly if you want:**
```
use spec-driven-development, copilot, lite, to fix the login redirect bug
use spec-driven-development, docs-only, to spec out a subscription feature
```

**Any single skill on its own (modular):** when you only want one artifact.
```
use to-prd for this idea
use threat-model on the payment flow
use map-codebase to understand this repo
use database-design to sanity-check this table
```

**Pure conversation, zero files** — like a grilling-style pressure-test, but
with a specific skill's structure (a requirements interview, an architecture
trade-off, a two-axis review). Say so explicitly and nothing gets written:
```
use discovery to think through this idea with me, don't write anything yet
use arch-decision, just talk through the trade-offs, no ADR file
use code-review on my diff — just tell me, no file needed (this is the default)
```

**OpenCode:** it auto-discovers plain `SKILL.md` folders — no config file needed.
Clone the repo, run `./install/install.sh generic --dest ~/.config/opencode/skills`
(global) or `./install/install.sh opencode` (this project only), then restart.
See the README's Install section for why the `plugin:` config array doesn't
apply here (it's for npm-style JS plugins, not plain markdown skills).

**Codex CLI:** auto-discovers `SKILL.md` under `.agents/skills`. Run
`./install/install.sh codex` (project) or
`./install/install.sh generic --dest ~/.agents/skills` (global — also covers
OpenCode, which scans the same path).

**Cursor:** has no per-skill discovery (it ignores plain `.md` under
`.cursor/rules`, only reading its own `.mdc` format there) — this pack targets
Cursor's documented `AGENTS.md` fallback instead: `./install/install.sh cursor`.

**Other agents:** point them at `AGENTS.md`, or run `install/install.sh <target>`
— see the README's Install section.

### Make it govern reliably (recommended for real projects)

Skill triggering is **pattern-matching against a description** — it's good,
not guaranteed. Two things get missed sometimes: the agent doesn't invoke it
for a request that should trigger it, or it drifts off after a few unrelated
messages and starts editing code without it. This pack's own instructions push
back on both (an explicit persistence rule, and "every new dev request
re-engages this skill"), but the single most reliable lever is outside this
pack entirely: **your project's own `CLAUDE.md`/`AGENTS.md`**, which most
agents load unconditionally every session — not probabilistically, the way a
skill description is matched. Add a short pointer there:

```markdown
## Development process
For any feature, bugfix, or development work in this repo, use the
`spec-driven-development` skill — it right-sizes itself automatically (a typo
needs no ceremony, a feature gets one file, a new product gets the full spec
trail), so invoke it even for requests that don't sound like they need rigor.
```

This isn't a hard guarantee either — it's still an instruction the agent
follows, not enforced code — but it's meaningfully stronger than relying on
skill-trigger matching alone, because it's read every time, not matched
probabilistically against a request's phrasing.

---

## How the agent picks defaults

If you don't specify, it infers and **tells you** (you can override):

| Your request sounds like… | It picks |
|---------------------------|----------|
| "fix typo / rename / tweak text / one-liner" | **quick** |
| "add feature X / fix this bug" | **lite** |
| "build an app / new product / subsystem" | **full** |
| "brainstorm / spec it out / don't code yet / just a plan" | stop-point **docs-only** |
| there's already a codebase | runs **`map-codebase`** first (brownfield) |
| nothing said about who drives | asks once, or defaults to **autopilot** and says so |

It always announces its choice first ("this looks small — I'll go quick, test-first,
no full spec tree"), so you catch a wrong guess before it runs.

---

## Recipes (copy a phrasing)

**"I just want to brainstorm / get a plan, no code."**
> use spec-driven-development, docs-only, to plan a notifications feature

**"Add a feature to my existing app."**
> use spec-driven-development, lite, to add CSV export — it's an existing Next.js repo

(It runs `map-codebase` first, respects your stack, adds tests around what it changes.)

**"Fix this small bug, don't overthink it."**
> use spec-driven-development, quick, the date shows a day off in the summary

**"Build a new thing from scratch, you drive."**
> use spec-driven-development, autopilot, full, build a link-shortener with analytics

**"Build a new thing, but check with me at each step."**
> use spec-driven-development, copilot, full, let's build the billing module

**"Explain the status to my non-technical boss / get sign-off."**
> use stakeholder-brief to summarise where the payments work stands

**"Estimate effort/cost before we commit."**
> use backlog-leveling to break this down and estimate it

**"I'm switching tools/models — package this up so I can continue later."**
> use handoff

**"Understand this repo I just inherited."**
> use map-codebase

**"Commit this / write me a commit message / open a PR."**
> use git-workflow

**"Design the database schema / I need a new table / this table's getting messy."**
> use database-design

---

## The phases (0–11)

Run in order for `full`; collapsed for `lite`; mostly skipped for `quick`.

| # | Phase | Produces |
|---|-------|----------|
| pre‑0 | Map existing code (brownfield only) | `00-codebase-map.md` |
| 0 | Discover the real need | discovery brief + glossary (`00-context.md`) |
| 1 | Product spec (what/why) | `01-prd.md` (REQ‑ids) |
| 2 | Diagrams (flows/DFD) | `02-diagrams.md` |
| 3 | Functional spec (how it behaves) | `03-fsd.md` (FSD‑ids) |
| 4 | Architecture + stack + conventions | `04-architecture.md`, `04-stack-guide.md` |
| 5 | Security (threat model / SSDLC) | `05-threat-model.md` (SEC‑ids) |
| 6 | Backlog + estimate | `06-backlog.md` (tiered tickets), `ESTIMATE.md` |
| 7 | Test plan | `07-test-plan.md` (TEST‑ids, ≥80% target) |
| — | **docs-only stops here** — a complete, code-free deliverable | |
| 8 | Implement (test-first) | tested code |
| 9 | Infra & delivery | CI/CD, IaC, `08-delivery.md` |
| 10 | Verify (coverage + review + security recheck) | proof |
| 11 | Ship | docs, changelog, deployed |

Everything is linked in `traceability.md` (REQ → FSD → SEC → ticket → test), and a
checker (`tools/check-traceability.mjs`) keeps that honest — it catches ids that
are speced but untracked, broken/typo references, tickets or tests that trace to
nothing upstream, the same id accidentally defined twice, and dead doc links.

---

## All 27 skills (reference)

You rarely call these directly — the orchestrator routes to them — but here's
**when each one fits, what it produces, and a tip** so nothing is a mystery.
Skip straight to the group you need.

### Orchestration

**`spec-driven-development`** — the conductor.
*When:* any build/change/fix request, even an ordinary one with no special
phrasing. *Produces:* routes every phase, keeps the gate board + traceability
current. *Tip:* state the dials up front (e.g. "…copilot, lite") if you already
know them — saves a round-trip of the agent asking.

### Understand (brownfield + discovery)

**`map-codebase`** — learn an existing codebase before touching it.
*When:* the project already has code (brownfield), always **before** anything
else. *Produces:* `00-codebase-map.md` — stack, structure, conventions
actually used, tests, risk areas. *Tip:* don't skip this even for a tiny
change — it's what stops the agent fighting your existing architecture.

**`discovery`** — collect the real need deeply.
*When:* a genuinely new feature/product, or a vague "I want an app that…".
*Produces:* a discovery brief + the glossary (`00-context.md`). *Tip:* the
friendliest phase for non-developers — plain-language questions about goals,
users, outcomes, no jargon required.

### Spec & design

**`to-prd`** — product requirements (what & why).
*When:* the need is understood, now formalize it. *Produces:* `01-prd.md`,
REQ-ids with MoSCoW priority + Given/When/Then acceptance criteria.

**`analytics-design`** — turn success criteria into measurable metrics + events
(the data-analyst seat).
*When:* after the PRD, or "what metrics/KPIs/analytics should we track".
*Produces:* `analytics.md` — north-star + guardrail KPIs tied to REQ outcomes,
a consistent event taxonomy, an instrumentation plan. *Tip:* a feature with no
way to tell if it worked is a guess you can't correct — worth it for anything
whose success actually matters.

**`to-diagrams`** — context/DFD/sequence/ERD diagrams (Mermaid).
*When:* after the PRD, before the functional spec. *Produces:* `02-diagrams.md`.
*Tip:* the DFD's trust boundaries feed the threat model directly — don't
skip them even in a hurry.

**`to-fsd`** — functional spec (exact behaviour, including error paths).
*When:* diagrams exist; now spell out precisely how it behaves. *Produces:*
`03-fsd.md`, FSD-ids covering main **and** error/alternate flows.

**`arch-decision`** — choose (or respect) architecture, stack, topology; ADRs.
*When:* before any code, on a new project or a topology-affecting change.
*Produces:* `04-architecture.md`. *Tip:* if you don't know your stack, say
so — it picks the most robust option and justifies it, it never guesses silently.

**`stack-conventions`** — reads the stack's **official docs**, turns them into
enforceable rules (TS strict, Laravel conventions, …).
*When:* right after the stack is picked. *Produces:* `04-stack-guide.md`,
version-pinned and source-cited. *Tip:* this is what makes generated code
idiomatic instead of generic — worth doing even on a small project.

**`database-design`** — the data model / schema (a canonical, **mandatory**
deliverable when the app stores data, not optional).
*When:* automatically once a datastore is chosen (phase 4) — the agent produces
it without being asked — and any time a migration is about to be written.
*Produces:* `04-schema.md`, held to the same bar every migration. *Tip:*
denormalizing is fine — but it needs a written reason tied to a real
performance need, not "it was easier."

**`ux-design`** — the interface, designed before it's built (UI/UX designer).
*When:* the design phase (4) whenever there's a UI — not optional for a product
with screens — or "design the UI / design system / color palette / wireframe".
*Produces:* `04-ux-design.md` — design tokens (color palette, type, spacing),
key screen wireframes, component patterns, every screen's states
(empty/loading/error/success), a11y + responsive. *Tip:* the four states per
screen become FSD error flows and e2e tests — designing them isn't extra, it's
where most of the real work hides.

**`threat-model`** — security-by-design (STRIDE), one control per real threat.
*When:* architecture is set, before implementation starts. *Produces:*
`05-threat-model.md`, SEC-ids for every High/Critical threat. *Tip:* even a
`lite` change gets a quick threat check — "it's just a small feature" is
exactly how gaps get in.

### Plan

**`backlog-leveling`** — tiered tickets (T1/T2/T3) + effort/cost estimate.
*When:* FSD + architecture exist, ready to plan work. *Produces:*
`06-backlog.md` + optional `ESTIMATE.md`. *Tip:* ask for the estimate
explicitly ("how long/how much") — it isn't produced automatically.

**`test-plan`** — happy/regression/edge/e2e cases + the coverage target.
*When:* the backlog is tiered, before implementation. *Produces:*
`07-test-plan.md`, TEST-ids by class, default coverage target ≥80%.

### Build

**`code-standards`** — the code-quality bar: SSOT, DRY, YAGNI, deep modules.
*When:* continuously — this is a bar `implement`/`code-review` hold code to,
not a phase you invoke on its own. *Tip:* read it once to understand *why*
code gets flagged in review.

**`implement`** — write the code, test-first, one ticket at a time.
*When:* a ticket is ready to build. *Produces:* tested code (red→green→refactor).
*Tip:* T3 tickets deserve extra care — don't let autopilot speed through a
security-sensitive ticket unattended.

**`debug`** — systematic root-cause fixing with a regression test.
*When:* something's broken, throwing, or slow. *Produces:* a fix plus a test
that proves the bug can't silently come back. *Tip:* prefers a specialized
debugging skill if you have one installed, but works standalone either way.

**`git-workflow`** — commit/branch/PR conventions tied to the ticket and
traceability.
*When:* something's ready to commit, or you want a PR description. *Produces:*
a commit message referencing `TICKET-xxx`/`FSD-xxx`, or a PR description built
from real gate results. *Tip:* ask for this **per ticket**, not once at the
end — smaller commits are easier to review and revert.

### Verify & ship

**`infra`** — CI/CD, infra-as-code, secrets, observability, deploy.
*When:* setting up CI, or getting ready to deploy. *Produces:* pipelines, IaC,
env parity, alerting, rollback. *Tip:* it will always stop and ask before
actually provisioning cloud resources or deploying — never ask it to skip that.

**`coverage-check`** — enforce the coverage gate honestly.
*When:* the verify gate, phase 10. *Produces:* a plain pass/fail, no gray area.
*Tip:* if it flags a skipped/`.only`/stubbed test as not-really-passing, fix
the test — don't argue with the gate.

**`code-review`** — two-axis review: Standards (quality) + Spec (does what was
asked).
*When:* a change is ready to merge. *Produces:* two separate verdicts, ranked
findings, an approve/changes-required call. *Tip:* ask for this on your own
diffs any time, not only at the pipeline's built-in verify gate.

**`documentation`** — user guide + developer docs (JSDoc/API/README).
*When:* shipping, or whenever you want docs for something specific.
*Produces:* `docs/user/<feature>.md` (plain language) + `docs/dev/` +
inline JSDoc. *Tip:* it derives from the specs — if the specs are stale, fix
those first rather than letting docs and specs drift apart.

### Keep it honest (any time)

**`traceability`** — the matrix linking requirements → tests; run the checker.
*When:* after any phase that creates/changes an ID. *Produces:* the matrix +
a one-line coverage summary (verified mechanically by `check-traceability.mjs`,
not eyeballed). *Tip:* a red row is the pipeline being honest — don't ask it
to hide the gap, ask it to close the gap.

**`decision-log`** — record every significant decision, the "why", and what got
locked.
*When:* proactively, any non-trivial call — especially an autopilot default made
on your behalf. *Produces:* one **timestamped file per decision** in
`docs/sdd/decisions/` (`YYYY-MM-DD-HHMM-topic.md` — title, what's locked, why,
alternatives), or an inline "Decisions" section in `lite`/`quick`. *Tip:* this
is where "why did we decide X" gets answered months later, and each decision is
its own linkable node.

**`project-memory`** — an Obsidian-style knowledge graph about *this* codebase.
*When:* whenever you learn something durable (a module's shape, a gotcha, a
domain concept), or at the end of a substantial session. *Produces:*
`docs/sdd/memory/` — small linked markdown notes + an `INDEX.md`. *Tip:*
expensive to seed once, cheap forever after — later sessions (or a cheaper
model) read the memory + a targeted code look instead of re-scanning the whole
repo. Point your project's `CLAUDE.md`/`AGENTS.md` at `memory/INDEX.md` so it's
read every session.

**`stakeholder-brief`** — plain-language status + sign-off for non-technical
people.
*When:* a non-technical person needs to understand status or approve something.
*Produces:* a brief + a sign-off loop that writes their answers back into the
specs (not just into the brief).

**`handoff`** — a resumable snapshot so another agent/cheaper model continues
cold.
*When:* a session is getting long, or you're switching tools/models.
*Produces:* `HANDOFF.md` — self-contained, no memory of this conversation
required to pick it up.

### General recommendations

- **Right-size by default, don't reflexively go `full`.** A typo is `quick`, a
  feature is `lite`, a new product is `full`. Over-ceremony wastes as much
  trust as under-rigor.
- **On existing code, always start with `map-codebase`.** Skipping it is the
  single most common way the agent ends up fighting your own architecture.
- **Ask for `git-workflow` per ticket, not once at the end** — smaller commits,
  easier reviews, easier reverts.
- **Trust a red traceability row.** It's the pipeline surfacing a real gap, not
  a bug to work around.
- **In `autopilot`, skim the decision log before shipping.** Every default the
  agent picked on your behalf is recorded there, specifically so you can
  audit and correct it before it's too late to matter.
- **For a non-technical stakeholder, use `stakeholder-brief` before a big
  decision, not after.** It's built to write their answer back into the specs.

---

## Where files go

One home per thing — nothing scattered:
```
docs/
  sdd/
    00-… through 08-…    the numbered spec trail (FULL build of one product only)
    changes/<topic>.md   one file per feature/fix (LITE mode — never appended to the trail)
    decisions/<ts-topic>.md   one timestamped file per decision (what's locked + why)
    memory/INDEX.md + notes   Obsidian-style codebase knowledge graph
    analytics.md ESTIMATE.md STAKEHOLDER-BRIEF.md HANDOFF.md traceability.md
  user/    documentation for end users
  dev/     documentation for developers (API, architecture, README)
```
**Anything that recurs — features, fixes, decisions, memory — is one file per
topic in a folder**, so those never balloon into a giant shared file. The
numbered trail is reserved for a single cohesive product build. For an existing
repo with feature slices / modules, code-level docs live **next to the code** (a
README per module/slice), with a top-level index in `docs/dev/`.

---

## What it guarantees

- **Gates that block** — no code before architecture + security are decided; no
  ship before tests pass, coverage ≥ 80%, review is clean, and the matrix is green.
- **Traceability** — every requirement traces to a test; a runnable checker catches
  drift (untracked ids, broken refs, duplicate id definitions, dead links) so the
  docs can't quietly lie.
- **Code quality bar** — SSOT / DRY / YAGNI / deep modules, plus your stack's own
  best practices (from its official docs) — in every mode, held even for a
  one-line fix. In-scope, readable, surgical diffs (no silent refactor-balloons).
- **Security by design** — threats modelled before code; controls tracked to tests.
- **Tests never touch production data** — the suite runs against a local/
  disposable DB only; if the environment looks like production, it stops and asks.
- **Efficient by design** — reads the minimum (memory index + targeted code, not
  whole-repo scans), right-sizes output, and compacts long runs via `handoff`;
  context and tokens are treated as a resource.
- **Right-sized** — a one-liner doesn't get 15 documents.
- **Dev + non-dev** — two clear doors, and every doc opens with a plain-language
  summary.

---

## FAQ

**Do I have to use the whole thing?** No. `quick` skips almost all of it; any skill
runs standalone; `docs-only` stops before code.

**Can I use one skill for a quick brainstorm/gut-check, like a grilling skill?**
Yes — say "just talk it through, don't write anything" and any skill runs
conversationally with no file written (see "Pure conversation, zero files"
above). This complements an installed grilling skill rather than replacing
it: use grilling for pure adversarial pressure-testing, use this pack's skills
conversationally when you want their specific structure (a requirements
interview, an architecture trade-off, a two-axis code review).

**Will it touch my existing code recklessly?** No — brownfield runs `map-codebase`
first, respects your stack, and adds characterization tests before changing legacy.

**Can a cheaper model continue what a stronger one started?** Yes — `handoff` writes
a self-contained snapshot for exactly that.

**Is autopilot going to deploy/spend/delete without asking?** No — those are always
stop-and-confirm, even in autopilot.

**How do I install it / run it in another tool?** See the README's Install section
(GitHub plugin for Claude Code; `install/install.sh` for Cursor/Codex/OpenCode/etc.).

**How do I get updates once installed?** Depends on how you installed — see the
README's Updating section. Short version: Claude Code plugin installs use
`/plugin marketplace update` + `/plugin update`; everything installed via
`install.sh` is a copy, so `git pull` + re-run the installer; OpenCode's
Option B and Cursor's `AGENTS.md` pointer just need `git pull`.

**Is trigger accuracy (does it fire from natural phrasing) proven?** Not
independently yet — that requires the pack to be genuinely installed in a real
agent session, which can only really be tested in your own environment, not
faked in advance. If a request doesn't invoke the skill you expected, that's
useful signal — it usually means a trigger description needs sharpening, not
that something is fundamentally broken.

**Does the model I use matter?** Yes, a lot — more than most of this pack.
Everything here is *instructions the model chooses to follow*, not enforced
code. A strong model holds behavioral nuance (staying in copilot, pausing turn
by turn, right-sizing, surgical diffs) reliably; a fast/cheap model (e.g. a
"flash"-tier model) tends to absorb the top-level intent and then default to
"just execute" — so copilot can collapse into autopilot, and it may over-change.
Two mitigations: (1) for behavior-sensitive work (a careful copilot session,
delicate refactor), use a stronger model; (2) **lean on modular use** — pointing
a weak model at *one* small skill ("use `to-fsd` for this", "use `debug` on
this") is far more reliable than asking it to hold the whole orchestrator in
mind. This is also why simpler, atomic invocations feel more dependable on
cheaper models.
