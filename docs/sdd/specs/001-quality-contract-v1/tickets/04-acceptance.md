# TICKET-004 — Evidence-backed acceptance

**Feature**: Quality Contract v1  
**Refs**: FSD-001 REQ-004, REQ-006, REQ-007; SEC-001, SEC-003, SEC-004, SEC-009  
**Tier**: T3  
**Status**: 🔨 in progress  
**Dependencies**: TICKET-001, TICKET-002, TICKET-003  
**Files likely touched:** `skills/meta/quality-contract/evidence-runner.mjs`, `rules/evidence.mjs`, `rules/acceptance.mjs`, `evaluator.mjs`, `fixtures/`, `scripts/test-quality-contract.sh`
goal: Only exact-candidate, sealed, mapped evidence can satisfy acceptance.
supports: REQ-004, REQ-006, REQ-007, SEC-001, SEC-003, SEC-004, SEC-009
success: A changed evidence binding or incomplete review prevents acceptance; exact bound evidence permits it.

## Bootstrap projection

**Canonical/projection digest:** `sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2`; **base subject:** `git:5d542a4a0a09e7e0746535e55a946e8c2cee3241`. **Risk / executor:** high T3 / security-capable builder. **Allowed scope:** explicit files above only, with fixture `skills/meta/quality-contract/fixtures/evidence.json`; **forbidden:** arbitrary command execution, external service, public command change. **Landmarks:** rule/runner files are new; evaluator composes only. **Baseline:** TEST-001,003,004,009,011,015,018,020,022; **stop:** missing observable AC mapping or unverifiable identity. **Authority/review:** human authorization, independent security review, external runner attestation.

## What to Build

Verify externally sealed immutable evidence and typed post-build conformance events for the exact candidate. Derive `may_accept` only from complete, conformant, fresh, provenance-sufficient results.

`evidence-runner.mjs` is the sole owner of routed command sealing and redaction; `rules/evidence.mjs` owns frozen assertion evaluation and `rules/acceptance.mjs` owns the acceptance predicate composition.

## Algorithm / Flow

1. Verify snapshot, AC-map, policy/rule/adapter, argv/environment, output, and attestation bindings.
2. Verify post-build review binds the resulting candidate and never substitutes for pre-build review.
3. Redact/bound durable evidence and deny acceptance on any stale/missing dimension.

## Acceptance Criteria

- [ ] Exact sealed candidate with mapped evidence and required reviews accepts; one changed binding denies — TEST-011.
- [ ] Replayed/spliced evidence, altered runner/argv/cwd/environment/policy, and secrets in output are rejected/redacted — TEST-004, TEST-009, TEST-015, TEST-018.

## Out of Scope

- Broad provider rollout and automatic retirement.
