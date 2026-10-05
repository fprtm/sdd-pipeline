import { resolveEffectiveDecisions } from './rules/effective-decisions.mjs';
import { digest } from './parser.mjs';
import { isGatewayVerifiedOperationLease, gatewayLeaseMatchesOperation } from './gateway.mjs';
import { evaluateExecutorFit } from './rules/executor-fit.mjs';
import { evaluateScopeAccounting } from './rules/scope-accounting.mjs';
import { canonicalAuthorizationBinding } from './trusted-events.mjs';
import { isResultCode } from './codes.mjs';

const VERIFIED_PREFLIGHT = new WeakSet();
const VERIFIED_ACCEPTANCE = new WeakSet();

export const DIMENSIONS = Object.freeze([
  'parse', 'compatibility', 'effective_decisions', 'readiness', 'semantic_review',
  'authorization', 'baseline', 'executor_fit', 'trusted_execution_subject',
  'operation_lease', 'change_accounting', 'scope', 'minimal_change', 'implementation_review',
  'evidence', 'provenance', 'retirement',
]);
export const STATUSES = new Set(['pass', 'fail', 'unknown', 'not-required', 'stale', 'blocked']);
export const PROVENANCE_ASSURANCE = new Set(['asserted', 'harness-attested', 'externally-attested', 'degraded']);

/** Acceptance rules may brand only a fully externally verified result. */
export function registerVerifiedAcceptanceAttestation(value) {
  if (!value || typeof value !== 'object' || !value.dimensions || typeof value.dimensions !== 'object') throw new TypeError('invalid acceptance attestation');
  const dimensions = {};
  for (const [name, candidate] of Object.entries(value.dimensions)) {
    if (!DIMENSIONS.includes(name)) throw new TypeError(`invalid acceptance dimension: ${name}`);
    dimensions[name] = dimensionFrom(normalizedAttestationFinding(name, candidate, 'acceptance-attestor'));
  }
  const frozen = Object.freeze({ dimensions: Object.freeze(dimensions), provenance_assurance: value.provenance_assurance });
  VERIFIED_ACCEPTANCE.add(frozen);
  return frozen;
}
export function isVerifiedAcceptanceAttestation(value) { return VERIFIED_ACCEPTANCE.has(value); }

export function finding(dimension, status, code, cause, options = {}) {
  if (!DIMENSIONS.includes(dimension) || !STATUSES.has(status) || !isResultCode(code)) throw new TypeError('invalid result finding');
  return { dimension, status, code, cause, risk: options.risk || 'medium', owner: options.owner || 'quality-contract', remediation: options.remediation || 'supply trusted input' };
}

function dimensionFrom(f) { return { status: f.status, code: f.code, cause: f.cause, risk: f.risk, owner: f.owner, remediation: f.remediation }; }
function green(dimensions, names) { return names.every((name) => dimensions[name]?.status === 'pass'); }

function operationLeaseFinding(lease, operation, expectedOperation) {
  if (!lease) return finding('operation_lease', 'fail', 'LEASE_MISSING', 'no lease was supplied for this operation', { owner: 'trusted-gateway', remediation: 'obtain a live environment-issued lease' });
  if (!isGatewayVerifiedOperationLease(lease)) return finding('operation_lease', 'fail', 'LEASE_UNVERIFIED', 'raw lease claims cannot set an execution predicate', { owner: 'trusted-gateway', remediation: 'route the operation through the trusted gateway' });
  if (!['dispatch', 'acceptance'].includes(operation) || lease.operation !== operation) {
    return finding('operation_lease', 'fail', 'LEASE_OPERATION_MISMATCH', 'lease does not bind the evaluated operation', { owner: 'trusted-gateway', remediation: 'obtain a lease bound to this exact operation' });
  }
  if (!expectedOperation || !gatewayLeaseMatchesOperation(lease, expectedOperation)) {
    return finding('operation_lease', 'fail', 'LEASE_BINDING_MISMATCH', 'lease does not bind the exact expected operation, subject, contract, projection, policy, and candidate', { owner: 'trusted-gateway', remediation: 'supply the exact operation snapshot and consume a lease bound to it' });
  }
  if (!STATUSES.has(lease.status)) throw new TypeError('invalid operation lease status');
  return finding('operation_lease', lease.status, lease.code || 'LEASE_MISSING', lease.cause || 'lease verification result', {
    risk: lease.risk, owner: lease.owner || 'trusted-gateway', remediation: lease.remediation || 'obtain a valid live lease',
  });
}

function provenanceAssurance(value) {
  const assurance = value || 'asserted';
  if (!PROVENANCE_ASSURANCE.has(assurance)) throw new TypeError('invalid provenance assurance');
  return assurance;
}

