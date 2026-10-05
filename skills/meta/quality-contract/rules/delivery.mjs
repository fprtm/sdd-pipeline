const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const ASSURANCE = ['A0', 'A1', 'A2', 'A3'];
const EVIDENCE_CLASSES = ['static', 'executed', 'review', 'negative', 'rollback', 'security', 'recovery', 'realistic-environment', 'external-approval'];
const PROVENANCE = ['self-reported', 'tool-attested', 'independently-attested', 'externally-attested'];
const LEVELS = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const EVIDENCE_FLOOR = Object.freeze({ static: 'E1', executed: 'E2', review: 'E2', negative: 'E3', rollback: 'E3', security: 'E3', recovery: 'E5', 'realistic-environment': 'E5', 'external-approval': 'E4' });
const REQUIRED = Object.freeze({
  A0: Object.freeze(['static']),
  A1: Object.freeze(['executed', 'review']),
  A2: Object.freeze(['executed', 'review', 'negative']),
  A3: Object.freeze(['executed', 'review', 'negative', 'rollback', 'recovery', 'realistic-environment', 'external-approval']),
});

function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function unique(value, key) { return Array.isArray(value) && value.length > 0 && value.length <= 256 && new Set(value.map((item) => item?.[key])).size === value.length; }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function result(status, code, cause, input, required, missing, remediation) {
  const packet = input && exact(input.subject, ['base_digest', 'candidate_digest', 'spec_digest']) ? {
    subject: structuredClone(input.subject), assurance: input.assurance, acceptance_criteria: structuredClone(input.acceptance_criteria),
    evidence_refs: input.evidence.map(({ id, evidence_class, evidence_level, evidence_digest, subject_digest, environment_digest, observed_at, verifier_actor }) => ({ id, evidence_class, evidence_level, evidence_digest, subject_digest, environment_digest, observed_at, verifier_actor })),
  } : null;
  return freeze({ status, code, cause, risk: input?.assurance === 'A3' ? 'critical' : input?.assurance === 'A2' ? 'high' : 'medium', owner: 'delivery-loop', remediation, required_evidence: required, missing_evidence: missing, verifier_packet: packet, may_accept: false });
}

function valid(input) {
  if (!exact(input, ['delivery_version', 'subject', 'assurance', 'acceptance_criteria', 'evidence', 'defects', 'rework_iteration'])) return false;
  if (input.delivery_version !== '1' || !ASSURANCE.includes(input.assurance) || !Number.isInteger(input.rework_iteration) || input.rework_iteration < 0) return false;
  if (!exact(input.subject, ['base_digest', 'candidate_digest', 'spec_digest']) || !Object.values(input.subject).every((value) => DIGEST.test(value || ''))) return false;
  if (!unique(input.acceptance_criteria, 'id') || !input.acceptance_criteria.every((item) => exact(item, ['id', 'evidence_class', 'minimum_evidence_level']) && ID.test(item.id || '') && EVIDENCE_CLASSES.includes(item.evidence_class) && LEVELS.includes(item.minimum_evidence_level))) return false;
  if (!unique(input.evidence, 'id') || !input.evidence.every((item) => exact(item, ['id', 'evidence_class', 'evidence_level', 'evidence_digest', 'subject_digest', 'environment_digest', 'observed_at', 'producer_actor', 'verifier_actor', 'provenance', 'status']) && ID.test(item.id || '') && EVIDENCE_CLASSES.includes(item.evidence_class) && LEVELS.includes(item.evidence_level) && DIGEST.test(item.evidence_digest || '') && DIGEST.test(item.subject_digest || '') && (item.environment_digest === null || DIGEST.test(item.environment_digest || '')) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(item.observed_at || '') && ID.test(item.producer_actor || '') && ID.test(item.verifier_actor || '') && PROVENANCE.includes(item.provenance) && ['pass', 'fail'].includes(item.status))) return false;
  return Array.isArray(input.defects) && input.defects.length <= 256 && new Set(input.defects.map((item) => item?.id)).size === input.defects.length && input.defects.every((item) => exact(item, ['id', 'severity', 'status', 'subject_digest']) && ID.test(item.id || '') && ['low', 'medium', 'high', 'critical'].includes(item.severity) && ['open', 'resolved'].includes(item.status) && DIGEST.test(item.subject_digest || ''));
}

