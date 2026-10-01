[← Back to work order](tickets/00-index.md)

---
description: Executable proof plan for Quality Contract v1.
status: testing/review
lifecycle: canonical
updated: 2026-09-30
source_decisions_digest: sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2
---

# Test Plan — Quality Contract v1

**Environment**: local Node.js only; fixture repositories are created under a temporary directory. No test may target a shared, staging, or production environment. **Coverage target and enforced gate**: aggregate line and branch coverage ≥80% across the complete `skills/meta/quality-contract/**` engine include set, plus every listed security/error flow. `scripts/test-quality-contract.sh` invokes Node's built-in test runner with `--experimental-test-coverage`, `--test-coverage-lines=80`, `--test-coverage-branches=80`, and an engine-only include glob; all engine source modules are directly imported by the harness so an unimported module cannot silently disappear from that scope. A runtime without those flags fails explicitly rather than silently skipping measurement.

Node's native threshold flags enforce the included set in aggregate, not each row of its human-readable report. Therefore a per-module ≥80% claim would be false: at the last measured revision, several module branch rows are below that number even though the actual aggregate gate passes. Individual module rows remain review signals—especially for trust-boundary code—but are not represented as a passing per-module gate until a coverage tool with a merged per-file enforcement capability is adopted. The command output from the current run is the authoritative measurement; this plan intentionally does not freeze a stale percentage as a quality claim.

| ID | Class | Proves | Given / When / Then |
|---|---|---|---|
| TEST-001 | security | SEC-001, REQ-007 | A changed candidate contract/rule/workflow with a prior attestation → evaluate → provenance/authority is invalid. |
| TEST-002 | security + negative | SEC-002, REQ-001 | Duplicate key/block → `parse=fail/PARSE_DUPLICATE_KEY`, `execution_eligible=false`, `may_dispatch=false`. |
| TEST-003 | security + negative | SEC-003, REQ-003 | Environment-manufactured human authorization → `authorization=fail/AUTH_HUMAN_REQUIRED`, all predicates false. |
| TEST-004 | security + negative | SEC-004, REQ-006 | Evidence for different candidate/AC-map/rule/environment → verify → stale/invalid; exact sealed snapshot succeeds. |
| TEST-005 | security | SEC-005, REQ-NF-003 | Command-like contract/repository prose → evaluate → never executes; finding/escalation is returned. |
| TEST-006 | integration + negative | SEC-006, REQ-008 | Untracked, delete, rename, lockfile, submodule and no-Git fixtures → exact accounting code; no-Git emits `trusted_execution_subject=fail`, `change_accounting=unknown`, both predicates false. |
| TEST-007 | integration | SEC-007, REQ-003 | Missing/new/ambiguous landmarks and promoted risk → preflight → blocked; complete eligible fixture may execute. |
| TEST-008 | compatibility | SEC-008, REQ-NF-002 | Unsupported/revoked adapter/schema/rules → fail closed; validated pinned adapter preserves result envelope. |
| TEST-009 | security | SEC-009 | Secret-like runner output → seal → redacted bounded envelope with no raw payload. |
| TEST-010 | performance + security | SEC-010, REQ-NF-001 | Over-limit depth/bytes/symlink/output fixture → bounded failure within configured limit. |
| TEST-011 | integration | REQ-004, REQ-007 | Exact candidate, green baseline, conformant scope, required reviews/mapped evidence, and acceptance lease → all required dimensions pass and `may_accept=true`. |
| TEST-012 | regression | REQ-009 | Ticket projection digest differs from canonical owner → drift; refreshed projection remains non-authoritative. |
| TEST-013 | security | SEC-003 | Forged/key-substituted/unsupported-algorithm/canonicalization-equivalent/reused event ID → external verifier → denied. |
| TEST-014 | security | SEC-003 | Clock rollback/future issue/revoked-after-issue/revocation source unavailable → trusted-time verifier → denied. |
| TEST-015 | security | SEC-004 | Altered argv/cwd/environment/policy/runner key or dirty/untracked replay → evidence verifier → denied. |
| TEST-016 | security | SEC-005 | Symlink cwd, inherited secret, production target, argv substitution, or expiry at dispatch → gateway → denied before execution. |
| TEST-017 | security | SEC-006 | Path alias/symlink/ignored/mode/submodule/engine-workflow bypass → accounting → scope not pass. |
| TEST-018 | security | SEC-005, SEC-009 | Direct/indirect/encoded/multilingual/tool-output/link/spoof inputs and benign lookalikes never execute; detector miss still leaves policy enforcement intact and redacted output has no secret. |
| TEST-019 | unit + security | REQ-010, SEC-002 | Missing predecessor, cycle, proposed/unresolved supersession, competing accepted value, revoked predecessor, or lower-authority replacement → effective decisions blocked. |
| TEST-020 | security | SEC-003 | Concurrent lease consumer → `authorization=fail/LEASE_REPLAY`, all predicates false; each other case is asserted by its exact outcome-matrix row. |
| TEST-022 | security | SEC-004 | Nonzero exit → `evidence=fail/EVIDENCE_PROCESS_FAILED`, `may_accept=false`; each other case is asserted by its exact outcome-matrix row. |
| TEST-021 | regression | REQ-011, REQ-012 | Thin/failing segment, P1, aggregate masking, duplicate authority, token/projection ratio or repeated-prose excess, entry/artifact cap, retrieval/p50/p90 regression, mixed responsibility, or archive/index-only movement → rollout/bloat gate blocked. |
| TEST-024 | lifecycle | REQ-009, REQ-012 | Retire projection/raw evidence without durable outcome, with live dependency, unrecoverable Git state, or as sole canonical truth/evidence → `retirement=fail`; all four predicates satisfied → eligible retirement. |
| TEST-023 | schema | REQ-001, REQ-002 | Canonical `quality-contract-json` example parses; alternate block name → `PARSE_BLOCK_NAME`; omitted required field → `PARSE_REQUIRED_FIELD`; forbidden number/illegal null → `PARSE_FIELD_TYPE`. |
| TEST-025 | security + liveness | REQ-003, REQ-NF-001 | A dispatcher whose completion never settles before its bounded lease deadline → gateway returns `LEASE_EXPIRED` and requests cancellation; every declared Git category is individually required and compared. |
| TEST-026 | adversarial | SEC-005, SEC-009 | Shell-shaped, instruction-shaped, encoded, link-shaped, and Unicode lookalike payloads remain inert data; no payload executes while parser/redaction boundaries remain fail-closed. |

