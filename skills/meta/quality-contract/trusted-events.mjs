import { canonicalJson, digest } from './parser.mjs';

const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const TYPES = new Set(['human_authorization', 'prebuild_semantic_review', 'postbuild_conformance_review', 'runner_attestation', 'operation_lease']);
const ROLES = new Set(['author', 'reviewer', 'human_authorizer', 'maintainer', 'runner']);
const SUBJECT_KEYS = ['repository_digest', 'base_digest', 'candidate_digest', 'contract_digest', 'projection_digest', 'policy_digest', 'schema_digest', 'rules_digest', 'adapter_digest', 'ac_map_digest'];
const BASE_KEYS = ['event_version', 'event_id', 'type', 'issuer', 'key_id', 'actor_id', 'actor_role', 'issued_at', 'expires_at', 'subjects', 'signature'];

function fail(code, cause) { return { ok: false, code, cause }; }
function validString(value, max = 4096) { return typeof value === 'string' && value === value.normalize('NFC') && Buffer.byteLength(value, 'utf8') <= max; }
function time(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value.replace('Z', '.000Z') ? parsed : null;
}
function same(left, right) { return canonicalJson(left) === canonicalJson(right); }

const FINDING_KEYS = ['finding_id', 'severity', 'code', 'subject_digest', 'detail_digest', 'remediation_digest'];

/**
 * Review findings are deliberately typed digest references, rather than free
 * prose. This keeps an authority-bearing event bounded and prevents a signed
 * review from becoming an unbounded prompt/payload transport.
 */
function findingsValid(findings) {
  if (!Array.isArray(findings) || findings.length > 256) return false;
  const ids = new Set();
  return findings.every((item) => {
    if (!exactKeys(item, FINDING_KEYS) || !ID.test(item.finding_id) || ids.has(item.finding_id)) return false;
    ids.add(item.finding_id);
    return ['P1', 'P2', 'P3'].includes(item.severity)
      && ID.test(item.code)
      && DIGEST.test(item.subject_digest)
      && DIGEST.test(item.detail_digest)
      && DIGEST.test(item.remediation_digest);
  });
}

/**
 * Derive the exact human-authorization claims from canonical truth.  The
 * digest includes both owner and projection so a valid approval cannot be
 * replayed after the executable ticket changes.
 */
export function canonicalAuthorizationBinding(contract, projection) {
  try {
  if (!contract || !projection || typeof contract !== 'object' || typeof projection !== 'object'
    || typeof contract.goal !== 'string' || !['low', 'medium', 'high'].includes(contract.risk)
    || !['low_cost', 'capable', 'specialist'].includes(contract.executor_class)
    || !contract.scope || !Array.isArray(contract.scope.allowed_paths) || !Array.isArray(contract.scope.forbidden_paths)
    || projection.contract_digest !== digest(contract)
    || projection.goal !== contract.goal || projection.risk !== contract.risk || projection.executor_class !== contract.executor_class
    || !Array.isArray(projection.allowed_paths) || !Array.isArray(projection.forbidden_paths)
    || !same(projection.allowed_paths, contract.scope.allowed_paths) || !same(projection.forbidden_paths, contract.scope.forbidden_paths)) return null;
  const contract_digest = digest(contract);
  const projection_digest = digest(projection);
  return Object.freeze({
    contract_digest,
    projection_digest,
    authorized_goal_digest: digest({ contract_digest, projection_digest, goal: contract.goal }),
    authorized_scope_digest: digest({ contract_digest, projection_digest, allowed_paths: projection.allowed_paths, forbidden_paths: projection.forbidden_paths }),
    risk: contract.risk,
    executor_class: contract.executor_class,
  });
  } catch { return null; }
}

export function authorizationMatchesCanonicalBinding(event, binding, subjects) {
  return !!binding && !!event && !!subjects
    && subjects.contract_digest === binding.contract_digest
    && subjects.projection_digest === binding.projection_digest
    && event.authorized_goal_digest === binding.authorized_goal_digest
    && event.authorized_scope_digest === binding.authorized_scope_digest
    && event.risk === binding.risk
    && event.executor_class === binding.executor_class;
}

