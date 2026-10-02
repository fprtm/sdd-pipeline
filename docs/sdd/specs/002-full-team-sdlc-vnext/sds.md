[← Back to work order](tickets/00-index.md)

---
description: Architecture for SDD Pipeline vNext control, lifecycle, profile, benchmark, and portability modules.
status: draft
lifecycle: canonical
goal: Extend one trusted runtime boundary through composable deterministic modules and provider-neutral policy.
updated: 2026-10-02
source_decisions_digest: sha256:12e2bd6520e3d8bf93b9b1fb5401b1647f5d111f215938342eb00c1d2d698758
---

# SDS-002 — Full-Team SDLC vNext

## Architecture decision

Extend `skills/meta/quality-contract/` with orthogonal, zero-dependency rule
providers and data schemas; do not create a second authority engine. New policy
skills describe product, QA, security, release, outcome, and pack behavior, while
machine predicates remain in one facade. All vNext behavior begins shadow or
report-only and is activated only by an explicit policy-version migration.

| Component | Owns | Must not do |
|---|---|---|
| axis evaluator | schema and effective complexity/risk/assurance/ceremony | infer lower assurance from mode/size |
| role authority rule | assignments, SoD, fallback, transition eligibility | manufacture human identity/qualification |
| lifecycle rule | state/event validation, predecessor, replay, expiry, subject | dispatch external effects or duplicate gateway |
| product validation policy | intake, assumptions, hypothesis, reject/revise/proceed | force every idea toward BUILD |
| delivery policy | evidence mapping, verifier packet, defect/rework routing | duplicate FSD/ticket truth |
| engineering profile rule | architecture, compatibility, reversibility, maintainability, performance, operability evidence | grant acceptance authority |
| QA profile rule | applicable behavioral techniques and residual risk | call unavailable tooling a pass |
| readiness profile rule | security/operations controls and exceptions | grant release authority |
| outcome rule | observation/incident-to-regression/result decision | persist raw sensitive logs |
| benchmark runtime | manifests, isolated adapter, graders, segment comparison | fetch arbitrary code or alter frozen rubric |
| pack resolver | schema, precedence, tightening proof | weaken global hard stops |
| capability resolver | required/optional host features and migration posture | claim unsupported provider guarantees |

## Repository shape

```text
benchmarks/vnext/
  protocol-v1.json                # immutable superseded revision
  protocol-v2.json                # immutable; binds metric dictionary
  protocol-v3.json                # active; binds categories + all quality dimensions
  corpus/{calibration,unseen}/manifest.json
  fixtures/
  results/                    # bounded generated examples; raw runs excluded
skills/meta/quality-contract/
  rules/{axes,roles,lifecycle,product,delivery,engineering,qa,readiness,outcome,packs,capabilities}.mjs
  benchmark/{loader,runner,graders,compare}.mjs
  fixtures/vnext/
skills/{think,build,prove,meta}/
  policy skills updated to consume, not restate, canonical rules
skills/packs/{developer-tooling,high-risk-api}/
docs/guides/                 # lifecycle/roles/assurance/benchmark/migration
```

Exact filenames may be consolidated when one module has no independent consumer;
the semantic ownership boundaries above are normative.

## Common wire rules

- Strict JSON: allowlisted keys, unique fields/IDs, UTF-8 NFC strings, bounded
  depth/bytes/arrays, decimal integer strings where existing Quality Contract
  canonicalization requires them, lowercase SHA-256 digests.
- Findings retain `{status,code,cause,risk,owner,remediation}`; new codes enter
  the stable registry before emission.
- Subjects include repository/candidate/environment/policy/schema/rules digests.
- Unknown/revoked schema or required capability fails; legacy input is
  report-only and cannot gain dispatch/acceptance authority.
- Shadow results set `may_dispatch=false` and `may_accept=false` regardless of
  otherwise green dimensions.

## Axis and role composition

Axis evaluation validates exact input, promotes risk monotonically from impact
dimensions, derives the assurance floor, then applies only upward policy/user
overrides. Complexity feeds decomposition; ceremony feeds presentation. Role
evaluation consumes the resulting assurance plus exact assignments. A2 requires
implementer/verifier separation and applicable specialist review; A3 additionally
requires externally attested qualified human authority. Distinct strings alone
never prove independence.

## Lifecycle composition

Lifecycle events form a signed predecessor chain over canonical states from
intake through outcome review, with reject/revise/rework/rollback/retire routes.
The existing trusted-event verifier supplies issuer, trusted-time, revocation,
subject, and signature validation. The replay store atomically consumes event
nonces/operation leases. An invalid event returns a finding and leaves the last
valid state unchanged.

## Profiles and packs

Assurance selects evidence floors; profiles select applicable proof techniques.
Pack merge order is global hard stops → assurance policy → domain pack →
organization pack → project upward overrides. Each later layer may add controls,
raise risk/assurance, narrow scope, or require stronger evidence. A monotonicity
check rejects deletion, downgrade, broader scope, weaker authority, or reduced
evidence.

## Benchmark runtime

The loader accepts only a locally pinned corpus manifest whose case digests,
license/privacy authority, lineage, cohort, segment, expected decision, seeded
faults, allowed alternatives, and forbidden outcomes validate against protocol
v1. The runner copies a case to a temporary isolated workspace, invokes an
explicit allowlisted adapter, bounds time/output, and seals measurements. Grader
adapters are deterministic or externally attested; human scores retain original
and adjudicated values. Comparator never emits an aggregate pass: every frozen
segment gets PASS/FAIL/INSUFFICIENT/INVALID plus raw counts and cost measures.

## Compatibility and distribution

Installer stages all runtime modules atomically as today. Capability negotiation
returns supported/degraded/blocked for required and optional features. Legacy
consumer CI keeps current report-only behavior; an explicit vNext policy marker
changes missing required installed tools to blocking. Downgrade removes vNext
enforcement only after preview and never reinterprets vNext authority as legacy.
Public commands remain unchanged.

## Rollout and observability

R1 shadow stores bounded mismatch results; R2 report-only exposes them; R3 is an
explicit project migration; R4/R5 require frozen unseen results and human
promotion. Gate telemetry records invocation, defect/decision effect, false
positive, elapsed/review cost, skip reason, and review date without storing raw
source or user data.

[← Work-order index](tickets/00-index.md)
