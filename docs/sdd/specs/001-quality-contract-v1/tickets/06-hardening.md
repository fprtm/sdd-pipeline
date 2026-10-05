# TICKET-006 — Compatibility, pilot, and lifecycle hardening

**Feature**: Quality Contract v1  
**Refs**: FSD-001 REQ-007..009, REQ-NF-005; SEC-009, SEC-010  
**Tier**: T2  
**Status**: 🔨 in progress  
**Dependencies**: TICKET-003, TICKET-004, TICKET-005  
**Files likely touched:** `skills/meta/quality-contract/rules/pilot-gates.mjs`, `fixtures/`, `docs/QUALITY-CONTRACT-PILOT.md`, `scripts/test-quality-contract.sh`, `scripts/test-quality-contract.test.mjs`, `scripts/test-checkers.sh`
goal: Rollout decisions are evidence-based and do not create artifact or cognitive bloat.
supports: REQ-007..009, REQ-NF-005, SEC-009, SEC-010
success: Compatibility/lifecycle fixtures and pilot gates make unsupported claims and excess residue visible.

## Bootstrap projection

**Canonical/projection digest:** `sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2`; **base subject:** `git:5d542a4a0a09e7e0746535e55a946e8c2cee3241`. **Risk / executor:** medium T2 / capable builder. **Allowed scope:** `skills/meta/quality-contract/rules/pilot-gates.mjs`, `skills/meta/quality-contract/fixtures/pilot.json`, `docs/QUALITY-CONTRACT-PILOT.md`, `scripts/test-quality-contract.sh`, `scripts/test-quality-contract.test.mjs`, `scripts/test-checkers.sh`; **forbidden:** automatic migration/deletion, dashboards, analytics, cross-provider claim. **Landmarks:** pilot-gates, pilot doc, fixture are new. **Baseline:** TEST-009,010,012,021,024 and checker suite. **Stop:** thin segment, absent baseline, or loss of canonical evidence. **Authority/review:** human rollout authorization + independent review.

## What to Build

Finish compatibility fixtures, lifecycle/retention rules, read-only pilot guidance, and measurable cognitive-bloat/segment gates needed before opt-in enforcement.

## Algorithm / Flow

1. Exercise allowed/deprecated/revoked compatibility and legacy report-only cases.
2. Validate guarded retirement never removes sole canonical truth/evidence.
3. Document calibrated pilot then unseen validation, segmented safety gates, and artifact/navigation caps.

## Acceptance Criteria

- [ ] Bound/redaction and lifecycle/projection regression cases pass, including sole-evidence/durable-outcome/dependency/recovery retirement gates — TEST-009, TEST-010, TEST-012, TEST-024.
- [ ] Segment isolation, thin-evidence, P1/P2, authority/token/navigation/retrieval caps, and p50/p90 non-inferiority are evaluated without aggregate masking — TEST-021.
- [ ] Documentation makes provider-neutral/one-adapter limits and opt-in rollout explicit.

## Out of Scope

- Automatic migration, dashboard, analytics, or cross-provider support claim.