export function signedEventPayload(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new TypeError('event must be an object');
  // Validate before bytes are canonicalized/signed: callers cannot mint a
  // signature over a structurally invalid or unbounded finding collection.
  if (!eventSchemaValid(event)) throw new TypeError('event schema is invalid');
  const copy = structuredClone(event);
  delete copy.signature;
  return `quality-contract-event/v1\0${canonicalJson(copy)}`;
}

function subjectValid(subjects) {
  return subjects && typeof subjects === 'object' && !Array.isArray(subjects)
    && Object.keys(subjects).length === SUBJECT_KEYS.length
    && SUBJECT_KEYS.every((key) => DIGEST.test(subjects[key]));
}

function exactKeys(event, keys) { return event && typeof event === 'object' && !Array.isArray(event) && Object.keys(event).length === keys.length && keys.every((key) => Object.hasOwn(event, key)); }

function payloadKeys(type) {
  if (type === 'human_authorization') return ['human_authorizer_id', 'authorized_goal_digest', 'authorized_scope_digest', 'risk', 'executor_class'];
  if (type === 'prebuild_semantic_review') return ['author_run_id', 'reviewer_run_id', 'reviewer_harness_id', 'reviewer_model_id', 'reviewer_session_id', 'reviewer_snapshot_digest', 'memory_sharing', 'frozen_inputs', 'findings'];
  if (type === 'postbuild_conformance_review') return ['candidate', 'contract', 'projection', 'evidence', 'findings'];
  if (type === 'runner_attestation') return ['runner_id', 'snapshot', 'policy', 'argv_digest', 'environment_class'];
  return ['lease_id', 'authorization_event_id', 'review_event_ids', 'operation_id', 'operation_digest', 'operation_kind', 'subject', 'scope_effect_class', 'policy_digest', 'policy_proof', 'max_duration_ms', 'nonce', 'decision'];
}

function policyProofValid(proof, subject, policyDigest) {
  return proof && typeof proof === 'object' && !Array.isArray(proof)
    && exactKeys(proof, ['proof_version', 'policy_digest', 'subject_digest', 'exemption_code'])
    && proof.proof_version === '1'
    && proof.policy_digest === policyDigest
    && proof.subject_digest === digest(subject)
    && ID.test(proof.exemption_code);
}

function payloadValid(event) {
  const keys = [...BASE_KEYS.slice(0, -1), ...payloadKeys(event.type), 'signature'];
  if (!exactKeys(event, keys)) return false;
  const payload = payloadKeys(event.type);
  if (event.type === 'human_authorization') return ID.test(event.human_authorizer_id) && DIGEST.test(event.authorized_goal_digest) && DIGEST.test(event.authorized_scope_digest) && ['low', 'medium', 'high'].includes(event.risk) && ['low_cost', 'capable', 'specialist'].includes(event.executor_class);
  if (event.type === 'prebuild_semantic_review') {
    const frozen = event.frozen_inputs;
    return ID.test(event.author_run_id) && ID.test(event.reviewer_run_id) && ID.test(event.reviewer_harness_id) && ID.test(event.reviewer_model_id) && ID.test(event.reviewer_session_id) && DIGEST.test(event.reviewer_snapshot_digest) && event.memory_sharing === false && exactFrozenInputs(frozen, event.subjects) && findingsValid(event.findings);
  }
  if (event.type === 'postbuild_conformance_review') return event.actor_role === 'reviewer' && DIGEST.test(event.candidate) && DIGEST.test(event.contract) && DIGEST.test(event.projection) && DIGEST.test(event.evidence) && findingsValid(event.findings);
  if (event.type === 'runner_attestation') return ID.test(event.runner_id) && DIGEST.test(event.snapshot) && DIGEST.test(event.policy) && DIGEST.test(event.argv_digest) && validString(event.environment_class, 128);
  return ID.test(event.lease_id) && (event.authorization_event_id === null || ID.test(event.authorization_event_id)) && Array.isArray(event.review_event_ids) && event.review_event_ids.length <= 256 && new Set(event.review_event_ids).size === event.review_event_ids.length && event.review_event_ids.every((id) => ID.test(id)) && ID.test(event.operation_id) && DIGEST.test(event.operation_digest) && ['mutation', 'runner', 'scope_expansion', 'acceptance'].includes(event.operation_kind) && subjectValid(event.subject) && ['repository', 'privileged'].includes(event.scope_effect_class) && DIGEST.test(event.policy_digest) && ((event.authorization_event_id === null && policyProofValid(event.policy_proof, event.subject, event.policy_digest)) || (event.authorization_event_id !== null && event.policy_proof === null)) && typeof event.max_duration_ms === 'string' && /^(0|[1-9][0-9]{0,9})$/.test(event.max_duration_ms) && Number(event.max_duration_ms) <= 86400000 && ID.test(event.nonce) && event.decision === 'allow';
}

