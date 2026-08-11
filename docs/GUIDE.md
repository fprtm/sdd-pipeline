# SDD Pipeline — How to use it (the manual)

Your one-stop guide so you never have to remember the details. Skim the tables;
read a recipe when you have a specific job.

- [30-second version](#30-second-version)
- [The 3 dials](#the-3-dials-size--mode--stop-point) — size · mode · stop-point
- [How to invoke it](#how-to-invoke-it)
- [How the agent picks defaults](#how-the-agent-picks-defaults)
- [Recipes](#recipes-copy-a-phrasing) — copy a phrasing for your situation
- [The phases (0–11)](#the-phases-0-11)
- [All 22 skills](#all-22-skills-reference)
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

Start it by saying: **"use spec-driven-development to <your goal>"**. It will pick
sensible defaults and tell you what it chose — correct it if you want.

---

## The 3 dials (size · mode · stop-point)

These are **independent**. You (or the agent) set all three. Mixing them is normal.

### 1. Size — *how much ceremony/documentation*
| Size | For | Docs produced | Example |
|------|-----|---------------|---------|
| **quick** | tiny, low-risk change | **0 docs** — just code + a test | fix a typo, change a label, an obvious one-liner |
| **lite** | one feature or bugfix | **1 file** (`CHANGE-<slug>.md`) | add "share wishlist", fix a real bug |
| **full** | new product / subsystem | the whole `docs/sdd/` trail (~11 files) | build a new app from scratch |

Quality never drops with size — a test is always written and working code is never
broken. Only the paperwork shrinks.

### 2. Mode — *who drives*
| Mode | Behaviour | Good for |
|------|-----------|----------|
| **autopilot** | Agent runs the whole thing itself; collects everything up front; picks robust defaults where you don't decide; stops only for blockers or risky/irreversible actions (deploy, spend, delete). | non-devs, or when you trust it to just do it |
| **copilot** | Same rigor, but **pauses at each gate** for you to review/approve, and defers technical calls to you. | developers who want control |

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

## All 22 skills (reference)

You rarely call these directly — the orchestrator routes to them — but here's what
each one is, so nothing is a mystery.

**Orchestration**
- `spec-driven-development` — the conductor: runs the phases, enforces gates, picks
  size/mode/stop-point, keeps the docs tidy.

**Understand (brownfield + discovery)**
- `map-codebase` — learn an existing codebase before changing it.
- `discovery` — collect the real need deeply (works for non-devs too).

**Spec & design**
- `to-prd` — product requirements (what & why).
- `to-diagrams` — context/DFD/sequence/ERD diagrams (Mermaid).
- `to-fsd` — functional spec (exact behaviour, incl. error paths).
- `arch-decision` — choose (or respect) architecture, stack, topology; write ADRs.
- `stack-conventions` — read the stack's **official docs** and turn them into rules
  (TS strict, Laravel conventions, …).
- `threat-model` — security-by-design (STRIDE), one control per real threat.

**Plan**
- `backlog-leveling` — tiered tickets (T1/T2/T3) + a rough effort/cost estimate.
- `test-plan` — happy/regression/edge/e2e cases + the coverage target.

**Build**
- `code-standards` — the code-quality bar: SSOT, DRY, YAGNI, deep modules.
- `implement` — write the code, test-first, one ticket at a time.
- `debug` — systematic root-cause fixing with a regression test.

**Verify & ship**
- `infra` — CI/CD, infra-as-code, secrets, observability, deploy.
- `coverage-check` — enforce the coverage gate honestly.
- `code-review` — two-axis review: Standards (quality) + Spec (does what was asked).
- `documentation` — user guide + developer docs (JSDoc/API/README).

**Keep it honest (any time)**
- `traceability` — the matrix linking requirements → tests; run the checker.
- `decision-log` — record every significant decision and the "why".
- `stakeholder-brief` — plain-language status + sign-off for non-technical people.
- `handoff` — a resumable snapshot so another agent/cheaper model continues cold.

---

## Where files go

One home per thing — nothing scattered:
```
docs/
  sdd/     the spec trail (00-… through 08-…, ESTIMATE, DECISIONS, traceability, CHANGE-*)
  user/    documentation for end users
  dev/     documentation for developers (API, architecture, README)
tools/     check-traceability.mjs (drift checker)
```
For an existing repo with feature slices / modules, code-level docs live **next to
the code** (a README per module/slice), with a top-level index in `docs/dev/`.

---

## What it guarantees

- **Gates that block** — no code before architecture + security are decided; no
  ship before tests pass, coverage ≥ 80%, review is clean, and the matrix is green.
- **Traceability** — every requirement traces to a test; a runnable checker catches
  drift (untracked ids, broken refs, duplicate id definitions, dead links) so the
  docs can't quietly lie.
- **Code quality bar** — SSOT / DRY / YAGNI / deep modules, plus your stack's own
  best practices (from its official docs).
- **Security by design** — threats modelled before code; controls tracked to tests.
- **Right-sized** — a one-liner doesn't get 15 documents.
- **Dev + non-dev** — every doc opens with a plain-language summary.

---

## FAQ

**Do I have to use the whole thing?** No. `quick` skips almost all of it; any skill
runs standalone; `docs-only` stops before code.

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
