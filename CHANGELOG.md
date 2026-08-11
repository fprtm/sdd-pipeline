# Changelog

All notable changes to SDD Pipeline. Versioning is [SemVer](https://semver.org/);
pre-1.0, so minors may still move fast. Plain-language where possible.

## [0.7.0] — 2026-08-11
Prompted by real, live feedback after the user ran the pack for actual work in a
production project (reviewed two real `CHANGE-*.md` outputs — a groomer/driver
idle-detection hardening fix and a point-duplication guard investigation with
real SQL diagnostics). The generated documents themselves were genuinely
solid — plain-language summaries, sequence diagrams, tiered backlogs, inline
decisions, honest de-scope notes — confirming the core pipeline works. The
feedback was about everything *around* that: skill files feeling long and less
independent than they claimed, losing track of the pipeline's mode across a
multi-turn conversation, confusion about how to invoke the dials in the moment,
and a missing git/commit skill.
### Added
- **`git-workflow`** (23rd skill) — commit granularity (one per ticket), a
  commit-message shape that references `TICKET-xxx`/`FSD-xxx`/`SEC-xxx` and
  explains *why*, branch naming, and a PR description generated from actual
  gate results instead of a template guess. Wired into phase 8 (commit as you
  go) and phase 11 (PR/changelog).
- **Explicit session-persistence instructions** in the orchestrator (and
  mirrored in `AGENTS.md`) — the deepest fix here. Skills aren't automatically
  "sticky" across conversation turns in most agent runtimes; a user reported
  the pipeline "forgetting" to stay in mode after a few follow-up questions.
  The orchestrator now explicitly instructs itself to keep governing every
  later message (not just the first), to always open with a one-line
  dial cheat-sheet so the controls are in front of the user without needing
  the docs, to restate its current phase/mode when there's ambiguity, and to
  log decisions **inline** even in `quick`/`lite` mode rather than skipping it
  because there's no separate `DECISIONS.md` in those modes (that file is a
  `full`-mode artifact — this was a real documentation gap, not a functional
  one: both real examples reviewed already had a "Decisions" section inline,
  the pack just never said plainly that's correct and sufficient for lite work).
### Changed
- **Softened "defers to mattpocock/superpowers" mentions** in `implement`,
  `debug`, and `code-review` — each said it twice (frontmatter + a body
  blockquote) and read as less self-sufficient than it actually is. Now one
  mention each, reframed to lead with "fully self-sufficient on its own" before
  the "prefer a specialized skill if also installed" note. The underlying
  behavior is unchanged — only the framing, which was the actual complaint
  (nothing was found that made this pack functionally non-independent).
- **Split `arch-decision`** the same way the orchestrator was split earlier
  (v0.5.0): a lean core (Step 1–4, the exit gate) plus a new `reference.md`
  holding the frontend-specific rigor, the FE/BE topology table, and the full
  worked ADR example — read only when there's a UI or a topology call to make.
  1134 → 597 mandatory words.
### Note
- The traceability-checker "not found" apology visible in the pre-0.6.0
  artifact reviewed here is exactly the bug **already fixed in 0.6.0**
  (co-located `check-traceability.mjs`) — it will not reproduce once the
  installed copy is updated (`git pull` + re-run the installer, or
  `/plugin update` if installed via Claude Code's marketplace).

## [0.6.0] — 2026-08-11
Root-cause fix for a bug a user hit live, running the pack for real via
OpenCode: the agent reported `docs/sdd/traceability.md` and
`tools/check-traceability.mjs` were "not present in this skill install" and
improvised an inline "lite" traceability note instead of running the real
checker. Traced to the exact unverified caveat flagged in 0.5.5 — the user was
using OpenCode's `skills` array pointed directly at the clone's `skills/`
folder (Option B), which doesn't carry sibling `templates/`/`tools/`
directories one level up.
### Changed (breaking for anyone scripting against the old layout)
- **Moved every skill-specific template and the traceability checker script
  INTO the skill folder that uses them**, matching Claude Code's own
  documented skill-authoring convention (`skills/<name>/SKILL.md` +
  co-located `reference.md`/`scripts/` — confirmed via
  `code.claude.com/docs/en/plugins-reference`, "Skill structure" section):
  - `templates/adr.template.md` → `skills/arch-decision/adr.template.md`
  - `templates/backlog.template.md`, `templates/estimate.template.md` →
    `skills/backlog-leveling/`
  - `templates/prd.template.md` → `skills/to-prd/prd.template.md`
  - `templates/threat-model.template.md` → `skills/threat-model/threat-model.template.md`
  - `templates/fsd.template.md` → `skills/to-fsd/fsd.template.md`
  - `templates/overview.template.md` → `skills/spec-driven-development/overview.template.md`
  - `templates/test-plan.template.md` → `skills/test-plan/test-plan.template.md`
  - `tools/check-traceability.mjs` → `skills/traceability/check-traceability.mjs`
    (its canonical home now; `infra` and `spec-driven-development` reference it
    as "bundled with the `traceability` skill" rather than a bare top-level path)
  - `templates/` at the repo root now holds only reference material no skill
    hard-codes a path to (`changelog`, `context`, `decisions`, `diagrams`,
    `stack-guide`, `traceability` templates); `tools/` is gone entirely.
- **This closes the bug for every install method at once**, not just the one
  that surfaced it — a bare `skills/` copy (or a config pointed straight at
  it, like OpenCode Option B) now carries everything each skill needs, with
  no separate templates/tools co-location step required.
- Simplified `install/install.sh`'s `copy_skills()` back to a plain `skills/`
  copy — the v0.5.1 special-casing for templates/tools is no longer needed,
  the root cause is fixed instead.
- Updated the repo's own CI (`.github/workflows/ci.yml`) to run the checker
  from its new path.
- Verified, not assumed: ran the checker from its new location against the
  wishlist example (clean), ran `install.sh generic` and confirmed every
  bundled file resolves at its new co-located path, and **directly simulated
  the user's exact failure** (copy only `skills/`, nothing else) — confirmed
  the checker is now found where it wasn't before. Full regression: wishlist
  suite green.

## [0.5.6] — 2026-08-11
### Added
- **"Updating" section in README** (and a matching FAQ entry in GUIDE.md) —
  closes a real gap: nowhere previously explained how an already-installed
  user gets updates. Verified per method, not assumed:
  - Claude Code `/plugin install`: `/plugin marketplace update` then
    `/plugin update sdd-pipeline@sdd-pipeline`. Confirmed against
    `code.claude.com/docs/en/plugins-reference`: this **only works if
    `plugin.json`'s `version` field is bumped** — Claude Code pins to that
    field and reports "already at the latest version" otherwise if it's
    unchanged, even with new commits pushed. This repo already bumps it every
    release (see this very file), so plugin-installed users do get updates —
    but it's worth stating plainly that the version-bump discipline isn't
    cosmetic, it's functionally required for `/plugin update` to do anything.
  - Every `install.sh`-based target (`claude`, `claude-proj`, `opencode`,
    `codex`, `generic`): these copy files, no live link — `git pull` +
    re-run the same installer command.
  - OpenCode Option B and the Cursor `AGENTS.md` pointer: `git pull` alone is
    enough, since both read live from the clone.

## [0.5.5] — 2026-08-11
Prompted by the user asking whether we should match superpowers' zero-clone
OpenCode install (a real `.opencode/plugins/superpowers.js` npm-style plugin —
fetched and read the actual file: it does message-injection bootstrapping and
OpenCode-specific tool-name mapping, real platform-specific runtime code, not a
small shim). Decision, stated plainly: **not replicated** — it would compromise
this pack's core design (plain `SKILL.md`, portable to every tool the same way,
zero runtime code to break or that I can't test from here) to save one `git
clone` step on a single tool. Instead, did the same doc-verification pass for
every other install target and found two more real bugs, plus one documented
alternative worth adding:
### Fixed
- **`install.sh cursor` was producing files Cursor never reads.** It copied
  `SKILL.md` into `.cursor/rules/sdd-pipeline/`. Verified against
  `cursor.com/docs/rules`: "*A plain `.md` file in `.cursor/rules` is ignored
  by the rules system*" — Cursor only reads its own `.mdc` Rules format there.
  Cursor's own documented plain-markdown fallback is `AGENTS.md`. `cursor`
  target now points `AGENTS.md` at the pack (same mechanism as `codex`)
  instead of copying files nothing would read.
- **`install.sh codex` under-delivered.** It only appended a note to
  `AGENTS.md`, never using Codex's real per-skill discovery. Verified against
  Codex's official docs (`developers.openai.com/codex/skills`, redirects to
  `learn.chatgpt.com/docs/build-skills`): Codex auto-scans `.agents/skills`
  (working dir up to repo root; `~/.agents/skills` globally) for `SKILL.md` —
  automatic, no `config.toml` registration needed. `codex` target now also
  copies into `.agents/skills` for real discovery, keeping the `AGENTS.md`
  pointer as a bonus.
### Added
- **`.agents/skills` is scanned by both Codex and OpenCode** — one install
  (`install.sh generic --dest ~/.agents/skills`) now covers both tools
  globally. Documented in the README/GUIDE install sections.
- **OpenCode Option B**: documented the verified `skills` array config
  (`{"skills": ["~/sdd-pipeline/skills"]}` in `opencode.json`, from
  `opencode.ai/v2/docs/skills`) as an update-friendlier alternative to
  `install.sh` — clone once, `git pull` to update, no re-copy. Note: the exact
  syntax is a flat array of path/URL strings, not the nested
  `{"skills":{"paths":[...]}}"` shape a community tool guessed; stated as
  unverified whether `templates/`/`tools/` resolve correctly this way, since
  it bypasses `install.sh`'s co-location — copy-based install remains the
  recommendation unless a user wants to verify this themselves.

## [0.5.4] — 2026-08-11
### Fixed
- **`marketplace.json` schema bug** — `description` and `version` were nested
  under a `"metadata"` object, but Claude Code's documented marketplace.json
  schema (code.claude.com/docs/en/plugin-marketplaces) puts both at the
  **top level**; the only recognized `metadata.*` field is `metadata.pluginRoot`.
  The nested values were likely silently ignored by Claude Code. Fixed by
  moving both to top-level keys.
### Verified (audit, prompted by the user asking to check Claude Code's own
docs the same way OpenCode's were checked)
- Fetched code.claude.com/docs/en/plugin-marketplaces directly and confirmed,
  field by field: `/plugin marketplace add owner/repo` (GitHub shorthand) and
  `/plugin marketplace add .` (local path) are both valid documented syntax;
  `/plugin install <name>@<marketplace>` matches the documented pattern;
  `plugin.json`'s fields (`name`, `version`, `description`, `author`, `license`,
  `keywords`) are all recognized; skills load from the `skills/` directory by
  default with no explicit declaration needed (confirmed — matches this repo's
  layout). Also confirmed `~/.claude/skills` (personal) and `./.claude/skills`
  (project) are real, documented mechanisms matching `install.sh`'s `claude`/
  `claude-proj` targets, with a **documented, deterministic precedence** order
  (enterprise > personal > project > bundled) when names collide — unlike
  OpenCode's undocumented same-name behavior noted in 0.5.3. No other changes
  were needed; the install commands were already correct.

## [0.5.3] — 2026-08-10
### Corrected (transparency note)
- **v0.5.2's OpenCode install instructions were wrong.** They recommended
  `{ "plugin": ["sdd-pipeline@git+https://..."] }` in `opencode.json`, reasoning
  "superpowers uses this same pattern and it's a comparable markdown-only pack."
  That reasoning was based on reading one superpowers doc page, not its actual
  repo — a user's own OpenCode session pushed back, and checking properly (the
  real `superpowers/package.json`, then OpenCode's own official docs at
  opencode.ai) confirmed the pushback was right: OpenCode's `plugin` array
  installs npm-style packages with real JS/TS code — superpowers ships an actual
  `.opencode/plugins/superpowers.js` runtime that registers its skills; this
  pack has no such code, only `SKILL.md` files, so that config would very
  likely register nothing.
