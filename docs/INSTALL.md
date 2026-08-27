# Installing SDD Pipeline

Two ways to install: the **plugin marketplace** (fastest, Claude Code only) or the **manual script** (works with any supported agent, more control).

---

## Option 1: Plugin Marketplace (Recommended for Claude Code)

Inside Claude Code, no terminal needed:

```
/plugin marketplace add fprtm/sdd-pipeline
/plugin install sdd-pipeline
```

That's it. SDD Pipeline registers as a plugin — the orchestrator (auto-triggers on coding tasks) and all 4 slash commands (`/sdd-pipeline:discover`, `/sdd-pipeline:spec`, `/sdd-pipeline:implement`, `/sdd-pipeline:check`) become available immediately.

**Note**: this method only sets up the skill/command layer. To also get the pre-commit hook, CI workflow, and `docs/sdd/` project files (glossary, decisions, plans, etc.), run the manual installer once with `--with-hooks --with-ci --with-templates` (see below) — it's safe to run alongside a plugin install.

---

## Option 2: Manual Install (Any Agent)

Use this if you're on Codex, OpenCode, Cursor, want project-scoped install, want only specific skill phases, or want enforcement hooks / CI / templates.

### Step 1 — Get the code

```bash
git clone https://github.com/fprtm/sdd-pipeline
cd sdd-pipeline
```

### Step 2 — Run the installer for your agent

| Agent | Command | Installs to |
|-------|---------|-------------|
| Claude Code (your user account, all projects) | `./install/install.sh --agent claude` | `~/.claude/skills/sdd/` |
| Claude Code (this project only) | `./install/install.sh --agent claude-proj` | `.claude/skills/sdd/` |
| Codex CLI | `./install/install.sh --agent codex` | `.agents/skills/sdd/` + `AGENTS.md` |
| OpenCode | `./install/install.sh --agent opencode` | `.opencode/skills/sdd/` + `AGENTS.md` |
| Cursor | `./install/install.sh --agent cursor` | `.cursor/skills/sdd/` + `AGENTS.md` |
| Any other agent | `./install/install.sh --agent generic --dest <dir>` | `<dir>` you choose |

Run this **from inside the project you want SDD Pipeline to guard**, not from the `sdd-pipeline/` clone itself — unless you're installing user-wide (`--agent claude`), in which case it doesn't matter.

> **Cursor note**: since Cursor's January 2026 Agent Skills release, Cursor natively discovers the same `SKILL.md` + frontmatter format used here, so `--agent cursor` installs into `.cursor/skills/sdd/` — the same shape as the `codex`/`opencode` targets, not a stripped-down orchestrator-only copy. If this project already has a `codex` install (`.agents/skills/sdd/`), Cursor discovers that too with zero extra steps, since it also scans `.agents/skills/` as a compatibility path. See `docs/ARCHITECTURE.md` §13 for the full cross-agent discovery comparison, including a note on the orchestrator's folder-name-vs-frontmatter alias this installer adds for OpenCode/Codex/Cursor discovery.

### Step 3 — Add project files (recommended)

```bash
./install/install.sh --agent claude --with-templates
```

Creates `docs/sdd/` in your project: `config.md`, `glossary.md`, `memory/INDEX.md`, `index.md`, and empty `decisions/`, `plans/`, `tickets/`, `reports/`, `specs/`, `test-plans/`, `dod/`, `stats/`, `erd/` directories. Without this, SDD Pipeline still works, but has nowhere to persist plans, decisions, or stats — it'll create these on first use anyway, so this step is just "set it up now vs. let it happen automatically."

### Step 4 — Add enforcement (optional)

```bash
./install/install.sh --agent claude --with-hooks --with-ci
```

