---
description: Implemented shadow end-to-end lifecycle state, event, transition, replay, and compatibility contract for SDD Pipeline vNext.
status: active
lifecycle: transient
updated: 2026-10-02
---

# WP-04 — lifecycle transition engine draft

**State:** IMPLEMENTED in the Quality Contract shadow boundary. Runtime owner:
`skills/meta/quality-contract/rules/lifecycle.mjs`; fixture owner:
`skills/meta/quality-contract/fixtures/vnext/lifecycle.json`. It creates no
second engine and grants no dispatch, acceptance, release, or production authority.

## State model

Canonical states are deliberately about observable lifecycle position, not
which command happens to be running:

```text
intake
→ discovering
→ problem-fit
→ validating
→ solution-fit
→ designing
→ design-ready
→ planning
→ ready-to-build
→ building
→ verifying
→ release-candidate
→ release-authorized
→ released
→ observing
→ outcome-reviewed
```

Terminal/side states are `rejected`, `rework`, `rolled-back`, and `retired`.
`blocked` and `degraded` are result statuses, not lifecycle states: the canonical
state remains the last valid state while the result explains why transition did
not occur.

## Event schema

```yaml
lifecycle_event_version: "1"
event_id: "stable opaque ID"
workflow_id: "stable opaque ID"
predecessor_event_digest: "sha256:<digest or genesis sentinel>"
from_state: "canonical state"
to_state: "canonical state"
work_subject:
  repository_digest: "sha256:<digest>"
  candidate_digest: "sha256:<digest or no-candidate sentinel>"
  environment_digest: "sha256:<digest or no-environment sentinel>"
  policy_digest: "sha256:<digest>"
decision:
  kind: approve | reject | revise | start | complete | authorize | release | rollback | retire
  role_id: "canonical role"
  assignment_digest: "sha256:<WP-03 assignment>"
evidence_refs:
  - evidence_digest: "sha256:<digest>"
    evidence_class: claim | static | executed | independent | production
    observed_at: "RFC3339 UTC"
issued_at: "RFC3339 UTC"
expires_at: "RFC3339 UTC"
nonce: "single-use opaque value"
issuer: "trusted issuer identifier"
signature: "external attestation envelope"
```

Exact schema, canonicalization, digest, time, issuer, revocation, and nonce rules
reuse Quality Contract trusted-event primitives. Unknown/duplicate fields,
invalid Unicode/canonicalization, unbounded arrays/text, or ambiguous subjects
fail before transition evaluation.

## Transition table

| From | To | Decision | Minimum owner/evidence | Failure route |
|---|---|---|---|---|
| intake | discovering | start | valid intake contract; product owner assigned | remain intake/blocked |
| discovering | problem-fit | approve | product-owner decision + problem evidence | rejected or remain discovering |
| problem-fit | validating | start | explicit hypothesis, thresholds, evidence plan | remain problem-fit |
| validating | solution-fit | approve | experiment evidence and product-owner decision | rejected or revise to discovering |
| solution-fit | designing | start | settled product scope/non-goals | remain solution-fit |
| designing | design-ready | approve | architect decision + assurance-triggered threat/UX/data/SRE evidence | rework to designing |
| design-ready | planning | start | canonical specs bound to subject | remain design-ready |
| planning | ready-to-build | approve | approved work order, scope, authority, risk/assurance, tests, rollback | rework to planning |
| ready-to-build | building | start | eligible Quality Contract preflight and operation lease | remain ready-to-build/blocked |
| building | verifying | complete | exact candidate and implementer evidence/deviations | rework to building |
| verifying | release-candidate | approve | independent verifier; required security/SRE evidence; frozen criteria pass | rework to building/verifying |
| release-candidate | release-authorized | authorize | external release authority bound to exact candidate+environment+window | remain release-candidate |
| release-authorized | released | release | unexpired single-use operation authorization and rollout evidence | remain release-authorized/blocked |
| released | observing | start | observation plan, signals, outcome window, owners | rollback or remain released |
| observing | outcome-reviewed | approve | outcome-owner receives distinct product+technical evidence | iterate to discovering or rollback |
| outcome-reviewed | retired | retire | canonical outcome, no live dependency, trusted recovery/retention policy | remain outcome-reviewed |
| released/observing | rolled-back | rollback | authorized rollback event bound to release subject | remain state/blocked |
| any nonterminal before released | rejected | reject | role authorized for that gate, recorded rationale | no forward transition |
| rework | prior applicable state | revise | new revision/event chain; prior evidence stays historical | remain rework |