- **The actually-correct, verified mechanism**: OpenCode natively auto-discovers
  plain `SKILL.md` folders with no config needed — `~/.config/opencode/skills/`
  (global) or `.opencode/skills/`/`.claude/skills/`/`.agents/skills/`
  (project-local). This is exactly what `install.sh` already did — the fix is
  documentation-only; `install.sh` was correct the whole time, just not
  confidently/correctly *described* as the primary path. README/GUIDE corrected
  accordingly, with an inline note explaining the mistake rather than silently
  swapping the text.
- Also documented plainly (previously unstated): OpenCode scans `~/.claude/skills/`
  too, so a Claude Code install of this pack is auto-picked-up by OpenCode with
  no extra step; and the real, still-open risk that OpenCode resolves skills by
  bare folder name with no documented namespacing, so this pack's more generic
  skill names (e.g. `code-review`) can collide with another installed pack's
  skill of the same name.

## [0.5.2] — 2026-08-10
### Fixed
- **Wrong recommended install path for OpenCode.** The README/GUIDE only
  documented `install.sh opencode` (clone the repo, run a shell script,
  `--dest` for global scope, manual restart, manual re-copy on every update) —
  a fallback we wrote by guessing OpenCode's skills directory, never verified
  against OpenCode's actual docs. OpenCode has its own native plugin manager
  that installs directly from a git URL (`{ "plugin":
  ["name@git+https://github.com/owner/repo.git"] }` in `opencode.json`, then
  restart) — the same pattern `obra/superpowers` documents and uses. Found
  because a user's own OpenCode install attempt looked unnecessarily manual;
  verified by reading superpowers' own OpenCode setup doc, a directly
  comparable markdown-only skills pack. README/GUIDE now document the native
  method as primary for OpenCode; `install.sh opencode` is kept as a labeled
  fallback for environments where the native mechanism isn't available.

