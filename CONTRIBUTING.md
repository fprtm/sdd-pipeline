# Contributing to SDD Pipeline

This repo is mostly Markdown (the skills themselves) plus 3 zero-dependency Node scripts (the mechanical checkers) and a bash installer. There's no build step and no runtime dependency to install — that's deliberate, keep it that way.

## Before you open a PR

1. **Read the skill(s) you're touching in full**, not just the section you're changing — cross-references between skills are load-bearing (a skill often says "see X for the full rule" instead of restating it). A change that makes sense locally can silently contradict something 200 lines away or in a different file. `docs/ARCHITECTURE.md` is the map if you need to trace what calls what.
2. **Check for drift, don't just add.** If you're changing a rule that's stated in more than one place (mode tables, `AGENTS.md`'s quick-reference vs. the full skill, `README.md`'s summary), grep for it and update every occurrence in the same PR. A framework about consistency shouldn't ship internal contradictions — several were found and fixed this way; see recent commit history for the pattern.
3. **If you're adding or changing behavior in `check-file-hygiene.mjs`, `check-traceability.mjs`, or `check-parallel-safety.mjs`**, add or update a test in the matching `*.test.mjs` file next to it. These are the only mechanically-enforced parts of the repo — untested changes to them are the highest-risk class of change here.

## Running the checks locally

```bash
# Structural validation: skill files exist, have valid frontmatter where
# required, plugin.json's skill registrations resolve.
./scripts/validate-skills.sh

# Behavioral tests for the 3 checker scripts (zero dependencies — uses
# Node's built-in test runner, requires Node >= 18).
./scripts/test-checkers.sh

# Syntax-check every bundled .mjs script.
find skills -name '*.mjs' -exec node --check {} \;
```

All three run in CI (`.github/workflows/ci.yml`) on every PR.

## Testing an install end-to-end

The installer (`install/install.sh`) is easy to break in ways that only show up in a fresh project, not in this repo (which already has everything the skills reference). Before changing it, test against a scratch directory, not this repo:

```bash
T=$(mktemp -d) && cd "$T" && git init -q .
/path/to/sdd-pipeline/install/install.sh --agent codex --with-templates --with-hooks --with-ci
# then actually exercise it: run the hygiene/traceability checkers it copied
# to tools/, try a commit, check the hook fires correctly
```

## Style

- No comments explaining *what* code does — only *why*, when it's non-obvious (a workaround, a subtle invariant, a bug this fixes). This applies to the `.mjs` scripts and to prose in skill files alike.
- Skill files: durable docs (FSD/SDS/PRD equivalents this framework asks *users* to write) never reference file paths or line numbers — the same rule applies to how you write the skills themselves where practical, since paths inside prose go stale exactly the same way.
- Keep the zero-dependency constraint on the 3 checker scripts and the installer. If a fix seems to need a package, it probably means the fix belongs somewhere else.

## Commit messages

This repo's own commit history is the style guide — explain *why*, cite what was verified (a bug fix should say how it was reproduced and how the fix was tested, not just what changed), and use `Refs:`-style trailers sparingly since there's no ticket system here.

## Reporting a bug vs. proposing a change

Use the issue templates (`.github/ISSUE_TEMPLATE/`) — bug reports and feature/behavior-change proposals ask for different information (a bug report needs reproduction steps; a behavior change needs the rationale, since most of this repo is deliberately-designed prose, not code with an obvious "correct" behavior).
