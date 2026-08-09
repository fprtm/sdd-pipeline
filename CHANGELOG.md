# Changelog

All notable changes to SDD Pipeline. Versioning is [SemVer](https://semver.org/);
pre-1.0, so minors may still move fast. Plain-language where possible.

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

[0.4.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.4.0
[0.3.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.3.0
[0.2.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.2.0
[0.1.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.1.0