/** External attestations may not mint an unversioned machine-code vocabulary. */
function normalizedAttestationFinding(dimension, candidate, owner) {
  if (!candidate || !STATUSES.has(candidate.status) || !isResultCode(candidate.code)) {
    return finding(dimension, 'fail', 'ATTESTATION_CODE_INVALID', 'external attestation supplied an unregistered or malformed result code', {
      risk: 'high', owner, remediation: 'reissue the external attestation with a registered v1 result code',
    });
  }
  return finding(dimension, candidate.status, candidate.code, candidate.cause, candidate);
}

/**
 * Compose a full result without assuming absent trust facts are good. Later
 * tickets provide verified facts through dimensionOverrides; this core never
 * manufactures a pass from Markdown or arbitrary caller prose.
 */
export function evaluateParsedContract(parsed, options = {}) {
  const findings = [];
  const dimensions = Object.fromEntries(DIMENSIONS.map((name) => [name, dimensionFrom(finding(name, 'unknown', 'INPUT_MISSING', `${name} has not been evaluated`))]));
  if (!parsed?.ok) {
    const fail = finding('parse', 'fail', parsed?.code || 'PARSE_FIELD_TYPE', parsed?.cause || 'contract parse failed', { remediation: 'repair the canonical contract block' });
    dimensions.parse = dimensionFrom(fail); findings.push(fail);
  } else {
    const pass = finding('parse', 'pass', 'PARSE_VALID', 'contract parsed and canonicalized');
    dimensions.parse = dimensionFrom(pass); findings.push(pass);
    const compatibility = finding('compatibility', 'pass', 'VERSION_SUPPORTED', 'schema version is supported');
    dimensions.compatibility = dimensionFrom(compatibility); findings.push(compatibility);
    const decisions = resolveEffectiveDecisions(parsed.contract.decision_revisions);
    const decisionFinding = finding('effective_decisions', decisions.status, decisions.code, decisions.cause, { remediation: decisions.status === 'pass' ? 'retain resolved decisions' : 'resolve decision lineage' });
    dimensions.effective_decisions = dimensionFrom(decisionFinding); findings.push(decisionFinding);
    const ready = dimensions.effective_decisions.status === 'pass'
      ? finding('readiness', 'pass', 'READINESS_VALID', 'typed canonical records and bindings are valid')
      : finding('readiness', 'blocked', 'READINESS_DECISIONS', 'effective decisions are unresolved', { remediation: 'resolve effective decisions' });
    dimensions.readiness = dimensionFrom(ready); findings.push(ready);
  }
  if (options.dimensionOverrides !== undefined) throw new TypeError('raw dimensionOverrides are forbidden; supply an opaque verified preflight attestation');
  for (const attestation of options.verifiedPreflight || []) {
    if (!VERIFIED_PREFLIGHT.has(attestation)) throw new TypeError('unverified preflight attestation');
    for (const [name, candidate] of Object.entries(attestation.dimensions)) {
      if (!DIMENSIONS.includes(name)) throw new TypeError(`invalid verified dimension: ${name}`);
      dimensions[name] = dimensionFrom(normalizedAttestationFinding(name, candidate, 'preflight-attestor'));
    }
  }
  for (const attestation of options.verifiedAcceptance || []) {
    if (!VERIFIED_ACCEPTANCE.has(attestation)) throw new TypeError('unverified acceptance attestation');
    for (const [name, candidate] of Object.entries(attestation.dimensions)) {
      if (!DIMENSIONS.includes(name)) throw new TypeError(`invalid verified acceptance dimension: ${name}`);
      dimensions[name] = dimensionFrom(normalizedAttestationFinding(name, candidate, 'acceptance-attestor'));
    }
  }
  const lease = operationLeaseFinding(options.operationLease, options.operation, options.expectedOperation);
  dimensions.operation_lease = dimensionFrom(lease);
  findings.push(lease);
  const eligibleNames = ['parse', 'compatibility', 'effective_decisions', 'readiness', 'baseline', 'executor_fit', 'trusted_execution_subject'];
  const executionEligible = green(dimensions, eligibleNames)
    && ['pass', 'not-required'].includes(dimensions.semantic_review.status)
    && ['pass', 'not-required'].includes(dimensions.authorization.status);
  const mayDispatch = executionEligible && options.operation === 'dispatch' && dimensions.operation_lease.status === 'pass';
  const mayAccept = executionEligible && options.operation === 'acceptance' && dimensions.operation_lease.status === 'pass'
    && green(dimensions, ['change_accounting', 'scope', 'minimal_change', 'implementation_review', 'evidence', 'provenance']);
  // Retirement is a governed state transition, not just a lifecycle check.
  // A passed lifecycle finding is insufficient unless it is attached to the
  // same trusted, version-compatible Git subject and a complete accounting
  // snapshot. In particular, the no-Git report-only path must stay denied.
  const mayRetire = green(dimensions, ['compatibility', 'trusted_execution_subject', 'change_accounting', 'retirement']);
  const assurance = [...(options.verifiedAcceptance || [])].find((item) => VERIFIED_ACCEPTANCE.has(item))?.provenance_assurance || options.provenance_assurance;
  return {
    envelope_version: '1', subject: options.subject || null, dimensions,
    predicates: { execution_eligible: executionEligible, may_dispatch: mayDispatch, may_accept: mayAccept, may_retire: mayRetire },
    findings, provenance_assurance: provenanceAssurance(assurance),
  };
}

