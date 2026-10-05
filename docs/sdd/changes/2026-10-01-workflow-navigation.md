---
description: Make every public command close with a contextual, user-controlled next step.
status: active
lifecycle: active
goal: Every command reports its terminal state, relevant skips, and a valid user-controlled continuation without silently advancing the workflow.
updated: 2026-10-01
---

# Change: Contextual workflow navigation

**Date**: 2026-10-01
**Mode**: standard
**Size**: medium
security-sensitive: false

## Success

- All eight public commands use one shared closure contract.
- A command offers at most one primary next action and two relevant alternatives; it never dumps every command or starts another step without the user's signal.
- Incomplete discovery/specification and unavailable capabilities state the missing decision or prerequisite before offering any downstream action.
- The validator rejects a public command that omits the shared contract.

## Actors

- implementer: root
- reviewer: command_closure_audit
- verifier: navigation_contract_review
- security_reviewer: none
- independence: independent

## Human Review

- Confirm that the recommended routes feel helpful without becoming a repetitive command menu.
- Confirm that an explicitly skipped or spec-only workflow never pressures the user into BUILD.

## What Changed

- Add a shared workflow-navigation contract, wire it into the orchestrator and eight command skills, and validate its presence.
- Clarify the README and architecture so the delivery spine and lateral utility commands remain distinct.
- Align the architecture diagram's large-work record path with the bounded feature-owned `specs/{NNN}-{slug}/tickets/` layout.

## Gate List

- [x] All command closure routes preserve prerequisites.
- [x] Structural validator passes with the new contract check.
- [x] No command automatically invokes a suggested next command.
- [x] Documentation describes only contextual, user-controlled recommendations.

## IDs

None — internal workflow contract change.

## Inline Decisions

- Shared navigation skill: selected over eight duplicated closure blocks so one contract governs wording and legal transitions without creating a public command.
- Recommendation budget: one primary and at most two alternatives so the close remains actionable rather than a menu dump.
- Handoff consumption: changed from implicit resumption to an explicit `Resume <next_action>` offer; the target resumes only after user selection.
- Handoff routing: consume validates state first; it may resume in the same invocation only when the user explicitly requested that outcome.
- Terminal-state refinement: distinguish blocked required prerequisites from a transparently degraded optional capability; add explicit no-op, spec-only, partial verification, clean-audit, and documentation-plan approval routes.
- Canonical handoff alignment: consumption offers the named resume action and proceeds only on an explicit user request or selection.

## What Was Tested

- `bash scripts/validate-skills.sh` — all eight public commands reference the shared navigation contract, retain its guardrails, and retain a state-specific safe-route marker.
- `node --test install/install.test.mjs` — 15/15 installer tests pass.
- `./scripts/test-checkers.sh` — 132/132 existing checker tests pass.
- `node skills/meta/health-check/check-file-hygiene.mjs` — passes.
- `node skills/meta/traceability/check-traceability.mjs` — passes.
- `git diff --check` — no whitespace errors.
