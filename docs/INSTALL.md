# Installing SDD Pipeline

Two installation paths serve different operational needs: the **plugin marketplace** for a managed skill/command install in Claude Code or Codex/ChatGPT, and the **manual script** for project-scoped files, enforcement, and any supported harness.

---

## Option 1: Plugin Marketplace (Claude Code or Codex/ChatGPT)

### Claude Code

Inside Claude Code, no terminal needed:

```
/plugin marketplace add fprtm/sdd-pipeline
/plugin install sdd-pipeline
```

### Codex / ChatGPT desktop app

Add the marketplace once, then install the plugin:

```bash
codex plugin marketplace add fprtm/sdd-pipeline
codex plugin add sdd-pipeline@sdd-pipeline
```

For a release already installed in Codex, refresh the marketplace and reinstall:

```bash
codex plugin marketplace upgrade sdd-pipeline
codex plugin add sdd-pipeline@sdd-pipeline
codex plugin list
```

Start a new task after reinstalling so the runtime loads the new skill set. The plugin cache version shown by `codex plugin list` is the installed version, not merely the repository version.

Both marketplace hosts install the orchestrator and the same eight explicit entry skills: discover, spec, implement, check, docs, learn, handoff, and update. Claude Code presents them as `/sdd-pipeline:*` commands; Codex exposes plugin skills through its own skill/command interface, so use the host picker or explicit skill mention if the exact slash syntax is not available.

**Note**: this method only sets up the skill/command layer. To also get the pre-commit hook, CI workflow, and the `docs/sdd/` project tree (`config.md`, `index.md`, `changes/`, `decisions/`, `reports/`, `specs/`, `stats/`, and `memory/`), run the manual installer once with `--with-hooks --with-ci --with-templates` (see below) — it's safe to run alongside a plugin install.

---

## Option 2: Manual Install (Any Agent)

Use this for project-scoped installation, OpenCode/Cursor and other harnesses, selective phases, or enforcement hooks / CI / templates. It is also the way to install the project artifacts that a marketplace plugin intentionally does not create.

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
| Hermes Agent | `./install/install.sh --agent generic --dest ~/.hermes/skills/sdd` (global) or `--dest skills/sdd` (project) | `~/.hermes/skills/sdd/` or `skills/sdd/` |
| OpenClaw | `./install/install.sh --agent claude-proj` (same `SKILL.md` format, zero changes) | `.claude/skills/sdd/` |
| Antigravity CLI (Gemini's successor) | `./install/install.sh --agent codex --dest .agents/skills/sdd` | `.agents/skills/sdd/` |
| DeepSeek (Deep Code / DeepSeek-TUI) | `./install/install.sh --agent codex --dest .agents/skills/sdd` (same format, confirmed compatible) | `.agents/skills/sdd/` |
| Any other agent | `./install/install.sh --agent generic --dest <dir>` | `<dir>` you choose |

All of the above install the exact same `SKILL.md` files — the "Agent Skills" format (`SKILL.md` + YAML frontmatter) is a shared open standard across every harness in this table as of 2026, not something sdd-pipeline maintains separately per agent. Only the *discovery path* differs; nothing in the skill content changes between rows.

**One reliability note, not a format difference**: skills here lean on cross-referencing each other (one skill saying "see X for how to ask") to avoid duplicating rules seven times over. Every harness *can* resolve that, but not all of them resolve it with the same consistency at every reasoning-effort tier — if a harness seems to skip steps a stronger model on the same harness wouldn't, that's usually this, not a missing feature. The framework's mechanical checkers (`check-file-hygiene.mjs`, `check-traceability.mjs`, `check-parallel-safety.mjs`, `check-retirement.mjs`) exist precisely because they don't depend on any model chasing a reference chain correctly — run them via `--with-hooks`/`--with-ci` (Step 4 below) on any harness where this is a concern; they catch what got missed regardless of which agent wrote the file.

Run this **from inside the project you want SDD Pipeline to guard**, not from the `sdd-pipeline/` clone itself — unless you're installing user-wide (`--agent claude`), in which case it doesn't matter.

> **Cursor note**: since Cursor's January 2026 Agent Skills release, Cursor natively discovers the same `SKILL.md` + frontmatter format used here, so `--agent cursor` installs into `.cursor/skills/sdd/` — the same shape as the `codex`/`opencode` targets, not a stripped-down orchestrator-only copy. If this project already has a `codex` install (`.agents/skills/sdd/`), Cursor discovers that too with zero extra steps, since it also scans `.agents/skills/` as a compatibility path. See `docs/ARCHITECTURE.md` §13 for the full cross-agent discovery comparison, including a note on the orchestrator's folder-name-vs-frontmatter alias this installer adds for OpenCode/Codex/Cursor discovery.

### Step 3 — Add project files (recommended)

```bash
./install/install.sh --agent claude --with-templates
```

Creates the bounded `docs/sdd/` tree: `config.md`, `glossary.md`,
`memory/INDEX.md`, `index.md`, and the current `decisions/`, `reports/`,
`specs/`, `stats/`, and `changes/` directories. Feature-owned docs and tickets
are created lazily inside `specs/{NNN}-{slug}/`; `design-system/` is also
created lazily with its required `design.md`. Deprecated
top-level `tickets/`, `design/`, `erd/`, and `test-plans/` directories are not
scaffolded.

### Step 4 — Add enforcement (optional)

```bash
./install/install.sh --agent claude --with-hooks --with-ci
```

- `--with-hooks` — installs a pre-commit hook (checks for secrets, missing scope declarations on large changes, security review on auth/payment code, oversized diffs, missing tests, missing decision log entry on large changes, and — regardless of whether a human or an agent is committing — any real source change with no accompanying `docs/sdd/{changes,decisions,specs}` record at all). Requires the current directory to be a git repo.
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
| `prove` | verification, adversarial, diagnose, performance-check, report, coverage-check, browser-qa, judgment |
| `meta` | decision-log, comprehension, insight, health-check, artifact-lifecycle, memory, stats, glossary, traceability, handoff |
| `modes` | prototype, vibe, standard, strict, emergency |
| `constraints` | universal, web, cli, mobile, library, api |
| `agents` | orchestration, subagent-patterns, parallel-work |
| `commands` | the 8 standalone slash commands plus their path-loaded runtime dependencies (all internal phases); the public surface remains exactly 8 |

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

Should print `ALL CHECKS PASSED` and a count of skills found (currently 64 in a full install — this counts every module, not just the 9 registered entry points: the orchestrator plus 8 commands). This checks skill files exist, have valid frontmatter, and that `plugin.json`'s registrations resolve — it validates the source repo, not what got copied into your project.

---

## Updating

From inside an active session, `/sdd-pipeline:update` (`skills/commands/update/`) is the recommended path — it reads the installed vs. latest version, shows the actual CHANGELOG diff (not just a version number), flags any breaking/migration entries, and asks for confirmation before applying anything.

Manually, the equivalent is:

```bash
cd sdd-pipeline
git pull
./install/install.sh --agent claude --update
```

`--update` overwrites the installed skill files but leaves your project's `docs/sdd/config.md` (and everything else in `docs/sdd/`) untouched — your mode defaults, constraint overrides, and history are preserved. Read `CHANGELOG.md` yourself for the diff before running this manually — the `/update` skill exists specifically so you don't have to remember to do that.

If you installed via a plugin marketplace, use that host's marketplace update path instead: Claude Code's plugin UI, or the Codex commands shown above. Do not mix a manual `--update` with a marketplace cache and assume both targets changed.

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