/**
 * Produce preflight dimension inputs without treating caller assertions as
 * authority. Authentication/review inputs must already be results from the
 * trusted-event adapter; this synchronous layer only composes them.
 */
function preflightDimensions(contract, input = {}) {
  const overrides = {};
  overrides.executor_fit = evaluateExecutorFit(contract, input.executor);
  const subject = input.subject;
  const canonicalSubject = subject?.canonical_subject;
  let canonicalSubjectDigest = null;
  try { canonicalSubjectDigest = canonicalSubject && digest(canonicalSubject); } catch { canonicalSubjectDigest = null; }
  Object.assign(overrides, evaluateScopeAccounting(input.accounting, contract?.scope, canonicalSubject));
  overrides.trusted_execution_subject = subject?.git_available === true && subject?.complete === true && canonicalSubjectDigest
    ? { status: 'pass', code: 'SUBJECT_TRUSTED', cause: 'complete trusted Git base/candidate subject is available', risk: 'high', owner: 'subject-resolver', remediation: 'retain the pinned subject' }
    : { status: 'fail', code: 'SUBJECT_NO_GIT', cause: 'no complete trusted Git base/candidate subject is available', risk: 'high', owner: 'subject-resolver', remediation: 'use a trusted Git worktree; no-Git is report-only' };
  const authorizationBinding = canonicalAuthorizationBinding(contract, input.projection);
  if (input.authorization && ['pass', 'fail', 'unknown', 'stale', 'blocked', 'not-required'].includes(input.authorization.status)) {
    const claim = input.authorization.canonical_binding;
    const matches = authorizationBinding && claim && typeof claim === 'object'
      && claim.authorized_goal_digest === authorizationBinding.authorized_goal_digest
      && claim.authorized_scope_digest === authorizationBinding.authorized_scope_digest
      && claim.risk === authorizationBinding.risk
      && claim.executor_class === authorizationBinding.executor_class
      && claim.contract_digest === authorizationBinding.contract_digest
      && claim.projection_digest === authorizationBinding.projection_digest;
    overrides.authorization = matches && isResultCode(input.authorization.code)
      ? input.authorization
      : matches
        ? { status: 'fail', code: 'ATTESTATION_CODE_INVALID', cause: 'authorization attestation uses an unregistered result code', risk: 'high', owner: 'preflight-attestor', remediation: 'reissue authorization with a registered v1 result code' }
      : { status: 'fail', code: 'AUTH_BINDING_MISMATCH', cause: 'authorization is not bound to the canonical contract and projection', risk: 'high', owner: 'preflight-attestor', remediation: 'obtain authorization for the exact canonical goal, scope, risk, executor class, and projection' };
  }
  for (const [dimension, event] of [['semantic_review', input.semantic_review], ['baseline', input.baseline]]) {
    if (event && ['pass', 'fail', 'unknown', 'stale', 'blocked', 'not-required'].includes(event.status)) {
      overrides[dimension] = isResultCode(event.code)
        ? event
        : { status: 'fail', code: 'ATTESTATION_CODE_INVALID', cause: `${dimension} attestation uses an unregistered result code`, risk: 'high', owner: 'preflight-attestor', remediation: 'reissue the external attestation with a registered v1 result code' };
    }
  }
  return overrides;
}

/**
 * The adapter is the explicit external trust boundary. It must authenticate
 * the subject/accounting/fit snapshot before this module brands it; callers
 * cannot forge a usable result by passing evaluator dimensions directly.
 */
export async function verifyPreflightAttestation(contract, input, adapter) {
  if (!adapter || adapter.kind !== 'external-preflight-attestor-v1' || typeof adapter.verify !== 'function') throw new TypeError('external preflight attestor is required');
  const contract_digest = contract && typeof contract === 'object' ? digest(contract) : null;
  let trusted;
  try { trusted = await adapter.verify({ contract_digest, input: structuredClone(input) }); } catch { throw new TypeError('external preflight attestation verification failed'); }
  if (!trusted || trusted.ok !== true || trusted.contract_digest !== contract_digest || !trusted.snapshot || typeof trusted.snapshot !== 'object') throw new TypeError('external preflight attestation was not verified for this contract');
  const dimensions = preflightDimensions(contract, trusted.snapshot);
  const result = Object.freeze({ dimensions: Object.freeze(dimensions) });
  VERIFIED_PREFLIGHT.add(result);
  return result;
}