## [0.5.1] — 2026-08-10
### Fixed
- **Installer dropped `templates/` and `tools/`** — 9 of 22 skills reference
  `templates/*.template.md` or `tools/check-traceability.mjs` by a pack-root-
  relative path, but `install/install.sh` only ever copied `skills/`, so every
  install target (`claude`, `claude-proj`, `cursor`, `opencode`, `generic`)
  silently produced dangling references. Found by a user's own install attempt
  via OpenCode, which had to improvise a manual workaround — not a real,
  repeatable "install from GitHub" flow. `copy_skills()` now copies
  `templates/` and `tools/` alongside the skill folders for every target;
  verified by actually running the installer and checking the files resolve.
  Known remaining gap: `--bundle` mode (a single concatenated markdown file)
  still can't carry sibling files — out of scope for a single-file format.

## [0.5.0] — 2026-08-10
Token efficiency, a self-sufficiency audit, and an honest correction.
### Changed
- **Orchestrator split** — `spec-driven-development/SKILL.md` cut from 3091 to
  1767 mandatory-load words (-43%); the team/role table, per-topology placement
  detail, and doc-currency rationale moved to a companion `reference.md`, read
  only on demand. Nothing was dropped — verified by diffing every skill
  reference between old and new.
- **Broadened the orchestrator's trigger description** so ordinary "add a
  feature / build X / fix this bug" requests invoke it (it right-sizes
  internally), not only requests that explicitly ask for rigor.
