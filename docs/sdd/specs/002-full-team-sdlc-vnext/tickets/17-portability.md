# TICKET-017 — WP-12 compatibility, installer, and portability

**Feature**: FSD-002
**Refs**: REQ-023, REQ-NF-008, SEC-021; TEST-037
**Tier**: T3
**Status**: 🧪 testing/review
**Dependencies**: stable schemas from TICKET-007 through TICKET-016
**Files likely touched:** `install/install.sh`, `install/install.test.mjs`, `enforcement/ci/sdd-check.yml`, handoff/capability rules, migration guide
goal: vNext distributes without assuming identical host capabilities or breaking legacy.
supports: REQ-023, REQ-NF-008, SEC-021
success: Optional missing degrades, required missing blocks after opt-in, legacy stays report-only, and install/update/downgrade/handoff pass.
implementer: root
independence: degraded independence

## Human Review

- Confirm each supported host's capability declaration is truthful and tool-attested where required.
- Confirm `.sdd/vnext-enforced` is only created by an explicit project migration.
- Exercise provider-neutral handoff with a second real host before claiming cross-provider support.

## Algorithm / Flow

1. Negotiate declared provider capabilities against assurance requirements.
2. Stage complete versioned runtime/packs/benchmark support atomically.
3. Preview explicit migration/downgrade and preserve legacy reader semantics.
4. Make missing required checker blocking only under vNext enforcement marker.

## Acceptance Criteria

- [x] ALN-015 decision has positive/negative installer+CI fixtures.
- [x] Every supported target gets identical provider-neutral core semantics.
- [x] Public command registry remains exactly eight.

## Out of Scope

Claiming untested provider support or silently modifying project policy.
