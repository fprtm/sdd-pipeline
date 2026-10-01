#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if ! node --help 2>&1 | rg --fixed-strings --quiet -- '--test-coverage-lines'; then
  echo 'quality-contract coverage gate requires a Node runtime with --test-coverage-lines and --test-coverage-branches' >&2
  exit 2
fi
# Node's native threshold flags apply to the complete included set, not each
# printed coverage row. Keep this scope explicit: all engine source modules
# are imported by the harness, and the aggregate is the enforceable floor.
exec node --test \
  --experimental-test-coverage \
  --test-coverage-lines=80 \
  --test-coverage-branches=80 \
  --test-coverage-include='skills/meta/quality-contract/**' \
  scripts/test-quality-contract.test.mjs

node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseContractDocument, canonicalJson, digest } from './skills/meta/quality-contract/parser.mjs';
import { evaluateContractDocument } from './skills/meta/quality-contract/quality-contract.mjs';
import { resolveEffectiveDecisions } from './skills/meta/quality-contract/rules/effective-decisions.mjs';
import { createProjection, projectionBindingDigest, validateProjection, validateProjectionLandmarks } from './skills/meta/quality-contract/rules/projection.mjs';
import { verifyPreflightAttestation, evaluateParsedContract, registerVerifiedAcceptanceAttestation } from './skills/meta/quality-contract/evaluator.mjs';
import { verifyTrustedEvent, verifyExecutionAuthorityEvent, canonicalAuthorizationBinding, signedEventPayload } from './skills/meta/quality-contract/trusted-events.mjs';
import { createGateway, createReplayStore, operationDigest } from './skills/meta/quality-contract/gateway.mjs';
import { redactOutput, sealEvidenceRun, isValidEvidenceEnvelope } from './skills/meta/quality-contract/evidence-runner.mjs';
import { verifySealedEvidence } from './skills/meta/quality-contract/rules/evidence.mjs';
import { verifyAcceptanceAttestation } from './skills/meta/quality-contract/rules/acceptance.mjs';
import { evaluateCompatibility, evaluateRetirement, evaluatePilotGates, verifyFrozenPilotPlan, verifyPilotMeasurements } from './skills/meta/quality-contract/rules/pilot-gates.mjs';
import { evaluateScopeAccounting } from './skills/meta/quality-contract/rules/scope-accounting.mjs';
import { evaluateExecutorFit } from './skills/meta/quality-contract/rules/executor-fit.mjs';
import { RESULT_CODES, isResultCode } from './skills/meta/quality-contract/codes.mjs';

