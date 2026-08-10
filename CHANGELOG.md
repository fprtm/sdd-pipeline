# Changelog

All notable changes to SDD Pipeline. Versioning is [SemVer](https://semver.org/);
pre-1.0, so minors may still move fast. Plain-language where possible.

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

[0.5.4]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.4
[0.5.3]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.3
[0.5.2]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.2
[0.5.1]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.1
[0.5.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.5.0
[0.4.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.4.0
[0.3.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.3.0
[0.2.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.2.0
[0.1.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.1.0
