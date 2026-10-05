import { benchmarkDigest } from './runner.mjs';

const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/;
const DECISIONS = new Set(['promote', 'revise', 'reject']);

function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function bounded(value) { return typeof value === 'string' && value.length > 0 && Buffer.byteLength(value, 'utf8') <= 4096 && value === value.normalize('NFC'); }
function result(status, code, cause, missing = [], extra = {}) { return Object.freeze({ status, code, cause, risk: status === 'pass' ? 'medium' : 'critical', owner: 'promotion-authority', missing, ...extra }); }
function digestOrNull(value) { return value === null || DIGEST.test(value || ''); }

function validPacket(packet) {
  if (!exact(packet, ['promotion_packet_version', 'benchmark', 'rollout_evidence', 'independent_reviews', 'field_outcomes', 'authority', 'decision', 'rationale', 'decided_at']) || packet.promotion_packet_version !== '1') return false;
  if (!exact(packet.benchmark, ['status', 'code', 'evidence_class', 'result_digest']) || !['PASS', 'FAIL', 'INSUFFICIENT', 'INVALID'].includes(packet.benchmark.status) || !bounded(packet.benchmark.code) || !['synthetic-fixture', 'field-pilot'].includes(packet.benchmark.evidence_class) || !DIGEST.test(packet.benchmark.result_digest || '')) return false;
  if (!exact(packet.rollout_evidence, ['shadow', 'report_only', 'opt_in', 'unseen']) || !Object.values(packet.rollout_evidence).every(digestOrNull)) return false;
  if (!exact(packet.independent_reviews, ['verifier', 'security', 'sre']) || !Object.values(packet.independent_reviews).every(digestOrNull)) return false;
  if (!exact(packet.field_outcomes, ['quality', 'productivity', 'product', 'operations']) || !Object.values(packet.field_outcomes).every(digestOrNull)) return false;
  if (!(packet.authority === null || (exact(packet.authority, ['actor_id', 'role', 'attestation_digest']) && bounded(packet.authority.actor_id) && packet.authority.role === 'promotion-authority' && DIGEST.test(packet.authority.attestation_digest || '')))) return false;
  if (!(packet.decision === null || DECISIONS.has(packet.decision))) return false;
  if (!(packet.rationale === null || bounded(packet.rationale)) || !(packet.decided_at === null || (ISO.test(packet.decided_at) && Number.isFinite(Date.parse(packet.decided_at))))) return false;
  const decisionFields = [packet.authority, packet.decision, packet.rationale, packet.decided_at];
  return decisionFields.every((value) => value === null) || decisionFields.every((value) => value !== null);
}

export function evaluatePromotionReadiness(packet) {
  if (!validPacket(packet)) return result('blocked', 'PILOT_PROMOTION_SCHEMA_INVALID', 'promotion packet does not match strict v1 shape');
  if (packet.benchmark.status !== 'PASS' || packet.benchmark.code !== 'BENCHMARK_PASS' || packet.benchmark.evidence_class !== 'field-pilot') return result('blocked', 'PILOT_BENCHMARK_NOT_FIELD', 'a passing field-pilot benchmark is required');
  const missing = [];
  for (const [group, values] of [['rollout_evidence', packet.rollout_evidence], ['independent_reviews', packet.independent_reviews], ['field_outcomes', packet.field_outcomes]]) for (const [name, value] of Object.entries(values)) if (value === null) missing.push(`${group}.${name}`);
  if (missing.length) return result('blocked', 'PILOT_EVIDENCE_INCOMPLETE', 'required rollout, independent-review, or field-outcome evidence is missing', missing);
  if (packet.authority === null) return result('blocked', 'PILOT_HUMAN_DECISION_REQUIRED', 'complete evidence awaits an externally attested human decision', ['authority', 'decision', 'rationale', 'decided_at']);
  return result('ready', 'PILOT_AUTHORITY_ATTESTATION_REQUIRED', 'packet is complete but repository content cannot prove promotion authority', [], { packet_digest: benchmarkDigest(packet) });
}

export async function verifyPromotionDecision(packet, adapter) {
  const readiness = evaluatePromotionReadiness(packet);
  if (readiness.code !== 'PILOT_AUTHORITY_ATTESTATION_REQUIRED') return readiness;
  if (!adapter || adapter.kind !== 'external-promotion-authority-v1' || typeof adapter.verify !== 'function') return result('blocked', 'PILOT_AUTHORITY_ATTESTATION_REQUIRED', 'an external promotion-authority verifier is required');
  let attestation;
  try { attestation = await adapter.verify({ packet_digest: readiness.packet_digest, packet: structuredClone(packet) }); } catch { return result('blocked', 'PILOT_AUTHORITY_ATTESTATION_INVALID', 'external promotion-authority verification failed'); }
  if (!exact(attestation, ['ok', 'packet_digest', 'envelope_digest', 'actor_id', 'decision']) || attestation.ok !== true || attestation.packet_digest !== readiness.packet_digest || !DIGEST.test(attestation.envelope_digest || '') || attestation.actor_id !== packet.authority.actor_id || attestation.decision !== packet.decision) return result('blocked', 'PILOT_AUTHORITY_ATTESTATION_INVALID', 'attestation is not bound to the exact packet, actor, and decision');
  return result('pass', 'PILOT_PROMOTION_DECISION_VALID', 'externally attested human promotion decision is bound to the complete evidence packet', [], { decision: packet.decision, packet_digest: readiness.packet_digest, attestation_digest: attestation.envelope_digest, may_promote_default: packet.decision === 'promote' });
}
