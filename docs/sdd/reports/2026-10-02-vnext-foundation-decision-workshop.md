---
description: Provisional decision workshop for the five foundations and consumer-CI compatibility needed before SDD Pipeline vNext implementation.
status: active
lifecycle: transient
updated: 2026-10-02
---

# SDD Pipeline vNext — foundation decision workshop

**Authority:** all recommendations were accepted by the user on 2026-10-02 and
are compacted into ADR-001 through ADR-003. Those ADRs authorize specification
and implementation inside their stated boundaries; they do not themselves
authorize a production release or automatic default promotion.

## Decision ledger

| Key | Recommended decision | Evidence and reasoning | Strongest reasonable alternative | Status |
|---|---|---|---|---|
| primary adopter | Full product/engineering team, with an explicit small-team multi-hat degradation path | The roadmap's lifecycle requires product, engineering, QA, security, release, and outcome accountability. Optimizing for solo use would make those boundaries advisory precisely where vNext is intended to make them verifiable. | Regulated organizations have the clearest need and willingness to pay the process cost, but selecting them first would make A3 ceremony the product default and weaken general adoption evidence. | accepted; ADR-001 |
| AI autonomy ceiling | AI may research, draft, evaluate deterministic policy, and implement an approved bounded work packet. It may not self-approve A2/A3 acceptance, security exceptions, production release, benchmark promotion, or irreversible operations. | This preserves useful autonomy while matching the existing Quality Contract rule that repository prose cannot manufacture human authority. | Allowing AI acceptance for A2 could reduce latency, but actor labels alone do not prove independence or real-world authority. | accepted; ADR-001 |
| initial benchmark domains | Developer tooling/library work for low-to-moderate risk, plus an API fixture containing authentication, authorization, and customer-data behavior for elevated risk. | These two domains exercise existing library/API constraints and create materially different failure modes without requiring private production data. They also support the two reference packs required by WP-11. | Web UI would exercise browser/accessibility gates, but it adds visual-grading variance before the core evidence protocol is calibrated. | accepted; ADR-002 |
| Quality Contract evolution | Extend the existing Quality Contract through versioned schemas/rules and a single companion lifecycle namespace inside the same runtime boundary. Do not introduce a second authority/state engine. Begin in shadow, then report-only. | The current runtime already owns exact-subject binding, trusted events, evidence, acceptance, and pilot gates. A second engine creates ambiguous authority and replay semantics. | A separate engine is easier to prototype, but reconciliation between two sources of truth would become a new correctness problem. | accepted; ADR-003 |
| acceptable review and latency cost | A0/A1: median end-to-end latency no more than 10% above matched baseline and review time no more than 15% above baseline. A2: each may rise up to 25% when safety gates pass. A3: no hard latency cap; report absolute and p90 cost and require human judgment. No segment may trade a P1/P2 regression for speed. | Low-risk work needs an anti-bureaucracy bound; elevated-risk work justifies more scrutiny; critical work cannot rationally optimize speed ahead of authority and recovery evidence. Segment-level reporting prevents an easy cohort from masking an expensive one. | One global 20% cap is simpler, but treats a typo and authorization migration as economically and operationally equivalent. | accepted; ADR-002 |
| consumer CI missing tools (ALN-015) | Legacy consumers remain report-only. A project that explicitly migrates to vNext enforcement fails closed when a required installed checker is missing; optional capability remains degraded. | This matches the roadmap's R2/R3 boundary and WP-12 acceptance while avoiding a silent breaking change for existing installs. A missing required executable in an opted-in install is corruption, not a clean result. | Always report-only maximizes compatibility, but represents an absent gate as a successful CI run. | accepted; ADR-003 |

## Consequences if accepted

- WP-01 freezes two initial benchmark domains and the cost thresholds above.
- WP-02 may implement a shadow evaluator without changing current acceptance.
- WP-03 distinguishes recorded actor separation from externally attested human
  authority; small-team multi-hat work is visible rather than falsely independent.
- WP-04 extends Quality Contract ownership instead of creating competing state.
- WP-12 preserves legacy report-only behavior and makes enforcement an explicit
  versioned migration.
- WP-14 remains a human promotion decision even if all mechanical gates pass.

## Falsification conditions

Re-open a decision if calibration shows any of the following:

- the two domains do not expose different meaningful failure modes;
- human graders cannot reach acceptable agreement on product/engineering quality;
- cost thresholds create incentives to omit required evidence;
- the existing Quality Contract cannot model lifecycle events without breaking its
  authority or compatibility invariants;
- full-team contracts make the small-team degradation path unusable;
- fail-closed opted-in CI cannot distinguish missing required tools from an
  intentionally unsupported optional capability.

## Required authorization

Authorization was supplied explicitly by the user on 2026-10-02. Any later
change follows ADR supersession rather than editing the accepted decision.