Directly skipping an intermediate state is invalid unless a versioned policy
declares a specific safe shortcut. Emergency changes may create a mitigation
candidate quickly, but ordinary acceptance/release still needs the missing
evidence transitions; urgency does not rewrite history.

## Evidence maturity rules

Evidence classes form an ordered vocabulary, not an automatic substitution:

```text
claim < static < executed < independent < production
```

Higher class remains bounded by subject, environment, method, and time. A
production observation for candidate X cannot validate candidate Y; an
independent review without executed evidence cannot satisfy an executable
control. Each transition declares required classes through the assurance policy.

## Replay, expiry, and concurrency

- Event IDs and nonces are single-use in a workflow.
- A valid event references the exact predecessor digest; forks at one predecessor
  are conflicts until an authorized reconciliation event selects one branch.
- Expiry is checked against trusted monotonic/external time, not caller wall time.
- Authorization or evidence issued for another policy, candidate, environment,
  workflow, or assignment is stale/invalid.
- Revocation after issue follows the frozen policy's explicit cutoff rule; an
  unavailable revocation source fails closed for A2/A3.
- Dispatch consumes the authorization nonce atomically before side effects.
- A timed-out/cancelled operation cannot reuse its lease; retry needs a new event.
- Historical rejected/failed/reworked events remain append-only evidence.

## Legacy and report-only compatibility

- Inputs without `lifecycle_event_version` are legacy and may be summarized but
  cannot create vNext authority or forward transitions.
- R1 shadow evaluation compares inferred current state with the event model and
  writes no canonical state.
- R2 report-only stores results but leaves current workflow authoritative.
- R3 begins only after explicit project migration binds policy/schema versions.
- Unknown/revoked versions fail closed; deprecated versions may finish only
  under a frozen sunset policy and cannot start new work.
- Downgrade never reinterprets a vNext authorization as a legacy approval.

## Required executable negative fixtures

1. transition not present in the table;
2. valid transition with unauthorized or self-approving actor;
3. stale candidate/evidence/environment/policy/assignment digest;
4. replayed event ID or nonce;
5. expired event using caller-controlled clock rollback;
6. concurrent fork from one predecessor;
7. forged/unknown/revoked issuer;
8. release authorization reused for another environment;
9. emergency mitigation attempting to skip deferred verification;
10. missing required evidence class represented as pass;
11. legacy input attempting a mutating transition;
12. raw incident data/secret entering a regression event;

Each fixture asserts exact status/code, unchanged prior state, false authority
predicates, and retained failure accounting. Positive fixtures cover every table
row and exact-subject success path.

## WP-04 acceptance mapping

| Deliverable | Draft status | Remaining proof |
|---|---|---|
| state schema/transition table | implemented and exported | positive fixture covers every edge |
| event validation | strict canonical schema plus external exact-event attestor | malformed/tampered/expired fixtures pass |
| exact-subject binding | repository/candidate/environment/policy enforced | mismatch preserves prior state |
| replay/expiry behavior | trusted-time verification plus atomic durable consume adapter | replay/expiry/failure fixtures pass |
| legacy/report-only compatibility | implemented | installer/provider migration remains WP-12 |

WP-04 package acceptance is achieved for the local shadow runtime. TEST-029
covers every allowed edge plus invalid edge, role, predecessor, subject, replay,
missing replay store, unverified event, expiry, malformed attestation, and legacy
mutation. External issuer/revocation adapters and opt-in enforcement remain
explicit WP-12 integration work.
