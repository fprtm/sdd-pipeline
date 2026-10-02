import { createHash } from 'node:crypto';
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/;
const SENSITIVE = /(bearer\s+[a-z0-9._-]+|-----BEGIN [A-Z ]*PRIVATE KEY-----|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i;
const VERIFIED = new WeakSet();
function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function bounded(value) { return typeof value === 'string' && value.length > 0 && Buffer.byteLength(value, 'utf8') <= 2048 && value === value.normalize('NFC') && !SENSITIVE.test(value); }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function canonical(value) { if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; if (object(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`; return JSON.stringify(value); }
function digest(value) { return `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`; }
function result(status, code, cause, remediation, extra = {}) { return freeze({ status, code, cause, risk: status === 'pass' ? 'medium' : 'critical', owner: 'release-outcome', remediation, may_deploy: false, ...extra }); }
function validAuthorization(event) {
  return exact(event, ['release_auth_version', 'authorization_id', 'candidate_digest', 'environment_digest', 'readiness_digest', 'issued_at', 'expires_at', 'nonce', 'authority_role', 'decision', 'signature']) && event.release_auth_version === '1' && ID.test(event.authorization_id || '') && [event.candidate_digest, event.environment_digest, event.readiness_digest].every((value) => DIGEST.test(value || '')) && ISO.test(event.issued_at || '') && ISO.test(event.expires_at || '') && ID.test(event.nonce || '') && event.authority_role === 'release-authority' && event.decision === 'authorize' && bounded(event.signature);
}

export async function verifyReleaseAuthorization(event, attestor) {
  if (!validAuthorization(event) || attestor?.kind !== 'external-release-attestor-v1' || typeof attestor.verify !== 'function') throw new TypeError('release authorization requires strict input and an external attestor');
  const authorization_digest = digest(event);
  const verified = await attestor.verify({ authorization_digest, event: structuredClone(event) });
  if (!exact(verified, ['ok', 'authorization_digest', 'event', 'attestation_digest', 'trusted_at']) || verified.ok !== true || verified.authorization_digest !== authorization_digest || digest(verified.event) !== authorization_digest || !DIGEST.test(verified.attestation_digest || '') || !ISO.test(verified.trusted_at || '') || Date.parse(verified.trusted_at) < Date.parse(event.issued_at) || Date.parse(verified.trusted_at) >= Date.parse(event.expires_at)) throw new Error('release authorization attestation is invalid or expired');
  const output = freeze(structuredClone(verified)); VERIFIED.add(output); return output;
}

export async function evaluateReleaseAuthorization(input = {}, replay) {
  if (!exact(input, ['candidate_digest', 'environment_digest', 'readiness_digest', 'verified_authorization']) || ![input.candidate_digest, input.environment_digest, input.readiness_digest].every((value) => DIGEST.test(value || '')) || !VERIFIED.has(input.verified_authorization)) return result('blocked', 'RELEASE_AUTHORIZATION_INVALID', 'release authorization is absent, malformed, or not externally verified', 'obtain a fresh exact-subject external authorization');
  const event = input.verified_authorization.event;
  if (event.candidate_digest !== input.candidate_digest || event.environment_digest !== input.environment_digest || event.readiness_digest !== input.readiness_digest) return result('blocked', 'RELEASE_BINDING_MISMATCH', 'authorization does not bind the exact candidate, environment, and readiness result', 'authorize the exact release tuple');
  if (replay?.kind !== 'external-durable-release-replay-v1' || typeof replay.consumeOnce !== 'function') return result('blocked', 'RELEASE_REPLAY_UNVERIFIED', 'durable release replay protection is unavailable', 'provide an external durable consume-once adapter');
  if (!await replay.consumeOnce({ authorization_id: event.authorization_id, nonce: event.nonce })) return result('blocked', 'RELEASE_AUTHORIZATION_REPLAY', 'release authorization was already consumed', 'issue a new release authorization');
  return result('pass', 'RELEASE_AUTHORIZATION_VALID', 'external authority approved the exact release tuple', 'perform deployment only through the externally controlled release system', { authorization_valid: true, observation_subject: freeze({ candidate_digest: input.candidate_digest, environment_digest: input.environment_digest }) });
}

function validSignals(signals, owner) {
  return Array.isArray(signals) && signals.length > 0 && signals.length <= 64 && new Set(signals.map(({ id }) => id)).size === signals.length && signals.every((signal) => exact(signal, ['id', 'measure', 'success_threshold', 'failure_threshold', 'owner']) && ID.test(signal.id || '') && bounded(signal.measure) && bounded(signal.success_threshold) && bounded(signal.failure_threshold) && signal.owner === owner);
}

export function createObservationPlan(input = {}) {
  if (!exact(input, ['observation_plan_version', 'candidate_digest', 'environment_digest', 'window', 'product_signals', 'technical_signals', 'security_signals', 'rollback_trigger', 'raw_sensitive_data_policy', 'decision_owner']) || input.observation_plan_version !== '1' || !DIGEST.test(input.candidate_digest || '') || !DIGEST.test(input.environment_digest || '') || !exact(input.window, ['starts_at', 'ends_at']) || !ISO.test(input.window.starts_at || '') || !ISO.test(input.window.ends_at || '') || Date.parse(input.window.starts_at) >= Date.parse(input.window.ends_at) || !validSignals(input.product_signals, 'product-owner') || !validSignals(input.technical_signals, 'sre') || !validSignals(input.security_signals, 'security-reviewer') || !bounded(input.rollback_trigger) || input.raw_sensitive_data_policy !== 'aggregate-or-pointer-only' || input.decision_owner !== 'outcome-owner') return result('fail', 'OBSERVATION_PLAN_INVALID', 'observation plan lacks bounded product, technical, security, privacy, window, or rollback fields', 'freeze the complete exact-subject observation plan before release');
  const ids = [...input.product_signals, ...input.technical_signals, ...input.security_signals].map(({ id }) => id);
  if (new Set(ids).size !== ids.length) return result('fail', 'OBSERVATION_PLAN_INVALID', 'signal identifiers collide across product, technical, or security domains', 'use globally unique signal identifiers');
  return result('pass', 'OBSERVATION_PLAN_VALID', 'product, technical, and security observations are frozen separately', 'bind this plan digest into release and outcome records', { observation_plan: freeze(structuredClone(input)), observation_plan_digest: digest(input) });
}

export function evaluateOutcome(input = {}) {
  if (!exact(input, ['outcome_version', 'candidate_digest', 'environment_digest', 'observation_plan_digest', 'product_outcome', 'technical_outcome', 'incident_regression_digest', 'decision', 'role_id']) || input.outcome_version !== '1' || ![input.candidate_digest, input.environment_digest, input.observation_plan_digest].every((value) => DIGEST.test(value || '')) || !['achieved', 'missed', 'inconclusive'].includes(input.product_outcome) || !['healthy', 'degraded', 'unsafe'].includes(input.technical_outcome) || !(input.incident_regression_digest === null || DIGEST.test(input.incident_regression_digest || '')) || !['keep', 'iterate', 'rollback', 'retire'].includes(input.decision) || input.role_id !== 'outcome-owner') return result('fail', 'OUTCOME_SCHEMA_INVALID', 'outcome review does not match strict v1 schema', 'supply separate product and technical results with an authorized decision');
  const expected = input.technical_outcome === 'unsafe' ? 'rollback' : input.product_outcome === 'missed' && input.technical_outcome === 'healthy' ? 'retire' : input.product_outcome === 'inconclusive' || input.technical_outcome === 'degraded' ? 'iterate' : 'keep';
  if (input.decision !== expected) return result('blocked', 'OUTCOME_DECISION_MISMATCH', `observations require ${expected}, not ${input.decision}`, 'record the evidence-consistent outcome-owner decision', { expected_decision: expected });
  return result('pass', `OUTCOME_${expected.toUpperCase()}`, 'product and technical outcomes were evaluated independently', 'issue the corresponding role-authorized lifecycle event', { decision: expected });
}

export function createIncidentRegression(input = {}) {
  if (!exact(input, ['incident_version', 'candidate_digest', 'incident_digest', 'root_cause_class', 'control_id', 'reproduction', 'redaction']) || input.incident_version !== '1' || !DIGEST.test(input.candidate_digest || '') || !DIGEST.test(input.incident_digest || '') || !ID.test(input.root_cause_class || '') || !ID.test(input.control_id || '') || !exact(input.reproduction, ['precondition', 'action', 'expected', 'actual']) || !Object.values(input.reproduction).every(bounded) || !exact(input.redaction, ['raw_sensitive_included', 'redaction_digest']) || input.redaction.raw_sensitive_included !== false || !DIGEST.test(input.redaction.redaction_digest || '')) return result('fail', 'INCIDENT_REDACTION_INVALID', 'incident input contains invalid, raw-sensitive, or non-redacted content', 'derive a minimal secret/PII-free reproduction before durable storage');
  const regression = { candidate_digest: input.candidate_digest, incident_digest: input.incident_digest, root_cause_class: input.root_cause_class, control_id: input.control_id, reproduction: structuredClone(input.reproduction), redaction_digest: input.redaction.redaction_digest };
  return result('pass', 'INCIDENT_REGRESSION_CREATED', 'minimal redacted incident learning is ready for regression planning', 'assign a TEST identifier and preserve the raw incident only in its authorized external system', { regression: freeze(regression), regression_digest: digest(regression) });
}
