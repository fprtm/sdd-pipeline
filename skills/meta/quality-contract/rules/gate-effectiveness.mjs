const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const DATE = /^\d{4}-\d\d-\d\d$/;
function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function bounded(value) { return typeof value === 'string' && value.length > 0 && Buffer.byteLength(value, 'utf8') <= 4096 && value === value.normalize('NFC'); }
function result(status, code, cause, decisions = []) { return Object.freeze({ status, code, cause, risk: 'medium', owner: 'governance', decisions: Object.freeze(decisions) }); }
function validGate(gate) {
  if (!exact(gate, ['gate_id', 'risk_prevented', 'trigger', 'owner', 'required_evidence', 'decision_outputs', 'skip_when', 'skip_authority', 'estimated_cost', 'observed_findings', 'invocations', 'false_positives', 'false_positive_rate', 'duplicate_of', 'review_or_expiry_date', 'decision'])) return false;
  if (![gate.gate_id, gate.owner, gate.skip_authority].every((value) => ID.test(value || '')) || ![gate.risk_prevented, gate.trigger, gate.required_evidence, gate.skip_when, gate.estimated_cost].every(bounded) || !DATE.test(gate.review_or_expiry_date || '')) return false;
  if (!Array.isArray(gate.decision_outputs) || gate.decision_outputs.length === 0 || gate.decision_outputs.length > 32 || new Set(gate.decision_outputs).size !== gate.decision_outputs.length || !gate.decision_outputs.every((value) => ID.test(value || ''))) return false;
  if (![gate.observed_findings, gate.invocations, gate.false_positives].every((value) => Number.isInteger(value) && value >= 0) || gate.false_positives > gate.invocations || !Number.isFinite(gate.false_positive_rate) || gate.false_positive_rate < 0 || gate.false_positive_rate > 1 || (gate.duplicate_of !== null && !ID.test(gate.duplicate_of || '')) || !['keep', 'remove', 'revise'].includes(gate.decision)) return false;
  const expectedRate = gate.invocations === 0 ? 0 : gate.false_positives / gate.invocations;
  return Math.abs(gate.false_positive_rate - expectedRate) <= Number.EPSILON;
}

/** Review gate value and cost without granting workflow or release authority. */
export function evaluateGateEffectiveness(input = {}) {
  if (!exact(input, ['effectiveness_version', 'gates']) || input.effectiveness_version !== '2' || !Array.isArray(input.gates) || input.gates.length === 0 || new Set(input.gates.map(({ gate_id }) => gate_id)).size !== input.gates.length || !input.gates.every(validGate)) return result('fail', 'GATE_EFFECTIVENESS_SCHEMA_INVALID', 'gate inventory lacks the complete risk/trigger/evidence/output/skip/authority/cost/finding/rate/review contract');
  const ids = new Set(input.gates.map(({ gate_id }) => gate_id)); const decisions = [];
  for (const gate of input.gates) {
    if (gate.duplicate_of && (!ids.has(gate.duplicate_of) || gate.duplicate_of === gate.gate_id)) return result('fail', 'GATE_EFFECTIVENESS_SCHEMA_INVALID', `${gate.gate_id} references an unknown or self duplicate owner`);
    const enoughObservations = gate.invocations >= 10;
    const expected = gate.duplicate_of || (enoughObservations && gate.observed_findings === 0 && gate.false_positive_rate >= .2)
      ? 'remove'
      : enoughObservations && gate.observed_findings > 0 && gate.false_positive_rate >= .2
        ? 'revise'
        : 'keep';
    if (gate.decision !== expected) return result('blocked', 'GATE_EFFECTIVENESS_DECISION_MISMATCH', `${gate.gate_id} evidence supports ${expected}, not ${gate.decision}`);
    decisions.push(Object.freeze({ gate_id: gate.gate_id, decision: expected, evidence_basis: gate.duplicate_of ? `duplicate:${gate.duplicate_of}` : `${gate.observed_findings}/${gate.invocations} findings; ${gate.false_positives}/${gate.invocations} false positives`, review_or_expiry_date: gate.review_or_expiry_date }));
  }
  return result('pass', 'GATE_EFFECTIVENESS_VALID', 'every gate has a complete contract and evidence-backed keep/remove/revise decision', decisions);
}