- Dropped the "not a rewrite, defers to mattpocock/superpowers" framing from the
  README — stale since `code-review`/`implement`/`debug` became self-sufficient,
  not defer-only.
### Fixed
- **Self-sufficiency audit** (all external-skill mentions checked): two real
  misattributions fixed — the glossary (`00-context.md`) is produced by this
  pack's own `discovery`, not the external `domain-modeling` skill it was
  wrongly credited to; the ship-phase row wrongly bundled this pack's own
  `handoff` with the genuinely-external `finishing-a-development-branch` under
  one "if present". Confirmed: every phase's primary skill is one of this
  pack's own 22 — zero hard external dependency.
- `tools/check-traceability.mjs` gained **duplicate-id detection** (the same id
  defined twice — a renumbering/copy-paste bug). Its first version had a real
  false-positive bug (a heading merely *citing* an id, e.g. "(ADR-005)" in
  parentheses, was misread as a second definition) — fixed by requiring the id
  to anchor the start of a heading/table row, not just appear in the line.
### Corrected (transparency note)
- An earlier commit claimed the trigger-description broadening was "validated
  via A/B subagent test." That validation was invalid: the test prompts named
  the skill pack directly, which primed the (haiku) test subagents to role-play
  reacting to a skill that was never actually installed in that environment,
  rather than genuinely exercising trigger matching. Caught by a third, more
  careful test run and corrected in the commit history rather than hidden. The
  description change itself stands on its own merits; the "validated" claim
  does not. Real trigger-accuracy evidence requires the pack to be genuinely
  installed somewhere — that's on the user's own test environment, not
  reproducible from here.

