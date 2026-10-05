import { canonicalJson, digest } from './parser.mjs';
import { verifyTrustedEvent, canonicalAuthorizationBinding, authorizationMatchesCanonicalBinding } from './trusted-events.mjs';

const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const OPERATION_KEYS = ['operation_id', 'operation_kind', 'argv', 'cwd', 'environment_class', 'target_class', 'network', 'subject', 'scope_effect_class', 'policy_digest', 'capabilities', 'environment_digest', 'cwd_digest'];
const VERIFIED_OPERATION_LEASES = new WeakSet();
// The public lease object is intentionally small, but its authority is not.
// Keep the exact operation binding in a private brand map so an in-process
// caller cannot reuse a branded lease for another candidate or operation.
const VERIFIED_OPERATION_LEASE_BINDINGS = new WeakMap();
const denied = (code, cause) => ({ ok: false, code, cause, may_dispatch: false });
const frozen = (value) => Object.freeze(structuredClone(value));
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

/** Every capability-bearing input is in the lease digest; unknown fields fail. */
export function operationDigest(operation) {
  if (!exact(operation, OPERATION_KEYS)) throw new TypeError('operation must have exactly the governed operation schema');
  return digest(Object.fromEntries(OPERATION_KEYS.map((field) => [field, operation[field]])));
}

/**
 * Build the complete immutable identity that a gateway-issued lease authorizes.
 * This deliberately names the redundant subject fields: callers must not be
 * able to treat a matching operation id as permission after a contract,
 * projection, policy, or candidate transition.
 */
export function operationLeaseBinding(operation) {
  if (!operationValid(operation)) throw new TypeError('operation must have a valid governed operation schema');
  const subject = operation.subject;
  return Object.freeze({
    operation: operation.operation_kind === 'acceptance' ? 'acceptance' : 'dispatch',
    operation_digest: operationDigest(operation),
    subject_digest: digest(subject),
    contract_digest: subject.contract_digest,
    projection_digest: subject.projection_digest,
    policy_digest: operation.policy_digest,
    candidate_digest: subject.candidate_digest,
  });
}

/** In-memory store deliberately cannot satisfy the production durable contract. */
export function createReplayStore() {
  const consumed = new Set();
  return Object.freeze({ kind: 'in-memory-test-only', durable: false, consumeOnce(lease) {
    const key = `${lease.lease_id}\0${lease.nonce}`;
    if (consumed.has(key)) return false;
    consumed.add(key); return true;
  } });
}

/** Opaque evaluator input: only this gateway can brand a verified lease. */
export function isGatewayVerifiedOperationLease(value) { return VERIFIED_OPERATION_LEASES.has(value); }
function verifiedLease(operation) {
  const binding = operationLeaseBinding(operation);
  const value = Object.freeze({ operation: binding.operation, status: 'pass', code: 'LEASE_VALID', cause: 'gateway verified and consumed one exact lease', risk: 'high', owner: 'trusted-gateway', remediation: 'obtain a new lease for another operation', binding });
  VERIFIED_OPERATION_LEASES.add(value);
  VERIFIED_OPERATION_LEASE_BINDINGS.set(value, binding);
  return value;
}

/**
 * Check the private gateway brand against the exact operation expected at the
 * decision point.  A structurally copied lease, or a lease from another
 * operation/subject, cannot satisfy this predicate.
 */
export function gatewayLeaseMatchesOperation(lease, expectedOperation) {
  if (!isGatewayVerifiedOperationLease(lease)) return false;
  let expected;
  try { expected = operationLeaseBinding(expectedOperation); } catch { return false; }
  const actual = VERIFIED_OPERATION_LEASE_BINDINGS.get(lease);
  return !!actual && canonicalJson(actual) === canonicalJson(expected);
}

