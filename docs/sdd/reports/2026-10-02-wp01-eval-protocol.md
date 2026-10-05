---
description: Frozen evaluation protocol for measuring SDD Pipeline vNext quality without post-result rubric changes.
status: active
lifecycle: transient
updated: 2026-10-02
source_decisions_digest: sha256:12e2bd6520e3d8bf93b9b1fb5401b1647f5d111f215938342eb00c1d2d698758
protocol_file_sha256: sha256:0e2e56548e99c0c7b8246efaf200b1db791ed265e761dd9ec1d4e4585a551106
protocol_canonical_digest: sha256:5c2cf1fad8c4a3b5c984b3e926d42641965ea201c28de56b0b5c58f21414eba7
---

# WP-01 — quality hypothesis and evaluation protocol draft

**State:** FROZEN revision 3 on 2026-10-02 following explicit user approval of
ADR-001 through ADR-003. Revisions 1 and 2 remain immutable. Revision 2 bound
the metric dictionary; the final pre-field audit then found that the twelve
declared corpus categories and comprehension/SLO/incident-learning dimensions
were still implicit. Revision 3 binds them explicitly and restarts synthetic
calibration. Revision-1/2 field evidence is forbidden. The active
machine-readable freeze is `benchmarks/vnext/protocol-v3.json`. Its frozen
byte-for-byte file SHA-256 is
`0e2e56548e99c0c7b8246efaf200b1db791ed265e761dd9ec1d4e4585a551106`.
The manifest `protocol_digest` field uses canonical JSON digest
`sha256:5c2cf1fad8c4a3b5c984b3e926d42641965ea201c28de56b0b5c58f21414eba7`;
the file hash and canonical digest are intentionally distinct identities.

Revision 3 changes no thresholds, segments, graders, corpus policy, or cost
budgets. It retains revision 2's exact metric semantics, adds the twelve frozen
case categories, and adds denominator-aware comprehension, SLO-health, and
incident-learning rates to the signed protocol surface.

## Quality hypothesis

For a pre-registered benchmark segment, SDD Pipeline vNext improves delivery
quality when it reduces material defects, requirement misunderstandings,
escaped assumptions, unsafe decisions, and rework without violating the
segment's review/latency budget. The claim is segment-scoped; it is not a claim
that an AI is a senior human or that results generalize beyond evaluated tuples.

The null/alternative decision is asymmetric:

- any P0/P1 safety, authority, privacy, or exact-subject regression rejects the
  candidate for that segment;
- missing or thin evidence is `INSUFFICIENT`, never a pass;
- otherwise the candidate must meet every frozen must-threshold and must not
  regress a guardrail beyond its frozen tolerance;
- aggregate improvement cannot offset one failing critical segment.

## Segment key

Every result is keyed by the full tuple below. Fields may not be collapsed after
results are visible.

```text
repository_class × work_type × risk × assurance × executor/model × domain
```

Initial domain values are `developer-tooling-library` and `auth-data-api`.
Repository class, executor/model, and environment versions are recorded
verbatim. Complexity and ceremony are explanatory covariates, not a
replacement for risk or assurance.

### Frozen segments and sample floor

| ID | Repository class | Work type | Risk | Assurance | Executor | Domain |
|---|---|---|---|---|---|---|
| SEG-01 | brownfield fixture | bugfix | low | A1 | capable | developer-tooling-library |
| SEG-02 | brownfield fixture | feature | moderate | A1 | capable | developer-tooling-library |
| SEG-03 | brownfield fixture | feature | high | A2 | capable | auth-data-api |
| SEG-04 | brownfield fixture | security-fix | critical | A3 | specialist | auth-data-api |
| SEG-05 | greenfield fixture | product-reject | moderate | A1 | capable | developer-tooling-library |
| SEG-06 | greenfield fixture | product-revise | high | A2 | capable | auth-data-api |

Each segment requires at least five eligible calibration runs per arm and three
eligible unseen runs per arm. These are operational evidence floors, not a claim
of statistical power; effect sizes, raw counts, denominators, p50/p90, and
missingness are always reported. A future power calculation may create revision
4 but cannot alter revision-1, revision-2, or revision-3 results.

## Metric dictionary

