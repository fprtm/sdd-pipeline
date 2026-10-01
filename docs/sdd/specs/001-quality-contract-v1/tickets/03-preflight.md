# TICKET-003 — Trusted preflight and execution eligibility

**Feature**: Quality Contract v1  
**Refs**: FSD-001 REQ-003, REQ-005, REQ-008; SEC-003, SEC-006, SEC-007  
**Tier**: T3  
**Status**: 🔨 in progress  
**Dependencies**: TICKET-001, TICKET-002  
**Files likely touched:** `skills/meta/quality-contract/trusted-events.mjs`, `gateway.mjs`, `rules/scope-accounting.mjs`, `rules/executor-fit.mjs`, `evaluator.mjs`, `fixtures/`, `scripts/test-quality-contract.sh`
goal: Execution eligibility is derived from trusted subject, fit, review, authority, and scope facts.
supports: REQ-003, REQ-005, REQ-008, SEC-003, SEC-006, SEC-007
success: Invalid event, incomplete accounting, or no-Git subject produces a false execution predicate with remediation.

## Bootstrap projection

**Canonical/projection digest:** `sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2`; **base subject:** `git:5d542a4a0a09e7e0746535e55a946e8c2cee3241`. **Risk / executor:** high T3 / security-capable builder; low-cost work is limited to reviewed mechanical fixtures. **Allowed scope:** the explicit files in `Files likely touched` only; **forbidden:** raw tool interception claims, public command changes, network/prod targets. **Landmarks:** listed engine modules are new, evaluator is modified; fixture must be `skills/meta/quality-contract/fixtures/preflight.json`. **Baseline:** TEST-003,006,007,013,014,016,017,020. **Stop:** external trust registry/revocation source unavailable or unenumerable scope. **Authority/review:** qualified human authorization, independent security pre/post review, external attestation.

## What to Build

Implement read-only trusted-base preflight: policy-derived risk/fit, Git change accounting, typed pre-build review/authorization verification, liveness checks, and no-Git report-only behavior.

`gateway.mjs` is the sole owner of atomic lease check-and-consume and routed mutation dispatch; `trusted-events.mjs` owns external event/replay-store verification. Neither claims to intercept raw host tools.

## Algorithm / Flow

1. Resolve trusted base/candidate and complete Git change categories.
2. Verify external pre-build events bind the exact base/contract/projection/scope/landmarks/AC map/policy/executor class.
3. Derive `execution_eligible`, then recheck bounded lease before a declared governed operation and return `may_dispatch` only when all requirements hold.

## Acceptance Criteria

- [ ] Forged/replayed/expired/non-independent event, key substitution, clock anomaly, or unavailable revocation denies execution — TEST-003, TEST-013, TEST-014.
- [ ] Untracked/delete/rename/submodule/path alias and no-Git inputs cannot masquerade as complete assurance — TEST-006, TEST-017.
- [ ] Gateway denies secret environment, network/prod/unclear target, symlink escape, altered argv, and TOCTOU lease reuse — TEST-016.
- [ ] Promoted risk, unfit executor, red baseline, or unresolved landmark blocks with remediation — TEST-007.

## Out of Scope

- Evidence sealing and post-build acceptance.