const fixture = JSON.parse(await readFile('./skills/meta/quality-contract/fixtures/core.json', 'utf8'));
const projectionFixture = JSON.parse(await readFile('./skills/meta/quality-contract/fixtures/projection.json', 'utf8'));
const preflightFixture = JSON.parse(await readFile('./skills/meta/quality-contract/fixtures/preflight.json', 'utf8'));
const evidenceFixture = JSON.parse(await readFile('./skills/meta/quality-contract/fixtures/evidence.json', 'utf8'));
const pilotFixture = JSON.parse(await readFile('./skills/meta/quality-contract/fixtures/pilot.json', 'utf8'));
const valid = parseContractDocument(fixture.valid);
assert.equal(valid.ok, true, valid.cause);
assert.equal(parseContractDocument(fixture.duplicate_key).code, 'PARSE_DUPLICATE_KEY');
assert.equal(parseContractDocument(fixture.command_like).code, 'PARSE_FIELD_TYPE');
assert.equal(parseContractDocument(fixture.unknown_key).code, 'PARSE_FIELD_TYPE');
assert.equal(parseContractDocument('x'.repeat(fixture.oversized_bytes)).code, 'PARSE_FIELD_TYPE');
assert.equal(parseContractDocument(fixture.valid.replace('quality-contract-json', 'quality-contract')).code, 'PARSE_BLOCK_NAME');
assert.equal(parseContractDocument(fixture.valid.replace('"revision":"1",', '')).code, 'PARSE_REQUIRED_FIELD');
assert.equal(parseContractDocument(fixture.valid.replace('"revision":"1"', '"revision":1')).code, 'PARSE_FIELD_TYPE');
assert.equal(parseContractDocument(`${fixture.valid}\n${fixture.valid}`).code, 'PARSE_DUPLICATE_KEY');
const missingMap = structuredClone(valid.contract);
missingMap.ac_evidence_map = [];
missingMap.ac_map_digest = digest(missingMap.ac_evidence_map);
assert.equal(parseContractDocument(`\`\`\`quality-contract-json\n${JSON.stringify(missingMap)}\n\`\`\``).code, 'PARSE_REQUIRED_FIELD');
assert.equal(canonicalJson({ z: 'x', a: ['y'] }), '{"a":["y"],"z":"x"}');
assert.match(digest([]), /^sha256:[a-f0-9]{64}$/);
assert.equal(new Set(RESULT_CODES).size, RESULT_CODES.length, 'stable code registry cannot contain duplicates');
for (const code of RESULT_CODES) assert.equal(isResultCode(code), true);
const sentinel = join(tmpdir(), `quality-contract-no-exec-${process.pid}`);
await rm(sentinel, { force: true });
const commandLikeGoal = fixture.valid.replace('Prove core parsing', `$(touch ${sentinel})`);
assert.equal(parseContractDocument(commandLikeGoal).ok, true);
assert.equal(existsSync(sentinel), false, 'contract prose must never execute');
for (const injected of evidenceFixture.injection_samples) {
  const candidate = fixture.valid.replace('Prove core parsing', injected);
  assert.equal(parseContractDocument(candidate).ok, true, 'untrusted prose remains inert input');
  assert.equal(existsSync(sentinel), false, 'injection-shaped input must never execute');
}
const result = evaluateContractDocument(fixture.valid);
assert.equal(result.dimensions.parse.status, 'pass');
assert.equal(result.dimensions.effective_decisions.status, 'pass');
assert.equal(result.predicates.execution_eligible, false);
assert.equal(result.predicates.may_accept, false);
assert.equal(result.dimensions.operation_lease.code, 'LEASE_MISSING');
assert.equal(result.predicates.may_dispatch, false);
assert.throws(() => evaluateContractDocument(fixture.valid, { provenance_assurance: 'self-certified' }), /invalid provenance assurance/);
const revoked = structuredClone(valid.contract);
revoked.decision_revisions[0].status = fixture.revoked_decision_status;
assert.equal(evaluateContractDocument(`\`\`\`quality-contract-json\n${JSON.stringify(revoked)}\n\`\`\``).dimensions.effective_decisions.status, 'fail');
const conflict = structuredClone(valid.contract.decision_revisions[0]);
conflict.revision_id = '2';
assert.equal(resolveEffectiveDecisions([valid.contract.decision_revisions[0], conflict]).code, 'DECISION_CONFLICT');
const revisions = (items) => resolveEffectiveDecisions(items, { digest: (revision) => revision.revision_id });
const base = { decision_key: 'adversarial', value_digest: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', status: 'accepted', authority_level: '1', accepted_at: '2026-09-30T00:00:00Z' };
assert.equal(revisions([{ ...base, revision_id: 'one', predecessor_digest: 'missing' }]).code, 'DECISION_MISSING_PREDECESSOR');
assert.equal(revisions([{ ...base, revision_id: 'one', predecessor_digest: 'two' }, { ...base, revision_id: 'two', predecessor_digest: 'one' }]).code, 'DECISION_CYCLE');
assert.equal(revisions([{ ...base, revision_id: 'one', predecessor_digest: null, authority_level: '2' }, { ...base, revision_id: 'two', predecessor_digest: 'one', authority_level: '1' }]).code, 'DECISION_AUTHORITY_DOWNGRADE');
const eventOptions = {
  now: Date.parse('2026-09-30T00:01:00Z'),
  maxEventLifetimeMs: 3600000,
  revocationStatus: async () => false,
  trustedKeyResolver: async ({ issuer, key_id }) => ({ issuer, key_id, algorithm: 'Ed25519' }),
  signatureVerifier: async () => true,
};
function executionEvent(projectionDigest, payload = projectionFixture.execution_payload) {
  const subjectDigest = (char) => `sha256:${char.repeat(64)}`;
  return {
    event_version: '1', event_id: 'execution-2', type: 'runner_attestation', issuer: 'fixture', key_id: 'key-1', actor_id: 'runner-1', actor_role: 'runner',
    issued_at: '2026-09-30T00:00:00Z', expires_at: '2026-09-30T01:00:00Z',
    subjects: { repository_digest: subjectDigest('a'), base_digest: valid.contract.base_subject, candidate_digest: subjectDigest('b'), contract_digest: valid.contract_digest, projection_digest: projectionDigest, policy_digest: subjectDigest('c'), schema_digest: subjectDigest('d'), rules_digest: subjectDigest('e'), adapter_digest: subjectDigest('f'), ac_map_digest: valid.contract.ac_map_digest },
    runner_id: 'runner-1', snapshot: digest(payload), policy: subjectDigest('c'), argv_digest: payload.baseline.argv_digest, environment_class: 'local-disposable', signature: 'fixture-signature',
  };
}
const projectionDigest = projectionBindingDigest(valid, projectionFixture);
const executionAuthorityEvent = executionEvent(projectionDigest);
const projection = await createProjection(valid, projectionFixture, executionAuthorityEvent, eventOptions);
assert.equal((await validateProjection(valid, projection, executionAuthorityEvent, eventOptions)).ok, true);
await assert.rejects(() => createProjection(valid, { ...projectionFixture, execution_payload: undefined }, executionAuthorityEvent, eventOptions), /execution payload/);
await assert.rejects(() => createProjection(valid, { ...projectionFixture, execution_payload: { baseline: {}, stop_conditions: [] } }, executionAuthorityEvent, eventOptions), /execution payload/);
assert.throws(() => projectionBindingDigest(valid, { ...projectionFixture, ticket_id: 'invalid ticket id' }), /valid ticket_id/);
await assert.rejects(() => createProjection(valid, { ...projectionFixture, ticket_id: 'invalid ticket id' }, executionAuthorityEvent, eventOptions), /valid ticket_id/);
await assert.rejects(() => createProjection(valid, projectionFixture, executionAuthorityEvent, { ...eventOptions, signatureVerifier: async () => false }), /SIGNATURE_INVALID/);
assert.equal(validateProjectionLandmarks(projection, () => []).ok, true);
const existingLandmark = structuredClone(projection);
existingLandmark.landmarks = [{ kind: 'existing', path: 'templates/changes.md', shape_digest: projectionFixture.landmark_shape_digest }];
assert.equal(validateProjectionLandmarks(existingLandmark, () => []).code, 'PROJECTION_LANDMARK_MISSING');
assert.equal(validateProjectionLandmarks(existingLandmark, () => [{ shape_digest: projectionFixture.landmark_shape_digest }, { shape_digest: projectionFixture.landmark_shape_digest }]).code, 'PROJECTION_LANDMARK_AMBIGUOUS');
assert.equal(validateProjectionLandmarks(existingLandmark, () => [{ shape_digest: projectionFixture.landmark_shape_digest }]).ok, true);
const staleProjection = structuredClone(projection);
staleProjection.contract_digest = digest({ changed: 'canonical' });
assert.equal((await validateProjection(valid, staleProjection, executionAuthorityEvent, eventOptions)).code, 'PROJECTION_CONTRACT_STALE');
const scopeDrift = structuredClone(projection);
scopeDrift.allowed_paths.push('outside');
scopeDrift.ac_subset_digest = digest(scopeDrift.ac_subset);
assert.equal((await validateProjection(valid, scopeDrift, executionAuthorityEvent, eventOptions)).code, 'PROJECTION_SCOPE_DRIFT');
const mapDrift = structuredClone(projection);
mapDrift.ac_subset[0].evidence_map.expected = 'tampered';
mapDrift.ac_subset_digest = digest(mapDrift.ac_subset);
assert.equal((await validateProjection(valid, mapDrift, executionAuthorityEvent, eventOptions)).code, 'PROJECTION_AC_MAP_DRIFT');
assert.equal((await validateProjection(valid, projection)).code, 'AUTH_EVENT_SCHEMA_INVALID');
const executionTamper = structuredClone(projection);
executionTamper.baseline.expected_exit_code = '1';
executionTamper.execution_digest = digest({ baseline: executionTamper.baseline, stop_conditions: executionTamper.stop_conditions });
assert.equal((await validateProjection(valid, executionTamper, executionAuthorityEvent, eventOptions)).code, 'PROJECTION_EXECUTION_EVENT_MISMATCH');
const replacementPayload = structuredClone(projectionFixture.execution_payload);
replacementPayload.stop_conditions[0].remediation = 'replacement';
const replacementEvent = executionEvent(projectionDigest, replacementPayload);
assert.equal((await validateProjection(valid, projection, replacementEvent, eventOptions)).code, 'PROJECTION_EXECUTION_EVENT_MISMATCH');

const subject = {
  ...preflightFixture.subject,
  contract_digest: valid.contract_digest,
  projection_digest: digest(projection),
  base_digest: valid.contract.base_subject,
  policy_digest: valid.contract.policy_digest,
  ac_map_digest: valid.contract.ac_map_digest,
};
const now = Date.parse('2026-09-30T12:00:00Z');
const trusted = {
  now,
  maxEventLifetimeMs: 3600000,
  revocationStatus: async () => false,
  trustedKeyResolver: async ({ issuer, key_id }) => ({ issuer, key_id, algorithm: 'Ed25519' }),
  signatureVerifier: async ({ signature }) => signature === 'valid-signature',
};
const event = (type, payload = {}) => ({
  event_version: '1', event_id: `evt-${type}`, type, issuer: 'test-issuer', key_id: 'test-key', actor_id: type === 'human_authorization' ? 'human-1' : type.includes('review') ? 'reviewer-1' : 'runner-1', actor_role: type === 'human_authorization' ? 'human_authorizer' : type.includes('review') ? 'reviewer' : 'runner', issued_at: '2026-09-30T11:59:00Z', expires_at: '2026-09-30T12:30:00Z', subjects: structuredClone(subject), ...payload, signature: 'valid-signature',
});
const authorizationBinding = canonicalAuthorizationBinding(valid.contract, projection);
assert.ok(authorizationBinding);
const authorization = event('human_authorization', { human_authorizer_id: 'human-1', authorized_goal_digest: authorizationBinding.authorized_goal_digest, authorized_scope_digest: authorizationBinding.authorized_scope_digest, risk: authorizationBinding.risk, executor_class: authorizationBinding.executor_class });
assert.equal((await verifyTrustedEvent(authorization, { ...trusted, expectedType: 'human_authorization', expectedSubjects: subject })).ok, true);
assert.equal((await verifyTrustedEvent({ ...authorization, signature: 'forged' }, trusted)).code, 'SIGNATURE_INVALID');
assert.equal((await verifyTrustedEvent(authorization, { ...trusted, revocationStatus: async () => undefined })).code, 'AUTH_REVOKED');
assert.equal((await verifyTrustedEvent({ ...authorization, issued_at: '2026-09-30T13:00:00Z' }, trusted)).code, 'AUTH_EXPIRED');
const authority = event('runner_attestation', { runner_id: 'runner-1', snapshot: subject.candidate_digest, policy: subject.policy_digest, argv_digest: 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', environment_class: 'isolated' });
assert.equal((await verifyExecutionAuthorityEvent(authority, { ...trusted, expectedSubjects: subject, stop_conditions: [{ code: 'STOP', remediation: 'stop' }] })).ok, true);
const categories = Object.fromEntries(['tracked', 'untracked', 'ignored', 'deleted', 'renamed', 'mode', 'symlink', 'submodule'].map((name) => [name, true]));
const typedAccounting = { accounting_version: '1', git_available: true, enumeration_complete: true, categories, subject_digest: digest(subject), changes: [{ kind: 'modify', path: 'skills/meta/quality-contract/gateway.mjs', old_path: null, canonical_path: 'skills/meta/quality-contract/gateway.mjs', canonical_old_path: null, path_alias: false, symlink_escape: false }] };
const accountingChange = (kind, suffix) => ({
  kind,
  path: `skills/meta/quality-contract/${suffix}.mjs`,
  old_path: kind === 'rename' ? `skills/meta/quality-contract/${suffix}-old.mjs` : null,
  canonical_path: `skills/meta/quality-contract/${suffix}.mjs`,
  canonical_old_path: kind === 'rename' ? `skills/meta/quality-contract/${suffix}-old.mjs` : null,
  path_alias: false,
  symlink_escape: false,
});
for (const kind of ['add', 'modify', 'delete', 'rename', 'mode', 'symlink', 'submodule', 'untracked', 'ignored']) {
  const observed = evaluateScopeAccounting({ ...typedAccounting, changes: [accountingChange(kind, `all-${kind}`)] }, valid.contract.scope, subject);
  assert.equal(observed.change_accounting.status, 'pass', `${kind} must be explicitly accounted`);
  assert.equal(observed.scope.status, 'pass', `${kind} must be compared to canonical scope`);
}
for (const category of Object.keys(categories)) {
  const incomplete = evaluateScopeAccounting({ ...typedAccounting, categories: { ...categories, [category]: false } }, valid.contract.scope, subject);
  assert.equal(incomplete.change_accounting.code, 'SCOPE_INCOMPLETE', `missing ${category} category must block complete accounting`);
}
const foreignAccounting = evaluateScopeAccounting({ ...typedAccounting, subject_digest: subject.candidate_digest }, valid.contract.scope, subject);
assert.equal(foreignAccounting.change_accounting.code, 'SCOPE_SUBJECT_MISMATCH', 'candidate-only accounting must not be replayed across canonical contract/policy subjects');
assert.equal(foreignAccounting.scope.code, 'SCOPE_SUBJECT_MISMATCH');
const typedExecutor = { attestation_version: '1', issuer: 'scheduler', attested_class: 'capable', work_kind: 'implementation', independent_review: false, subject_digest: subject.candidate_digest, expires_at: '2026-09-30T12:30:00Z' };
assert.equal(evaluateExecutorFit(null, typedExecutor).code, 'EXECUTOR_UNFIT');
assert.equal(evaluateExecutorFit(valid.contract, {}).code, 'EXECUTOR_ATTESTATION_MISSING');
assert.equal(evaluateExecutorFit(valid.contract, { ...typedExecutor, attested_class: 'untrusted' }).code, 'EXECUTOR_ATTESTATION_MISSING');
assert.equal(evaluateExecutorFit(valid.contract, { ...typedExecutor, attested_class: 'low_cost' }).code, 'EXECUTOR_UNFIT');
const lowCostContract = { ...valid.contract, executor_class: 'low_cost', risk: 'low', tier: 'T1' };
assert.equal(evaluateExecutorFit(lowCostContract, { ...typedExecutor, attested_class: 'low_cost' }).code, 'EXECUTOR_UNFIT');
assert.equal(evaluateExecutorFit(lowCostContract, { ...typedExecutor, attested_class: 'low_cost', independent_review: true, work_kind: 'mechanical' }).status, 'pass');
const attestor = { kind: 'external-preflight-attestor-v1', verify: async ({ contract_digest, input }) => ({ ok: true, contract_digest, snapshot: input }) };
const preflight = await verifyPreflightAttestation(valid.contract, {
  projection,
  subject: { git_available: true, complete: true, canonical_subject: subject },
  executor: typedExecutor,
  accounting: typedAccounting,
  authorization: { status: 'pass', code: 'AUTH_VALID', cause: 'trusted human authorization', canonical_binding: authorizationBinding },
  semantic_review: { status: 'pass', code: 'REVIEW_VALID', cause: 'independent trusted review' },
  baseline: { status: 'pass', code: 'BASELINE_GREEN', cause: 'baseline passed' },
}, attestor);
assert.equal(preflight.dimensions.scope.status, 'pass');
assert.equal(preflight.dimensions.executor_fit.status, 'pass');
const arbitraryCodePreflight = await verifyPreflightAttestation(valid.contract, {
  projection, subject: { git_available: true, complete: true, canonical_subject: subject }, executor: typedExecutor, accounting: typedAccounting,
  authorization: { status: 'pass', code: 'AUTH_VALID', cause: 'trusted human authorization', canonical_binding: authorizationBinding },
  semantic_review: { status: 'pass', code: 'REVIEW_VALID', cause: 'independent trusted review' },
  baseline: { status: 'pass', code: 'ARBITRARY_EXTERNAL_CODE', cause: 'unregistered caller string' },
}, attestor);
assert.equal(arbitraryCodePreflight.dimensions.baseline.code, 'ATTESTATION_CODE_INVALID', 'preflight must fail closed on an arbitrary external code');
assert.equal(evaluateParsedContract(valid, { verifiedPreflight: [arbitraryCodePreflight] }).predicates.execution_eligible, false);
const noGit = await verifyPreflightAttestation(valid.contract, { subject: { git_available: false }, accounting: { git_available: false }, executor: typedExecutor }, attestor);
assert.equal(noGit.dimensions.trusted_execution_subject.code, 'SUBJECT_NO_GIT');
assert.equal(noGit.dimensions.change_accounting.status, 'unknown');
const retirementPass = registerVerifiedAcceptanceAttestation({
  dimensions: {
    retirement: {
      status: 'pass', code: 'RETIRE_READY', cause: 'trusted lifecycle attestation permits retirement',
      risk: 'high', owner: 'lifecycle-attestor', remediation: 'retain the exact trusted subject and accounting snapshot',
    },
  },
  provenance_assurance: 'externally-attested',
});
assert.equal(
  evaluateParsedContract(valid, { verifiedPreflight: [preflight], verifiedAcceptance: [retirementPass] }).predicates.may_retire,
  true,
  'retirement requires a branded lifecycle pass plus trusted Git accounting',
);
assert.equal(
  evaluateParsedContract(valid, { verifiedPreflight: [noGit], verifiedAcceptance: [retirementPass] }).predicates.may_retire,
  false,
  'no-Git remains report-only even when a branded retirement attestation passes',
);
const dispatchOperation = { operation_id: 'op-1', operation_kind: 'runner', argv: ['node', '--version'], cwd: '/tmp/disposable', environment_class: 'isolated', target_class: 'local_disposable', network: false, subject, scope_effect_class: 'repository', policy_digest: subject.policy_digest, capabilities: [], environment_digest: subject.adapter_digest, cwd_digest: subject.repository_digest };
const review = event('prebuild_semantic_review', { author_run_id: 'author-run', reviewer_run_id: 'review-run', reviewer_harness_id: 'review-harness', reviewer_model_id: 'review-model', reviewer_session_id: 'review-session', reviewer_snapshot_digest: subject.candidate_digest, memory_sharing: false, frozen_inputs: { base: subject.base_digest, contract: subject.contract_digest, projection: subject.projection_digest, scope: subject.ac_map_digest, landmarks: subject.rules_digest, ac_map: subject.ac_map_digest, policy: subject.policy_digest, executor_class: 'capable' }, findings: [] });
const lease = event('operation_lease', { lease_id: 'lease-1', authorization_event_id: authorization.event_id, review_event_ids: [review.event_id], operation_id: 'op-1', operation_digest: operationDigest(dispatchOperation), operation_kind: 'runner', subject, scope_effect_class: 'repository', policy_digest: subject.policy_digest, policy_proof: null, max_duration_ms: '1000', nonce: 'nonce-1', decision: 'allow' });
const green = evaluateParsedContract(valid, { verifiedPreflight: [preflight], operation: 'dispatch', operationLease: { operation: 'dispatch', status: 'pass', code: 'LEASE_VALID', cause: 'gateway verified exact lease' } });
assert.equal(green.predicates.execution_eligible, true);
assert.equal(green.predicates.may_dispatch, false);
const events = new Map([[authorization.event_id, authorization], [review.event_id, review]]);
const replayAdapter = { kind: 'external-durable-replay-v1', used: false, async consumeOnce() { if (this.used) return false; this.used = true; return true; } };
const dispatchAdapter = { kind: 'cancellable-dispatch-v1', start() { return { completion: Promise.resolve('ok'), cancel: async () => {} }; } };
const gateway = createGateway({ contract: valid.contract, projection, replayAdapter, dispatchAdapter, operationPolicy: { allowed_operations: [{ operation_id: dispatchOperation.operation_id, operation_digest: operationDigest(dispatchOperation) }] }, eventVerification: { ...trusted, authorRunResolver: async () => ({ actor_id: 'author-1', harness_id: 'author-harness', session_id: 'author-session', memory_sharing: false }) }, eventResolver: { get: async (id) => events.get(id) }, resolveCwd: () => ({ safe: true }), now: () => now });
const dispatched = await gateway.dispatch(dispatchOperation, lease);
assert.equal(dispatched.ok, true);
const gated = evaluateParsedContract(valid, { verifiedPreflight: [preflight], operation: 'dispatch', expectedOperation: dispatchOperation, operationLease: dispatched.operation_lease });
assert.equal(gated.predicates.may_dispatch, true);
const policyProof = { proof_version: '1', policy_digest: subject.policy_digest, subject_digest: digest(subject), exemption_code: 'POLICY_LOW_RISK_EXEMPT' };
const noAuthorizationLease = event('operation_lease', { ...lease, event_id: 'lease-policy-proof-1', lease_id: 'lease-policy-proof-1', nonce: 'nonce-policy-proof-1', authorization_event_id: null, policy_proof: policyProof });
const policyGateway = createGateway({ contract: valid.contract, projection, replayAdapter: { kind: 'external-durable-replay-v1', async consumeOnce() { return true; } }, dispatchAdapter, operationPolicy: { allowed_operations: [{ operation_id: dispatchOperation.operation_id, operation_digest: operationDigest(dispatchOperation) }] }, eventVerification: { ...trusted, authorRunResolver: async () => ({ actor_id: 'author-1', harness_id: 'author-harness', session_id: 'author-session', memory_sharing: false }) }, eventResolver: { get: async (id) => events.get(id) }, authorizationPolicyVerifier: async ({ policy_proof, subject: boundSubject, contract, projection: boundProjection }) => ({ ok: policy_proof.exemption_code === 'POLICY_LOW_RISK_EXEMPT' && digest(boundSubject) === policy_proof.subject_digest && contract.policy_digest === policy_proof.policy_digest && digest(boundProjection) === subject.projection_digest, authorization: 'not-required', policy_digest: policy_proof.policy_digest, subject_digest: policy_proof.subject_digest }), resolveCwd: () => ({ safe: true }), now: () => now });
assert.equal((await policyGateway.dispatch(dispatchOperation, noAuthorizationLease)).ok, true, 'a signed environment lease may use the independently verified authorization-not-required policy proof');
const missingPolicyProof = { ...noAuthorizationLease, event_id: 'lease-policy-proof-invalid', lease_id: 'lease-policy-proof-invalid', nonce: 'nonce-policy-proof-invalid', policy_proof: null };
assert.equal((await verifyTrustedEvent(missingPolicyProof, trusted)).code, 'AUTH_EVENT_SCHEMA_INVALID', 'authorization-not-required must carry a signed typed policy proof');
const rejectingPolicyGateway = createGateway({ contract: valid.contract, projection, replayAdapter: { kind: 'external-durable-replay-v1', async consumeOnce() { return true; } }, dispatchAdapter, operationPolicy: { allowed_operations: [{ operation_id: dispatchOperation.operation_id, operation_digest: operationDigest(dispatchOperation) }] }, eventVerification: { ...trusted, authorRunResolver: async () => ({ actor_id: 'author-1', harness_id: 'author-harness', session_id: 'author-session', memory_sharing: false }) }, eventResolver: { get: async (id) => events.get(id) }, authorizationPolicyVerifier: async () => ({ ok: false }), resolveCwd: () => ({ safe: true }), now: () => now });
assert.equal((await rejectingPolicyGateway.dispatch(dispatchOperation, { ...noAuthorizationLease, event_id: 'lease-policy-proof-reject', lease_id: 'lease-policy-proof-reject', nonce: 'nonce-policy-proof-reject' })).code, 'AUTH_POLICY_PROOF_INVALID');
const unavailablePolicyGateway = createGateway({ contract: valid.contract, projection, replayAdapter: { kind: 'external-durable-replay-v1', async consumeOnce() { return true; } }, dispatchAdapter, operationPolicy: { allowed_operations: [{ operation_id: dispatchOperation.operation_id, operation_digest: operationDigest(dispatchOperation) }] }, eventVerification: { ...trusted, authorRunResolver: async () => ({ actor_id: 'author-1', harness_id: 'author-harness', session_id: 'author-session', memory_sharing: false }) }, eventResolver: { get: async (id) => events.get(id) }, authorizationPolicyVerifier: async () => { throw new Error('unavailable'); }, resolveCwd: () => ({ safe: true }), now: () => now });
assert.equal((await unavailablePolicyGateway.dispatch(dispatchOperation, { ...noAuthorizationLease, event_id: 'lease-policy-proof-unavailable', lease_id: 'lease-policy-proof-unavailable', nonce: 'nonce-policy-proof-unavailable' })).code, 'AUTH_POLICY_PROOF_INVALID');
const changedCandidateOperation = { ...dispatchOperation, subject: { ...subject, candidate_digest: `sha256:${'d'.repeat(64)}` } };
const changedProjectionOperation = { ...dispatchOperation, subject: { ...subject, projection_digest: `sha256:${'e'.repeat(64)}` } };
const changedPolicyOperation = { ...dispatchOperation, policy_digest: `sha256:${'a'.repeat(64)}`, subject: { ...subject, policy_digest: `sha256:${'a'.repeat(64)}` } };
const changedOperation = { ...dispatchOperation, operation_id: 'op-other' };
for (const mismatchedOperation of [changedCandidateOperation, changedProjectionOperation, changedPolicyOperation, changedOperation]) {
  const reused = evaluateParsedContract(valid, { verifiedPreflight: [preflight], operation: 'dispatch', expectedOperation: mismatchedOperation, operationLease: dispatched.operation_lease });
  assert.equal(reused.dimensions.operation_lease.code, 'LEASE_BINDING_MISMATCH', 'a branded in-process lease must not authorize a changed operation binding');
  assert.equal(reused.predicates.may_dispatch, false);
}
assert.equal((await gateway.dispatch(dispatchOperation, lease)).code, 'LEASE_REPLAY');
const timeoutLease = { ...lease, event_id: 'lease-timeout-1', lease_id: 'lease-timeout-1', nonce: 'nonce-timeout-1', max_duration_ms: '25' };
let cancellationObserved = false;
const ignoringDispatcher = { kind: 'cancellable-dispatch-v1', start() { return { completion: new Promise(() => {}), cancel: async () => { cancellationObserved = true; } }; } };
const timeoutGateway = createGateway({ contract: valid.contract, projection, replayAdapter: { kind: 'external-durable-replay-v1', async consumeOnce() { return true; } }, dispatchAdapter: ignoringDispatcher, operationPolicy: { allowed_operations: [{ operation_id: dispatchOperation.operation_id, operation_digest: operationDigest(dispatchOperation) }] }, eventVerification: { ...trusted, authorRunResolver: async () => ({ actor_id: 'author-1', harness_id: 'author-harness', session_id: 'author-session', memory_sharing: false }) }, eventResolver: { get: async (id) => new Map([[authorization.event_id, authorization], [review.event_id, review]]).get(id) }, resolveCwd: () => ({ safe: true }), now: () => now });
const timeoutResult = await Promise.race([timeoutGateway.dispatch(dispatchOperation, timeoutLease), new Promise((_, reject) => setTimeout(() => reject(new Error('gateway deadline race did not settle')), 250))]);
assert.equal(timeoutResult.code, 'LEASE_EXPIRED');
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(cancellationObserved, true, 'gateway must request cancellation even when dispatcher ignores it');
assert.equal((await createGateway({ operationPolicy: { allowed_operations: [{ operation_id: dispatchOperation.operation_id, operation_digest: operationDigest(dispatchOperation) }] } }).dispatch({ ...dispatchOperation, network: true }, lease)).code, 'LEASE_OPERATION_MISMATCH');
assert.throws(() => operationDigest({ ...dispatchOperation, hidden_capability: true }), /governed operation schema/);
assert.throws(() => evaluateParsedContract(valid, { dimensionOverrides: { baseline: { status: 'pass' } } }), /raw dimensionOverrides/);
assert.equal((await verifyTrustedEvent(authorization, { ...trusted, maxEventLifetimeMs: undefined })).code, 'AUTH_EXPIRED');
assert.equal((await verifyTrustedEvent({ ...authorization, issued_at: '2026-02-30T00:00:00Z' }, trusted)).code, 'AUTH_EXPIRED');
assert.equal((await verifyTrustedEvent({ ...authorization, human_authorizer_id: 'other-human' }, trusted)).code, 'AUTH_HUMAN_REQUIRED');
const collidingReview = { ...review, actor_id: 'author-1' };
assert.equal((await verifyTrustedEvent(collidingReview, { ...trusted, authorRunResolver: async () => ({ actor_id: 'author-1', harness_id: 'author-harness', session_id: 'author-session', memory_sharing: false }) })).code, 'REVIEW_NOT_INDEPENDENT');
const malformedFindingReview = { ...review, findings: [{ finding_id: 'F-1', severity: 'P1', code: 'INJECTION', subject_digest: subject.candidate_digest, detail: 'unbounded candidate prose', remediation_digest: subject.policy_digest }] };
assert.equal((await verifyTrustedEvent(malformedFindingReview, { ...trusted, authorRunResolver: async () => ({ actor_id: 'author-1', harness_id: 'author-harness', session_id: 'author-session', memory_sharing: false }) })).code, 'AUTH_EVENT_SCHEMA_INVALID');
assert.throws(() => signedEventPayload(malformedFindingReview), /event schema is invalid/);
const typedFindingReview = { ...review, findings: [{ finding_id: 'F-1', severity: 'P1', code: 'INJECTION', subject_digest: subject.candidate_digest, detail_digest: subject.rules_digest, remediation_digest: subject.policy_digest }] };
assert.equal((await verifyTrustedEvent(typedFindingReview, { ...trusted, authorRunResolver: async () => ({ actor_id: 'author-1', harness_id: 'author-harness', session_id: 'author-session', memory_sharing: false }) })).ok, true);
const malformedAccounting = await verifyPreflightAttestation(valid.contract, { subject: { git_available: true, complete: true, canonical_subject: subject }, executor: typedExecutor, accounting: { ...typedAccounting, changes: [{ path: 'x' }] } }, attestor);
assert.equal(malformedAccounting.dimensions.change_accounting.status, 'fail');
const misboundPreflight = await verifyPreflightAttestation(valid.contract, { projection, subject: { git_available: true, complete: true, canonical_subject: subject }, executor: typedExecutor, accounting: typedAccounting, authorization: { status: 'pass', code: 'AUTH_VALID', cause: 'incorrect risk claim', canonical_binding: { ...authorizationBinding, risk: 'high' } } }, attestor);
assert.equal(misboundPreflight.dimensions.authorization.code, 'AUTH_BINDING_MISMATCH');
const aliasScope = structuredClone(valid.contract); aliasScope.scope.allowed_paths = ['skills//meta']; aliasScope.scope_digest = digest(aliasScope.scope);
assert.equal(parseContractDocument(`\`\`\`quality-contract-json\n${JSON.stringify(aliasScope)}\n\`\`\``).code, 'PARSE_FIELD_TYPE');
const postbuild = event('postbuild_conformance_review', { candidate: subject.candidate_digest, contract: subject.contract_digest, projection: subject.projection_digest, evidence: subject.ac_map_digest, findings: [] });
assert.equal((await verifyTrustedEvent({ ...postbuild, actor_role: 'runner' }, trusted)).code, 'AUTH_EVENT_SCHEMA_INVALID');

// TICKET-004: raw runner output is redacted before a sealed envelope exists.
const redacted = redactOutput('API_KEY=super-secret-token-value\nordinary output');
assert.equal(redacted.output.includes('super-secret-token-value'), false);
assert.equal(redacted.redactions[0].kind, 'secret-like');
const evidenceExpected = {
  subject,
  toolchain_digest: subject.rules_digest,
  dependency_digest: subject.adapter_digest,
  argv_digest: authority.argv_digest,
  cwd_digest: subject.repository_digest,
  environment_class: 'isolated',
};
const evidence = {
  evidence_version: '1', run_id: 'run-1', event_id: authority.event_id, subject: structuredClone(subject),
  ac_results: [{ ac_id: 'AC-1', assertion_status: 'pass', matcher_id: 'exact', matcher_version: '1', expected_digest: digest('pass'), observed_digest: digest('pass'), evidence_class: 'unit', negative_assertion_status: 'pass', detail_digest: null }],
  argv_digest: evidenceExpected.argv_digest, cwd_digest: evidenceExpected.cwd_digest, environment_class: evidenceExpected.environment_class,
  toolchain_digest: evidenceExpected.toolchain_digest, dependency_digest: evidenceExpected.dependency_digest,
  exit_code: '0', signal: null, duration_ms: '1', output_digest: redacted.output_digest, redactions: redacted.redactions,
  referenced_event_ids: [authority.event_id], started_at: '2026-09-30T11:59:00Z', completed_at: '2026-09-30T12:00:00Z', signature: 'evidence-signature',
};
const evidenceAttestor = { kind: 'external-evidence-attestor-v1', verify: async ({ evidence_digest }) => ({ ok: true, evidence_digest }) };
const sealedEvidence = await sealEvidenceRun(evidence, evidenceAttestor);
assert.equal(isValidEvidenceEnvelope(evidence), true);
const portableSealedEvidence = JSON.parse(JSON.stringify(sealedEvidence));
const matcherPolicy = { kind: 'external-matcher-policy-v1', allows: ({ matcher_id, matcher_version }) => matcher_id === 'exact' && matcher_version === '1' };
const evidenceOptions = { expected: evidenceExpected, runner_attestation: authority, eventVerification: trusted, evidenceSignatureVerifier: async ({ signature, payload }) => signature === 'evidence-signature' && payload === `quality-contract-evidence/v1\0${canonicalJson(Object.fromEntries(Object.entries(evidence).filter(([key]) => key !== 'signature')))}`, matcherPolicy };
assert.equal((await verifySealedEvidence(projection, sealedEvidence, evidenceOptions)).status, 'pass');
assert.equal((await verifySealedEvidence(projection, portableSealedEvidence, evidenceOptions)).status, 'pass', 'serialized/parsing a sealed envelope must retain verifiability');
const staleEvidence = await sealEvidenceRun({ ...evidence, subject: { ...subject, candidate_digest: `sha256:${'c'.repeat(64)}` } }, evidenceAttestor);
assert.equal((await verifySealedEvidence(projection, staleEvidence, evidenceOptions)).code, 'EVIDENCE_SUBJECT_STALE');
const failedEvidence = await sealEvidenceRun({ ...evidence, exit_code: '1' }, evidenceAttestor);
assert.equal((await verifySealedEvidence(projection, failedEvidence, { ...evidenceOptions, evidenceSignatureVerifier: async () => true })).code, 'EVIDENCE_PROCESS_FAILED');
assert.rejects(() => sealEvidenceRun({ ...evidence, raw_output: 'do not persist' }, evidenceAttestor), /invalid evidence envelope|raw runner material/);
for (const rawField of evidenceFixture.raw_fields) assert.rejects(() => sealEvidenceRun({ ...evidence, [rawField]: evidenceFixture.nested_secret }, evidenceAttestor), /invalid evidence envelope/);
assert.rejects(() => sealEvidenceRun({ ...evidence, redactions: [{ kind: evidenceFixture.multilingual_secret, matched_count: '1' }] }, evidenceAttestor), /invalid evidence envelope/);
assert.rejects(() => sealEvidenceRun({ ...evidence, ac_results: [{ ...evidence.ac_results[0], evidence_class: evidenceFixture.encoded_secret }] }, evidenceAttestor), /invalid evidence envelope/);
assert.rejects(() => sealEvidenceRun({ ...evidence, subject: { ...subject, candidate_digest: evidenceFixture.nested_secret } }, evidenceAttestor), /invalid evidence envelope/);
for (const field of evidenceFixture.binding_fields) {
  const altered = { ...evidence, [field]: field === 'environment_class' ? 'local-disposable' : `sha256:${'f'.repeat(64)}` };
  const resealed = await sealEvidenceRun(altered, evidenceAttestor);
  assert.notEqual((await verifySealedEvidence(projection, resealed, evidenceOptions)).status, 'pass', `altered ${field} must not splice into valid evidence`);
}
const policySplice = { ...authority, policy: `sha256:${'e'.repeat(64)}` };
assert.notEqual((await verifySealedEvidence(projection, sealedEvidence, { ...evidenceOptions, runner_attestation: policySplice })).status, 'pass');
assert.notEqual((await verifySealedEvidence(projection, sealedEvidence, { ...evidenceOptions, eventVerification: { ...trusted, trustedKeyResolver: async () => ({ issuer: 'wrong', key_id: 'wrong', algorithm: 'Ed25519' }) } })).status, 'pass');
const replaySplice = JSON.parse(JSON.stringify(sealedEvidence));
replaySplice.evidence.referenced_event_ids = ['different-event'];
replaySplice.evidence_digest = digest(replaySplice.evidence);
assert.notEqual((await verifySealedEvidence(projection, replaySplice, evidenceOptions)).status, 'pass');
const boundPostbuild = event('postbuild_conformance_review', { candidate: subject.candidate_digest, contract: subject.contract_digest, projection: subject.projection_digest, evidence: digest(evidence), findings: [] });
const acceptanceOperation = { ...dispatchOperation, operation_id: 'accept-1', operation_kind: 'acceptance' };
const acceptanceLeaseEvent = { ...lease, event_id: 'lease-accept-1', lease_id: 'lease-accept-1', operation_id: acceptanceOperation.operation_id, operation_digest: operationDigest(acceptanceOperation), operation_kind: 'acceptance', nonce: 'nonce-accept-1' };
const acceptanceGateway = createGateway({ contract: valid.contract, projection, replayAdapter: { kind: 'external-durable-replay-v1', async consumeOnce() { return true; } }, dispatchAdapter, operationPolicy: { allowed_operations: [{ operation_id: acceptanceOperation.operation_id, operation_digest: operationDigest(acceptanceOperation) }] }, eventVerification: { ...trusted, authorRunResolver: async () => ({ actor_id: 'author-1', harness_id: 'author-harness', session_id: 'author-session', memory_sharing: false }) }, eventResolver: { get: async (id) => new Map([[authorization.event_id, authorization], [review.event_id, review]]).get(id) }, resolveCwd: () => ({ safe: true }), now: () => now });
const acceptedLease = await acceptanceGateway.dispatch(acceptanceOperation, acceptanceLeaseEvent);
assert.equal(acceptedLease.ok, true);
assert.equal(acceptedLease.operation_lease.operation, 'acceptance');
const acceptance = await verifyAcceptanceAttestation(projection, { sealed_evidence: sealedEvidence, runner_attestation: authority, postbuild_review: boundPostbuild, acceptance_lease: acceptedLease.operation_lease, acceptance_operation: acceptanceOperation, expected: evidenceExpected }, { eventVerification: trusted, evidenceSignatureVerifier: evidenceOptions.evidenceSignatureVerifier, matcherPolicy, postbuildReviewerVerifier: async () => true, postbuildAttestor: { kind: 'external-acceptance-attestor-v1', verify: async ({ subject: bound, evidence_digest }) => ({ ok: true, subject: bound, evidence_digest, minimal_change: { status: 'pass', code: 'MINIMAL_CHANGE_VALID', cause: 'trusted post-build delta is minimal', risk: 'high', owner: 'postbuild-attestor', remediation: 'retain bounded delta' } }) } });
assert.equal(acceptance.dimensions.evidence.status, 'pass');
const accepting = evaluateParsedContract(valid, { verifiedPreflight: [preflight], verifiedAcceptance: [acceptance], operation: 'acceptance', expectedOperation: acceptanceOperation, operationLease: acceptedLease.operation_lease });
assert.equal(accepting.predicates.may_accept, true);
const arbitraryCodeAcceptance = await verifyAcceptanceAttestation(projection, { sealed_evidence: sealedEvidence, runner_attestation: authority, postbuild_review: boundPostbuild, acceptance_lease: acceptedLease.operation_lease, acceptance_operation: acceptanceOperation, expected: evidenceExpected }, { eventVerification: trusted, evidenceSignatureVerifier: evidenceOptions.evidenceSignatureVerifier, matcherPolicy, postbuildReviewerVerifier: async () => true, postbuildAttestor: { kind: 'external-acceptance-attestor-v1', verify: async ({ subject: bound, evidence_digest }) => ({ ok: true, subject: bound, evidence_digest, minimal_change: { status: 'pass', code: 'ARBITRARY_EXTERNAL_CODE', cause: 'unregistered caller string' } }) } });
assert.equal(arbitraryCodeAcceptance.dimensions.minimal_change.code, 'ATTESTATION_CODE_INVALID', 'post-build attestation must fail closed on an arbitrary external code');
assert.equal(evaluateParsedContract(valid, { verifiedPreflight: [preflight], verifiedAcceptance: [arbitraryCodeAcceptance], operation: 'acceptance', expectedOperation: acceptanceOperation, operationLease: acceptedLease.operation_lease }).predicates.may_accept, false);
const reusedAcceptance = await verifyAcceptanceAttestation(projection, { sealed_evidence: sealedEvidence, runner_attestation: authority, postbuild_review: boundPostbuild, acceptance_lease: acceptedLease.operation_lease, acceptance_operation: { ...acceptanceOperation, subject: { ...subject, contract_digest: `sha256:${'f'.repeat(64)}` } }, expected: evidenceExpected }, { eventVerification: trusted, evidenceSignatureVerifier: evidenceOptions.evidenceSignatureVerifier, matcherPolicy, postbuildReviewerVerifier: async () => true, postbuildAttestor: { kind: 'external-acceptance-attestor-v1', verify: async () => ({ ok: true, subject, evidence_digest: sealedEvidence.evidence_digest, minimal_change: { status: 'pass', code: 'MINIMAL_CHANGE_VALID', cause: 'valid', risk: 'high', owner: 'test', remediation: 'none' } }) } });
assert.equal(reusedAcceptance.dimensions.operation_lease.code, 'LEASE_BINDING_MISMATCH');
const stalePostbuild = await verifyAcceptanceAttestation(projection, { sealed_evidence: sealedEvidence, runner_attestation: authority, postbuild_review: { ...boundPostbuild, evidence: subject.ac_map_digest }, acceptance_lease: acceptedLease.operation_lease, acceptance_operation: acceptanceOperation, expected: evidenceExpected }, { eventVerification: trusted, evidenceSignatureVerifier: evidenceOptions.evidenceSignatureVerifier, matcherPolicy, postbuildReviewerVerifier: async () => true, postbuildAttestor: { kind: 'external-acceptance-attestor-v1', verify: async () => ({ ok: false }) } });
assert.equal(stalePostbuild.dimensions.implementation_review.status, 'stale');
const incompleteAcceptance = await verifyAcceptanceAttestation(projection);
assert.equal(incompleteAcceptance.dimensions.implementation_review.code, 'EVIDENCE_ATTESTATION_MISMATCH');
assert.equal(incompleteAcceptance.dimensions.minimal_change.code, 'EVIDENCE_ATTESTATION_MISMATCH');
assert.equal(incompleteAcceptance.dimensions.operation_lease.code, 'LEASE_MISSING');

// TICKET-006: compatibility remains independently pinned and legacy is report-only.
const compatInput = { versions: pilotFixture.versions, now: '2026-09-30T12:00:00Z', operation: 'start' };
assert.equal(evaluateCompatibility(compatInput, pilotFixture.compatibility_policy).status, 'pass');
assert.equal(evaluateCompatibility({ ...compatInput, operation: 'accept' }, pilotFixture.compatibility_policy).may_accept, true);
assert.equal(evaluateCompatibility({ ...compatInput, versions: { ...pilotFixture.versions, adapter: 'x' } }, pilotFixture.compatibility_policy).status, 'fail');
assert.equal(evaluateCompatibility({ ...compatInput, versions: pilotFixture.deprecated_versions, operation: 'finish' }, pilotFixture.compatibility_policy).status, 'pass');
assert.equal(evaluateCompatibility({ ...compatInput, versions: pilotFixture.deprecated_versions, operation: 'start' }, pilotFixture.compatibility_policy).status, 'fail');
assert.equal(evaluateCompatibility({ ...compatInput, versions: pilotFixture.deprecated_versions, operation: 'finish', now: '2026-10-01T00:00:00Z' }, pilotFixture.compatibility_policy).status, 'fail');
assert.equal(evaluateCompatibility({ legacy: true, operation: 'report' }, pilotFixture.compatibility_policy).mode, 'report-only');
assert.equal(evaluateCompatibility({ legacy: true, operation: 'accept' }, pilotFixture.compatibility_policy).status, 'fail');

const retirement = pilotFixture.retirement;
assert.equal(evaluateRetirement(retirement).status, 'pass');
assert.equal(evaluateRetirement({ ...retirement, durable_outcome_digest: null }).code, 'RETIRE_DURABLE_OUTCOME_MISSING');
assert.equal(evaluateRetirement({ ...retirement, live_dependency_count: 1 }).code, 'RETIRE_LIVE_DEPENDENCY');
assert.equal(evaluateRetirement({ ...retirement, recovery_verified: false }).code, 'RETIRE_UNRECOVERABLE');
assert.equal(evaluateRetirement({ ...retirement, sole_canonical_truth_or_evidence: true }).code, 'RETIRE_CANONICAL_ONLY');

const tuples = pilotFixture.segments.map(({ id, eligible_runs, minimum_runs, p1_count, baseline_p2_per_run, candidate_p2_per_run, ...tuple }) => ({ ...tuple, work_size: 'medium' }));
const pilotPlan = { plan_version: '1', frozen: pilotFixture.frozen, calibration: { cohort_digest: `sha256:${'1'.repeat(64)}`, minimum_runs: 3 }, unseen_validation: { cohort_digest: `sha256:${'2'.repeat(64)}` }, tuples, measurements_schema_digest: `sha256:${'3'.repeat(64)}` };
const pilotPlanAttestor = { kind: 'external-pilot-plan-attestor-v1', verify: async ({ plan_digest, plan }) => ({ ok: true, plan_digest, plan, envelope_digest: `sha256:${'4'.repeat(64)}` }) };
const verifiedPilotPlan = await verifyFrozenPilotPlan(pilotPlan, pilotPlanAttestor);
const segment = (tuple, eligible_runs) => ({ ...tuple, eligible_runs, p1_count: 0, baseline_p2_per_run: 0.5, candidate_p2_per_run: 0.25, baseline: structuredClone(pilotFixture.baseline), candidate: structuredClone(pilotFixture.baseline), archive_or_index_only_movement: false, mixed_responsibility_file: false });
const pilotMeasurements = { measurement_version: '1', plan_digest: verifiedPilotPlan.plan_digest, calibration: { cohort_digest: pilotPlan.calibration.cohort_digest, segments: tuples.map((tuple) => segment(tuple, 3)) }, unseen_validation: { cohort_digest: pilotPlan.unseen_validation.cohort_digest, segments: tuples.map((tuple) => segment(tuple, 1)) } };
const measurementAttestor = { kind: 'external-pilot-measurement-attestor-v1', verify: async ({ plan_digest, measurement_digest }) => ({ ok: true, plan_digest, measurement_digest, envelope_digest: `sha256:${'5'.repeat(64)}` }) };
const attestMeasurements = async (value) => verifyPilotMeasurements(verifiedPilotPlan, value, measurementAttestor);
const verifiedPilotMeasurements = await attestMeasurements(pilotMeasurements);
assert.equal(evaluatePilotGates({ verified_plan: verifiedPilotPlan, verified_measurements: verifiedPilotMeasurements }).status, 'pass');
assert.throws(() => { verifiedPilotPlan.plan.tuples[0].repository = 'mutated-repository'; }, /read only|Cannot assign/);
assert.throws(() => { verifiedPilotMeasurements.measurements.unseen_validation.segments[0].candidate.retrieval_p90_ms = 999; }, /read only|Cannot assign/);
assert.equal(evaluatePilotGates({ verified_plan: verifiedPilotPlan, verified_measurements: verifiedPilotMeasurements }).status, 'pass', 'nested mutation after verification cannot alter a gate result');
assert.equal(evaluatePilotGates({ verified_plan: pilotPlan, verified_measurements: pilotMeasurements }).status, 'blocked', 'caller booleans/digests cannot create a trusted result');
const thinUnseen = structuredClone(pilotMeasurements); thinUnseen.unseen_validation.segments[0].eligible_runs = 0;
assert.equal(evaluatePilotGates({ verified_plan: verifiedPilotPlan, verified_measurements: await attestMeasurements(thinUnseen) }).status, 'blocked');
const p1Calibration = structuredClone(pilotMeasurements); p1Calibration.calibration.segments[0].p1_count = 1;
assert.equal(evaluatePilotGates({ verified_plan: verifiedPilotPlan, verified_measurements: await attestMeasurements(p1Calibration) }).status, 'blocked');
const aggregateMasked = structuredClone(pilotMeasurements); aggregateMasked.unseen_validation.segments[1].candidate.retrieval_p90_ms = 31;
assert.equal(evaluatePilotGates({ verified_plan: verifiedPilotPlan, verified_measurements: await attestMeasurements(aggregateMasked) }).status, 'blocked', 'a failing tuple cannot be offset by aggregate success');
const capFailure = structuredClone(pilotMeasurements); capFailure.unseen_validation.segments[0].candidate.active_work_artifacts = 2;
assert.equal(evaluatePilotGates({ verified_plan: verifiedPilotPlan, verified_measurements: await attestMeasurements(capFailure) }).status, 'blocked');
await assert.rejects(() => verifyPilotMeasurements(verifiedPilotPlan, { ...pilotMeasurements, unseen_validation: undefined }, measurementAttestor), /cohorts/);
await assert.rejects(() => verifyFrozenPilotPlan({ ...pilotPlan, tuples: [tuples[0], tuples[0]] }, pilotPlanAttestor), /frozen pilot plan/);
await assert.rejects(() => verifyFrozenPilotPlan({ ...pilotPlan, unexpected: true }, pilotPlanAttestor), /frozen pilot plan/);
await assert.rejects(() => verifyPilotMeasurements(verifiedPilotPlan, { ...pilotMeasurements, unexpected: true }, measurementAttestor), /externally verified/);
await assert.rejects(() => verifyFrozenPilotPlan(pilotPlan, { kind: 'external-pilot-plan-attestor-v1', verify: async () => ({ ok: true }) }), /envelope/);
const cyclicPlan = structuredClone(pilotPlan); cyclicPlan.self = cyclicPlan;
await assert.rejects(() => verifyFrozenPilotPlan(pilotPlan, { kind: 'external-pilot-plan-attestor-v1', verify: async ({ plan_digest }) => ({ ok: true, plan_digest, plan: cyclicPlan, envelope_digest: `sha256:${'6'.repeat(64)}` }) }), /pilot envelope/);
const deepPlan = structuredClone(pilotPlan); let deepNode = deepPlan; for (let index = 0; index < 40; index += 1) { deepNode.child = {}; deepNode = deepNode.child; }
await assert.rejects(() => verifyFrozenPilotPlan(pilotPlan, { kind: 'external-pilot-plan-attestor-v1', verify: async ({ plan_digest }) => ({ ok: true, plan_digest, plan: deepPlan, envelope_digest: `sha256:${'7'.repeat(64)}` }) }), /depth limit/);
const oversizedPlan = { ...pilotPlan, padding: 'x'.repeat(300000) };
await assert.rejects(() => verifyFrozenPilotPlan(pilotPlan, { kind: 'external-pilot-plan-attestor-v1', verify: async ({ plan_digest }) => ({ ok: true, plan_digest, plan: oversizedPlan, envelope_digest: `sha256:${'8'.repeat(64)}` }) }), /byte limit|invalid string/);
console.log('quality-contract core: ok');
NODE
