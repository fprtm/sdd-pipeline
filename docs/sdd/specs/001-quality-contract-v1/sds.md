[← Back to work order](tickets/00-index.md)

---
description: Architecture and operational design for Quality Contract v1.
status: draft
lifecycle: canonical
goal: Define the portable contract engine without duplicating policy in command adapters.
updated: 2026-09-30
source_decisions_digest: sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2
---

# SDS-001 — Quality Contract v1

## Architecture decision

Quality Contract v1 is a local zero-dependency Node.js ESM facade over a strict parser, deterministic rule providers, trusted-event/evidence verification, and thin compatibility adapters. It migrates existing checkers incrementally rather than replacing them wholesale.

| Module | Responsibility | Must not do |
|---|---|---|
| Contract parser | Locate exactly one typed block, validate, canonicalize, and digest it. | Execute commands or treat surrounding prose as authority. |
| Evaluator facade | Compose independent dimensions and own the only normative predicates. | Emit generic PASS or upgrade unknown/degraded status. |
| Rule providers | Check readiness, projection drift, scope/accounting, lifecycle, fit, and provenance. | Mutate a worktree or authorize intent. |
| Trusted-event verifier | Verify externally authenticated role, separation, liveness, and binding. | Treat candidate Markdown as an event. |
| Evidence verifier | Verify sealed snapshot envelope and AC-map freshness. | Execute arbitrary contract prose. |
| Adapter | Invoke facade and preserve exit/status/JSON semantics. | Reinterpret or upgrade outcomes. |

## Repository shape

The new engine lives under `skills/meta/quality-contract/`:

```text
quality-contract/
  SKILL.md
  quality-contract.mjs       # stable facade
  parser.mjs                 # strict block + canonical digest
  evaluator.mjs              # result envelope and predicates
  rules/                     # orthogonal deterministic rule providers
  fixtures/                  # positive, negative, replay/tamper conformance cases
```

`spec`, `implement`, `check`, ticket decomposition, verification, installer, and CI call the facade. The public command registry remains at eight commands. Existing checkers keep working through adapters while their semantics are moved behind the facade.

## Normative result and state

The result envelope reports `parse`, `compatibility`, `effective_decisions`, `readiness`, `semantic_review`, `authorization`, `baseline`, `executor_fit`, `trusted_execution_subject`, `operation_lease`, `change_accounting`, `scope`, `minimal_change`, `implementation_review`, `evidence`, `provenance`, and `retirement` separately, with cause, risk, remediation, and ownership. `trusted_execution_subject` passes only for a complete trusted versioned base/candidate subject; it fails for no-Git and is owned by the external subject resolver. `operation_lease` owns `LEASE_*` dispatch/acceptance failures and never rewrites authorization/eligibility. `retirement` is owned by lifecycle rules and passes only under the FSD `may_retire` conditions.

The required predicate object is exactly `{ execution_eligible, may_dispatch, may_accept, may_retire }`. `execution_eligible` requires a valid/supported parse, resolved decisions, readiness, all required semantic review and authorization, green required baseline, eligible executor, and a trusted versioned subject. `may_dispatch` additionally requires `operation_lease=pass` for the exact live operation. `may_accept` requires eligibility, `operation_lease=pass` for a distinct acceptance lease, complete accounting, conformant scope, required minimal-change/implementation reviews, valid sealed evidence, and sufficient provenance. `may_retire` requires `retirement=pass`, a trusted Git subject, a sealed transient/projection target, durable accepted outcome, no live dependency, verified recovery, and preserved sole canonical truth/evidence. Degraded and unknown never equal full success.

### Canonical wire contracts

