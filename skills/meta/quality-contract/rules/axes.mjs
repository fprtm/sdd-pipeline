const DIGEST = /^sha256:[0-9a-f]{64}$/;
const COMPLEXITY = ['micro', 'small', 'medium', 'large'];
const RISK = ['low', 'moderate', 'high', 'critical', 'unknown'];
const ASSURANCE = ['A0', 'A1', 'A2', 'A3'];
const CEREMONY = ['prototype', 'vibe', 'standard', 'strict', 'emergency'];
const CEREMONY_SOURCE = ['explicit-user', 'project-config', 'default', 'incident-signal'];
const HARD_STOP_STATUS = ['pass', 'fail', 'unknown'];
const DIMENSIONS = Object.freeze({
  user_harm: ['none', 'bounded', 'material', 'severe', 'unknown'],
  money: ['none', 'bounded', 'material', 'regulated', 'unknown'],
  privacy: ['none', 'internal', 'personal', 'sensitive', 'unknown'],
  authorization: ['none', 'adjacent', 'enforcement', 'privileged', 'unknown'],
  availability: ['none', 'noncritical', 'customer', 'critical', 'unknown'],
  data_change: ['reversible', 'recoverable', 'destructive', 'irreversible', 'unknown'],
  compliance: ['none', 'contractual', 'regulated', 'safety', 'unknown'],
});
const CRITICAL = new Set(['severe', 'regulated', 'sensitive', 'privileged', 'critical', 'irreversible', 'safety']);
const HIGH = new Set(['material', 'personal', 'enforcement', 'customer', 'destructive', 'contractual']);
const MODERATE = new Set(['bounded', 'internal', 'adjacent', 'noncritical', 'recoverable']);
const RISK_RANK = new Map([['low', 0], ['moderate', 1], ['high', 2], ['critical', 3]]);
const ASSURANCE_RANK = new Map(ASSURANCE.map((value, index) => [value, index]));

function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function boundedStrings(value) { return Array.isArray(value) && value.length > 0 && value.length <= 32 && value.every((item) => typeof item === 'string' && item.length > 0 && Buffer.byteLength(item, 'utf8') <= 4096 && item === item.normalize('NFC')); }
function finding(status, code, cause, owner, remediation) { return Object.freeze({ status, code, cause, risk: 'high', owner, remediation }); }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }

function schemaValid(input) {
  if (!exact(input, ['axis_schema_version', 'subject_digest', 'complexity', 'risk', 'requested_assurance', 'ceremony', 'hard_stops', 'policy_version'])) return false;
  if (input.axis_schema_version !== '1' || input.policy_version !== 'vnext-shadow-1' || !DIGEST.test(input.subject_digest || '')) return false;
  if (!exact(input.complexity, ['level', 'basis']) || !COMPLEXITY.includes(input.complexity.level) || !boundedStrings(input.complexity.basis)) return false;
  if (!exact(input.risk, ['level', 'dimensions', 'basis']) || !RISK.includes(input.risk.level) || !boundedStrings(input.risk.basis) || !exact(input.risk.dimensions, Object.keys(DIMENSIONS))) return false;
  for (const [name, allowed] of Object.entries(DIMENSIONS)) if (!allowed.includes(input.risk.dimensions[name])) return false;
  if (!ASSURANCE.includes(input.requested_assurance) || !exact(input.ceremony, ['mode', 'source']) || !CEREMONY.includes(input.ceremony.mode) || !CEREMONY_SOURCE.includes(input.ceremony.source)) return false;
  if (!Array.isArray(input.hard_stops) || input.hard_stops.length > 64) return false;
  const ids = new Set();
  for (const stop of input.hard_stops) {
    if (!exact(stop, ['id', 'status']) || typeof stop.id !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(stop.id) || !HARD_STOP_STATUS.includes(stop.status) || ids.has(stop.id)) return false;
    ids.add(stop.id);
  }
  return true;
}

function computedRisk(dimensions) {
  const values = Object.values(dimensions);
  if (values.some((value) => CRITICAL.has(value))) return 'critical';
  if (values.some((value) => HIGH.has(value))) return 'high';
  if (values.includes('unknown')) return 'unknown';
  if (values.some((value) => MODERATE.has(value))) return 'moderate';
  return 'low';
}

