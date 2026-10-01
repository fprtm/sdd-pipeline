# TICKET-001 — Contract core and result envelope

**Feature**: Quality Contract v1  
**Refs**: FSD-001 REQ-001, REQ-002, REQ-NF-001..004; SEC-001, SEC-002, SEC-005, SEC-008, SEC-010  
**Tier**: T2  
**Status**: 🔨 in progress  
**Dependencies**: none  
**Files likely touched:** `skills/meta/quality-contract/quality-contract.mjs`, `skills/meta/quality-contract/parser.mjs`, `skills/meta/quality-contract/evaluator.mjs`, `skills/meta/quality-contract/rules/effective-decisions.mjs`, `skills/meta/quality-contract/fixtures/core.json`, `scripts/test-quality-contract.sh`
goal: A deterministic, fail-closed contract evaluation envelope exists locally.
supports: REQ-001, REQ-002, REQ-NF-001..004, SEC-001, SEC-002, SEC-005, SEC-008, SEC-010
success: Valid and adversarial fixtures produce the exact canonical status/predicate result without executing prose.

## Bootstrap projection

**Canonical/projection digest:** `sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2`; **base subject:** `git:5d542a4a0a09e7e0746535e55a946e8c2cee3241`. **Risk / executor:** medium T2 / capable builder. **Allowed scope:** exactly the six files above; **forbidden:** public command registry, external dependencies, runner/gateway modules. **Landmarks:** all engine files are declared new; existing `tools/` is out of scope. **Baseline:** `scripts/test-checkers.sh`; **stop:** unsupported canonicalization, unresolved enum, or baseline failure. **Authority/review:** human authorization and independent pre-build/post-build review required; actors are assigned at BUILD. **AC evidence subset digest:** `sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2` (TEST-001,002,005,008,010,013,019).

## What to Build

Deliver a read-only, zero-dependency facade that parses exactly one constrained contract block, emits canonical digests and the versioned orthogonal result envelope, and fails closed. It must not execute contract/repository prose.

## Deliverables

- Engine facade and strict parser — typed contract and deterministic JSON/human output.
- Evaluator and rule interfaces — dimensions plus `execution_eligible`, `may_dispatch`, `may_accept`, and `may_retire` predicates.
- Fixtures and local test harness — valid, duplicate, revoked, oversized, and command-like inputs.

## Algorithm / Flow

1. Bound input traversal and parse exactly one typed block.
2. Canonicalize only schema-defined fields and compute digests.
3. Evaluate each dimension without mutation or command execution.
4. Return false predicates unless every normative condition is explicitly satisfied.

## Acceptance Criteria

- [ ] Valid constrained contract returns deterministic versioned envelope, no generic PASS — TEST-002, TEST-008.
- [ ] Duplicate/unknown/revoked/oversized and command-like inputs fail closed without execution — TEST-002, TEST-005, TEST-010.

## Out of Scope

- Ticket materialization, Git preflight, trusted events, and CI migration.