| Metric | Unit and denominator | Collection rule | Better / blocking rule |
|---|---|---|---|
| defect escape rate | confirmed benchmark defects not found before candidate acceptance / total seeded+adjudicated defects | independent adjudicator maps each defect to the frozen oracle | lower; any escaped P0/P1 blocks |
| requirement misunderstanding | frozen acceptance criteria implemented with materially wrong semantics / applicable criteria | blinded diff+behavior grading | lower; P1 blocks |
| critical/high security findings | distinct validated findings by severity per run | seeded controls plus independent security rubric; duplicate root cause counted once | zero P0/P1 required |
| regression count | previously passing frozen behavior that fails / applicable regression checks | deterministic rerun on exact candidate | zero P0/P1; no P2-per-run regression |
| oracle weakness | seeded fault surviving the declared applicable oracle / seeded faults | mutation/fixture identity hidden from executor; unsupported tooling is not pass | lower; missing applicable oracle is insufficient/block per assurance |
| unnecessary complexity | adjudicated avoidable components, abstractions, dependencies, or authority copies / run | two graders use frozen deletion/duplication rubric | non-inferior to baseline |
| review time | active reviewer minutes per accepted/rejected run | external timer; excludes environment outage and records exclusions | threshold by assurance; report p50/p90 |
| review corrections | material corrections requested / run | deduplicate by root cause and severity | lower or non-inferior |
| rollback/recovery success | successful exact-subject recovery / attempted recovery fixtures | bounded executable recovery fixture | required for A2/A3 where applicable |
| escaped assumptions | material unstated assumptions first discovered after build start / total adjudicated assumptions | frozen assumption ledger and event timestamps | lower; authority-affecting escape blocks |
| product decision quality | rubric dimensions correctly reject, revise, or proceed / applicable product cases | blinded product graders; includes at least one reject and revise case | frozen minimum agreement and outcome |
| rework | changed source lines plus corrected decisions after first verification / accepted run | version-control diff; generated/vendor files excluded by frozen rule | lower or within budget |
| change failure | runs needing rollback, abandonment, or post-acceptance correction / eligible runs | exact terminal-state event | lower; severity gate still applies |
| outcome achieved | cases meeting frozen product and technical success thresholds / eligible observed cases | outcome window and measurement method frozen per case | higher; output completion alone earns no credit |
| reviewer comprehension | correct explanations of behavior, weakest point, and decision rationale / frozen comprehension checks | blinded reviewer rubric without implementer chat | higher; candidate may not regress |
| SLO health | healthy observed SLO windows / observed SLO windows | frozen SLI/SLO and window method | higher; candidate may not regress |
| incident learning | redacted regression fixtures created / observed incidents | independent review confirms exact root-cause/control mapping | higher; candidate may not regress |

No metric may silently substitute self-reported agent counts for external or
deterministic evidence. When an external measurement is unavailable, the field
is missing with a reason; it is not zero.

## Severity and terminal decisions

| Severity | Meaning | Evaluation effect |
|---|---|---|
| P0 | irreversible/critical harm, production authority breach, secret/private-data exposure, benchmark integrity compromise | stop cohort; reject candidate until root cause and protocol integrity are reviewed |
| P1 | material security/correctness/authority failure or invalid acceptance | segment fails; zero tolerated in calibration or unseen |
| P2 | significant defect/rework/review regression without critical harm | candidate rate may not exceed matched baseline; unexplained regression fails |
| P3 | minor issue with bounded impact | report rate and confidence; cannot mask P0–P2 |

Terminal result is exactly `PASS`, `FAIL`, `INSUFFICIENT`, or `INVALID`.
`INVALID` means protocol integrity failed; its run is retained in the accounting
and may not be silently replaced. `INSUFFICIENT` includes missing data, a thin
segment, unsupported required tooling, or grader agreement below threshold.

## Corpus and assignment protocol

Before execution, freeze and externally attest:

1. case IDs and immutable digests;
2. license/authority and privacy review per source;
3. calibration/unseen membership;
4. expected decisions, seeded faults, acceptable alternatives, and forbidden
   outcomes;