function assuranceFloor(risk, complexity) {
  if (risk === 'critical') return 'A3';
  if (risk === 'high' || risk === 'unknown') return 'A2';
  if (risk === 'moderate') return 'A1';
  return complexity === 'micro' ? 'A0' : 'A1';
}

/** Pure report-only evaluator. It cannot dispatch or accept work. */
export function evaluateControlAxes(input = {}) {
  if (!schemaValid(input)) return freeze({
    axis_result_version: '1', subject_digest: DIGEST.test(input?.subject_digest || '') ? input.subject_digest : null, status: 'fail', effective: null,
    dimensions: { schema: finding('fail', 'AXES_SCHEMA_INVALID', 'axis input does not match the strict v1 shadow schema', 'axis-evaluator', 'supply every allowlisted field with a valid bounded value') },
    shadow: { enforcement: 'report-only', may_dispatch: false, may_accept: false },
  });

  const floor = computedRisk(input.risk.dimensions);
  const declared = input.risk.level;
  const declaredRank = RISK_RANK.get(declared);
  const floorRank = RISK_RANK.get(floor);
  const riskUnknown = floor === 'unknown' && declared !== 'critical';
  const riskDemoted = floor !== 'unknown' && declared !== 'unknown' && declaredRank < floorRank;
  const effectiveRisk = riskUnknown ? 'unknown' : declared === 'unknown' ? floor : (declaredRank >= floorRank ? declared : floor);
  const minimumAssurance = assuranceFloor(effectiveRisk, input.complexity.level);
  const assuranceDemoted = ASSURANCE_RANK.get(input.requested_assurance) < ASSURANCE_RANK.get(minimumAssurance);
  const failedStop = input.hard_stops.find(({ status }) => status === 'fail');
  const unknownStop = input.hard_stops.find(({ status }) => status === 'unknown');

  const dimensions = {
    schema: finding('pass', 'AXES_VALID', 'axis input matches the strict v1 shadow schema', 'axis-evaluator', 'retain the bound schema and subject'),
    hard_stops: failedStop
      ? finding('fail', 'HARD_STOP_FAILED', `${failedStop.id} failed`, 'global-policy', 'satisfy the hard stop before any forward transition')
      : unknownStop
        ? finding('unknown', 'HARD_STOP_UNKNOWN', `${unknownStop.id} is unresolved`, 'global-policy', 'resolve the hard stop; unknown never lowers safety')
        : finding('pass', 'HARD_STOPS_VALID', 'all declared hard stops pass', 'global-policy', 'retain hard-stop evidence'),
    risk_floor: riskDemoted
      ? finding('fail', 'RISK_BELOW_FLOOR', `declared ${declared} is below computed ${floor}`, 'axis-evaluator', 'raise risk to the computed floor')
      : riskUnknown
        ? finding('unknown', 'RISK_UNKNOWN', 'risk contains an unresolved impact dimension', 'axis-evaluator', 'resolve the unknown dimension before enforced acceptance')
        : finding('pass', floor === declared ? 'RISK_FLOOR_VALID' : 'RISK_PROMOTED', `effective risk is ${effectiveRisk}`, 'axis-evaluator', 'retain or raise the effective risk'),
    assurance_floor: assuranceDemoted
      ? finding('fail', 'ASSURANCE_BELOW_FLOOR', `${input.requested_assurance} is below ${minimumAssurance}`, 'axis-evaluator', 'raise requested assurance to the policy floor')
      : finding('pass', 'ASSURANCE_FLOOR_VALID', `effective assurance is ${input.requested_assurance}`, 'axis-evaluator', 'retain or raise assurance'),
  };
  const status = failedStop || assuranceDemoted || riskDemoted ? 'blocked' : unknownStop || riskUnknown ? 'unknown' : 'pass';
  return freeze({
    axis_result_version: '1', subject_digest: input.subject_digest, status,
    effective: { complexity: input.complexity.level, risk: effectiveRisk, assurance: assuranceDemoted ? minimumAssurance : input.requested_assurance, ceremony: input.ceremony.mode },
    dimensions, shadow: { enforcement: 'report-only', may_dispatch: false, may_accept: false },
  });
}
