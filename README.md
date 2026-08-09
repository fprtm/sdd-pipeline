# SDD Pipeline

A **Spec-Driven Development** skill pack for AI coding agents. It turns "here's a
rough idea" into shipped, tested, secured, fully-traceable code by running a
**gated pipeline** — and it works across **many agents** (Claude Code, Codex,
Cursor, Gemini CLI, Copilot CLI, OpenCode, …).

It's designed for the way people build with AI now: spec first, diagrams matter,
tests matter, security is designed in (not bolted on), and the backlog is broken
down so a junior dev — or a cheap model — can execute the easy parts safely.

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
there and it routes the rest.

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

### Two ways to run it

- **Autopilot** — the agent runs the whole pipeline as an autonomous team,
  collecting requirements exhaustively up front (batched questions), choosing the
  most robust defaults where you don't decide, and stopping only for blockers or
  irreversible actions (deploy, spend, delete). Friendly for non-developers and
  developers.
- **Copilot** — same full sequence and same rigor, but it pauses at each gate for
  a developer to review/approve and defers technical calls where you have a
  preference. Developer-friendly.

Or use any skill **modularly** on its own (`to-prd`, `threat-model`, …) — you
just give up the automatic gating and traceability wiring.

### Just brainstorming? Stop at documents — no code required

You don't have to build anything to use this. Ask for **`docs-only`** mode and the
pipeline runs phases 0–7 (discovery → PRD → diagrams → FSD → architecture →
security → tiered backlog + estimate → test plan) and **stops** — a complete,
traceable spec ready to hand to a developer, a team, or your future self, with
zero code written. Say *"spec+review"* instead if you want a checkpoint to
explicitly approve before any implementation begins.

### Works on existing code, not just new projects (brownfield)

Most real work is on code that already exists. When there's a codebase, the
pipeline starts with **`map-codebase`** — it learns the stack, module map,
conventions actually in use, tests, and risky areas *before* touching anything.
Then `arch-decision` runs in **respect-existing** mode (it won't re-pick your
stack), changes are framed as changes (not new products), and `implement` adds
**characterization tests** to legacy code before altering it, so it can prove it
didn't break what worked.

### Right-sized — a one-liner doesn't get 15 documents

Ceremony matches the work: **quick** (tiny change → understand, fix test-first,
done — no doc tree), **lite** (a feature → one collapsed `CHANGE-*.md`), **full**
(new product/subsystem → the whole trail). Over-ceremony is treated as a real
failure mode, not a virtue.

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

Then, in any agent: **"use spec-driven-development to build \<X\>"**. It will ask
your **interaction mode** (autopilot / copilot) and **size** (full / lite), or you
can say them up front: e.g. *"…in copilot mode, lite"*.

## See it in action

A full worked run lives in [`examples/wishlist/`](examples/wishlist/) — the
"Wishlist + shareable link" feature taken from idea to a spec-complete, secured,
fully-traceable plan (PRD, diagrams, FSD, ADRs, threat model, tiered backlog,
test plan, and an honest traceability matrix). Read it to see what each phase
actually produces before running the pipeline on your own work.

## Repo layout

```
sdd-pipeline/
├─ README.md
├─ AGENTS.md                # entry point for non-Claude agents
├─ .claude-plugin/          # Claude Code plugin + marketplace manifests
├─ skills/                  # 22 SKILL.md files (portable Markdown)
├─ templates/               # doc templates the skills fill in
├─ examples/wishlist/       # a complete worked run of the whole pipeline
└─ install/install.sh       # multi-agent installer
```

## Status

v0.1.0 — usable end to end. Contributions/adjustments welcome; the skills are
plain Markdown, so fork and adapt to your own conventions.

## License

MIT — see [LICENSE](LICENSE).