The parser accepts one fenced block exactly named ```` ```quality-contract-json ```` containing one JSON object. Contract required keys are `schema_version`, `contract_id`, `revision`, `goal`, `requirements`, `acceptance_criteria`, `ac_evidence_map`, `scope`, `requirements_digest`, `ac_map_digest`, `scope_digest`, `risk`, `tier`, `executor_class`, `base_subject`, `policy_digest`, `landmarks`, and `decision_revisions`; all other keys reject. Digests are recomputed from their same-named ordered typed arrays/objects after canonical JSON serialization; any content/digest mismatch blocks readiness. A projection must carry `ac_subset` and `ac_subset_digest`, computed by the same rule, not a digest-only claim. Canonical JSON uses lexicographically ordered keys, UTF-8, NFC strings, no insignificant whitespace, and SHA-256 digests.

`decision_revisions` is a required array of `{ decision_key, revision_id, value_digest, status, predecessor_digest|null, authority_level, accepted_at }`. `status` is `proposed|assumed|unresolved|rejected|accepted|superseded|revoked`; `authority_level` is integer-string `"0"|"1"|"2"` for author, qualified human, maintainer respectively; only `accepted` can be effective. The resolver groups by `decision_key`, follows exact predecessor digests, rejects missing predecessor/cycle, requires replacement authority ≥ predecessor authority, and yields exactly one terminal accepted revision. A competing terminal accepted revision, accepted revision after revoked input, or any unresolved required key blocks `effective_decisions`.

All object keys are allowlisted; duplicate/unknown keys, floating-point JSON numbers, non-NFC strings, and bytes/depth/path limits reject. Every integer is a decimal string (`"0"`..`"2147483647"`), including revision, exit code, duration, and lease duration; only `predecessor_digest`, `signal`, and `authorization_event_id` may be null. Arrays are only listed schema arrays, max 256 ordered items. Digests are lowercase `sha256:` plus 64 hex. IDs are ASCII `[A-Za-z0-9._:-]{1,128}`; timestamps are RFC3339 UTC `Z`; text fields max 4096 bytes. `risk=low|medium|high`, `tier=T1|T2|T3`, `executor_class=low_cost|capable|specialist`, `actor_role=author|reviewer|human_authorizer|maintainer|runner`, `operation_kind=mutation|runner|scope_expansion|acceptance`, and `scope_effect_class=repository|privileged`. Landmark/path arrays contain `{kind:existing|new,path,shape_digest}`; redactions contain `{kind,matched_count}`. A field omitted is invalid unless explicitly optional below.

| Object | Required fields | Optional fields |
|---|---|---|
| projection | `projection_version,contract_digest,ticket_id,goal,risk,tier,executor_class,base_subject,allowed_paths,forbidden_paths,landmarks,execution_digest,baseline,stop_conditions,ac_subset,ac_subset_digest` | `new_landmarks` |
| subject | `repository_digest,base_digest,candidate_digest,contract_digest,projection_digest,policy_digest,schema_digest,rules_digest,adapter_digest,ac_map_digest` | none |
| finding | `dimension,status,code,cause,risk,owner,remediation` | `location` |
| result | `envelope_version,subject,dimensions,predicates,findings,provenance_assurance` | none |
| AC result | `ac_id,assertion_status,matcher_id,matcher_version,expected_digest,observed_digest,evidence_class,negative_assertion_status` | `detail_digest` |
| evidence | `evidence_version,run_id,event_id,subject,ac_results,argv_digest,cwd_digest,environment_class,toolchain_digest,dependency_digest,exit_code,signal,duration_ms,output_digest,redactions,referenced_event_ids,started_at,completed_at,signature` | none |

`assertion_status` is `pass|fail`; matcher/version is allowlisted by external policy. Evidence is `pass` only when every effective AC result passes its frozen matcher, process `exit_code=0`, `signal=null`, subject/toolchain/dependency/event bindings match, and its signature verifies; mismatch is `stale`, a failed matcher/process is `fail`, malformed signature/schema is `fail` with an `EVIDENCE_*` code. A structurally valid failing run therefore cannot satisfy acceptance.

The exhaustive stable v1 machine-code registry is [`codes.mjs`](../../../../skills/meta/quality-contract/codes.mjs): it covers both pass and non-pass outcomes emitted by every engine module and accepted from external attestation adapters, including `SCOPE_SUBJECT_MISMATCH` and `AUTH_POLICY_PROOF_INVALID`. CI scans all emitted uppercase machine codes against that registry; ingestion rejects an unregistered external code as `ATTESTATION_CODE_INVALID`. Adding, removing, or changing a registry code requires a schema-version change.

`subject` contains repository, base, candidate, contract, projection, policy, schema, rules, adapter, and AC-map digests. Each `dimensions[name]` is `{ status, code, cause, risk, owner, remediation }`, where status is exactly the FSD enum. Predicates are booleans only and cannot be absent. The `result` row above is the sole result schema, including `provenance_assurance`.

Every event has one base schema: `{ event_version,event_id,type,issuer,key_id,actor_id,actor_role,issued_at,expires_at,subjects,signature }`; `subjects` is the required `subject` object defined above. `independent_of` exists only on review events and is an `author_run_id` ID. `operation_id` and fixed `decision:"allow"` exist only on an operation lease. `type` is `human_authorization`, `prebuild_semantic_review`, `postbuild_conformance_review`, `runner_attestation`, or `operation_lease`. The signed bytes are the unambiguous UTF-8 sequence `quality-contract-event/v1\0` + canonical JSON of every field except `signature`; duplicate keys reject, and canonical JSON is ordered UTF-8/NFC JSON as above. V1 accepts Ed25519 only: `issuer`/`key_id` select an external registry entry pinned to `algorithm: Ed25519`; an envelope never supplies an algorithm, key, URL, or trust anchor.

Authorization/review IDs are reusable while live only for exactly matching subjects; their reuse never dispatches an operation. The replay store atomically consumes only `(lease_id,nonce)` and runner `run_id`; it is durable outside the candidate workspace, locked across concurrent consumers, restored before serving after restart, and retains records at least through event expiry plus policy retention. It uses its own trusted clock: `issued_at ≤ now + skew`, `issued_at ≤ expires_at`, and maximum event lifetime must all hold; revocation is checked at issuance and evaluation. Candidate clocks/`revoked_at` prose, unknown issuer/key, unavailable revocation source, signature/subject mismatch, and replay fail closed. Key rotation permits only concurrently trusted key IDs in external configuration.

Type payloads are mandatory and are part of signed canonical JSON. `human_authorization` adds `{ human_authorizer_id, authorized_goal_digest, authorized_scope_digest, risk, executor_class }`; its goal/scope digests are derived from the exact canonical contract plus digest-pinned projection, and its risk/executor values must exactly equal both. `prebuild_semantic_review` adds `{ author_run_id, reviewer_run_id, reviewer_harness_id, reviewer_model_id, reviewer_session_id, reviewer_snapshot_digest, memory_sharing:false, frozen_inputs:{base,contract,projection,scope,landmarks,ac_map,policy,executor_class}, findings }`; it must not include a future candidate. `postbuild_conformance_review` adds `{ candidate, contract, projection, evidence, findings }` and binds one exact candidate. Each `findings` array has at most 256 unique typed records `{finding_id,severity:P1|P2|P3,code,subject_digest,detail_digest,remediation_digest}`; arbitrary finding prose is not signed. `runner_attestation` adds `{ runner_id, snapshot, policy, argv_digest, environment_class }`. A review event with inherited author history, unspecified/true memory sharing, unverifiable runs, missing frozen inputs, or a substituted type/subject fails independence.

Typed canonical records are: requirement `{id,text,priority}`, AC `{id,requirement_id,observable}`, AC-map `{ac_id,setup_digest,action,expected,negative_assertion,evidence_class}`, scope `{allowed_paths,forbidden_paths}`, baseline `{argv_digest,expected_exit_code}`, stop-condition `{code,remediation}`, and landmark `{kind,path,shape_digest}`. Each ID is unique within its array; every AC references one requirement, every map references one AC, and every projection `ac_subset` carries the complete referenced AC+map records. Projection `execution_digest` is the canonical digest of `{baseline,stop_conditions}`, not authority. `execution_authority` is a required externally verified pre-build event input to materialization/validation, not a projection field: it binds canonical contract, deterministic prospective projection, baseline, and stop-condition payload digests. Its association is `(contract_digest, projection_binding_digest, base_subject)` and an event is never standalone authority. Duplicate/orphan/mismatched reference or altered content with old digest blocks readiness. Static fixtures cover contract, projection, preflight, evidence, and pilot cases; the conformance harness deterministically constructs signed valid and one-field-invalid events for every event type.

Every event has base fields `event_version,event_id,type,issuer,key_id,actor_id,actor_role,issued_at,expires_at,subjects,signature`; `operation_id` and `decision` are required only for `operation_lease` and otherwise forbidden. The type payload above is required exactly once at top level (not duplicated in `subjects`). `human_authorization` requires its five named fields; prebuild requires every named review/frozen-input field; postbuild requires `candidate,contract,projection,evidence,findings`; runner requires its five named fields; lease requires all fields in the next paragraph. No event type has optional payload fields. The conformance harness, rather than nonexistent per-event JSON files, generates the signed event fixtures and their one-field-invalid variants.

`operation_lease` is an environment-issued event type. Its payload is `{ lease_id, authorization_event_id|null, review_event_ids, operation_id, operation_digest, operation_kind, subject, scope_effect_class, policy_digest, policy_proof, max_duration_ms, nonce, decision }`; `operation_digest` canonically binds kind, exact argv or mutation target, cwd, subject snapshot, scope/effect class, and policy. When `authorization_event_id` is non-null, `policy_proof` is exactly `null`; when it is null, `policy_proof` is exactly `{proof_version:"1",policy_digest,subject_digest,exemption_code}` and each digest binds the lease subject/policy. A separate external policy verifier must attest `{authorization:"not-required",policy_digest,subject_digest}` immediately before dispatch; a runner-issued proof by itself never exempts authorization. Human authorization/review events remain reusable live decisions over matching subjects; only the lease is single-use. The trusted replay store atomically check-and-consumes `(lease_id,nonce)` in the same gateway transaction that dispatches the operation, including concurrency locking. It is one action only; the gateway rechecks it immediately before dispatch, races completion against the absolute deadline, and returns expiration at that deadline even when a dispatcher ignores abort/cancel. It never permits retry, next mutation, scope expansion, or acceptance from the same lease. Revocation/expiry before dispatch denies; during operation the gateway cancels or safely terminates according to operation policy and returns a non-accepting result.

The evidence row above is the sole evidence/AC-result schema. Its signed bytes are `quality-contract-evidence/v1\0` + canonical JSON excluding `signature`; V1 accepts only external-registry-pinned Ed25519 runner keys. The verifier binds it to the exact runner-attestation subject. `subject.candidate` is a content-addressed base commit plus candidate tree/patch digest including untracked, deleted, mode, symlink, and submodule state; a worktree path is never a subject. `argv_digest` is re-derived from normalized approved argv, cwd, environment allowlist/class, and runner-policy identity. Retries create a new run and cannot compose evidence.

- Canonical owner: goal, effective requirements/AC, scope, and material decisions; states `draft → current → superseded|revoked`.
- Projection: digest-pinned materialization for a worker; states `active → sealed → retirable → retired`; it is never independently editable truth.
- Pre-build review binds base, canonical contract, projection, scope, landmarks, AC map, policy, intended executor class.
- Post-build review binds exact candidate plus its contract/projection/evidence.
- A reference gateway checks a lease and dispatches the one atomic operation in the same trusted process/snapshot, preventing TOCTOU/rebinding. It validates the event schema above and permits only its declared atomic `operation_id`; caller input cannot substitute it after validation. Default-deny policy rejects network, inherited/secret-bearing environments, shared/production/unclear targets, symlink-escaping cwd, and arbitrary executable paths; only explicit local/disposable allowlisted argv/cwd run. The evaluator alone is advisory eligibility and cannot stop raw/unmediated tool use; adapters must not claim otherwise.

## Compatibility and operations

Schema, rule bundle, evidence envelope, adapter protocol, and policy are pinned independently as allowed/deprecated/revoked. Unknown/revoked cannot start or accept work; deprecated active work can only finish inside its policy sunset. Legacy is report-only until an explicit migration.

V1 is provider-neutral with one validated adapter, not a cross-provider claim. That claim requires two independent adapters passing identical fixtures. Distribution installs the engine directory together with current standalone tools; CI selects trusted base/candidate itself. Parser/evaluator traversal has size, depth, path, symlink, time, and output bounds. V1 includes a minimal reference evidence runner/gateway for routed local/disposable actions: it accepts environment-approved explicit argv/cwd/environment classes, enforces lease/event checks, seals the envelope, and strips secrets. External/network/production effects require separate policy and human authority. Unmediated model/tool behavior remains a documented residual risk.

Scope paths are normalized repository-relative UTF-8 paths: absolute paths, `..`, NUL, aliases/case collisions, and symlink escapes reject. Before scope comparison the verifier resolves symlinks and accounts for tracked/untracked/ignored files, add/delete/rename, mode/executable-bit changes, symlink target changes, nested repositories/submodules, `.gitignore`, and contract/rule/workflow changes. `accounting.subject_digest` is the canonical digest of the exact trusted subject selected for evaluation, not merely a candidate-tree digest; a mismatch emits `SCOPE_SUBJECT_MISMATCH` and neither accounting nor scope can pass. If any category cannot be enumerated, `scope` cannot pass. Accounting remains not-containment.

The runner never persists raw stdout, stderr, environment, or payload. It captures bounded output in memory, redacts before serialization/logging/error reporting, computes `output_digest` from the redacted bounded representation (or an external non-reversible store reference), and rejects raw secret-bearing envelope fields. Local host process memory/terminal exposure remains residual risk.

Injection matching is optional defense-in-depth only: it can add a block/escalation but cannot authorize/lower risk or fetch, decode, or execute content. Authority, runner, and gateway policy remain mandatory if matching is disabled or misses.

[← Work-order index](tickets/00-index.md)