5. matched baseline/candidate assignment and randomization seed;
6. executor/model/tool/environment versions and allowed capabilities;
7. rubric, severity, formulas, exclusions, missing-data rules, stop rules, and
   segment thresholds;
8. grader identities/qualification classes and conflict disclosures.

Calibration and unseen cases are disjoint by case digest and semantic lineage.
Near-duplicate or derived cases share one lineage and cannot be split across
cohorts. Executors and graders do not receive unseen oracles. Memorization or
training-contamination risk is recorded per case.

Revision 3 freezes five calibration and three unseen runs per arm per segment.
Both cohorts must cover every one of the twelve declared case categories; one
case may carry multiple categories, but missing category coverage is
`INSUFFICIENT`, never silently ignored.
Calibration still reports variance and grader agreement; the floor supports a
repeatable pilot but does not license population-level confidence claims.

## Grader protocol

- Deterministic checks decide machine-verifiable facts first.
- At least two blinded graders independently score product judgment,
  maintainability, unnecessary complexity, and ambiguous semantic correctness.
- Graders see normalized artifacts and evidence, not baseline/candidate labels,
  executor identity, or persuasive self-assessment where practical.
- Disagreement is measured before adjudication. Raw categorical agreement must
  be at least 80% for an unseen segment to be eligible; because raw agreement is
  sensitive to prevalence, the result is reported alongside the full confusion
  table and is not described as chance-corrected reliability.
- Adjudication records the original scores, reason, and final decision; it never
  deletes disagreement.
- A grader may abstain with a reason. Abstention contributes missing data and
  cannot be coerced into a numeric score.

## Privacy, license, and retention policy

- Include only repository/case material with recorded redistribution and
  evaluation authority. Unknown license or ownership excludes the case.
- Exclude secrets, credentials, private customer data, production identifiers,
  and unconsented personal data before corpus hashing.
- Synthetic fixtures must state their generator/source and may not imitate real
  customer records closely enough to re-identify them.
- Raw sensitive operational evidence stays outside the corpus; store an
  authorized aggregate or digest-bound pointer with retention policy.
- Conversation transcripts are neither corpus truth nor acceptance evidence.
- Retain invalid, stopped, failed, clarified, and abandoned attempts in bounded
  accounting so selection bias cannot remove hard cases.

## Frozen success and cost thresholds

Safety thresholds are zero P0/P1, no P2-per-run regression, no missing critical
segment, and no unexplained data loss. Review/latency thresholds are:

| Assurance | Matched candidate budget |
|---|---|
| A0/A1 | median end-to-end latency ≤ baseline +10%; review time ≤ baseline +15% |
| A2 | both ≤ baseline +25%, with all safety/recovery gates passing |
| A3 | no hard cap; absolute and p90 cost reported for human promotion judgment |

## Freeze and change control

The active protocol is frozen by the machine-readable revision-3 file, accepted
decisions, and its repository digest; superseded revisions 1/2 remain recoverable.
Corpus cases receive a separate immutable
manifest before execution. After the first result is observed, any protocol
change creates a new revision and restarts affected calibration; it cannot
rewrite the old cohort. Candidate implementation must not read unseen fixtures
or grader keys.

## WP-01 acceptance mapping

| Deliverable | Draft evidence | Remaining freeze condition |
|---|---|---|
| benchmark segments | six exact tuples and twelve required case categories in protocol v3 | achieved; real case corpus remains WP-10/WP-14 execution work |
| metrics dictionary | digest-bound raw fields, definitions, denominators, collection, direction, distributions, and comprehension/SLO/incident-learning rates | achieved |
| severity | P0–P3 and exact terminal result semantics | achieved |
| calibration/unseen protocol | lineage isolation, assignment, 5/3 per-arm floors, freeze/change control | achieved |
| grader rules | deterministic-first, blinded dual grading, 80% raw agreement, abstention/adjudication | achieved |
| privacy/license policy | authority, exclusions, retention, invalid-run accounting | achieved; enforced per case by WP-10 manifest validator |

WP-01 acceptance is achieved at the protocol level: baseline and candidate use
the same pre-result rubric, segment keys, metrics, cost limits, missing-data
semantics, and sample floors. Corpus construction and actual measurements remain
WP-10/WP-14 work and cannot retroactively alter this freeze.
