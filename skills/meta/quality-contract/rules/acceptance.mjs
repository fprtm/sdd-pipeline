import { canonicalJson, digest } from '../parser.mjs';
import { isGatewayVerifiedOperationLease, gatewayLeaseMatchesOperation } from '../gateway.mjs';
import { registerVerifiedAcceptanceAttestation } from '../evaluator.mjs';
import { verifyTrustedEvent } from '../trusted-events.mjs';
import { verifySealedEvidence } from './evidence.mjs';
import { isResultCode } from '../codes.mjs';

function result(status, code, cause, owner, remediation) {
  return { status, code, cause, risk: 'high', owner, remediation };
}
function equal(left, right) { return canonicalJson(left) === canonicalJson(right); }
function completeFinding(value, owner) {
  return value && typeof value === 'object' && ['pass', 'fail', 'unknown', 'not-required', 'stale', 'blocked'].includes(value.status)
    && isResultCode(value.code) && typeof value.cause === 'string'
    ? { ...value, risk: value.risk || 'high', owner: value.owner || owner, remediation: value.remediation || 'supply trusted post-build input' }
    : result('fail', 'ATTESTATION_CODE_INVALID', 'external post-build input has an unregistered or malformed result code', owner, 'reissue typed external post-build input with a registered v1 result code');
}

async function reviewFinding(review, subject, evidenceDigest, options) {
  if (!subject || typeof subject !== 'object') return result('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'trusted expected subject is required for post-build review', 'postbuild-review', 'supply a complete trusted subject');
  if (!review) return result('fail', 'REVIEW_MISSING', 'post-build conformance review is required', 'postbuild-review', 'obtain an independent post-build review');
  const verified = await verifyTrustedEvent(review, { ...options.eventVerification, expectedType: 'postbuild_conformance_review', expectedSubjects: subject });
  if (!verified.ok) return result('fail', verified.code, verified.cause, 'postbuild-review', 'obtain a fresh trusted post-build review');
  if (review.candidate !== subject.candidate_digest || review.contract !== subject.contract_digest || review.projection !== subject.projection_digest || review.evidence !== evidenceDigest) return result('stale', 'EVIDENCE_ATTESTATION_MISMATCH', 'post-build review does not bind the exact candidate, contract, projection, and evidence', 'postbuild-review', 'rerun review over the exact sealed evidence');
  if (typeof options.postbuildReviewerVerifier !== 'function') return result('fail', 'REVIEW_NOT_INDEPENDENT', 'external post-build reviewer independence verifier is unavailable', 'postbuild-review', 'configure a reviewer independence verifier');
  let independent;
  try { independent = await options.postbuildReviewerVerifier({ review: structuredClone(review), subject: structuredClone(subject) }); } catch { independent = false; }
  if (independent !== true) return result('fail', 'REVIEW_NOT_INDEPENDENT', 'post-build reviewer independence is not externally verified', 'postbuild-review', 'obtain an independent post-build review');
  return result('pass', 'IMPLEMENTATION_REVIEW_VALID', 'independent post-build review binds the exact sealed evidence', 'postbuild-review', 'retain the reviewed evidence binding');
}

/**
 * Produce the opaque post-build dimensions consumed by evaluator.mjs. Raw
 * caller dimension overrides cannot make acceptance true.
 */
export async function verifyAcceptanceAttestation(projection, input = {}, options = {}) {
  const expected = input.expected;
  const evidence = await verifySealedEvidence(projection, input.sealed_evidence, {
    expected,
    runner_attestation: input.runner_attestation,
    eventVerification: options.eventVerification,
    evidenceSignatureVerifier: options.evidenceSignatureVerifier,
    matcherPolicy: options.matcherPolicy,
  });
  const subject = expected?.subject;
  const implementation_review = await reviewFinding(input.postbuild_review, subject, input.sealed_evidence?.evidence_digest, options);
  let minimal_change = result('unknown', 'EVIDENCE_ATTESTATION_MISMATCH', 'external minimal-change attestation is absent', 'minimal-change', 'supply a typed post-build minimal-change attestation');
  if (!subject || typeof subject !== 'object') {
    minimal_change = result('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'trusted expected subject is required for post-build attestation', 'minimal-change', 'supply a complete trusted subject');
  } else if (!options.postbuildAttestor || options.postbuildAttestor.kind !== 'external-acceptance-attestor-v1' || typeof options.postbuildAttestor.verify !== 'function') {
    minimal_change = result('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'external acceptance attestor is required', 'minimal-change', 'configure the trusted acceptance adapter');
  } else {
    let attested;
    try { attested = await options.postbuildAttestor.verify({ subject: structuredClone(subject), evidence_digest: input.sealed_evidence?.evidence_digest, review_event_id: input.postbuild_review?.event_id }); } catch { attested = null; }
    if (!attested || attested.ok !== true || !equal(attested.subject, subject) || attested.evidence_digest !== input.sealed_evidence?.evidence_digest) {
      minimal_change = result('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'minimal-change attestation is not bound to the exact subject and evidence', 'minimal-change', 'reissue a trusted post-build attestation');
    } else minimal_change = completeFinding(attested.minimal_change, 'minimal-change');
  }
  const lease = input.acceptance_lease;
  const operation_lease = !lease
    ? result('fail', 'LEASE_MISSING', 'a distinct acceptance lease is required', 'trusted-gateway', 'obtain a live acceptance-transition lease')
    : !isGatewayVerifiedOperationLease(lease) || lease.operation !== 'acceptance'
      ? result('fail', 'LEASE_OPERATION_MISMATCH', 'lease is not a gateway-verified distinct acceptance lease', 'trusted-gateway', 'consume a lease bound to acceptance only')
      : !input.acceptance_operation || !gatewayLeaseMatchesOperation(lease, input.acceptance_operation)
        ? result('fail', 'LEASE_BINDING_MISMATCH', 'acceptance lease does not bind the exact operation, subject, contract, projection, policy, and candidate', 'trusted-gateway', 'supply the exact acceptance operation and consume a newly bound lease')
      : result('pass', lease.code, lease.cause, lease.owner || 'trusted-gateway', lease.remediation || 'obtain a new lease for another operation');
  const provenance = evidence.status === 'pass'
    ? result('pass', 'PROVENANCE_EXTERNALLY_ATTESTED', 'runner evidence and review were externally verified', 'provenance', 'retain pinned external attestations')
    : result('fail', 'EVIDENCE_ATTESTATION_MISMATCH', 'unverified or stale evidence cannot provide acceptance provenance', 'provenance', 'supply exact externally verified evidence');
  return registerVerifiedAcceptanceAttestation({
    dimensions: { evidence, implementation_review, minimal_change, operation_lease, provenance },
    provenance_assurance: evidence.status === 'pass' ? 'externally-attested' : 'degraded',
  });
}

/** Convenience predicate for callers that need a result before evaluator composition. */
export function acceptanceDimensionsAreGreen(attestation) {
  return attestation && Object.values(attestation.dimensions || {}).every((finding) => finding?.status === 'pass');
}
