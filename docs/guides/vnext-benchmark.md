# vNext benchmark methodology

[Policy] `benchmarks/vnext/protocol-v3.json` is the active frozen protocol. Revisions
1 and 2 remain immutable. Revision 3 binds all twelve corpus categories plus
comprehension, SLO-health, and incident-learning metrics. Its digest,
segments, 5/3 cohort floors, grader agreement, cost budgets, and severity gates
must change through a new protocol version, not after results are seen.
The frozen file SHA-256 is
`0e2e56548e99c0c7b8246efaf200b1db791ed265e761dd9ec1d4e4585a551106`,
while manifest binding uses the
canonical JSON digest `sha256:5c2cf1fad8c4a3b5c984b3e926d42641965ea201c28de56b0b5c58f21414eba7`.

[Mechanical] `benchmark/runner.mjs` validates licensed lineage, matched
case/arm assignment, complete frozen metrics, grader attestations, missing-data
reasons, and segment gates. It reports all metric numerators/denominators plus
p50/p90 costs, explicit per-segment terminal status and effect-size deltas, and
bounded missingness detail; the top-level decision envelope cannot mask a
failed segment. Segment arms retain verbatim executor/model/prompt/tool and
provider/OS/runtime profiles beside their binding digests, timeframe, and
measurement method. Its isolated adapter executor
creates and removes a disposable local workspace, passes network-disabled
intent, enforces timeout/input/output bounds, and seals the returned measurement
digest. Adapter output is a strict allowlisted metric envelope; arbitrary raw
logs or source-shaped fields are invalid. The grader executor separately enforces blind arm/executor inputs,
attestation/pre-adjudication fields, timeout/output bounds, and grade sealing;
actual sandbox/network and human-identity enforcement remain host capabilities.
`synthetic-fixture` and
`field-pilot` are distinct evidence classes; only the latter can be promotion
input. A benchmark result never marks itself promotion-eligible; its report
always sets `human_promotion_required`. `benchmark/promotion.mjs` separately
requires rollout, review, outcome, and externally attested human-decision
evidence. `scripts/test-vnext-benchmark.sh` uses 96 synthetic attempts to prove
mechanics only.

[Runtime] Real promotion requires a locally authorized corpus, independent
blinded grades, and both calibration and unseen measurements.

[Policy] The older `rules/pilot-gates.mjs` evaluates Quality Contract v1
artifact-efficiency tuples only. Its result is explicitly scoped as
`quality-contract-v1-artifact-efficiency` with `may_promote_vnext: false`.
The vNext benchmark plus externally verified promotion packet are the sole
vNext promotion path inside the same Quality Contract runtime boundary.

[Host-dependent] No remote service, proprietary corpus, or cross-provider
quality result is bundled or claimed.

The exact collection and execution checklist is in
`benchmarks/vnext/PILOT.md`. Run a bounded local evaluation with:

```sh
node benchmarks/vnext/run.mjs \
  benchmarks/vnext/protocol-v3.json manifest.json attempts.json
```

Exit status is `0` for a passing comparison, `1` for a measured gate failure,
and `2` for invalid or insufficient evidence. A synthetic pass returns
`BENCHMARK_MECHANICS_PASS`, never `BENCHMARK_PASS`.
