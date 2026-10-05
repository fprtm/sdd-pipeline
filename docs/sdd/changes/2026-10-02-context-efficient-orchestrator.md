---
description: Reduce SDD orchestration context pressure through progressive disclosure.
status: active
lifecycle: active
goal: Keep the orchestrator entrypoint below 150 lines while preserving every policy invariant and public command.
updated: 2026-10-02
---

# Change: Context-efficient orchestrator

**Date**: 2026-10-02
**Mode**: standard
**Size**: medium
security-sensitive: false

## Success

- `skills/orchestrator/SKILL.md` is a thin router of at most 150 lines.
- Non-coding discussion exits before loading pipeline policy references.
- Governed tasks load only the behavior, delivery, or project-state reference they need.
- The unified mode matrix remains a single mechanically validated source of truth.
- Existing commands, installers, aliases, and validation suites remain compatible.

## Actors

- implementer: root-context
- reviewer: degraded independence
- verifier: deterministic repository suites
- security_reviewer: not required
- independence: degraded independence

## Human Review

Verify that moving policy text does not weaken approval, evidence, authority,
coverage, or non-negotiable secret-handling rules, and that installed OpenCode
aliases can resolve every routed reference.

## What Changed

- `skills/orchestrator/SKILL.md`: reduce to essential entrypoint and routing rules.
- `skills/orchestrator/references/`: own conditional behavior, delivery, and project-state policy.
- Validators, installers, and cross-references: follow the new canonical owners and enforce a context-footprint budget.

## Gate List

- [x] Root entrypoint is at most 150 lines and materially smaller in bytes.
- [x] All moved policy sections remain reachable from the root router.
- [x] Skill validation, checker, installer, Quality Contract, docs, E2E, hygiene, and traceability suites pass.
- [x] Installed OpenCode/Codex alias contains resolvable progressive-disclosure references.
- [x] `git diff --check` passes.

## IDs

Refs: REQ-NF-011, TEST-037, TEST-038.

## Inline Decisions

- Split by decision point rather than phase implementation: the root selects only behavior, delivery, and project-state policy needed for the current request.
- Preserve automatic discovery; context reduction comes from progressive disclosure, not disabling the skill.

## What Was Tested

- `./scripts/validate-skills.sh` — pass with only the two pre-existing long-skill advisories.
- `node --test install/install.test.mjs` — 21/21 pass, including a fresh OpenCode install.
- `./scripts/test-checkers.sh` — 138/138 pass.
- `./scripts/test-quality-contract.sh` — 4/4 pass; 96.96% line and 83.00% branch coverage.
- `./scripts/test-vnext-benchmark.sh` — 96/96 synthetic attempts and 6/6 mechanics segments pass.
- `./scripts/test-vnext-e2e.sh` and `node scripts/test-vnext-docs.mjs` — pass.
- Skill Creator `quick_validate.py skills/orchestrator` — valid.
- File hygiene, traceability, shell/JavaScript syntax, and `git diff --check` — pass.
