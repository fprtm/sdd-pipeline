---
description: Implemented shadow schema and deterministic evaluator separating complexity, risk, assurance, and ceremony for SDD Pipeline vNext.
status: active
lifecycle: transient
updated: 2026-10-02
---

# WP-02 — independent control axes schema draft

**State:** IMPLEMENTED in shadow/report-only mode after ADR-001..003 approval.
It changes no acceptance or enforcement default. Canonical runtime:
`skills/meta/quality-contract/rules/axes.mjs`; executable fixture:
`skills/meta/quality-contract/fixtures/vnext/axes.json`.

## Boundary and ownership

- `complexity` describes decomposition/context cost only.
- `risk` describes probability and impact of harm only.
- `assurance` is the minimum evidence/authority profile derived from risk and
  explicit policy; it is never derived from task size or ceremony.
- `ceremony` controls interaction depth, narration, and checkpoints only.
- global hard stops are evaluated independently and cannot be overridden.
- the future evaluator should extend the existing Quality Contract runtime
  boundary, initially as a pure shadow decision with no dispatch authority.

This avoids a second owner for existing mode detection, size detection, trusted
events, or acceptance. The orchestrator supplies observed axes; a deterministic
evaluator validates them and returns the effective assurance floor.

## Canonical input schema

```yaml
axis_schema_version: "1"
subject_digest: "sha256:<64 lowercase hex>"
complexity:
  level: micro | small | medium | large
  basis: ["bounded observable reason"]
risk:
  level: low | moderate | high | critical | unknown
  dimensions:
    user_harm: none | bounded | material | severe | unknown
    money: none | bounded | material | regulated | unknown
    privacy: none | internal | personal | sensitive | unknown
    authorization: none | adjacent | enforcement | privileged | unknown
    availability: none | noncritical | customer | critical | unknown
    data_change: reversible | recoverable | destructive | irreversible | unknown
    compliance: none | contractual | regulated | safety | unknown
  basis: ["bounded observable reason"]
requested_assurance: A0 | A1 | A2 | A3
ceremony:
  mode: prototype | vibe | standard | strict | emergency
  source: explicit-user | project-config | default | incident-signal
hard_stops:
  - id: "canonical rule identifier"
    status: pass | fail | unknown
policy_version: "vnext-shadow-1"
```

Unknown fields, missing keys, duplicate keys, invalid enum values, floating
versions, unbound subjects, or unbounded text fail schema validation. `basis`
is evidence for human review, not an alternate policy language.

## Deterministic derivation

### Risk floor

The effective risk is the maximum of the declared risk and dimension floors:

| Observed dimension | Minimum risk |
|---|---|
| any `severe`, `regulated`, `sensitive`, `privileged`, `critical`, `irreversible`, or `safety` | critical |
| any `material`, `personal`, `enforcement`, `customer`, `destructive`, or contractual compliance affecting external acceptance | high |
| any `bounded`, `internal`, `adjacent`, `noncritical`, or `recoverable` beyond an ordinary local edit | moderate |
| all dimensions at their lowest value | low |

A declared level below the computed floor is invalid; a higher declared level is
allowed and remains visible. Ambiguous or missing dimension evidence yields
`unknown`, which cannot lower the floor.

### Assurance floor

Accepted mapping:

| Effective risk | Minimum assurance |
|---|---|
| low | A0 for micro-only disposable/non-public work; otherwise A1 |
| moderate | A1 |
| high | A2 |
| critical | A3 |

Project/domain/organization packs and an authorized user may raise assurance.
Nothing may lower it below the global floor. An unknown effective risk requires
at least A2 for shadow recommendations and blocks future enforced acceptance
until resolved; it never defaults to low.

### Precedence

Evaluation order is exact:

```text
schema/subject validity
→ hard stops
→ effective risk
→ minimum assurance
→ requested assurance elevation
→ complexity-specific decomposition
→ ceremony-specific interaction presentation
```

The last two steps cannot mutate the earlier results. Prototype, vibe, and
emergency may reduce ceremony but return the same assurance requirement as
standard/strict for an otherwise identical subject.

## Shadow result schema

```yaml
axis_result_version: "1"
subject_digest: "sha256:<same subject>"
status: pass | fail | unknown | blocked
effective:
  complexity: micro | small | medium | large
  risk: low | moderate | high | critical | unknown
  assurance: A0 | A1 | A2 | A3
  ceremony: prototype | vibe | standard | strict | emergency
dimensions:
  schema: {status: pass|fail, code: "...", cause: "..."}
  hard_stops: {status: pass|fail|unknown, code: "...", cause: "..."}
  risk_floor: {status: pass|fail|unknown, code: "...", cause: "..."}
  assurance_floor: {status: pass|fail|unknown, code: "...", cause: "..."}
shadow:
  enforcement: report-only
  may_dispatch: false
  may_accept: false
```

Every dimension also carries risk, owner, and remediation under the existing
Quality Contract finding convention. Machine codes must be registered before
implementation; prose strings are not stable API.

## Required fixture matrix

| Fixture | Input distinction | Required result |
|---|---|---|
| micro-critical-standard | one-file privileged authorization fix | complexity=micro, risk=critical, assurance=A3 |
| micro-critical-prototype | same exact subject, prototype | same A3; ceremony cannot demote |
| micro-critical-emergency | same exact subject, emergency | same A3; immediate mitigation may defer evidence but acceptance stays blocked |
| large-low-standard | multi-file generated internal refactor with reversible data and no external behavior | complexity=large, risk=low, assurance=A1; decomposition depth does not raise risk |
| small-moderate-vibe | reversible customer-visible behavior without sensitive data | complexity=small, risk=moderate, assurance=A1 |
| medium-high-strict | auth-adjacent customer-data API | risk=high, assurance=A2 |
| requested-elevation | low-risk work explicitly requests A3 | effective assurance=A3 |
| requested-demotion | critical work requests A1 | fail with assurance-below-floor code |
| hard-stop-fail | any size/mode with a failed no-secret rule | blocked before ceremony evaluation |
| unknown-risk | missing/ambiguous authorization impact | risk=unknown; no low-risk default; acceptance unavailable |
| subject-mismatch | same inputs bound to another candidate digest | fail closed |
| invalid-enum-or-key | unknown mode/risk or extra field | schema fail |

Positive fixtures prove each valid axis combination. Negative fixtures must
assert exact code, status, effective floor, and false authority predicates—not
only that an exception occurred.

## Compatibility and rollout

1. R0: schema and fixtures only.
2. R1: pure evaluator runs in shadow beside current orchestrator decisions;
   mismatches are reported, never silently reconciled.
3. R2: report-only result is written into evidence; existing workflows remain
   authoritative.
4. R3: explicit project policy version opts into blocking semantics.
5. Legacy documents without this schema remain readable/report-only and cannot
   acquire new dispatch or acceptance authority.

No stage changes public command count. Promotion requires WP-01 frozen evals,
WP-03 authority contracts, WP-04 transition semantics, compatibility fixtures,
and human authorization.

## Verification result

- TEST-027 passes every declared axis fixture plus malformed schema, risk
  promotion/demotion, assurance demotion, and hard-stop fail/unknown cases.
- Same micro-critical subject under standard, prototype, and emergency stays
  critical/A3; large-low-risk stays A1.
- Results are deeply frozen and always return `may_dispatch=false` and
  `may_accept=false` in shadow mode.
- Quality Contract suite passes 3/3 with 95.30% lines, 82.23% branches, and
  94.42% functions after the new module.

WP-02 package acceptance is achieved for shadow mode. Enforcement remains a
later explicit migration under WP-12.