function operationValid(operation) {
  if (!exact(operation, OPERATION_KEYS) || !ID.test(operation.operation_id) || !['mutation', 'runner', 'scope_expansion', 'acceptance'].includes(operation.operation_kind)) return false;
  if (!Array.isArray(operation.argv) || operation.argv.length === 0 || operation.argv.some((arg) => typeof arg !== 'string' || !arg)) return false;
  return typeof operation.cwd === 'string' && operation.cwd.length > 0 && operation.environment_class === 'isolated' && operation.target_class === 'local_disposable' && operation.network === false && Array.isArray(operation.capabilities) && operation.capabilities.length === 0 && DIGEST.test(operation.environment_digest) && DIGEST.test(operation.cwd_digest) && DIGEST.test(operation.policy_digest) && operation.subject && typeof operation.subject === 'object' && operation.policy_digest === operation.subject.policy_digest && operation.scope_effect_class === 'repository';
}
function immutableAllowlist(policy) {
  if (!policy || !Array.isArray(policy.allowed_operations) || policy.allowed_operations.length === 0 || policy.allowed_operations.some((entry) => !exact(entry, ['operation_id', 'operation_digest']) || !ID.test(entry.operation_id) || !DIGEST.test(entry.operation_digest))) return null;
  return frozen(policy.allowed_operations);
}
async function verifyReferences(lease, subject, options) {
  if (!Array.isArray(lease.review_event_ids) || lease.review_event_ids.length === 0 || new Set(lease.review_event_ids).size !== lease.review_event_ids.length || typeof options.eventResolver?.get !== 'function') return denied('REVIEW_MISSING', 'lease must reference resolvable independent review events');
  try {
    if (lease.authorization_event_id !== null) {
      const authorization = await options.eventResolver.get(lease.authorization_event_id);
      const auth = await verifyTrustedEvent(authorization, { ...options.eventVerification, expectedType: 'human_authorization', expectedSubjects: subject });
      if (!auth.ok) return denied(auth.code, auth.cause);
      const binding = canonicalAuthorizationBinding(options.contract, options.projection);
      if (!binding) return denied('AUTH_BINDING_MISSING', 'gateway requires canonical contract and projection for authorization binding');
      if (!authorizationMatchesCanonicalBinding(authorization, binding, subject)) return denied('AUTH_BINDING_MISMATCH', 'human authorization does not bind this canonical goal, scope, risk, executor class, and projection');
    } else {
      if (typeof options.authorizationPolicyVerifier !== 'function') return denied('AUTH_POLICY_PROOF_INVALID', 'an external policy verifier is required for authorization-not-required');
      let proof;
      try { proof = await options.authorizationPolicyVerifier({ policy_proof: structuredClone(lease.policy_proof), subject: structuredClone(subject), contract: structuredClone(options.contract), projection: structuredClone(options.projection), lease: structuredClone(lease) }); } catch { return denied('AUTH_POLICY_PROOF_INVALID', 'external authorization-not-required policy proof could not be verified'); }
      if (!proof || proof.ok !== true || proof.authorization !== 'not-required' || proof.policy_digest !== lease.policy_digest || proof.subject_digest !== digest(subject)) return denied('AUTH_POLICY_PROOF_INVALID', 'policy proof does not establish authorization-not-required for this exact subject and policy');
    }
    for (const id of lease.review_event_ids) {
      const review = await options.eventResolver.get(id);
      const verified = await verifyTrustedEvent(review, { ...options.eventVerification, expectedType: 'prebuild_semantic_review', expectedSubjects: subject });
      if (!verified.ok) return denied(verified.code, verified.cause);
    }
  } catch { return denied('REVIEW_MISSING', 'authorization or review event could not be resolved'); }
  return null;
}

