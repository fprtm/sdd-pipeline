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
0 Discover ─▶ 1 PRD ─▶ 2 Diagrams ─▶ 3 FSD ─▶ 4 Architecture ┐
                                                              ▼
        ship ◀─ 9 Verify ◀─ 8 Implement ◀─ 7 Test plan ◀─ 6 Backlog ◀─ 5 Security
              (coverage≥80%,                (happy/regression/    (tiered   (STRIDE,
               review, threat                edge/e2e)             tickets)  SSDLC)
               re-check)
```

Each box is a skill in `skills/`. The orchestrator is
[`spec-driven-development`](skills/spec-driven-development/SKILL.md) — start
there and it routes the rest.

## Skills in this pack

| Skill | Role | New / defers |
|-------|------|--------------|
| `spec-driven-development` | orchestrator + gates + routing | **new** |
| `to-prd` | Product Requirements (REQ-xxx) | **new** |
| `to-diagrams` | context / DFD / sequence / ERD (Mermaid) | **new** |
| `to-fsd` | Functional Spec (FSD-xxx) | **new** |
| `arch-decision` | architecture + stack + topology gate (ADR) | **new** |
| `threat-model` | SSDLC security gate (SEC-xxx, STRIDE) | **new** |
| `backlog-leveling` | tiered, executor-friendly backlog | **new** |
| `test-plan` | happy/regression/edge/e2e + coverage target | **new** |
| `coverage-check` | verify-gate coverage enforcement | **new** |
| `traceability` | the single-source-of-truth matrix | **new** |
| TDD / debug / review / worktrees / finish | phases 8–10 | **defers** to your installed skills |

## Install

### Claude Code (plugin)

```bash
# from a clone of this repo, add it as a local marketplace, then install
/plugin marketplace add ./sdd-pipeline
/plugin install sdd-pipeline@sdd-pipeline
```

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

Then, in any agent: **"use spec-driven-development to build \<X\>"** (full mode)
or **"…lite mode"** for a small feature/bugfix.

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
├─ skills/                  # 10 SKILL.md files (portable Markdown)
├─ templates/               # doc templates the skills fill in
├─ examples/wishlist/       # a complete worked run of the whole pipeline
└─ install/install.sh       # multi-agent installer
```

## Status

v0.1.0 — usable end to end. Contributions/adjustments welcome; the skills are
plain Markdown, so fork and adapt to your own conventions.

## License

MIT — see [LICENSE](LICENSE).
