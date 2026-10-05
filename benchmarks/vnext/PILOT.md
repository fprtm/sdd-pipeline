# vNext field-pilot input kit

This checklist turns the frozen protocol into an auditable field run. It does
not grant repository, data, review, release, or promotion authority.

## Before collection

1. Name the corpus owner, privacy/license reviewer, two independent human
   graders, and promotion authority outside benchmark content.
2. Select at least five calibration and three unseen cases for each of the six
   frozen segments. Keep semantic lineages disjoint across cohorts.
3. Freeze the case manifest before observing results. Set `evidence_class` to
   `field-pilot`, bind `protocol_digest` to the canonical JSON digest
   `sha256:5c2cf1fad8c4a3b5c984b3e926d42641965ea201c28de56b0b5c58f21414eba7`
   (not the byte-for-byte file SHA), record the verbatim `randomization_seed`,
   record every case/arm in its randomized `execution_order`, and bind the seed,
   order, and every sorted case assignment as `assignment_digest`.
4. Cover every frozen case category in both calibration and unseen cohorts,
   and tag each case with one or more `categories` from protocol revision 3.
   Missing category coverage makes the cohort `INSUFFICIENT`.
5. For every case, record all fields enforced by `benchmark/runner.mjs`,
   including repository snapshot, evaluation authority, privacy review,
   source provenance, retention policy, hidden facts/tests, three rubrics,
   security traps, and contamination risk. License/evaluation authority,
   provenance, privacy, and retention records each require immutable digests;
   `unknown`, `pending`, and common credential-shaped corpus content are rejected.
6. Normalize artifacts shown to graders. Hide arm and executor identity where
   practical, disclose conflicts, and retain each pre-adjudication score.

## Per-attempt record

Every case has exactly one retained `baseline` and one retained `candidate`
attempt. An attempt records:

- verbatim executor/model/tool and provider/OS/runtime profiles, their canonical
  binding digests, pipeline version, measurement timeframe, and method;
- terminal result (`PASS`, `FAIL`, `INSUFFICIENT`, or `INVALID`);
- latency and review time;
- P0–P3 findings;
- defect, requirement, regression, oracle, complexity, correction, recovery,
  assumption, product-decision, rework, change-failure, and outcome counts;
- at least two independently attested human grades with qualification,
  conflict disclosure, blinded fields, and pre-adjudication digest;
- when raw verdict or severity differs, an independently attested adjudication
  with a distinct adjudicator identity, conflict disclosure, final
  verdict/severity, and reason. Raw grades remain unchanged and the segment
  report retains the pre-adjudication confusion table.

A grader may use `ABSTAIN` only with `severity: null` and a bounded reason. The
attempt remains retained, but the affected segment becomes `INSUFFICIENT`; an
abstention is never coerced into a score or silently replaced.

Use zero only for an observed zero. Use denominator zero for a metric that is
genuinely not applicable. If a required observation is unavailable, set the
metric to `null` and provide its bounded reason in `metric_missing`; the run
will correctly become `INSUFFICIENT` rather than silently treating it as zero.
Numerators may not exceed their denominators.

## Execute and retain

```sh
node benchmarks/vnext/run.mjs \
  benchmarks/vnext/protocol-v3.json \
  /authorized/path/manifest.json \
  /authorized/path/attempts.json \
  > /authorized/path/result.json
```

Retain the input digests, normalized result, invalid/stopped/failed attempts,
grader disagreement, exclusions, and command environment. Do not place raw
sensitive operational data in this repository; store an authorized aggregate
or digest-bound pointer.

## Promotion boundary

`BENCHMARK_PASS` means the field input satisfied the frozen mechanical gates.
It does not automatically promote vNext. The named human promotion authority
must separately review segment results, absolute and p90 A3 cost, unexplained
missingness, report-only/opt-in operational outcomes, and independent ticket
reviews, then record `promote`, `revise`, or `reject`.

Build a strict promotion packet matching
`skills/meta/quality-contract/fixtures/vnext/promotion.json`. The packet binds:

- the passing field-benchmark result;
- shadow, report-only, opt-in, and unseen rollout evidence;
- independent verifier, security, and SRE reviews;
- quality, productivity, product, and operational field outcomes;
- the named human authority, rationale, timestamp, and decision.

`benchmark/promotion.mjs` keeps incomplete packets blocked and requires an
`external-promotion-authority-v1` adapter to attest the exact packet digest,
actor, and decision. Repository prose or a digest-shaped fixture cannot supply
that authority. A valid `revise` or `reject` decision closes the decision record
but never authorizes a default change.