/** Routes exactly one allowlisted local operation, never raw host tools. */
export function createGateway(options = {}) {
  const allowlist = immutableAllowlist(options.operationPolicy);
  const replay = options.replayAdapter;
  const dispatcher = options.dispatchAdapter;
  return Object.freeze({ async dispatch(operation, lease) {
    if (!allowlist || !operationValid(operation)) return denied('LEASE_OPERATION_MISMATCH', 'operation does not match the strict governed schema');
    if (typeof options.resolveCwd !== 'function') return denied('SCOPE_PATH_ESCAPE', 'trusted cwd resolver is required');
    let cwd; try { cwd = await options.resolveCwd(operation.cwd, operation.cwd_digest); } catch { return denied('SCOPE_PATH_ESCAPE', 'cwd resolution failed'); }
    if (!cwd || cwd.safe !== true) return denied('SCOPE_PATH_ESCAPE', 'cwd is not a trusted non-symlink repository path');
    const operation_digest = operationDigest(operation);
    if (!allowlist.some((entry) => entry.operation_id === operation.operation_id && entry.operation_digest === operation_digest)) return denied('GATEWAY_TARGET_DENIED', 'operation is not in immutable trusted allowlist');
    const verified = await verifyTrustedEvent(lease, { ...options.eventVerification, expectedType: 'operation_lease', expectedSubjects: operation.subject });
    if (!verified.ok) return denied(verified.code === 'AUTH_EXPIRED' ? 'LEASE_EXPIRED' : verified.code === 'AUTH_REVOKED' ? 'LEASE_REVOKED' : verified.code, verified.cause);
    if (lease.operation_id !== operation.operation_id || lease.operation_kind !== operation.operation_kind || lease.operation_digest !== operation_digest || lease.scope_effect_class !== operation.scope_effect_class || lease.policy_digest !== operation.policy_digest || canonicalJson(lease.subject) !== canonicalJson(operation.subject)) return denied('LEASE_OPERATION_MISMATCH', 'lease does not bind this exact operation snapshot');
    const refs = await verifyReferences(lease, operation.subject, options); if (refs) return refs;
    if (!replay || replay.kind !== 'external-durable-replay-v1' || typeof replay.consumeOnce !== 'function') return denied('LEASE_REPLAY', 'external durable atomic replay adapter is unavailable');
    if (!dispatcher || dispatcher.kind !== 'cancellable-dispatch-v1' || typeof dispatcher.start !== 'function') return denied('GATEWAY_DISPATCH_UNAVAILABLE', 'cancellable trusted dispatch adapter is unavailable');
    const now = typeof options.now === 'function' ? options.now() : Date.now(); const expires = Date.parse(lease.expires_at); const max = Number(lease.max_duration_ms); const deadline = Math.min(expires, now + max);
    if (!Number.isSafeInteger(max) || max <= 0 || !Number.isFinite(deadline) || deadline <= now) return denied('LEASE_EXPIRED', 'lease deadline elapsed before dispatch');
    if (await replay.consumeOnce({ lease_id: lease.lease_id, nonce: lease.nonce, deadline }) !== true) return denied('LEASE_REPLAY', 'lease has already been consumed');
    const controller = new AbortController(); let handle; try { handle = dispatcher.start(frozen(operation), { signal: controller.signal, deadline }); } catch { return denied('GATEWAY_DISPATCH_FAILED', 'dispatcher refused the governed operation'); }
    if (!handle || typeof handle.cancel !== 'function' || !handle.completion || typeof handle.completion.then !== 'function') { controller.abort(); return denied('GATEWAY_DISPATCH_UNAVAILABLE', 'dispatcher did not provide cancellable completion handle'); }
    let timer;
    const completion = Promise.resolve(handle.completion).then(
      (output) => ({ kind: 'completion', output }),
      () => ({ kind: 'failure' }),
    );
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => {
        controller.abort();
        // Cancellation is best effort only. The result race still completes
        // at the deadline when a dispatcher ignores both cancellation paths.
        Promise.resolve(handle.cancel('lease-deadline')).catch(() => {});
        resolve({ kind: 'timeout' });
      }, Math.max(0, deadline - now));
    });
    try {
      const settled = await Promise.race([completion, timeout]);
      if (settled.kind === 'timeout' || (typeof options.now === 'function' ? options.now() : Date.now()) > deadline) {
        return denied('LEASE_EXPIRED', 'operation did not complete before its bounded lease deadline');
      }
      if (settled.kind === 'failure') return denied('GATEWAY_DISPATCH_FAILED', 'trusted dispatch adapter failed after lease consumption');
      return { ok: true, code: 'GATEWAY_DISPATCHED', cause: 'trusted lease was consumed for one exact allowlisted operation', may_dispatch: operation.operation_kind !== 'acceptance', may_accept: operation.operation_kind === 'acceptance', operation_lease: verifiedLease(operation), output: settled.output };
    } finally { clearTimeout(timer); }
  } });
}