function eventSchemaValid(event) {
  return !!event && typeof event === 'object' && !Array.isArray(event)
    && event.event_version === '1' && TYPES.has(event.type)
    && ID.test(event.event_id) && ID.test(event.issuer) && ID.test(event.key_id)
    && ID.test(event.actor_id) && ROLES.has(event.actor_role)
    && subjectValid(event.subjects) && validString(event.signature, 16384)
    && payloadValid(event);
}

function exactFrozenInputs(value, subjects) {
  const keys = ['base', 'contract', 'projection', 'scope', 'landmarks', 'ac_map', 'policy', 'executor_class'];
  return exactKeys(value, keys) && DIGEST.test(value.base) && DIGEST.test(value.contract) && DIGEST.test(value.projection) && DIGEST.test(value.scope) && DIGEST.test(value.landmarks) && DIGEST.test(value.ac_map) && DIGEST.test(value.policy) && ['low_cost', 'capable', 'specialist'].includes(value.executor_class)
    && value.base === subjects.base_digest && value.contract === subjects.contract_digest && value.projection === subjects.projection_digest && value.ac_map === subjects.ac_map_digest && value.policy === subjects.policy_digest;
}

/**
 * Strictly validate an event against injected, external trust. No key, URL, or
 * network input is accepted from candidate data. `signatureVerifier` receives
 * only the externally resolved trust record and canonical signed bytes.
 */
