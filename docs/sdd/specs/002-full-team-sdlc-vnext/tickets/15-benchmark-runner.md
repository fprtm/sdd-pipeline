# TICKET-015 — WP-10 benchmark runner

**Feature**: FSD-002
**Refs**: REQ-021, REQ-025, REQ-NF-009..010, SEC-018, SEC-019; TEST-035
**Tier**: T3
**Status**: 🧪 testing/review
**Dependencies**: TICKET-009 through TICKET-014
**Files likely touched:** `skills/meta/quality-contract/benchmark/`, `benchmarks/vnext/`, `scripts/test-vnext-benchmark.sh`, `.github/workflows/`
goal: Frozen baseline/candidate evals rerun reproducibly and gate every segment.
supports: REQ-021, REQ-025, SEC-018, SEC-019
success: Loader, isolated runner, graders, results, comparator, missingness, and critical-segment gates pass TEST-035.
implementer: root
independence: degraded independence

## Human Review

- Confirm synthetic TEST-035 proves mechanics only and is not presented as pilot evidence.
- Review licenses/authority and lineage separation before adding a real corpus.
- Confirm grader adapters preserve blinded pre-adjudication scores.

## Algorithm / Flow

1. Validate frozen protocol and local licensed corpus manifest/digests/lineage.
2. Run explicit adapters in bounded temporary workspaces and retain all attempts.
3. Seal deterministic measurements and externally supplied blinded grades.
4. Compare matched arms per segment; never synthesize aggregate success.

## Acceptance Criteria

- [x] Calibration/unseen isolation and 5/3 per-arm floors enforce exactly.
- [x] Result reports raw counts, denominators, effects, cost, agreement, missingness.
- [x] Same frozen inputs normalize byte-identically across reruns.

## Out of Scope

Remote benchmark service, public leaderboard, and proprietary corpus.
