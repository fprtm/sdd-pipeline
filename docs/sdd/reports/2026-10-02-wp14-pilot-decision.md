---
description: Evidence audit and promotion decision record for SDD Pipeline vNext.
status: blocked
lifecycle: active
updated: 2026-10-02
---

# WP-14 pilot and promotion decision

## Provisional evidence disposition

**REVISE / DO NOT PROMOTE.** This is a conservative non-promotion decision,
not a finding that vNext is ineffective and not a human promotion-authority
decision. No authorized human decision exists yet.

## Evidence audit

| Claim | Classification | Evidence | Verdict |
|---|---|---|---|
| schemas, negative paths, replay, packs, capabilities, and gate decisions behave as specified | mechanical | Quality Contract harness, TEST-027..038 | supported locally |
| frozen revision-3 benchmark loader/comparator enforces twelve-category coverage, matched assignment, full quality-dimension metrics, field-grade attestations, 5/3 floors, and critical-segment gates | mechanical | TEST-035 with 96 synthetic attempts | supported locally |
| normalized synthetic run is reproducible | mechanical | TEST-039 runs the benchmark twice and compares bytes | supported locally |
| vNext improves real quality/productivity over baseline | runtime | no authorized real corpus/cohorts or independent grades | insufficient |
| vNext should become default | human policy decision | no report-only/opt-in/unseen evidence or promotion-authority record | blocked |

Synthetic fixtures have zero observed P0/P1/P2 and fit frozen cost limits, but
they were constructed to exercise the protocol. They are not independent
evidence of real effectiveness and cannot satisfy the calibration/unseen pilot.
The runner labels them `BENCHMARK_MECHANICS_PASS`; only a structurally valid
`field-pilot` input can return `BENCHMARK_PASS`. Even that result always retains
`human_promotion_required`; `benchmark/promotion.mjs` requires a separate,
externally attested complete promotion packet. The collection checklist is
`benchmarks/vnext/PILOT.md`.

## Rollout state

| Stage | State | Missing evidence |
|---|---|---|
| local fixtures | complete | none for mechanics |
| shadow | implementation ready, not field-measured | real mismatch/cost telemetry |
| report-only projects | not run | authorized projects and reviewers |
| opt-in enforcement | not run | prior report-only evidence and explicit migration |
| unseen evaluation | not run | licensed disjoint corpus and two blinded graders |
| human promotion | blocked | complete segment evidence and named authority decision |

## Residual review items

- Independent humans must review every ticket currently labeled degraded independence.
- A real corpus needs recorded license/evaluation authority and disjoint lineage.
- Calibration and unseen cohorts must each cover all twelve frozen case categories.
- Each of six segments needs 5 calibration and 3 unseen attempts per arm, with
  two blinded graders and at least 80% raw agreement.
- Report-only and opt-in hosts must supply actual latency/review-cost data.
- The promotion authority must record promote, revise, or reject; no test or
  version bump may change the default automatically.