## Exact outcome matrix

| Case | Required dimension/status/code | `execution_eligible` | `may_dispatch` | `may_accept` | `may_retire` |
|---|---|---:|---:|---:|
| duplicate block/key | `parse=fail/PARSE_DUPLICATE_KEY` | false | false | false | false |
| conflicting terminal decision | `effective_decisions=fail/DECISION_CONFLICT` | false | false | false | false |
| environment asserts human approval | `authorization=fail/AUTH_HUMAN_REQUIRED` | false | false | false | false |
| no Git | `trusted_execution_subject=fail/SUBJECT_NO_GIT`; `change_accounting=unknown` | false | false | false | false |
| missing dispatch lease | `operation_lease=fail/LEASE_MISSING` | true | false | false | false |
| consumed dispatch lease | `operation_lease=fail/LEASE_REPLAY` | true | false | false | false |
| replayed lease | `operation_lease=fail/LEASE_REPLAY` | true | false | false | false |
| altered operation under lease | `operation_lease=fail/LEASE_OPERATION_MISMATCH` | true | false | false | false |
| failed matcher | `evidence=fail/EVIDENCE_MATCHER_FAILED` | true | false | false | false |
| nonzero process | `evidence=fail/EVIDENCE_PROCESS_FAILED` | true | false | false | false |
| changed evidence subject | `evidence=stale/EVIDENCE_SUBJECT_STALE` | true | false | false | false |
| changed toolchain | `evidence=stale/EVIDENCE_TOOLCHAIN_STALE` | true | false | false | false |
| wrong attestation event | `evidence=stale/EVIDENCE_ATTESTATION_MISMATCH` | true | false | false | false |
| fully bound green fixture | every required dimension `pass` | true | true | true | true |

The CLI test harness runs `scripts/test-quality-contract.sh`, which delegates the existing ESM assertions through `scripts/test-quality-contract.test.mjs` so Node can measure imported engine modules. Tests are written before implementation and reviewed independently from the builder. No UI/E2E cases apply: this is a local CLI/library feature.

[← Work-order index](tickets/00-index.md)