- `--with-hooks` — installs a pre-commit hook (checks for secrets, missing scope declarations on large changes, security review on auth/payment code, oversized diffs, missing tests, missing decision log entry on large changes, and — regardless of whether a human or an agent is committing — any real source change with no accompanying `docs/sdd/{changes,plans,decisions,design,tickets}` record at all). Requires the current directory to be a git repo.
- `--with-ci` — copies a GitHub Actions workflow to `.github/workflows/sdd-check.yml` that runs the same class of checks on every PR.

You can combine every flag in one call:

```bash
./install/install.sh --agent claude --with-templates --with-hooks --with-ci
```

---

## Installing Only Part of SDD Pipeline

If you don't want the full install, use `--only` with a comma-separated list of phases (the orchestrator is always included on top of whatever you list — see below):

```bash
./install/install.sh --agent claude --only think,build
```

| Phase name | What it includes |
|------------|-------------------|
| `think` | elicitation, context-loader, scope-guard, complexity-analyzer, sdlc-detector, arch-analyzer, grill, threat-model, database-design, ux-design, stack-conventions, analytics-design |
| `build` | constraints, anti-patterns, change-plan, execution-guard, model-router, doc-generator, ticket-decomposition, test-plan, git-workflow, infra |
| `prove` | verification, adversarial, security-check, performance-check, report, coverage-check, browser-qa, judgment |
| `meta` | decision-log, comprehension, insight, health-check, memory, stats, glossary, traceability, handoff |
| `modes` | prototype, vibe, standard, strict, emergency |
| `constraints` | universal, web, cli, mobile, library, api |
| `agents` | orchestration, model-strategy, subagent-patterns, parallel-work |
| `commands` | the 5 standalone slash commands |

Shortcuts for common combinations:

```bash
./install/install.sh --agent claude --only security   # constraints + prove
./install/install.sh --agent claude --only quality     # build + prove
```

The orchestrator is always included regardless of `--only`, since every other phase depends on it.

---

## Verify the Install

```bash
cd sdd-pipeline   # the cloned repo, not your project
./scripts/validate-skills.sh
```

Should print `ALL CHECKS PASSED` and a count of skills found (60 in a full install — this counts every skill module, not just the 6 that register as invocable entry points; see `docs/ARCHITECTURE.md` §13 if that distinction matters to you). This checks skill files exist, have valid frontmatter, and that `plugin.json`'s skill registrations resolve — it validates the *source repo*, not what got copied into your project, so run it here if something seems off after installing.

---

## Updating

```bash
cd sdd-pipeline
git pull
./install/install.sh --agent claude --update
```

`--update` overwrites the installed skill files but leaves your project's `docs/sdd/config.md` (and everything else in `docs/sdd/`) untouched — your mode defaults, constraint overrides, and history are preserved.

If you installed via the plugin marketplace, update through Claude Code's own plugin update mechanism instead.

---

## Uninstalling

```bash
./install/install.sh --agent claude --uninstall
```

Removes the installed skill files, the pre-commit hook (if it was SDD Pipeline's), and the CI workflow (if present). **Does not** touch `docs/sdd/` in your project — your decisions, plans, and stats are left in place. Delete that directory manually if you want a full clean removal.

---

## Troubleshooting

**"Unknown option" or install fails immediately**
Check `./install/install.sh --version` — you may be running an old copy. `git pull` in the `sdd-pipeline/` clone first.

**Pre-commit hook not running**
`--with-hooks` requires the target directory to already be a git repository (`git init` first if it isn't). Check `.git/hooks/pre-commit` exists and is executable (`chmod +x`).

**Slash commands (`/sdd-pipeline:discover` etc.) don't show up in Claude Code**
These only register through the plugin marketplace path (Option 1) or if `.claude-plugin/plugin.json`'s `skills` array is picked up by your Claude Code version. The manual script's `--agent claude` install copies skill *content* for the model to read, but doesn't guarantee command registration — if you need the slash commands specifically, use the plugin marketplace method.

**Want to confirm what mode/config SDD Pipeline is using in a project**
Check `docs/sdd/config.md` in that project — if absent, SDD Pipeline is using defaults (standard mode, auto-detected domain/SDLC).
