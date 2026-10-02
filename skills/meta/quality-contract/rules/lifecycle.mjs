import { createHash } from 'node:crypto';
import { canonicalJson } from '../parser.mjs';

const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const TIME = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/;
const STATES = ['intake', 'discovering', 'problem-fit', 'validating', 'solution-fit', 'designing', 'design-ready', 'planning', 'ready-to-build', 'building', 'verifying', 'release-candidate', 'release-authorized', 'released', 'observing', 'outcome-reviewed', 'learned', 'rejected', 'rework', 'rolled-back', 'retired'];
const EVIDENCE_CLASS = ['claim', 'static', 'executed', 'independent', 'production'];
const EDGES = [
  ['intake', 'discovering', 'start', 'product-owner'], ['discovering', 'problem-fit', 'approve', 'product-owner'], ['problem-fit', 'validating', 'start', 'product-owner'],
  ['validating', 'solution-fit', 'approve', 'product-owner'], ['solution-fit', 'designing', 'start', 'product-owner'], ['designing', 'design-ready', 'approve', 'architect'],
  ['design-ready', 'planning', 'start', 'architect'], ['planning', 'ready-to-build', 'approve', 'architect'], ['ready-to-build', 'building', 'start', 'architect'],
  ['building', 'verifying', 'complete', 'implementer'], ['verifying', 'release-candidate', 'approve', 'verifier'], ['release-candidate', 'release-authorized', 'authorize', 'release-authority'],
  ['release-authorized', 'released', 'release', 'release-authority'], ['released', 'observing', 'start', 'sre'], ['observing', 'outcome-reviewed', 'approve', 'outcome-owner'],
  ['outcome-reviewed', 'learned', 'keep', 'outcome-owner'], ['outcome-reviewed', 'validating', 'iterate', 'outcome-owner'], ['outcome-reviewed', 'rolled-back', 'rollback', 'release-authority'], ['outcome-reviewed', 'retired', 'retire', 'outcome-owner'],
  ['released', 'rolled-back', 'rollback', 'release-authority'], ['observing', 'rolled-back', 'rollback', 'release-authority'], ['rolled-back', 'learned', 'learn', 'outcome-owner'],
  ['validating', 'discovering', 'revise', 'product-owner'], ['designing', 'rework', 'revise', 'architect'], ['planning', 'rework', 'revise', 'architect'],
  ['building', 'rework', 'revise', 'implementer'], ['verifying', 'rework', 'revise', 'verifier'], ['rework', 'building', 'start', 'architect'],
];
for (const state of STATES.filter((state) => !['released', 'observing', 'outcome-reviewed', 'learned', 'rejected', 'rolled-back', 'retired'].includes(state))) EDGES.push([state, 'rejected', 'reject', 'product-owner']);
export const LIFECYCLE_TRANSITIONS = Object.freeze(EDGES.map(([from, to, decision, role]) => Object.freeze({ from, to, decision, role })));
const TRANSITION_MAP = new Map(LIFECYCLE_TRANSITIONS.map((edge) => [`${edge.from}\0${edge.to}`, edge]));
const VERIFIED = new WeakSet();

function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function digest(value) { return `sha256:${createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex')}`; }
function finding(status, code, cause, remediation) { return freeze({ status, code, cause, risk: 'high', owner: 'lifecycle', remediation }); }
function utc(value) { return typeof value === 'string' && TIME.test(value) && Number.isFinite(Date.parse(value)); }
function subjectValid(value) { return exact(value, ['repository_digest', 'candidate_digest', 'environment_digest', 'policy_digest']) && Object.values(value).every((item) => DIGEST.test(item)); }
function eventValid(event) {
  if (!exact(event, ['lifecycle_event_version', 'event_id', 'workflow_id', 'predecessor_event_digest', 'from_state', 'to_state', 'work_subject', 'decision', 'evidence_refs', 'issued_at', 'expires_at', 'nonce', 'issuer', 'signature'])) return false;
  if (event.lifecycle_event_version !== '1' || !ID.test(event.event_id || '') || !ID.test(event.workflow_id || '') || !DIGEST.test(event.predecessor_event_digest || '') || !STATES.includes(event.from_state) || !STATES.includes(event.to_state) || !subjectValid(event.work_subject)) return false;
  if (!exact(event.decision, ['kind', 'role_id', 'assignment_digest']) || !ID.test(event.decision.kind || '') || !ID.test(event.decision.role_id || '') || !DIGEST.test(event.decision.assignment_digest || '')) return false;
  if (!Array.isArray(event.evidence_refs) || event.evidence_refs.length > 256) return false;
  const evidence = new Set();
  for (const item of event.evidence_refs) {
    if (!exact(item, ['evidence_digest', 'evidence_class', 'observed_at']) || !DIGEST.test(item.evidence_digest || '') || !EVIDENCE_CLASS.includes(item.evidence_class) || !utc(item.observed_at) || evidence.has(item.evidence_digest)) return false;
    evidence.add(item.evidence_digest);
  }
  return utc(event.issued_at) && utc(event.expires_at) && Date.parse(event.issued_at) < Date.parse(event.expires_at) && ID.test(event.nonce || '') && ID.test(event.issuer || '') && typeof event.signature === 'string' && event.signature.length > 0 && Buffer.byteLength(event.signature, 'utf8') <= 4096;
}