## [0.4.0] — 2026-08-10
Right-sizing, brownfield, anti-drift, and a usage guide — mostly from a critical
self-audit against real developer/vibe-coder pain points.
### Added
- **`map-codebase`** — the brownfield entry point: understand an EXISTING codebase
  (stack, module map, conventions actually in use, tests, seams, risks) before
  changing it. The pipeline now runs change-aware: `arch-decision` in
  respect-existing mode, work framed as changes, and characterization tests before
  altering legacy code. (Most real work isn't greenfield — this was the #1 gap.)
- **Stop-point dial** — `docs-only` (phases 0–7, no code), `spec+review` (spec then
  a checkpoint), `full-build` (default). Just want a plan? Stop at documents.
- **`quick` size** — tiny/low-risk changes get **no doc tree** (understand → fix
  test-first → done). `lite` collapses to one `CHANGE-<slug>.md`. Over-ceremony is
  now an explicit failure mode; the agent right-sizes and states its choice.
- **`tools/check-traceability.mjs`** — a zero-dependency validator that catches
  matrix drift (untracked spine ids, broken/typo refs, freelance tickets/tests,
  dead links). Wired into the `traceability` + `infra` skills and repo CI. It
  caught a real inconsistency in the worked example, now fixed.
- **`docs/GUIDE.md`** — a complete usage manual: the three dials (mode / size /
  stop-point) and how they combine, invocation, defaults, copy-paste recipes, a
  reference for all skills, file placement, guarantees, and an FAQ.
- Worked example gained a **runnable, tested backend** (`examples/wishlist/impl/`,
  54 tests, ~99% coverage) and a **brownfield change** (`CHANGE-clear-wishlist.md`)
  dogfooding lite mode on existing code.
### Changed
- **Consolidated `estimate` into `backlog-leveling`** (the tiers already drive the
  estimate) — one fewer skill to reason about; still writes `ESTIMATE.md`.
- README reworked: fixed the misleading "two ways to run it" into one coherent
  "three independent dials" section (source of the quick/lite/full vs
  autopilot/copilot confusion), refreshed layout, version, and status.

## [0.3.0] — 2026-08-08
Delivery, documentation, and tidiness.
### Added
- `estimate` — effort/cost from the tiered backlog (ranges + assumptions), for non-IT/PM.
- `debug` — systematic root-cause loop (reproduce→isolate→hypothesize→prove→fix→regression test); defers to installed debug skills.
- `documentation` — user guide (flows) + developer docs (inline JSDoc/docstrings, `api.md`, `architecture.md`, dev README).
- `decision-log` — append-only `DECISIONS.md` of every significant decision + the "why"; links to ADRs, marks autopilot defaults for review.
### Changed
- **Canonical, tidy output layout** — one home per artifact (`docs/sdd/`, `docs/user/`, `docs/dev/`); documented as the SSOT-for-location. No more scattered files.
- **Topology-aware doc placement** — for modular monolith / clean architecture (a README per module documenting its public ports), feature-sliced FE (README + user doc per slice), separate repos, or monorepo. Co-location + a top-level index keeps large codebases navigable.
- **Doc-as-you-go currency** — `implement` writes docs + JSDoc in the same ticket; `code-review` blocks public-interface/behavior changes with stale docs; `infra` adds a CI docs-drift check. Docs are no longer a one-time end-of-project act.

## [0.2.0] — 2026-08-08
Self-sufficiency, code quality, and full-team framing.
### Added
- Interaction **modes**: autopilot (autonomous full team, exhaustive up-front collection) and copilot (same rigor, pauses per gate); orthogonal full/lite size; modular use.
- `discovery`, `implement`, `infra` — the pack now runs discover→ship without external skills.
- `code-standards` — the SSOT/DRY/YAGNI/deep-module code bar ("ponytail" quality).
- `code-review` — self-sufficient two-axis review (Standards + Spec).
- `stack-conventions` — reads the chosen stack's official docs (Context7/web) and writes version-pinned rules to `04-stack-guide.md` (TS strict, Laravel conventions, …).
- `handoff` and `stakeholder-brief` — resumable snapshots for another agent/cheaper model; plain-language briefs + sign-off for non-IT.
### Changed
- Orchestrator gained a **role→phase map** (represents a full team) and the code-quality bar as an output contract; robust standard plugin manifest.

## [0.1.0] — 2026-08-08
Initial release.
### Added
- Gated, traceable Spec-Driven Development pipeline (PRD → diagrams → FSD → architecture → security/SSDLC → tiered backlog → test plan → verify → ship) with a traceability matrix and a tech-lead gate board.
- Stack-neutral, FE/BE/topology-aware; two-layer (dev + non-dev) docs.
- Portable SKILL.md skills + templates + multi-agent installer + Claude Code plugin/marketplace manifests.
- Worked example (`examples/wishlist/`): full spec set + a runnable, tested backend (zero-dep TypeScript on Node type-stripping, HTTP delivery, SSR shared page, infra-as-code; 50 tests, ~99%/96% coverage).

[0.7.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.7.0
[0.6.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.6.0
[0.5.6]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.6
[0.5.5]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.5
[0.5.4]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.4
[0.5.3]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.3
[0.5.2]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.2
[0.5.1]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.1
[0.5.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.0
[0.4.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.4.0
[0.3.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.3.0
[0.2.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.2.0
[0.1.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.1.0
