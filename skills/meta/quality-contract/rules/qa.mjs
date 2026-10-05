const TECHNIQUES = Object.freeze(['mutation', 'property', 'state', 'contract', 'differential', 'fault', 'concurrency']);
const STATES = ['not-required', 'skipped', 'blocked', 'fail', 'pass'];
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function output(status, code, cause, techniques, remediation) {
  const residual = techniques.filter(({ status: state }) => state !== 'pass' && state !== 'not-required').map(({ technique, status: state }) => ({ technique, status: state }));
  return freeze({ status, code, cause, risk: residual.length ? 'high' : 'medium', owner: 'qa-verifier', remediation, technique_results: structuredClone(techniques), residual_risk: residual, coverage_is_correctness_claim: false, may_accept: false });
}
function valid(input) {
  if (!exact(input, ['qa_profile_version', 'profile_id', 'risk_matrix_digest', 'condition_matrix_digest', 'oracle_review_digest', 'exploratory_charter_digest', 'flaky_assessment_digest', 'coverage_status', 'oracle_assertions', 'techniques'])) return false;
  if (input.qa_profile_version !== '1' || !ID.test(input.profile_id || '') || !['pass', 'fail', 'skipped'].includes(input.coverage_status) || !Number.isInteger(input.oracle_assertions) || input.oracle_assertions < 0) return false;
  if (![input.risk_matrix_digest, input.condition_matrix_digest, input.oracle_review_digest, input.exploratory_charter_digest, input.flaky_assessment_digest].every((value) => DIGEST.test(value || ''))) return false;
  return Array.isArray(input.techniques) && input.techniques.length === TECHNIQUES.length && new Set(input.techniques.map(({ technique }) => technique)).size === TECHNIQUES.length && TECHNIQUES.every((name) => input.techniques.some(({ technique }) => technique === name)) && input.techniques.every((item) => exact(item, ['technique', 'applicable', 'required', 'tool_available', 'status', 'seeded_faults', 'caught_faults']) && TECHNIQUES.includes(item.technique) && typeof item.applicable === 'boolean' && typeof item.required === 'boolean' && typeof item.tool_available === 'boolean' && STATES.includes(item.status) && Number.isInteger(item.seeded_faults) && item.seeded_faults >= 0 && Number.isInteger(item.caught_faults) && item.caught_faults >= 0 && item.caught_faults <= item.seeded_faults);
}

/** Evaluate behavioral QA technique semantics without treating coverage as correctness. */
export function evaluateQaProfile(input = {}) {
  if (!valid(input)) return output('fail', 'QA_SCHEMA_INVALID', 'QA profile does not match strict v1 schema', [], 'supply every named technique with explicit applicability, availability, status, and seeded-fault counts');
  for (const item of input.techniques) {
    if (!item.applicable && (item.required || item.status !== 'not-required')) return output('fail', 'QA_STATUS_INVALID', `${item.technique} is inapplicable but not recorded as not-required`, input.techniques, 'record inapplicable techniques as not-required and required=false');
    if (item.applicable && !item.tool_available) {
      if (item.required) return output('blocked', 'QA_REQUIRED_TOOL_UNAVAILABLE', `${item.technique} is required but its tool is unavailable${item.status === 'blocked' ? '' : ` and was incorrectly recorded as ${item.status}`}`, input.techniques, 'record BLOCKED and install or provide the required capability');
      if (!item.required && item.status !== 'skipped') return output('fail', 'QA_STATUS_INVALID', `${item.technique} is optional and unavailable but not recorded as skipped`, input.techniques, 'record unavailable optional technique as skipped');
    }
    if (item.applicable && item.tool_available && item.status !== 'pass' && item.status !== 'fail') return output('fail', 'QA_STATUS_INVALID', `${item.technique} is available but has no executed verdict`, input.techniques, 'execute the technique and record pass or fail');
    if (item.applicable && item.tool_available && item.seeded_faults === 0) return output('fail', 'QA_SEEDED_FAULT_MISSING', `${item.technique} has no seeded faulty implementation`, input.techniques, 'add at least one relevant seeded fault and demonstrate the oracle against it');
    if (item.applicable && item.tool_available && (item.status === 'fail' || item.caught_faults < item.seeded_faults)) return output('fail', 'QA_ORACLE_WEAK', `${item.technique} caught ${item.caught_faults}/${item.seeded_faults} seeded faults`, input.techniques, 'strengthen the oracle or state the uncovered behavior as blocking residual risk');
  }
  if (input.coverage_status !== 'pass') return output('fail', 'QA_COVERAGE_GATE_FAILED', 'coverage remains a required gate but is not proof of correctness', input.techniques, 'repair or execute the coverage gate independently of behavioral techniques');
  if (input.oracle_assertions === 0) return output('fail', 'QA_ORACLE_WEAK', 'no behavioral oracle assertion was recorded', input.techniques, 'add assertions that distinguish correct from seeded-fault behavior');
  return output('pass', 'QA_PROFILE_VALID', 'coverage gate and applicable behavioral techniques passed their explicit oracles', input.techniques, 'preserve residual skipped/not-required techniques in the verifier report');
}

export { TECHNIQUES as QA_TECHNIQUES };