export function lifecycleEventDigest(event) { if (!eventValid(event)) throw new TypeError('invalid lifecycle event schema'); return digest(event); }

/** Require an external attestor to bind schema-valid event bytes and trusted time. */
export async function verifyLifecycleEvent(event, adapter) {
  if (!eventValid(event) || !adapter || adapter.kind !== 'external-lifecycle-event-attestor-v1' || typeof adapter.verify !== 'function') throw new TypeError('externally verified lifecycle event is required');
  const event_digest = digest(event); let attested;
  try { attested = await adapter.verify({ event_digest, event: structuredClone(event) }); } catch { throw new TypeError('lifecycle event attestation failed'); }
  if (!exact(attested, ['ok', 'event_digest', 'event', 'attestation_digest', 'trusted_at']) || attested.ok !== true || attested.event_digest !== event_digest || !DIGEST.test(attested.attestation_digest || '') || !utc(attested.trusted_at) || canonicalJson(attested.event) !== canonicalJson(event)) throw new TypeError('lifecycle attestation is not bound to the exact event');
  const trusted = Date.parse(attested.trusted_at);
  if (trusted < Date.parse(event.issued_at) || trusted >= Date.parse(event.expires_at)) throw new TypeError('lifecycle event is expired or not yet valid');
  const verified = freeze({ event: structuredClone(event), event_digest, attestation_digest: attested.attestation_digest, trusted_at: attested.trusted_at });
  VERIFIED.add(verified); return verified;
}

export function evaluateLegacyLifecycle(input = {}) {
  return input.legacy === true && input.operation === 'report'
    ? { ...finding('pass', 'LIFECYCLE_LEGACY_REPORT_ONLY', 'legacy lifecycle input is readable only', 'migrate explicitly before a transition'), state: input.state || null, mode: 'report-only', may_transition: false }
    : { ...finding('blocked', 'LIFECYCLE_LEGACY_REPORT_ONLY', 'legacy lifecycle input cannot create vNext authority', 'use report or perform an explicit migration'), state: input.state || null, mode: 'report-only', may_transition: false };
}

/** Consume one externally verified event and advance only an exact current state. */
export async function evaluateLifecycleTransition(input = {}, replayAdapter) {
  const verified = input.verified_event;
  if (!VERIFIED.has(verified)) return { ...finding('blocked', 'LIFECYCLE_ATTESTATION_INVALID', 'an externally verified event object is required', 'verify the exact event first'), state: input.current_state || null, may_transition: false };
  const event = verified.event;
  if (!STATES.includes(input.current_state) || !DIGEST.test(input.current_event_digest || '') || !subjectValid(input.work_subject)) return { ...finding('fail', 'LIFECYCLE_SCHEMA_INVALID', 'current lifecycle input is invalid', 'supply exact current state, predecessor, and subject'), state: input.current_state || null, may_transition: false };
  if (event.from_state !== input.current_state || event.predecessor_event_digest !== input.current_event_digest) return { ...finding('blocked', 'LIFECYCLE_PREDECESSOR_MISMATCH', 'event does not extend the exact current state/event', 'rebase a new event on the current predecessor'), state: input.current_state, may_transition: false };
  if (canonicalJson(event.work_subject) !== canonicalJson(input.work_subject)) return { ...finding('blocked', 'LIFECYCLE_SUBJECT_MISMATCH', 'event is bound to another work subject', 'issue an event for the exact repository/candidate/environment/policy'), state: input.current_state, may_transition: false };
  const edge = TRANSITION_MAP.get(`${event.from_state}\0${event.to_state}`);
  if (!edge || edge.decision !== event.decision.kind) return { ...finding('blocked', 'LIFECYCLE_TRANSITION_INVALID', `${event.from_state} cannot transition to ${event.to_state} with ${event.decision.kind}`, 'use an allowed transition or remain at the prior state'), state: input.current_state, may_transition: false };
  if (edge.role !== event.decision.role_id) return { ...finding('blocked', 'LIFECYCLE_ROLE_UNAUTHORIZED', `${event.decision.role_id} cannot authorize this transition`, `obtain ${edge.role} authority`), state: input.current_state, may_transition: false };
  if (!replayAdapter || replayAdapter.kind !== 'external-durable-replay-v1' || typeof replayAdapter.consumeOnce !== 'function') return { ...finding('blocked', 'LIFECYCLE_REPLAY_UNVERIFIED', 'durable replay protection is unavailable', 'supply an atomic durable replay adapter'), state: input.current_state, may_transition: false };
  let consumed = false;
  try { consumed = await replayAdapter.consumeOnce({ workflow_id: event.workflow_id, event_id: event.event_id, nonce: event.nonce, event_digest: verified.event_digest }); } catch { consumed = false; }
  if (consumed !== true) return { ...finding('blocked', 'LIFECYCLE_REPLAY', 'event ID or nonce was already consumed or could not be persisted', 'issue a fresh externally attested event'), state: input.current_state, may_transition: false };
  return freeze({ ...finding('pass', 'LIFECYCLE_STATE_ADVANCED', `${event.from_state} advanced to ${event.to_state}`, 'retain the append-only event and exact subject'), state: event.to_state, event_digest: verified.event_digest, may_transition: true });
}