/** Derive delivery evidence from assurance and criteria; this shadow evaluator never grants acceptance. */
export function evaluateDeliveryEvidence(input = {}) {
  if (!valid(input)) return result('fail', 'DELIVERY_SCHEMA_INVALID', 'delivery input does not match strict v1 schema', input, [], [], 'supply exact subject-bound acceptance, evidence, defect, and rework fields');
  const required = [...new Set([...REQUIRED[input.assurance], ...input.acceptance_criteria.map(({ evidence_class }) => evidence_class)])].sort();
  const stale = input.evidence.find(({ subject_digest }) => subject_digest !== input.subject.candidate_digest);
  if (stale) return result('blocked', 'DELIVERY_EVIDENCE_STALE', `evidence ${stale.id} is not bound to the current candidate`, input, required, [], 'rerun evidence against the current candidate digest');
  const openDefect = input.defects.find(({ status }) => status === 'open');
  if (openDefect) return result('rework', 'DELIVERY_REWORK_REQUIRED', `defect ${openDefect.id} remains open`, input, required, [], 'resolve the defect, increment rework_iteration, and regenerate candidate-bound evidence');
  const passing = input.evidence.filter(({ status }) => status === 'pass');
  const missing = required.filter((kind) => !passing.some(({ evidence_class }) => evidence_class === kind));
  if (missing.length) return result('blocked', 'DELIVERY_EVIDENCE_MISSING', 'required assurance or acceptance evidence is missing', input, required, missing, 'produce every missing evidence class against the current candidate');
  for (const evidenceClass of required) {
    const criterionFloor = input.acceptance_criteria.filter(({ evidence_class }) => evidence_class === evidenceClass).map(({ minimum_evidence_level }) => LEVELS.indexOf(minimum_evidence_level));
    let floor = Math.max(LEVELS.indexOf(EVIDENCE_FLOOR[evidenceClass]), ...criterionFloor);
    if (evidenceClass === 'review' && ['A2', 'A3'].includes(input.assurance)) floor = Math.max(floor, LEVELS.indexOf('E4'));
    if (evidenceClass === 'rollback' && input.assurance === 'A3') floor = Math.max(floor, LEVELS.indexOf('E5'));
    const proof = passing.find(({ evidence_class }) => evidence_class === evidenceClass);
    if (LEVELS.indexOf(proof.evidence_level) < floor || (LEVELS.indexOf(proof.evidence_level) >= LEVELS.indexOf('E5') && !proof.environment_digest)) return result('blocked', 'DELIVERY_EVIDENCE_LEVEL_INSUFFICIENT', `${proof.id} cannot support ${LEVELS[floor]} ${evidenceClass} claim`, input, required, [], 'raise evidence maturity and bind E5/E6 proof to the observed environment');
  }
  if (['A2', 'A3'].includes(input.assurance)) {
    const weak = passing.find(({ evidence_class, provenance }) => required.includes(evidence_class) && provenance === 'self-reported');
    if (weak) return result('blocked', 'DELIVERY_EVIDENCE_WEAK', `required evidence ${weak.id} is self-reported`, input, required, [], 'use tool, independent, or external attestation appropriate to the evidence class');
    const selfVerified = passing.find(({ evidence_class, producer_actor, verifier_actor }) => required.includes(evidence_class) && producer_actor === verifier_actor);
    if (selfVerified) return result('blocked', 'DELIVERY_VERIFIER_NOT_INDEPENDENT', `required evidence ${selfVerified.id} is self-verified`, input, required, [], 'assign a distinct verifier and issue new evidence');
  }
  return result('pass', 'DELIVERY_VALID', 'all assurance-derived and criterion-specific evidence is present for the current candidate', input, required, [], 'submit the frozen verifier packet to the role-authorized lifecycle transition');
}
