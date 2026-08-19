# Changelog

All notable changes to SDD Pipeline. Versioning is [SemVer](https://semver.org/);
pre-1.0, so minors may still move fast. Plain-language where possible.

## [2.1.1] — 2026-08-19
### Fixed
- Plugin/marketplace author credit: `ferryaguspratama` → `FerryPratama`.

## [2.1.0] — 2026-08-19
Three post-release upgrades from Ferry's review of v2.0.0, all aimed at agent
speed (cheap orientation, clear coordination) rather than new gates.
### Changed — memory is a knowledge graph, not a flat list
- `docs/sdd/memory.md` (flat, max-50) → `docs/sdd/memory/` — Obsidian-style
  linked notes + `INDEX.md` map, restoring the old pack's `project-memory`
  structure (the one audit call that deserved reversing: the *function* was
  redundant, the *structure* was superior). One durable fact per note,
  `[[wikilinks]]`, index-first reads: a session orients from a few hundred
  tokens instead of a full repo re-scan. Both memory jobs merged: codebase
  knowledge (modules/concepts/gotchas) AND answered-question notes
  (conventions/preferences/overrides) live in one graph.
- `templates/index.md` now mandates the row format (`file — one-line
  description · status`) that makes index-first matching actually work.
- `check-file-hygiene.mjs` verifies the graph: note naming, `description:`
  frontmatter, every note listed in `memory/INDEX.md` (unindexed = invisible).
### Added — ticket kanban + board view
- Ticket `Status` is now a real kanban: `⬜ todo → 🔨 in progress → 🧪
  testing/review → ✅ done` (+ `⛔ blocked`, with a reason). 🧪 is the
  multi-agent handoff state: implementation agents flip to it when the PR
  opens; a review agent picks 🧪 tickets up concurrently.
- `check-parallel-safety.mjs --board` prints the live board (lanes, titles,
  who claimed what, deps on todo items) — one glance answers "who's doing
  what" without opening every ticket file.
- GitHub Issues mirror sync specified: status labels updated in the same
  breath as the local edit; issue closes when the ticket hits ✅. Local files
  stay the SSOT.
### Added — Deliverables manifest in tickets
- New `## Deliverables` section in the ticket format: `file → function/
  component born there` — the what-will-exist manifest at a glance, no
  implementation code, complementing `Files likely touched:` (which feeds the
  parallel-safety check) and the FSD (which stays path-free).

## [2.0.0] — 2026-08-19
**Engine transplant.** v2 is a new machine, not an upgrade: the adaptive-depth,
judgment-first engine developed as **Reins** (v0.4.0, 49 skills + 5 commands)
replaces the old 11-phase gated architecture wholesale. v0.33.0 was the last
release of the old generation; it lives on in git history. Positioning:
**spec in front, judgment behind** — control over, and trust in, AI-generated
code that lands faster than you can review it.
### The new engine (from Reins)
- Fixed sequence ask → spec → plan → build → check; depth adapts to task size
  (micro/small/medium/large), never the order. DoD floor for every small+ task.
- AI-output **judgment gate** (research-grounded): weakest point named in every
  report, hallucination-risk zones, security escalation for AI code in risky
  zones even when checks pass, review-capacity throttle.
- 5 modes (prototype/vibe/standard/strict/emergency), SDLC detection,
  arch-analyzer (deletion test, adapter-count, design-it-twice), SDD Grill,
  rule-of-three decision log, glossary, numbered docs with required Mermaid,
  session persistence, multi-agent orchestration (hard cap 6), 5 slash commands
  (`/sdd-pipeline:brainstorm|discover|design|implement|check`).
### Absorbed from the old pipeline (the audit's 16 ABSORB items)
- **ID spine (hybrid)** — numbered doc files ARE their spine IDs (FSD-003 =
  `003-x-fsd.md`, decisions 005 = ADR-005); REQ/SEC/TICKET/TEST stay item-level
  global; sub-IDs (FSD-003.2) for fine links.
- **Traceability** — matrix + ship gate, size-gated (full at large/full, lite
  inline at medium), `check-traceability.mjs` rewritten for the v2 tree
  (recursive, filename-based definitions, sub-ID resolution).
- **Threat model** (THINK-phase STRIDE, SEC-xxx controls) paired with the
  existing PROVE security checklist; **coverage gate** ≥80% + honesty checks;
  **test plan** with 5 classes and the **LOCAL-only hard stop** (never run
  tests/browser QA against anything that might be production); **browser-qa**;
  **git-workflow** (traceable commits/PRs, always English).
- **parallel-work** — worktree isolation + `check-parallel-safety.mjs`
  (retargeted to the tickets/ tree) + always-confirm-before-spawn; ticket
  format gains Tier/Status/Dependencies/Files-likely-touched/Claimed-by and a
  durability exemption (tickets carry real paths; FSD/SDD/PRD stay path-free).
- **`check-file-hygiene.mjs` rewritten** for the v2 tree (+ `changes/` — one
  dated self-contained file per small/medium topic — and `ux-screens/`).
- New skills: infra (CI gates incl. both checkers), database-design,
  stack-conventions, ux-design (process, not taste), analytics-design, handoff.
- Absorbed rules: tickets local-first with optional GitHub Issues mirror
  (asked, never assumed) · docs follow the user's language, code artifacts
  English · index-first reading · design-only as a complete honest stop point ·
  arch proposals pin the real directory tree + FE↔BE contracts · docs/user vs
  docs/dev split with doc-as-you-go.
### Removed
- The old 30-skill/11-phase pack (11 redundant vs the new engine, 3 skipped:
  self-update, old installer, stakeholder-brief), the wishlist example, and the
  old repo CI that depended on them (replaced with validate-skills + script
  syntax checks).

## [0.33.0] — 2026-08-14
User caught a real gap: `docs/user/` and `docs/dev/` — canonical since early in
this pack's life — didn't actually exist in xplorenusa, even though the gate
board claimed "user/developer guide written." The content existed
(`docs/user-guide.md`, `docs/developer-guide.md`), just at the wrong location —
a self-check that only verified "does guide-shaped content exist somewhere"
instead of the actual canonical path. Same probabilistic-instruction class of
bug this pack has repeatedly closed with a script.
### Added — `check-file-hygiene.mjs`: verifies docs/user/ and docs/dev/ actually exist
- If `04-ux-design.md` exists (there's a UI), `docs/user/` must exist with ≥1
  file. If `04-architecture.md` exists (a real build), `docs/dev/` must exist
  with ≥1 file. Any stray `.md` sitting directly in `docs/` (outside
  `sdd/`/`user/`/`dev/`) is flagged as likely misplaced.
- Verified against xplorenusa's real state — correctly found all 7 real
  problems (missing `docs/user/`, missing `docs/dev/`, and 5 stray files
  including `docs/user-guide.md`/`docs/developer-guide.md` themselves) — and
  against the wishlist example, which turned out to have the **same real gap**
  (no `docs/dev/`) — fixed by dogfooding: added
  `examples/wishlist/docs/dev/{README,architecture}.md`, pointing at the
  existing `impl/README.md` and the ADRs rather than duplicating them.
  Verified accurate against the actual `impl/src/` layout, not guessed.
- `documentation`'s exit gate now says to run the checker — "the gate board
  says it's written" isn't enough, the checker confirms it landed in the
  canonical place.

## [0.32.0] — 2026-08-14
User asked directly: is there really no technique to make `parallel-work`'s
"which tickets are safe to parallelize" step automatic instead of eyeballing
the backlog by hand? Answer grounded in what's actually possible: the
Agent-tool spawn itself always needs an agent turn to invoke it (no script can
call it unattended), but the *safety judgment* is genuinely mechanical and was
being done by reading, not by rule — so make it a deterministic script, same
backstop pattern as every other checker this pack ships.
### Added — `check-parallel-safety.mjs`, bundled with `parallel-work`
- Zero-dep script: parses `06-backlog.md`, finds tickets eligible to start now
  (not done, not claimed, dependencies met), and computes **strict-safe
  clusters** (zero file overlap between `Files likely touched` lists) plus
  **near-safe pairs** (a small shared file, flagged for a human call rather
  than silently included or excluded) — replacing manual list-comparison with
  the same check, run mechanically. Verified against real data (xplorenusa's
  actual 115-ticket backlog — correctly excluded the two tickets this
  session's live demo had already completed, correctly unblocked a
  previously-dependent ticket, correctly flagged the same shared-file case
  found by hand earlier) and a synthetic backlog covering every branch (done,
  blocked-dependency, already-claimed, strict cluster, near-safe pair, solo).
- `parallel-work` §2 now leads with running this script; its plan is the
  starting point, not a hand-picked guess.
### Changed — spawning always requires explicit confirmation, every mode
- New rule, deliberately stricter than the pack's usual autopilot-batches
  default: **present the checker's plan and get an explicit yes before
  spawning any agent, in autopilot and copilot alike** — committing several
  background agents at once is a real resource decision, not a routine one.
### Fixed — merge-trial belongs in its own worktree too
- Grounded in a real incident this session: trial-merging in the repo's main
  checkout raced with another concurrent session actively using that same
  directory, and a `git checkout` from that other session silently moved
  `HEAD` mid-trial. §5 now says the merge-and-verify step must also run in its
  own worktree, never the main checkout — same isolation guarantee as every
  other step in the protocol, no exception for "just a trial."

## [0.31.0] — 2026-08-14
A full grilling session (`/mattpocock-skills:grilling`, 2 rounds, 9 questions) on
two real, unresolved problems: running several agents on the same repo without
fear of forking/conflict, and UX-design output quality. Two verified facts
grounded the design tree before any question was asked: (1) OpenCode's own
subagents are **sequential child sessions**, not concurrent workers — verified
against `opencode.ai/docs/agents`, not assumed; (2) a direct re-read of
xplorenusa's real `04-ux-design.md` showed the wireframe *content* was already
detailed (why-per-element, breakpoints, device strategy) — the actual gap,
confirmed by the user, was findability/clarity, not depth.
### Added — `parallel-work` skill (30th): several agents, one repo, no forking
- Git **worktree** isolation (shares history, isn't a fork) instead of separate
  clones. **Vertical-slice-per-operation** ticket assignment, not layer-split
  (2 BE/2 FE) — independently mergeable, no cross-agent waiting.
- **File-overlap is the actual parallel-safety test**, not a guess — two
  tickets are only parallel-safe if their `Files likely touched` lists don't
  intersect (real example from xplorenusa's own backlog documented as the
  worked case: two "independent-looking" adapter tickets both needed the same
  `notification.module.ts` factory — not parallel-safe once checked).
- Lightweight **`Claimed by:`** ticket field (new in `backlog.template.md`) so
  two agents never silently duplicate work.
- **Roles clarified**: `test-plan` is upstream (phase 7, before implementation
  agents start), not a concurrent peer; `code-review` genuinely is
  concurrent-compatible. Merge in wave-dependency order through the normal
  per-ticket review/PR flow.
- **Runtime-honest**: the protocol works manually on any runtime; on Claude
  Code specifically, its `Agent` tool (`isolation: "worktree"`,
  `run_in_background`) can execute it directly. Never implies automated
  parallelism a runtime doesn't actually have.
### Changed — `ux-design`: index-first per-flow files, not one mega-section
- **One file per flow** (`docs/sdd/ux-screens/<flow-slug>.md`), frontmatter
  `description` + `priority` (`Must`/`Should`/`Could`) — `04-ux-design.md` §3
  becomes a thin index. Same topic-scoping fix already applied to
  `changes`/`decisions`/`memory`, now applied to wireframes (50 screens in one
  530-line section was genuinely unfindable, even though the content was good).
- Per screen, "fully detailed" now also requires an **interaction/behavior
  spec** (what happens on tap/validation/edge case) beyond the screen-level
  states — a layout with no interaction spec is only half-specified.
- **§0 strengthened**: direction options now need a **concrete preview each**
  (a real sample, not just a style label — a named style with nothing to look
  at isn't a real choice), and **check-in happens per flow**, not once at the
  start with the rest produced silently in one batch.
- `check-file-hygiene.mjs` extended to validate `ux-screens/` (filename,
  `description`/`priority` frontmatter, indexed in §3) — same backstop pattern
  as `changes`/`decisions`/`memory`.
- Skill roster, modular table, README/GUIDE catalogs, workspace-layout tree
  updated. Count 29 → **30**.

## [0.30.0] — 2026-08-14
User asked for a real option on backlog tickets: write locally, or also mirror to
GitHub Issues.
### Added — `backlog-leveling`: ask where tickets live (local vs. GitHub Issues mirror)
- New "Where do tickets live?" step, asked before writing tickets (native
  question tool): **local file only** (default, `docs/sdd/06-backlog.md`) or
  **also mirror to GitHub Issues**.
- **The local backlog stays the traceability SSOT regardless** — GitHub Issues,
  when chosen, is a linked mirror (assignable/labelable/commentable on the
  repo's own board), never a second source of truth to reconcile later.
- **Capability checked before promising it**: `gh auth status` + `gh repo view`;
  falls back to local-only and says so if either fails — same honest-gap pattern
  as `browser-qa`.
- **Confirmed before creating** — bulk-creating issues is a visible, external
  action (same category as posting to any external service); shows titles +
  count and gets a yes first, especially the first batch.
- Each mirrored issue carries the ticket's full self-contained body (so it's
  usable standalone on GitHub too), a tier label, and `Refs: TICKET-xxx,
  FSD-xxx`; the resulting issue number is recorded back into the local ticket
  (new `GitHub Issue:` field in `backlog.template.md`) — the link always goes
  both ways.
- `git-workflow`'s commit template gained an optional `Closes #<issue>` line for
  when a ticket was mirrored. Exit gate updated to require this was confirmed,
  not assumed.

## [0.29.0] — 2026-08-14
Real bug, live evidence: the user ran `self-update` from inside a project-scoped
OpenCode install (`.opencode/skills/self-update`) and the agent had to resort to
manually `find`-ing for a `plugin.json` across several directories — a clear sign
`check-update.mjs` was failing silently. Root cause: **`install.sh` copies only
the `skills/` subtree, never `.claude-plugin/`** — so every skills-only install
(project or global OpenCode/Claude/Codex — by far the most common install
method) has **no `plugin.json` anywhere**, and `check-update.mjs` had no other
way to learn the local version or the remote repo URL.
### Fixed — `check-update.mjs` now works for a skills-only install (the common case)
- New bundled **`skills/self-update/VERSION`** — a plain-text version file living
  *inside this skill's own folder*, so it travels with every install method
  (skills-only copies included) the same way any other skill-bundled file does.
  This is now the primary local-version source; `.claude-plugin/plugin.json` is
  still read as a fallback (and its source for the repo URL) when it's actually
  present — a full clone / the Claude Code marketplace clone.
- Added a **default repo constant** so remote resolution no longer depends on
  `plugin.json` existing at all — `--repo` still overrides it.
- Removed the old hard failure ("could not determine the remote repo") that
  fired on every skills-only install; a sensible default now makes that path
  unreachable in practice.
- `self-update`'s own SKILL.md corrected — it described reading version from
  `plugin.json` alone, the same stale assumption that caused the bug.
- Verified by simulating a real skills-only install (skills/ copied with no
  `.claude-plugin/` anywhere near it, matching `.opencode/skills/self-update`
  exactly) — previously failed, now reports correctly.
### Also — repo audit for hardcoded paths / sensitive info (nothing found)
- User asked to check the whole pack for machine-specific hardcoded paths or
  sensitive data (would break for anyone else installing it) — audited all
  tracked files and all 54 commit messages: no hardcoded paths, no leaked email,
  no secrets. All bundled scripts already resolve paths dynamically
  (`homedir()`, `process.cwd()`, `import.meta.url`) — genuinely portable.

## [0.28.0] — 2026-08-14
Explicit fallback mitigation for every "prefer an installed X skill" pattern
(TDD/code-review/debugging/UI-UX) — user asked directly: what if the named
example (e.g. `ui-ux-pro-max`) isn't actually installed?
### Changed — named external-skill examples are illustrative, never assumed present
- Orchestrator's "How to route": **named examples are illustrative, not assumed
  present** — check what's actually available rather than guessing from the
  name; don't stall, don't ask the user to confirm an install, don't claim to
  have used a skill that isn't there. **If it isn't installed, this pack's own
  version runs the phase completely, automatically, with no missing step** —
  restated as the self-sufficiency *guarantee*, not a degraded fallback.
- `ux-design` mirrors it locally: check the skill is actually available before
  assuming so; if none is installed, do the whole thing yourself (§§1–6 need no
  external tool — already fully self-sufficient).

## [0.27.0] — 2026-08-14
Caught immediately after shipping v0.26.0's "prefer an installed UI/UX skill":
tested live on `xplorenusa`, and `ui-ux-pro-max` (correctly preferred) wrote its
`design-system/xplorenusa/MASTER.md` at the **repo root**, outside `docs/sdd/` —
because that tool has its own hardcoded output convention
(`design-system/<slug>/`) that "prefer it" didn't reconcile with this pack's own
"one home per artifact, never scatter files" rule. (The wireframes themselves
were fine — all 50 screens + why-per-screen landed correctly inside
`04-ux-design.md` as designed; only the raw token-source file escaped the tree.)
### Fixed — `ui-ux-pro-max`'s (or similar) output now stays inside docs/sdd/
- `ux-design`: **pass `--output-dir docs/sdd`** when invoking `ui-ux-pro-max`, so
  its `design-system/<slug>/MASTER.md` + `pages/` land at
  `docs/sdd/design-system/<slug>/` instead of the repo root. `04-ux-design.md`
  still carries the actual tokens + wireframes and must cite `MASTER.md` as SSOT.
- Documented that an **empty `pages/` folder is expected, not a bug** —
  `ui-ux-pro-max` creates a page-override file lazily, only once that page is
  actually built (phase 8), not upfront for the whole wireframe set. (This was
  the second thing the user couldn't explain from the output alone.)
- Added `design-system/` to the orchestrator's canonical workspace-layout tree
  as the documented home for an external UI/UX skill's own SSOT output.
- General lesson, stated for next time: preferring an external skill (any
  skill, not just UI/UX) means deferring to its *process*, never to *where its
  files land* — that still has to resolve inside the canonical tree.

## [0.26.0] — 2026-08-14
`ux-design` skipped straight to producing artifacts — no check-in on whether the
user even wants wireframes made, what design language they want, or how much
detail — and wireframes had no requirement to explain *why* a screen was laid
out that way. Real gap: every other consequential decision in the pipeline is
confirmed or explained before/while being made; UX direction wasn't.
### Added — `ux-design`: confirm direction first, explain wireframe decisions
- **New §0 "Confirm direction first"** — before writing anything, ask (native
  question tool): (1) is there already a design to follow (brand guide, Figma,
  reference app, existing design system) — if so, **respect-existing** like
  `arch-decision` does for architecture, don't reinvent; (2) if starting fresh,
  which design direction (2–3 concrete options + a recommendation, e.g.
  minimal/utilitarian vs expressive/brand-forward vs "match this reference"),
  light/dark preference, brand constraints; (3) how much wireframe detail —
  structure-only vs fully detailed. Answers recorded at the top of
  `04-ux-design.md`; §1's principles are now derived from them, not invented
  independently.
- **§3 wireframes now has two explicit depths**: structure-only (the prior
  behavior, default for `quick`/`lite`) or **fully detailed** — every
  section/component named, spacing/hierarchy tied to the design tokens, and a
  short **"why"** per screen (layout/hierarchy/primary-action reasoning, the
  main alternative rejected if any) — the same "explain what you decide" rule
  the rest of the pipeline already holds to, made concrete for UX.
- Exit gate now requires direction was confirmed (not assumed) and, when full
  detail was asked for, that each screen states its rationale.
- **Prefer an installed specialized UI/UX skill if present** (e.g.
  `ui-ux-pro-max` — searchable style/palette/typography/a11y data), same pattern
  as `implement`/`code-review`/`debug` preferring an installed TDD/review/
  debugging skill — treat this skill's rules as the checklist to hold it to.
  Mirrored in the orchestrator's routing section.

## [0.25.0] — 2026-08-14
Backlog sequencing + to-do freshness, from real friction: "kadang ga update
dengan real todonya" (the live to-do sometimes drifts from what's actually
done) and a concrete example — a CRUD user feature — where the fix is really
about *how the backlog is ordered*, not just a stronger reminder.
### Added — `backlog-leveling`: foundation first, then one vertical slice at a time
- For a feature with several similar operations (CRUD being the classic case;
  also multiple report types, notification channels, …): **one foundation
  ticket first** (only if genuinely shared and not already there — the
  type/interface/schema every operation needs; still YAGNI, don't
  speculative-design what no operation needs yet), **then one ticket per
  operation, each a complete vertical slice** (route → service → domain →
  tests → docs for *that one operation*, shippable) before the next operation
  starts. Explicitly **not** layer-by-layer ("all four routes" then "all four
  services") — that leaves every operation simultaneously half-done, which is
  exactly what makes progress hard to see and a to-do list drift from reality.
### Changed — `implement` respects the slice order + to-do freshness is concrete
- New rule: finish the current operation's vertical slice completely (tests
  green) before touching the next operation's ticket, even if it looks quick —
  don't leave two operations half-built at once.
- **"Keep the trail honest as you go" now says exactly when to update the live
  to-do**: the moment state actually changes (ticket started, criterion green,
  ticket done, new work discovered) — not batched to end-of-turn. A stale entry
  is worse than none. Mirrored (tightened) in the orchestrator's existing
  live-to-do bullet and in `AGENTS.md`, plus the new slice-ordering principle.

## [0.24.0] — 2026-08-14
Grounded in a real accident: `xplorenusa`'s `.opencode/skills/` (37 files) had been
committed since the initial commit — nobody decided that, `install.sh opencode`'s
default output path just landed inside a `git add -A`. After a refresh, `git
status` showed 14 unrelated "modified" skill files mixed into the project's own
diff — noise, not signal.
### Changed — `install.sh` excludes a project-scoped install from git by default
- After copying skills into `claude-proj`, `opencode`, `codex`, or a `generic
  --dest` **inside a git repo**, the installer now auto-appends the destination
  to that repo's `.gitignore` (idempotent — checks first, never duplicates).
  Installed skills are tooling, not app code; committing them turns every pack
  update into an unrelated diff in the project's own history.
- **New `--vendor` flag** opts out — for a team that deliberately wants an exact
  methodology version pinned and committed (like a lockfile) across every
  teammate/CI run. Skips the auto-gitignore entirely.
- **If the destination was already tracked** (the `xplorenusa` situation), the
  installer does **not** silently untrack it (that's a real git-history action,
  not a default to sneak in) — it adds the `.gitignore` entry (so new files stop
  being caught) *and* prints the exact count and the `git rm -r --cached …`
  command to run if the user wants to stop committing them.
- No-ops cleanly outside any git repo (global installs like `~/.claude/skills`,
  `~/.config/opencode/skills`) and with `--vendor`. Verified with 5 scenarios in
  a scratch repo: fresh install, idempotent re-run, already-tracked warning,
  `--vendor` skip, and a non-repo destination.
- README's Install section documents the default + the trade-off.

## [0.23.0] — 2026-08-14
Make the browser capability set itself up, and fix a schema bug caught by
verifying against primary docs (the recurring lesson: never trust one secondary
source for an integration config).
### Fixed — wrong OpenCode MCP schema in v0.22's setup doc
- v0.22's `docs/browser-qa-setup.md` nested the server under `mcp.servers.<name>`
  (copied from a secondary source). Verified against
  [opencode.ai/docs/mcp-servers](https://opencode.ai/docs/mcp-servers): the real
  schema is `mcp.<name>` directly (with `type`/`command`/`enabled`). Corrected.
### Added — `setup-browser-mcp.mjs`: auto-configure, don't make the user do it
- Bundled with `browser-qa`: idempotent, **non-clobbering** script that merges the
  Playwright MCP server into `~/.config/opencode/opencode.json` (or a `--project`/
  `--path` config), preserving `$schema`, other top-level keys, and existing MCP
  servers. `--dry-run` previews; backs up to `.bak` before editing; **refuses to
  touch an unparseable config** rather than clobber it; no-ops if already present.
- `browser-qa` now has a "set it up if it's missing" step: for OpenCode it runs
  the script, then tells the user to **restart** (a freshly-added MCP server isn't
  usable in the running session) — the same auto-configure-and-tell spirit as the
  orchestrator's Project-setup pointer. Only after setup genuinely isn't possible
  does it fall back to flagging the browser layer as an honest gap.
- Verified across cases: dry-run writes nothing; fresh create emits the correct
  schema; re-run is a no-op; merging preserves other servers + keys + writes a
  backup; invalid JSON is refused, not overwritten.

## [0.22.0] — 2026-08-14
Real browser e2e — closing a gap the framework named but never operationalized.
The pyramid already listed "e2e over Must journeys," but "driven through the outer
interface" was abstract: for a UI product it quietly degraded to an API/SSR-level
integration test (the bundled wishlist example: 54 node:test, zero browser). So
"verified" was weaker than it looked for UIs.
### Added — `browser-qa` skill (29th): verify Must journeys in a real browser
- New **`browser-qa`**: drive a real browser against the **locally-running** app to
  verify each Must-priority user journey — navigate/click/type/submit + **explicit
  assertions**, not just "the click didn't throw".
  - **Capability-agnostic** (the point, given multi-agent): uses the host's
    built-in browser (e.g. Claude Code), **Playwright MCP** (OpenCode/Codex/other
    MCP clients), or an **in-repo Playwright/Cypress runner** — whichever exists.
    Interacts by **accessibility ref** (role + name), not screen coordinates.
    No capability at all → verify at the best fidelity available and **flag the
    browser gap honestly**, never fake a pass.
  - **Local-only hard stop** — reuses `test-plan`'s "Test environment safety":
    browser QA runs only against a local app + disposable DB, stops if it detects
    production/non-local, and neutralizes real side effects (email/payments).
  - **Thin, on purpose** — Must-priority journeys only; the bulk stays in
    unit/integration (pyramid discipline, not "click everything").
  - **Two flavors:** an interactive agent-driven run (fast dev loop:
    run→act→assert→fix→retest, ephemeral) *and* a committed Playwright/Cypress
    spec (durable regression net CI reruns).
- **Multi-tool setup doc** `docs/browser-qa-setup.md` — Claude Code's built-in
  browser, Playwright MCP for OpenCode/Codex (config + `--caps=testing`), and the
  in-repo runner option.
### Changed — wired the browser layer through the pipeline
- **Verify gate (phase 10)** now requires each Must UI journey browser-verified (or
  its gap flagged) — orchestrator gate row + `coverage-check` honesty check #5 +
  `AGENTS.md`.
- `test-plan`'s e2e class + pyramid now say a UI's "outer interface" is a real
  browser via `browser-qa`, and an API/SSR-only "e2e" for a UI is an integration
  test mislabeled.
- `implement`'s test-first loop: a UI ticket on a Must journey isn't done on
  unit-green alone — browser-verify it (local-only), fix and retest on failure.
- `infra` runs the committed browser e2e specs in CI against an ephemeral env.
- Modular "which skill for which job" table, README/GUIDE catalogs, role map, and
  skill roster updated. Count 28 → **29**.

## [0.21.0] — 2026-08-14
A deterministic backstop for the v0.19 file-management rule, triggered by real
evidence: tested v0.20 live on `internal-dsg-2` and confirmed the correct,
up-to-date instructions (date-prefix rule stated twice) **were** loaded — the
agent (a weaker model) still wrote an undated `changes/*.md` with no frontmatter.
Confirms the known ceiling — markdown instructions are followed probabilistically
— and that "state the rule more clearly" isn't the fix; a mechanical check is.
### Added — `check-file-hygiene.mjs`, bundled with `spec-driven-development`
- Zero-dep script checking: `changes/*.md` filenames are date-prefixed
  (`YYYY-MM-DD-<slug>.md`) and carry frontmatter `description:`; `decisions/*.md`
  filenames are timestamped (`YYYY-MM-DD-HHMM-<slug>.md`) and carry a valid
  `status:`; `memory/*.md` notes carry `description:`; every `changes/`/`memory`
  file is actually registered in its index (`00-overview.md`/`memory/INDEX.md`) —
  catches an orphaned topic file the same way an unindexed one is caught.
  Exit 0 clean / 10 violations / 2 nothing to check.
- Wired in: the orchestrator's "File & folder management" section now says to run
  it after writing/renaming a `changes`/`decisions`/`memory` file; `infra` copies
  it to `tools/check-file-hygiene.mjs` and runs it in CI, same pattern as
  `check-traceability.mjs`.
### Fixed — dogfooding: the bundled wishlist example didn't pass its own new checker
- `examples/wishlist/docs/sdd/changes/clear-wishlist.md` (written before v0.19)
  had no date prefix and no frontmatter — renamed to `2026-08-09-clear-wishlist.md`
  (real date from git history), given frontmatter, and registered in a new
  "Topic index" section in `00-overview.md` (which otherwise correctly keeps its
  single full-mode gate board — the documented exception). README's link updated.
  The example now passes `check-file-hygiene.mjs` clean.

## [0.20.0] — 2026-08-13
Orchestrator slimming pass — **no behavior change, no rule removed.** The core
`spec-driven-development/SKILL.md` (loaded every run) had grown to ~4520 words as
each release added behavior; this moves the *narrative, rationale, and examples*
into the on-demand `reference.md` while keeping **every rule** in the core, stated
imperatively.
### Changed
- Core `SKILL.md` **4522 → 3342 words (−26%)**; `reference.md` 750 → 1060. All 51
  behavioral rules verified still present (cheat-sheet, re-engage-per-request,
  copilot contract, DoD, docs-currency, index-first file management, English code
  artifacts, code-quality bar, mode/size/stop-point dials, gate table, modular
  table, …). Prose compressed to tight imperative bullets; the gate table, modular
  table, and workspace tree kept verbatim (they're the routing/gating spec).
- Moved to `reference.md`: the verbatim `CLAUDE.md`/`AGENTS.md` setup pointer, the
  shared-file failure-mode rationale (why one-topic-per-file), and the full
  self-sufficiency skill roster.
### Note
- The remaining bulk is mostly irreducible structured content (the phase/gate
  table, the "which skill for which job" table, the workspace tree). Going
  materially below ~3300 would mean relocating one of those into `reference.md`,
  which the agent would then have to reload for routine routing — a trade against
  the efficiency goal, so left in the core.

## [0.19.0] — 2026-08-13
File & folder management overhaul, grounded in the user's real runs
(`internal-dsg`, `internal-dsg-2`): topic-scoping worked, but `00-overview.md` was
a single shared file accumulating every topic's brief + gate board + IDs — a
source of merge conflicts (two sessions edit it), unbounded growth, and token
waste (every session re-reads it whole). Plus messy, near-duplicate filenames
(`product-v2-ux` vs `product-v2-scope-and-list-ux`) and an empty `memory/INDEX`.
### Changed — one topic = one dated, self-contained file; overview is a thin index
- **`docs/sdd/changes/` files are now dated + self-contained:**
  `YYYY-MM-DD-<topic-slug>.md` (folder stays chronological), each carrying **its
  own** mini gate board, IDs, and inline decisions. New bundled
  **`change.template.md`** with that shape + frontmatter.
- **`00-overview.md` is now a THIN index**, not a ledger: a topic registry (one
  row per change — date · file · one-line description · status · branch) + the
  global ID next-free counters. Adding a topic adds *one row* → sessions rarely
  collide and it never balloons. (A single **full-mode product** keeps its one
  shared gate board — that case is one cohesive build.) `overview.template.md`
  restructured accordingly.
- **Naming convention:** kebab, one topic = one slug, no `-v2-ux` near-duplicates
  (update the file or pick a clearly distinct slug).
### Added — index-first, description-gated reading (the token-saver)
- Every `changes/…` file and memory note carries a one-line **frontmatter
  `description`** (the relevance hook). The read protocol is now explicit: read
  the indexes (`00-overview.md` + `memory/INDEX.md`), **match the task to a
  row/note by its description**, then open **only** the relevant file — never load
  the whole trail to find one thing. Mirrored in `project-memory` and `AGENTS.md`.
### Added — docs currency is enforced (check → update or create)
- `documentation` + `implement` + the DoD: before a change is done, **check
  whether user + developer docs exist for the touched area; update if behavior
  changed, create if missing** (a missing doc is a create, not a skip).
### Added — code artifacts are English; docs follow the user
- Identifiers, **JSDoc (kept simple)**, and **commit messages / branch slugs** are
  always English, even when specs and user-facing docs are in the user's language.
  Stated in the orchestrator, `documentation` (JSDoc), `git-workflow` (commits),
  and `AGENTS.md`.
### Added — depth matches the audience
- Basic questions are right for the non-dev door; on the **developer** door, or
  when a change genuinely touches **UI or architecture**, the agent proactively
  surfaces the UX/architecture decisions instead of staying basic.

## [0.18.0] — 2026-08-13
### Added — `self-update` skill (28th): the pack keeps itself current
- New **`self-update`** skill: ask the agent to "update sdd-pipeline" and it
  checks the remote for a newer release and updates the installed copy via
  whatever install method is in use — no more tracking releases by hand.
  - Bundled **`check-update.mjs`** (zero-dep): reads the local `version` +
    `repository` from `plugin.json`, compares against the highest remote release
    tag (falls back to raw `plugin.json` over HTTP), prints `local` / `latest` /
    a `RESULT:` line, and exits `0` up-to-date / `10` update-available.
  - **Safety-gated:** refuses to clobber a working clone of the source (dirty
    tree / commits ahead → STOP); updating changes config, so it confirms first.
  - **Method-aware update:** Claude Code plugin → hands you `/plugin marketplace
    update` + `/plugin update` (agents can't run slash commands); `install.sh`
    copy → `git pull` + re-run the installer; live-read clone → `git pull` only.
  - Verifies the new version afterward and gives a short plain-language recap of
    what changed across the range (from `CHANGELOG.md`).
- Added `homepage` + `repository` to `plugin.json` (SSOT for the remote URL the
  checker reads).
- Wired into the README (skills table + "Updating" now leads with the skill),
  `AGENTS.md`, the orchestrator's modular "which skill for which job" table, and
  the GUIDE catalog. Counts updated 27 → **28** (the pipeline is still
  self-sufficient on its own; `self-update` is a maintenance helper, not a phase).

## [0.17.0] — 2026-08-13
Output-quality + working-rhythm pass, driven by how these files actually get
read: **each session is a different context** (later run, cheaper model,
teammate), so the artifacts have to be re-understandable cold, fast.
### Added
- **"Write for the next reader" principle** (orchestrator + `AGENTS.md`): split
  by topic — never one giant file; short scannable sections with stable IDs;
  to the point; each file self-contained. The test: could a fresh session open
  this file and act on it in a minute without re-reading the whole trail?
- **Definition of Done is explicit, always** — each phase's exit-gate cell *is*
  its DoD; each ticket's DoD = acceptance criteria + its TEST-xxx green +
  traceability + docs updated. Nothing is "done" until its DoD is ticked off,
  `quick`/`lite` included. State it up front; don't leave "done" to feel.
- **Live to-do list in the host's native tool** — mirror the gate board / open
  tickets into it and keep status current (phase entered, ticket red→green, gate
  passed), derived from and kept in sync with what's written.
### Changed
- **Asking/brainstorming/confirming now *always* uses the host's native
  structured-question UI** (was "prefer if available") — plain text only as a
  fallback when the runtime has none.
- Tightened the orchestrator's "Read state, then ask" prose (same rules, less
  restatement). Note: the orchestrator (~4000 words) is the one real outlier;
  every other skill is already 430–1158 words / to the point.

## [0.16.0] — 2026-08-12
### Added — test safety: local DB only (hard stop)
- **Before running any test suite, the target must be a local/disposable test
  DB** (`NODE_ENV=test`/`development`, `localhost`/`*_test`/in-memory/
  testcontainer, from `.env.test` — not the app's real `.env`). **If anything
  points at production or a non-local host, or it can't be told, STOP and ask
  the user — never run.** Running tests against a production DB is one of the few
  truly irreversible mistakes. Full rule in `test-plan` ("Test environment
  safety"), enforced with a hard-stop reminder in `implement` before its
  test-first loop, and mirrored in `AGENTS.md`'s baked-in principles.
### Added — efficiency as a first-class framework concern
- New **"Work efficiently — token / memory / context are first-class"**
  principle in the orchestrator: read the minimum (memory `INDEX.md` + relevant
  notes + *targeted* code, not whole-repo scans), don't re-read or reload
  `reference.md` needlessly, right-size output, use `handoff` on long runs.
  Codifies what `project-memory` / targeted-reads / the reference.md splits were
  already for — stated plainly because this is a framework for agentic
  development, not a one-off skill. Mirrored in `AGENTS.md`.
### Changed
- **Ease of use is now stated as a runtime behavior, not just docs** — a new
  "Make it comfortable to use" section in the orchestrator: on first engagement
  confirm which door (just-build-it vs drive-step-by-step), one-line dials, get
  to the goal, don't front-load ceremony or make the user read docs to proceed.
  This carries the v0.15 "Start here" clarity into the actual interaction (the
  user asked that the comfort be felt in use, not only in the README/GUIDE).
- **Code-quality bar reworded to hold in every mode and size** — `quick`/`lite`
  reduce ceremony, never code quality or scope discipline; a one-line fix's diff
  is held to the same SSOT/DRY/YAGNI + in-scope + readable + surgical bar as a
  full build. Reinforced in `AGENTS.md` and the GUIDE's guarantees.

## [0.15.0] — 2026-08-12
Approachability / onboarding — docs only, no skill or behavior change. The user's
real concern (clarified after a grilling): the pack is powerful but not *easy or
comfortable to use*, so people don't adopt it or feel its benefit — and the "too
modular" feeling is really "I can't tell which door to walk through for my
specific need" (a small fix? just brainstorm? just design? just tests?). Also
surfaced a genuine two-audience gap: a non-dev needs one door ("describe it");
a developer wants the explicit, methodology-correct steps to pick from.

Deliberately did **not** merge skills into bigger ones (the earlier proposal) —
that would re-bloat the skills, hurt weaker models, and blur the gates, trading
one presentation problem for three architecture ones. The fix is presentation:
make the entry points obvious, keep the machinery as machinery.
### Added
- **A "Start here — what do you want to do?" section at the top of the README**
  (and an intent map in GUIDE.md's 30-second version): two clearly labeled doors
  — (1) "just want it built/fixed" (non-dev too) → `spec-driven-development`,
  which right-sizes so it's never "too much" even for a one-liner; (2) "a
  developer who wants to drive one step at a time" → a compact intent→skill
  table (brainstorm→`discovery`, spec→`to-prd`/`to-fsd`, design→`arch-decision`/
  `database-design`/`ux-design`, implement→`implement`, fix→`debug`, review→
  `code-review`, …). The mattpocock-style "reach for one tool" clarity, but at
  the front where a new user actually looks.
- The full 27-skill table is relabeled "full reference" with a lead-in saying
  most rows are **machinery the orchestrator runs for you** — you don't memorize
  them; the Start-here map is the handful you actually reach for. This directly
  answers "27 is overwhelming to search through."

## [0.14.0] — 2026-08-12
The behavioral/UX pass, plus real fixes grounded in the user's internal-dsg
BTER branch (`feature/bter-reminder#2890`). Inspecting it showed: the scary
"46k-line diff" was 45k of an auto-generated Drizzle `snapshot.json` (normal,
not bloat), BUT (a) adding "BTER reminder" also modified the OTD and petty-cash
reminders to extract a shared service — real scope creep beyond the ticket —
and (b) the feature's spec was *appended to the global* `01-prd.md`/`03-fsd.md`/
etc., which is exactly how those files balloon.
### Changed — copilot is now a real behavioral contract, not a label
- Rewrote `copilot` in the orchestrator (mirrored in `AGENTS.md`, README, GUIDE):
  it must produce **one phase (or one decision) at a time, then STOP and wait**,
  offering options to pick rather than announcing a done deal. Generating several
  phases in one turn is explicitly called out as autopilot behavior / a bug in
  copilot. This targets the #1 recurring complaint ("copilot feels the same as
  autopilot — it asks once then runs the whole thing").
### Changed — topic-scoped output (stop the doc bloat)
- **Lite mode now writes `docs/sdd/changes/<topic>.md`** — one file per
  feature/fix — and **must NOT append to the global numbered trail**. Added a
  "topic-scoping" principle: anything that recurs (features, fixes, decisions,
  memory) is one-file-per-topic in a folder; the numbered trail is reserved for
  a single cohesive product build. Migrated the wishlist example's
  `CHANGE-clear-wishlist.md` → `changes/clear-wishlist.md` to demonstrate it.
### Added — surgical "lazy-senior" coding
- New rule in `implement`: **the smallest change that satisfies the ticket**,
  touch nothing else. Adding feature A is not license to refactor B and C; a
  refactor of existing working code is its own decision (surface it, log it, get
  buy-in or split a ticket) — don't let it silently balloon the diff. Don't
  rewrite what works. Grounded directly in the BTER finding. Matches the
  "lazy senior developer" style the user likes.
### Added — clear modular map + honest model guidance
- A **"which skill for which job" table** in the orchestrator's Modular-use
  section: brainstorm→`discovery`/grilling, spec→`to-prd`/`to-fsd`,
  design→`arch-decision`/`database-design`/`ux-design`, build→`implement`,
  fix→`debug`, etc. — the mattpocock-style "reach for one tool" clarity the user
  found missing.
- An honest **FAQ note on model choice**: this is all instructions the model
  chooses to follow, not enforced code — a fast/cheap "flash"-tier model holds
  behavioral nuance (staying in copilot, pausing, surgical diffs) less reliably
  and can collapse copilot into autopilot. Mitigations: a stronger model for
  behavior-sensitive work, and leaning on **modular single-skill invocation**
  (far more reliable on weak models than holding the whole orchestrator).
### Note
- Orchestrator grew to ~3450 words (the copilot contract + modular table). The
  behavioral fixes were the point; not cut for tokens, same principle as before.

## [0.13.0] — 2026-08-12
A big cohesion pass toward the user's stated goal — this shouldn't feel like "a
bunch of skills" but a **framework** for building/maintaining apps that's tidy,
predictable, robust, and easy to maintain. Driven by concrete gaps found in the
real xplorenusa run.
### Added
- **`project-memory`** (27th skill) — a lightweight, Obsidian-style knowledge
  graph about the codebase: small linked markdown notes (`docs/sdd/memory/`,
  `INDEX.md` + `[[wikilinked]]` notes) capturing what's *durable and non-obvious*
  (module shapes, gotchas, domain concepts). Expensive to seed once, cheap
  forever after — later sessions/cheaper models read memory + a targeted look
  instead of re-scanning the whole repo. Verified the pattern against how
  Obsidian graphs + agent-memory setups actually work; kept it deliberately
  simple and token-light (read the INDEX + a few notes, never the whole vault).
- **Mandatory "Project setup" step** in the orchestrator (and `AGENTS.md`):
  first engagement in a project **ensures the repo's `CLAUDE.md`/`AGENTS.md`
  points at `spec-driven-development` + reading `memory/INDEX.md` first**, adding
  the pointer if missing. This makes the "govern reliably" lever automatic
  instead of a manual step the user has to remember — the user asked for this
  explicitly.
- **"Explain what you decide or propose"** principle in the orchestrator: when
  proposing an approach or making an unspecified call, state what / why / the
  main alternative rejected, in the moment — feeds `decision-log`. Addresses
  "kurang ngasih penjelasan di setiap keputusan".
### Changed
- **`decision-log` is now a timestamped folder, not one file.**
  `docs/sdd/decisions/YYYY-MM-DD-HHMM-<topic>.md`, one file per decision, each
  with title / timestamp / status (proposed|decided|locked|superseded) /
  decided-by / what's locked / why+alternatives / consequences / `[[links]]`.
  Each decision is now a findable, linkable node (ties into `project-memory`).
  Reworded as MANDATORY and proactive. (User: decision log must be guaranteed,
  in a folder, timestamped, with proper title/description/what's-locked.)
- **FSD and backlog are now held to a "cheap-model-executable" bar** — the
  actual correction to the earlier "too long" misread: the real problem was the
  opposite, specs too *high-level/conceptual*, so a junior or cheap model
  hallucinates the shapes. `to-fsd` now requires naming exact fields+types, the
  per-endpoint interaction shape, and a worked example; `backlog-leveling` adds
  a rule that a ticket's steps must name concrete files/functions and point at
  the exact spec sections defining every shape ("use X from FSD-nnn, don't
  invent it"), T1 near paint-by-numbers.
- **`arch-decision` now produces the concrete project structure and the API
  contract**, not just module boundaries — the user noted these were missing and
  that FE wasn't proposed in detail. New Step 3a writes the actual FE/BE/packages
  directory tree (so a ticket never guesses a path) and decides FE structure in
  detail by default (routing, state, folder layout) as `ADR-FE-xxx`; new Step 3b
  defines the FE↔BE contract per feature/endpoint (route/method/request/response/
  errors, referencing the schema). Exit gate now requires both.
- Role map gains the **project-memory / scribe** touchpoint; the design-phase
  hand-offs (`stack-conventions` + `database-design` + `ux-design`) are all in
  the arch-decision exit gate now.

## [0.12.0] — 2026-08-12
Prompted by real use on a production project (xplorenusa — reviewed the actual
`docs/sdd/` output: a copilot+full+docs-only run producing 49 REQ, 44 FSD, 33
SEC, 48 TICKET, 59 TEST, with genuinely senior-level ADRs and a clean decision
log). Output quality confirmed high. The user's key insight: the schema
(`04-schema.md`) only got produced **because they explicitly asked** — meaning
the data model, a canonical/basic software-engineering artifact, was treated as
optional. And UI/UX design was missing entirely. Fixed both as the design phase
being genuinely complete, and named the two missing team roles.
### Changed
- **`database-design` is now MANDATORY, not optional.** Its description and body
  reworded: the data model is produced automatically whenever the app persists
  data, without waiting to be asked. Standardized its output filename to
  `04-schema.md` (which is what the agent already named it in the real run).
- **Phase 4 is now the "Architecture & Design gate"**, not just "Architecture" —
  its exit gate explicitly requires a data model (`04-schema.md`) if the app
  stores data, and a UI/UX design (`04-ux-design.md`) if there's a UI. A data
  app with no schema, or a UI product with no design, does not pass. This
  closes the "only appeared because I asked" gap at the wiring level.
### Added
- **`ux-design`** (25th skill, UI/UX designer role) — the interface designed
  before it's built: design tokens (semantic color palette with light/dark +
  WCAG-AA contrast, type scale, spacing), key screen wireframes per user
  journey, component patterns, every screen's four states
  (empty/loading/error/success — which become FSD error flows and e2e tests),
  and accessibility + responsive as deliberate decisions. Runs at phase 4
  whenever there's a UI. Produces `04-ux-design.md`.
- **`analytics-design`** (26th skill, data-analyst role) — turns the PRD's
  success criteria into measurable metrics: a north-star + input + guardrail
  KPI tree (each tied to a REQ), a consistent event taxonomy (typed
  properties, SSOT for tracking), an instrumentation plan that lands in the
  backlog and reuses `infra` observability, and privacy (no PII in events
  without a lawful basis — ties to `threat-model`). Runs after the PRD.
  Produces `analytics.md`.
- Role map (reference.md) gains **Data analyst**, **Data engineer / DBA**, and
  **UI/UX designer** seats — the team the user noted was incomplete.
### Note (honest scoping)
- The user also asked whether the FSD/backlog were too long. They're not, per
  item (~7 lines/FSD, ~10/ticket) — the total was large because the run specced
  the **whole product, not an MVP** (their own decision, D-3 in that project's
  DECISIONS.md). That's a scoping choice, not tool bloat. The separate "it
  dumps everything at once / modes don't feel active / modular isn't pleasant"
  feedback is a real UX/pacing issue tracked for a following release — this
  release is the concrete content gap (missing basic artifacts + roles).

## [0.11.1] — 2026-08-11
### Changed
- **Extended "Read state, then ask" to explicitly cover the actual code**, not
  just `docs/sdd/` state. Real distinction the previous wording blurred:
  `map-codebase`'s initial pass is deliberately shallow outside the immediate
  touch area, and docs/an earlier summary in the conversation can both drift
  from what the code actually does — the code is the ground truth. Now states
  plainly: every time a new topic/file/feature comes up mid-conversation, read
  the real code for it before discussing, deciding, or changing anything —
  don't rely on a stale mental model from earlier or on documentation alone.
  Mirrored in `AGENTS.md`.
- `implement`'s "match the surrounding code" line reframed: reading
  neighboring files isn't only about matching style, it's to verify what the
  code *actually does right now* before touching it (the FSD/ticket describes
  intent; the two can have drifted). `debug` already covered this well
  ("Observe, don't assume") — no change needed there.

## [0.11.0] — 2026-08-11
User asked for three related behaviors: always collect info from the user
before acting, always read existing state first to be clear before doing
anything, and always use the agent platform's native question tool when
asking.
### Added
- **"Read state, then ask — don't guess"** — a new cross-cutting principle in
  the orchestrator (and mirrored in `AGENTS.md`): before acting, read the
  existing state (`docs/sdd/` if this project already has a run in progress,
  the actual code via `map-codebase` on brownfield); for anything
  consequential that state doesn't already answer, ask rather than assume
  (always in copilot, and for anything blocking/irreversible in autopilot —
  routine unknowns still batch into a recorded default, unchanged).
- **Resume from real state, don't restart.** Real gap: the phase-0 instruction
  said "create `docs/sdd/00-overview.md`" with no check for whether one
  already exists. Now checks first — if `docs/sdd/` is already there, read
  `00-overview.md`/`traceability.md`/`DECISIONS.md` and resume from that,
  instead of risking a re-ask of already-answered questions or a silent
  restart.
- **Prefer the platform's native structured question tool over plain-text
  questions**, when one is available (e.g. Claude Code's multiple-choice ask
  tool) — added to the orchestrator, `discovery` (the 9-question interview),
  and `arch-decision` (the 2–3-option architecture choices). Faster for the
  user to answer, and it's what makes autopilot's "batch everything"
  requirement pleasant instead of a wall of text. Falls back to plain
  questions when no such tool exists (e.g. most non-Claude-Code agents).
- `spec-driven-development` grew 2310 → 2504 words for this — deliberate,
  same principle as every prior reliability-focused release this project.

## [0.10.0] — 2026-08-11
User reported two related reliability problems: `decision-log` doesn't
consistently fire ("kalo lepas dari pengawasan dia ga ngasih tau"), and the
agent doesn't always invoke `spec-driven-development` at all for work that
should trigger it. Honest framing up front: skill triggering is pattern-
matching against a description, not enforced code — this cannot be made
100% reliable from markdown alone (established the hard way earlier this
project, testing against OpenCode). What follows are the concrete levers
actually available, applied.
### Changed
- **Broadened `spec-driven-development`'s trigger description further** —
  explicit casual phrasings ("can you code this", "let's work on Z", "help me
  add..."), and explicit instruction that it triggers on **every new
  development request within an already-active session**, not just the first
  one in a conversation.
- **`decision-log` now fires proactively, not just on request** — rewrote its
  description to say plainly: the moment a default is picked, scope is cut, a
  risk is accepted, or a spec changes, log it immediately, don't wait to be
  asked. Added a concrete self-check ("did I just decide something?") to both
  `decision-log` and the orchestrator's persistence section, called out
  explicitly as mattering most in autopilot / an unattended stretch — exactly
  when a missed decision does the most damage.
- **Orchestrator now explicitly re-engages on every new dev request mid-session**
  — a plain "now add X" is enough, the user shouldn't have to re-invoke the
  skill by name; if the agent notices it's been editing code without having
  engaged this skill, the instruction is to stop and engage it retroactively
  rather than continue unsupervised.
### Added
- **"Make it govern reliably" section in GUIDE.md** — the single most
  reliable lever available, and it's outside this pack: point your **own**
  project's `CLAUDE.md`/`AGENTS.md` at `spec-driven-development` (most agents
  load that file unconditionally every session, not probabilistically the way
  a skill description is matched). Includes a ready-to-paste snippet. Framed
  honestly as a strong mitigation, not a hard guarantee — it's still an
  instruction the agent follows, not enforced code.
- Net effect: `spec-driven-development` grew 2065 → 2310 words for this —
  deliberate, same principle as 0.7.0/0.8.0: a reliability fix doesn't get cut
  to save tokens.

## [0.9.0] — 2026-08-11
### Added
- **`database-design`** (24th skill) — schema design principles: model around
  bounded contexts to avoid crowded/god tables (one entity, one responsibility);
  normalize by default, denormalize only with a written reason tied to a real
  NFR; narrowest correct types (not `text`/`json` as an escape hatch from
  modeling); explicit foreign keys and cascade behavior; index for real query
  patterns, not speculatively; additive-first migrations. Wired into phase 4
  (right after a datastore is chosen) and referenced by `implement` whenever a
  ticket touches a migration.
- **"Pure conversation, zero files" mode** — a real gap: `discovery` (and by
  extension every skill) assumed it was always writing an artifact, even for a
  user who just wants to think out loud or pressure-test an idea, the way
  mattpocock's `grilling` skill runs as a pure conversation. Any skill can now
  run conversationally with nothing written, when the user says so explicitly
  — documented as complementary to an installed grilling skill (grilling for
  pure adversarial pressure-testing; this pack's skills conversationally when
  their specific structure — a requirements interview, an architecture
  trade-off, a two-axis review — is what's wanted without the file it'd
  normally produce). New GUIDE.md recipes + FAQ entry make this discoverable.

## [0.8.0] — 2026-08-11
Two asks: audit every skill for genuine token savings, and add richer docs on
when each skill fits / what it produces / recommendations.
### Changed — token audit across all 23 skills
Measured every skill; trimmed real redundancy (duplication with another
skill's own content, or verbose restating), applied the `reference.md` split
(core instructions vs. read-on-demand detail) where a skill had clearly
separable "always need this" vs "only need this sometimes" content. Did
**not** force cuts where content was already dense and non-redundant (that was
checked, not assumed) — most notably `spec-driven-development`'s Modes section
and the session-persistence instructions added in 0.7.0 were deliberately left
alone: cutting them to save tokens would undo the fix the user asked for last.
- `implement`: 1016 → 794 words (removed duplication with `code-standards` and
  `documentation` — those skills already own that content in full).
- `backlog-leveling`: 837 → 552 + new `reference.md` (301) — the worked ticket
  example and the estimate formula moved out, tiers/rules/exit gate stayed.
- `documentation`: 799 → 676 — the topology-placement and doc-currency
  sections were near-verbatim duplicates of the orchestrator's own
  `reference.md`; now point there instead of restating.
- `arch-decision`: 1134 → 597 + `reference.md` (520) — carried over from the
  0.7.0 pass, included here for the full picture.
- `stack-conventions`: 686 → 543 + new `reference.md` (193) — the TypeScript/
  Laravel worked examples moved out; the method stayed in the core.
- `infra`, `traceability`: light tightening (727, 590) — genuinely dense
  already, small wins only.
- `spec-driven-development`: 2065 (was 2102 right after 0.7.0's persistence
  addition) — deduplicated a repeated self-sufficiency claim and tightened two
  asides; the Modes/persistence sections were kept in full, deliberately.
- Total across the 7 skills actually touched: ~15% fewer mandatory words,
  with the cut content either genuinely gone (duplication) or moved to
  `reference.md` (read only when actually needed) — nothing lost.
### Added
- **Expanded the "All 23 skills" reference in `docs/GUIDE.md`** from one-line
  descriptions into a real catalog: for every skill, *when* it fits, *what* it
  produces, and a practical *tip* — plus a new "General recommendations"
  section (6 cross-cutting rules of thumb: right-size by default, always
  `map-codebase` on existing code, commit per ticket, trust a red traceability
  row, skim the decision log before shipping in autopilot, brief stakeholders
  before big decisions not after). Deliberately extended the existing GUIDE
  rather than adding a fourth overlapping doc (README already has an overview
  table) — same reasoning this pack asks of its own users: one source of
  truth, not a new file for everything.

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

[0.33.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.33.0
[0.32.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.32.0
[0.31.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.31.0
[0.30.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.30.0
[0.29.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.29.0
[0.28.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.28.0
[0.27.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.27.0
[0.26.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.26.0
[0.25.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.25.0
[0.24.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.24.0
[0.23.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.23.0
[0.22.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.22.0
[0.21.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.21.0
[0.20.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.20.0
[0.19.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.19.0
[0.18.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.18.0
[0.17.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.17.0
[0.16.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.16.0
[0.15.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.15.0
[0.14.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.14.0
[0.13.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.13.0
[0.12.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.12.0
[0.11.1]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.11.1
[0.11.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.11.0
[0.10.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.10.0
[0.9.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.9.0
[0.8.0]: https://github.com/fprtm/sdd-pipeline/releases/tag/v0.8.0
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