export async function verifyTrustedEvent(event, options = {}) {
  if (!eventSchemaValid(event)) return fail('AUTH_EVENT_SCHEMA_INVALID', 'event schema is invalid or has unknown fields');
  if (options.expectedType && event.type !== options.expectedType) return fail('AUTH_EVENT_TYPE_MISMATCH', 'event type does not match the required trusted event');
  if (options.expectedSubjects && !same(event.subjects, options.expectedSubjects)) return fail('AUTH_SUBJECT_MISMATCH', 'event subjects do not bind the evaluated subject');
  const issued = time(event.issued_at); const expires = time(event.expires_at);
  if (issued === null || expires === null || issued > expires) return fail('AUTH_EXPIRED', 'event time range is invalid');
  if (!Number.isSafeInteger(options.maxEventLifetimeMs) || options.maxEventLifetimeMs <= 0) return fail('AUTH_EXPIRED', 'trusted policy must set a bounded maximum event lifetime');
  const now = typeof options.trustedClock === 'function' ? await options.trustedClock() : options.now;
  const skew = options.maxClockSkewMs ?? 30000;
  if (!Number.isSafeInteger(now) || issued > now + skew || expires < now || expires - issued > options.maxEventLifetimeMs) return fail('AUTH_EXPIRED', 'event is expired, issued in the future, or exceeds policy lifetime');
  if (typeof options.revocationStatus !== 'function') return fail('AUTH_REVOKED', 'external revocation status is unavailable');
  let revoked;
  try { revoked = await options.revocationStatus({ issuer: event.issuer, key_id: event.key_id, event_id: event.event_id, issued_at: event.issued_at }); } catch { return fail('AUTH_REVOKED', 'external revocation status could not be resolved'); }
  if (revoked !== false) return fail('AUTH_REVOKED', 'issuer, key, or event is revoked or revocation state is indeterminate');
  if (typeof options.trustedKeyResolver !== 'function' || typeof options.signatureVerifier !== 'function') return fail('AUTH_HUMAN_REQUIRED', 'no external key resolver and signature verifier are configured');
  let key;
  try { key = await options.trustedKeyResolver({ issuer: event.issuer, key_id: event.key_id }); } catch { return fail('AUTH_HUMAN_REQUIRED', 'trusted key could not be resolved'); }
  if (!key || key.issuer !== event.issuer || key.key_id !== event.key_id || key.algorithm !== 'Ed25519') return fail('AUTH_HUMAN_REQUIRED', 'issuer/key is not an externally pinned Ed25519 trust record');
  let verified;
  try { verified = await options.signatureVerifier({ key, payload: signedEventPayload(event), signature: event.signature }); } catch { return fail('SIGNATURE_INVALID', 'signature verification failed'); }
  if (verified !== true) return fail('SIGNATURE_INVALID', 'signature does not verify against the external trust record');
  if (event.type === 'prebuild_semantic_review') {
    if (event.actor_role !== 'reviewer' || event.memory_sharing !== false || event.author_run_id === event.reviewer_run_id || typeof options.authorRunResolver !== 'function') return fail('REVIEW_NOT_INDEPENDENT', 'reviewer identity or memory separation is not independently attestable');
    let author; try { author = await options.authorRunResolver(event.author_run_id); } catch { return fail('REVIEW_NOT_INDEPENDENT', 'author run could not be resolved for independence check'); }
    if (!author || !ID.test(author.actor_id) || author.actor_id === event.actor_id || author.harness_id === event.reviewer_harness_id || author.session_id === event.reviewer_session_id || author.memory_sharing !== false) return fail('REVIEW_NOT_INDEPENDENT', 'review has an actor, harness, session, or memory-sharing collision');
  }
  if (event.type === 'human_authorization' && (event.actor_role !== 'human_authorizer' || event.human_authorizer_id !== event.actor_id)) return fail('AUTH_HUMAN_REQUIRED', 'authorization event was not issued by its qualified human authorizer');
  if (event.type === 'postbuild_conformance_review' && event.actor_role !== 'reviewer') return fail('REVIEW_NOT_INDEPENDENT', 'post-build conformance review must be issued by reviewer role');
  if ((event.type === 'runner_attestation' || event.type === 'operation_lease') && event.actor_role !== 'runner') return fail('AUTH_HUMAN_REQUIRED', 'runner and lease events must be environment-issued by the runner role');
  return { ok: true, code: 'AUTH_EVENT_VALID', cause: 'event is externally verified, live, and subject-bound', event };
}

/** Narrow adapter hook for projection execution payloads. */
export async function verifyExecutionAuthorityEvent(event, options = {}) {
  const verified = await verifyTrustedEvent(event, { ...options, expectedType: 'runner_attestation' });
  if (!verified.ok) return verified;
  const payload = { baseline: event.snapshot ? { argv_digest: event.argv_digest, expected_exit_code: options.expected_exit_code ?? '0' } : null, stop_conditions: options.stop_conditions };
  if (!payload.baseline || !Array.isArray(payload.stop_conditions) || payload.stop_conditions.length === 0) return fail('AUTH_EVENT_SCHEMA_INVALID', 'execution authority adapter requires externally supplied stop conditions and expected exit code');
  return { ok: true, code: 'EXECUTION_AUTHORITY_VALID', cause: 'trusted event binds execution authority', execution_authority: { execution_payload: payload, execution_digest: digest(payload) }, event };
}
