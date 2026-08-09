# SDD Pipeline

A **Spec-Driven Development** skill pack for AI coding agents. It turns "here's a
rough idea" into shipped, tested, secured, fully-traceable code by running a
**gated pipeline** — and it works across **many agents** (Claude Code, Codex,
Cursor, Gemini CLI, Copilot CLI, OpenCode, …).

It's designed for the way people build with AI now: spec first, diagrams matter,
tests matter, security is designed in (not bolted on), and the backlog is broken
down so a junior dev — or a cheap model — can execute the easy parts safely.

> **📖 New here or forgot how it works? Read the [Usage Guide](docs/GUIDE.md)** —
> how to use it, the 3 dials (size / mode / stop-point), every skill, and
> copy-paste recipes for common jobs.

> Not a rewrite of existing skills. This pack **fills the gaps** other skill
> collections (e.g. [mattpocock/skills](https://github.com/mattpocock/skills),
> [obra/superpowers](https://github.com/obra/superpowers)) leave, and **defers**
> to them for TDD, code review, worktrees, and finishing branches when they're
> installed.

## What makes it different

| Principle | What it means |
|-----------|---------------|
| **Traceable** | `REQ → FSD → ADR/SEC → TICKET → TEST`, all linked in one matrix. A requirement with no test is a visible red row, not a silent gap. |
| **Gated** | No code before architecture + security are decided. No ship before coverage ≥ 80% and the matrix is green. Gates *block*. |
| **Stack-neutral** | The agent asks; you decide. If you defer, it picks the most robust/scalable/maintainable option **and tells you why**. |
| **Full-stack aware** | Architecture covers frontend, backend, and topology: fullstack, FE/BE separate, BE-only, FE-only, or monorepo. |
| **Two audiences** | Every doc opens with a plain-language summary for non-devs, then technical detail for devs/agents. |
| **Cost-aware backlog** | Tickets are tiered T1/T2/T3 so trivial work goes to a junior/cheap model, hard work to a senior/strong model. |
| **Secure by design (SSDLC)** | A lightweight STRIDE threat model runs on the data-flow diagram before implementation; controls are tracked to tests. |

## The pipeline

```
0 Discover ─▶ 1 PRD ─▶ 2 Diagrams ─▶ 3 FSD ─▶ 4 Architecture ─▶ 5 Security ┐
 (deep needs                          (REQ↔FSD,   (style/stack/    (STRIDE,   │
  collection)                          errors)     topology)        SSDLC)    ▼
                                                                          6 Backlog
                                                                          (tiered)
                                                                              │
  11 Ship ◀─ 10 Verify ◀─ 9 Infra ◀─ 8 Implement ◀─ 7 Test plan ◀───────────┘
 (deployed,   (cov≥80%,   (CI/CD,IaC, (TDD, ticket   (happy/regression/
  matrix       review,     secrets,    by ticket)     edge/e2e, ≥80%)
  green)       threats)    observ.)
```

Each box is a skill in `skills/`. The orchestrator is
[`spec-driven-development`](skills/spec-driven-development/SKILL.md) — start
there and it routes the rest. On existing code, a **pre-0 `map-codebase`** step
runs first (brownfield). For small work the whole thing collapses — see the size
dial below.

## Skills in this pack

| Skill | Role in the "team" | Phase |
|-------|--------------------|-------|
| `spec-driven-development` | orchestrator + gates + routing + modes | all |
| `map-codebase` | understand an EXISTING codebase before changing it (brownfield) | pre-0 |
| `discovery` | deep requirement collection (dev + non-dev) | 0 |
| `to-prd` | Product Requirements (REQ-xxx) | 1 |
| `to-diagrams` | context / DFD / sequence / ERD (Mermaid) | 2 |
| `to-fsd` | Functional Spec (FSD-xxx) | 3 |
| `arch-decision` | architecture + stack + topology gate (ADR) | 4 |
| `stack-conventions` | official best practices of the chosen stack, as rules | 4 |
| `threat-model` | SSDLC security gate (SEC-xxx, STRIDE) | 5 |
| `backlog-leveling` | tiered, executor-friendly backlog + effort/cost estimate | 6 |
| `test-plan` | happy/regression/edge/e2e + coverage target | 7 |
| `code-standards` | the SSOT/DRY/YAGNI/deep-module code bar | 8·10 |
| `implement` | the coding phase, test-first, ticket-by-ticket | 8 |
| `debug` | systematic root-cause debugging + regression test | 8·10 |
| `infra` | CI/CD, IaC, envs, secrets, observability, deploy | 9 |
| `code-review` | Standards + Spec review | 10 |
| `coverage-check` | verify-gate coverage enforcement | 10 |
| `documentation` | user guide + developer docs (JSDoc/API/README) | 11 |
| `traceability` | the single-source-of-truth matrix | all |
| `decision-log` | running record of every significant decision + "why" | any |
| `stakeholder-brief` | plain-language brief + sign-off for non-IT | any |
| `handoff` | resumable snapshot for another agent / cheaper model | any |

22 self-sufficient skills — the pipeline runs end to end with nothing else
installed, and **defers** to your planning/worktree/grilling and (if you prefer
them) TDD/review/debug skills (mattpocock/skills, superpowers) when present.

### Tidy by design (predictable file placement)

Every artifact has one canonical home, so runs never scatter files: the spec trail
in `docs/sdd/`, user docs in `docs/user/`, developer docs in `docs/dev/`, and
code/tests/CI/IaC in their normal repo locations. The orchestrator documents this
layout as the single source of truth for *where things live*.

### Code-quality bar (SSOT · DRY · YAGNI · deep modules)

Everything the pipeline writes must clear `code-standards`: one source of truth
per fact (types inferred from a single schema, named constants, ubiquitous
naming), knowledge-level DRY (no premature abstraction — rule of three), YAGNI
(only what a requirement needs; no dead code), and deep modules (simple interfaces
hiding real complexity, logic in the domain layer). `implement` writes to it;
`code-review` enforces it.

### Stack-aware (reads the docs, writes idiomatic code)

`code-standards` is stack-neutral. On top of it, `stack-conventions` reads the
**official docs** of whatever stack `arch-decision` picked (using a docs tool like
Context7 if available, else the official sites) and writes version-pinned rules to
`04-stack-guide.md` — e.g. TypeScript `strict` + `noUncheckedIndexedAccess` and
no `any`; Laravel Form-Request validation, Eloquent conventions, and mass-assignment
guarding. `implement` follows it and `infra` wires the config (tsconfig, linters)
into CI, so the code is idiomatic to the framework, not generic.

### It represents a full team

Each phase plays a role — PM, analyst, architect, security, delivery lead, QA,
engineer, DevOps/SRE, reviewer, tech writer — so one agent covers the whole org.
In **copilot** the human is the senior in the loop; in **autopilot** the agent
plays every seat and records what each role would have signed off. The agent
announces which role it's "wearing" as it moves through phases, so a non-technical
user can follow along.

## How to run it — three independent dials

You (or the agent) set three dials. They're **separate and combine freely** — e.g.
`autopilot + quick + full-build`, or `copilot + full + docs-only`. If you say
nothing, the agent infers them and tells you its choice so you can correct it. Full
detail + copy-paste recipes are in the **[Usage Guide](docs/GUIDE.md)**.

**Dial 1 · Mode — who drives**
- **Autopilot** — the agent runs the whole thing itself; collects requirements up
  front; picks robust defaults where you don't decide; stops only for blockers or
  irreversible actions (deploy, spend, delete). Good for non-devs, or when you
  trust it to just go.
- **Copilot** — same rigor, but **pauses at each gate** for you to review/approve
  and defers technical calls to you. Good for developers who want control.

**Dial 2 · Size — how much ceremony/documentation**
- **quick** — tiny change → understand, fix test-first, done. **No docs.**
- **lite** — a feature/bugfix → one collapsed `CHANGE-<slug>.md`.
- **full** — new product/subsystem → the whole `docs/sdd/` trail (~11 files).
- Quality never drops with size — a test is always written; only the paperwork
  shrinks. Over-ceremony (15 docs for a one-liner) is treated as a failure mode.

**Dial 3 · Stop-point — how far it goes**
- **docs-only** — phases 0–7, a complete spec with **zero code**. For brainstorming
  or handing a plan to someone else.
- **spec+review** — spec, then it asks before writing any code.
- **full-build** — all the way to implement, verify, ship (default for "build this").

Or ignore the pipeline and use any skill **modularly** (`to-prd`, `threat-model`,
`map-codebase`, …) — you just give up the automatic gating and traceability wiring.

### Brownfield: works on existing code, not just new projects

Not a dial — it's auto-detected. When there's already a codebase, the pipeline
starts with **`map-codebase`** (learns the stack, module map, conventions, tests,
and risky areas *before* touching anything). Then `arch-decision` runs in
**respect-existing** mode (it won't re-pick your stack), changes are framed as
changes, and `implement` adds **characterization tests** to legacy code before
altering it — so it can prove it didn't break what worked.

## Install

### Claude Code (plugin)

```bash
# straight from GitHub — no clone needed
/plugin marketplace add fprtm/sdd-pipeline
/plugin install sdd-pipeline@sdd-pipeline
```

Or, if you already have a local clone:

```bash
# from inside the clone, register it as a local marketplace
/plugin marketplace add .
/plugin install sdd-pipeline@sdd-pipeline
```

`sdd-pipeline@sdd-pipeline` is `<plugin-name>@<marketplace-name>` — both happen to
be named "sdd-pipeline" in the manifests, not a GitHub account.

Or copy skills into your project/user scope with the installer:

```bash
./install/install.sh claude-proj   # -> ./.claude/skills
./install/install.sh claude        # -> ~/.claude/skills (all projects)
```

### Other agents (multi-agent)

```bash
./install/install.sh cursor        # -> ./.cursor/rules/sdd-pipeline
./install/install.sh opencode      # -> ./.opencode/skills
./install/install.sh codex         # points ./AGENTS.md at the pack
./install/install.sh generic --dest /path/to/agent/skills
```

For agents that read a single rules file, add `--bundle` to also emit
`sdd-pipeline.bundle.md` (all skills concatenated in order):

```bash
./install/install.sh codex --bundle
```

Then, in any agent: **"use spec-driven-development to \<do X\>"**. It picks the
three dials (mode / size / stop-point) and tells you, or you can say them up front:
e.g. *"…copilot, lite"* or *"…docs-only, just a plan"*. See the
[Usage Guide](docs/GUIDE.md) for recipes.

## See it in action

A full worked run lives in [`examples/wishlist/`](examples/wishlist/) — the
"Wishlist + shareable link" feature taken from idea to a spec-complete, secured,
fully-traceable plan (PRD, diagrams, FSD, ADRs, threat model, tiered backlog,
test plan, honest traceability matrix) **plus a runnable, tested backend** in
[`examples/wishlist/impl/`](examples/wishlist/impl/) (zero-dependency TypeScript,
54 tests, ~99% coverage, HTTP + SSR + infra-as-code). It also includes a
brownfield change ([`CHANGE-clear-wishlist.md`](examples/wishlist/docs/sdd/CHANGE-clear-wishlist.md))
showing lite mode on existing code.

## Repo layout

```
sdd-pipeline/
├─ README.md
├─ AGENTS.md                # entry point for non-Claude agents
├─ CHANGELOG.md             # version history
├─ .claude-plugin/          # Claude Code plugin + marketplace manifests
├─ docs/GUIDE.md            # the usage manual
├─ skills/                  # 22 SKILL.md files (portable Markdown)
├─ templates/               # doc templates the skills fill in
├─ tools/                   # check-traceability.mjs (anti-drift checker)
├─ examples/wishlist/       # a complete worked run (+ runnable, tested impl)
└─ install/install.sh       # multi-agent installer
```

## Status

**v0.4.0** — usable end to end; 22 self-sufficient skills; a worked example with a
runnable, tested backend (54 tests). Pre-1.0, so things may still move. See
[CHANGELOG.md](CHANGELOG.md). Contributions/adjustments welcome — the skills are
plain Markdown, so fork and adapt to your own conventions.

## License

MIT — see [LICENSE](LICENSE).
