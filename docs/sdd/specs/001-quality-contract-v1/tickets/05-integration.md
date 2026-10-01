# TICKET-005 — Adapter, installer, and CI migration

**Feature**: Quality Contract v1  
**Refs**: FSD-001 REQ-002, REQ-009; SDS-001 compatibility/distribution; SEC-008  
**Tier**: T2  
**Status**: 🔨 in progress  
**Dependencies**: TICKET-001  
**Files likely touched:** `install/install.sh`, `install/install.test.mjs`, `.github/workflows/quality-contract.yml`, `skills/commands/spec/SKILL.md`, `skills/commands/implement/SKILL.md`, `skills/commands/check/SKILL.md`, `scripts/test-checkers.sh`
goal: Existing commands and installation use one facade without new public surface.
supports: REQ-002, REQ-009, SEC-008
success: Installed and CI adapters preserve canonical result semantics and eight-command compatibility.

## Bootstrap projection

**Canonical/projection digest:** `sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2`; **base subject:** `git:5d542a4a0a09e7e0746535e55a946e8c2cee3241`. **Risk / executor:** medium T2 / capable builder. **Allowed scope:** exact files above plus the declared `skills/meta/quality-contract/` module files from TICKET-001; **forbidden:** public command addition or weakened CI trust. **Landmarks:** installer/checker exist; workflow is new. **Baseline:** installer tests, checker suite, TEST-008,011. **Stop:** non-atomic module install or altered facade output. **Authority/review:** human authorization + independent review.

## What to Build

Install the engine directory and replace duplicated policy in command/CI adapters with facade invocation while preserving the eight public commands and legacy behavior during migration.

## Algorithm / Flow

1. Package core modules with installed tools.
2. Add thin command adapters that preserve facade status/JSON without reinterpretation.
3. Migrate CI references to current artifacts and test installation plus compatibility.

## Acceptance Criteria

- [ ] Installed distribution contains engine dependencies and no new public command — TEST-008.
- [ ] Adapter preserves unsupported/revoked and valid envelope semantics in CI/local invocation — TEST-008, TEST-011.

## Out of Scope

- A second provider adapter or universal enforcement claim.
