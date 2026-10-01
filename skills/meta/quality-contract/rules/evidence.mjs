import { canonicalJson, digest } from '../parser.mjs';
import { isPortableSealedEvidence, isValidEvidenceEnvelope, signedEvidencePayload } from '../evidence-runner.mjs';
import { verifyTrustedEvent } from '../trusted-events.mjs';

const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const RESULT_KEYS = ['ac_id', 'assertion_status', 'matcher_id', 'matcher_version', 'expected_digest', 'observed_digest', 'evidence_class', 'negative_assertion_status', 'detail_digest'];

function exact(value, keys) { return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function outcome(status, code, cause, remediation) { return { status, code, cause, risk: 'high', owner: 'evidence-verifier', remediation }; }
function equal(left, right) { return canonicalJson(left) === canonicalJson(right); }
function subjectValid(subject) { return subject && typeof subject === 'object' && !Array.isArray(subject) && Object.values(subject).length === 10 && Object.values(subject).every((value) => DIGEST.test(value)); }

function matcherAllowed(policy, result) {
  if (!policy || policy.kind !== 'external-matcher-policy-v1' || typeof policy.allows !== 'function') return false;
  try { return policy.allows({ matcher_id: result.matcher_id, matcher_version: result.matcher_version }) === true; } catch { return false; }
}

/** Verify every frozen AC mapping without executing its prose/action. */
export function evaluateFrozenAssertions(projection, evidence, matcherPolicy) {
  if (!projection || !Array.isArray(projection.ac_subset) || !evidence || !Array.isArray(evidence.ac_results)) return outcome('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'projected AC records or evidence results are absent', 'supply complete canonical AC mapping and sealed results');
  const maps = new Map(projection.ac_subset.map((item) => [item?.acceptance_criterion?.id, item?.evidence_map]));
  const results = new Map(evidence.ac_results.map((item) => [item?.ac_id, item]));
  if (maps.size !== projection.ac_subset.length || results.size !== evidence.ac_results.length || maps.size !== results.size) return outcome('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'each effective AC requires exactly one evidence result', 'emit one result for every projected AC');
  for (const [acId, map] of maps) {
    const result = results.get(acId);
    if (!exact(result, RESULT_KEYS) || !ID.test(result.ac_id) || !['pass', 'fail'].includes(result.assertion_status) || !ID.test(result.matcher_id) || !ID.test(result.matcher_version) || !DIGEST.test(result.expected_digest) || !DIGEST.test(result.observed_digest) || typeof result.evidence_class !== 'string' || !['pass', 'fail'].includes(result.negative_assertion_status) || (result.detail_digest !== null && !DIGEST.test(result.detail_digest))) return outcome('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'an AC result has an invalid typed shape', 'reissue typed runner evidence');
    if (!map || result.expected_digest !== digest(map.expected) || result.evidence_class !== map.evidence_class || !matcherAllowed(matcherPolicy, result)) return outcome('stale', 'EVIDENCE_ATTESTATION_MISMATCH', 'AC result does not bind its frozen map or approved matcher', 'rerun evidence against the current AC map and matcher policy');
    if (result.assertion_status !== 'pass' || result.negative_assertion_status !== 'pass') return outcome('fail', 'EVIDENCE_MATCHER_FAILED', `AC matcher failed: ${acId}`, 'repair the implementation and rerun the frozen assertion');
  }
  return outcome('pass', 'EVIDENCE_ASSERTIONS_VALID', 'every effective AC has a passing approved frozen assertion', 'retain the sealed AC evidence');
}

/**
 * Validate a sealed runner envelope. The candidate never supplies a key, URL,
 * trust anchor, raw output, or a self-declared successful evidence result.
 */
export async function verifySealedEvidence(projection, sealed, options = {}) {
  if (!isPortableSealedEvidence(sealed)) return outcome('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'evidence envelope is not a complete portable sealed schema', 'obtain a fresh externally sealed runner envelope');
  const evidence = sealed.evidence;
  if (!isValidEvidenceEnvelope(evidence) || sealed.evidence_digest !== digest(evidence)) return outcome('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'sealed envelope shape or digest is invalid', 'reissue evidence from the trusted runner');
  const expected = options.expected;
  if (!expected || !subjectValid(expected.subject) || !DIGEST.test(expected.toolchain_digest) || !DIGEST.test(expected.dependency_digest) || !DIGEST.test(expected.argv_digest) || !DIGEST.test(expected.cwd_digest) || typeof expected.environment_class !== 'string') return outcome('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'trusted expected evidence bindings are incomplete', 'supply a complete externally resolved runner snapshot');
  if (!equal(evidence.subject, expected.subject)) return outcome('stale', 'EVIDENCE_SUBJECT_STALE', 'evidence was produced for a different exact candidate subject', 'rerun evidence for the current candidate');
  if (evidence.toolchain_digest !== expected.toolchain_digest || evidence.dependency_digest !== expected.dependency_digest) return outcome('stale', 'EVIDENCE_TOOLCHAIN_STALE', 'toolchain or dependency binding differs from the trusted snapshot', 'rerun using the pinned toolchain and dependencies');
  if (evidence.argv_digest !== expected.argv_digest || evidence.cwd_digest !== expected.cwd_digest || evidence.environment_class !== expected.environment_class) return outcome('stale', 'EVIDENCE_ATTESTATION_MISMATCH', 'argv, cwd, or environment binding differs from the trusted runner snapshot', 'rerun through the exact approved runner route');
  if (!options.runner_attestation) return outcome('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'runner attestation is required', 'supply the matching trusted runner event');
  const runner = await verifyTrustedEvent(options.runner_attestation, { ...options.eventVerification, expectedType: 'runner_attestation', expectedSubjects: expected.subject });
  if (!runner.ok || options.runner_attestation.event_id !== evidence.event_id || options.runner_attestation.snapshot !== expected.subject.candidate_digest || options.runner_attestation.policy !== expected.subject.policy_digest || options.runner_attestation.argv_digest !== evidence.argv_digest || options.runner_attestation.environment_class !== evidence.environment_class || !evidence.referenced_event_ids.includes(evidence.event_id)) return outcome(runner.ok ? 'stale' : 'fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'runner attestation does not bind this sealed evidence', 'rerun under a matching trusted runner attestation');
  if (typeof options.evidenceSignatureVerifier !== 'function') return outcome('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'external evidence signature verifier is unavailable', 'configure a pinned runner evidence verifier');
  let signatureOk;
  try { signatureOk = await options.evidenceSignatureVerifier({ event: options.runner_attestation, payload: signedEvidencePayload(evidence), signature: evidence.signature }); } catch { signatureOk = false; }
  if (signatureOk !== true) return outcome('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'evidence signature does not verify against the external runner identity', 'rerun through a trusted runner');
  if (evidence.exit_code !== '0' || evidence.signal !== null) return outcome('fail', 'EVIDENCE_PROCESS_FAILED', 'the sealed runner process did not finish successfully', 'repair the failing process and rerun');
  return evaluateFrozenAssertions(projection, evidence, options.matcherPolicy);
}
