const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function bounded(value) { return typeof value === 'string' && value.length > 0 && Buffer.byteLength(value, 'utf8') <= 4096 && value === value.normalize('NFC'); }
function ids(value) { return Array.isArray(value) && value.length > 0 && value.length <= 64 && new Set(value).size === value.length && value.every((item) => ID.test(item || '')); }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function result(status, code, cause, expected, input, remediation) { return freeze({ status, code, cause, risk: input?.urgency === 'emergency' ? 'critical' : 'medium', owner: 'product-intake', remediation, expected_decision: expected, emergency_route: input?.urgency === 'emergency', may_discover: false }); }
function valid(input) {
  return exact(input, ['intake_version', 'intake_id', 'source', 'problem_statement', 'requested_solution', 'owner_role', 'affected_users', 'affected_surfaces', 'urgency', 'evidence_strength', 'risk_hints', 'duplicate_candidates', 'decision'])
    && input.intake_version === '1' && ID.test(input.intake_id || '')
    && exact(input.source, ['type', 'evidence_digest']) && ['request', 'incident', 'customer-evidence', 'compliance', 'tech-debt', 'experiment'].includes(input.source.type) && DIGEST.test(input.source.evidence_digest || '')
    && bounded(input.problem_statement) && (input.requested_solution === null || bounded(input.requested_solution))
    && ['product-owner', 'service-owner'].includes(input.owner_role) && bounded(input.affected_users) && ids(input.affected_surfaces)
    && ['normal', 'emergency'].includes(input.urgency) && ['assertion', 'static', 'executed', 'field'].includes(input.evidence_strength)
    && Array.isArray(input.risk_hints) && input.risk_hints.length <= 32 && input.risk_hints.every(bounded)
    && Array.isArray(input.duplicate_candidates) && input.duplicate_candidates.length <= 32 && new Set(input.duplicate_candidates).size === input.duplicate_candidates.length && input.duplicate_candidates.every((item) => ID.test(item || ''))
    && exact(input.decision, ['value', 'role_id']) && ['valid', 'clarify'].includes(input.decision.value) && input.decision.role_id === input.owner_role;
}

/** Normalize intake without allowing a requested solution to masquerade as the problem. */
export function evaluateIntake(input = {}) {
  if (!valid(input)) return result('fail', 'INTAKE_SCHEMA_INVALID', 'intake does not match strict v1 schema or lacks an evidence pointer', null, input, 'supply bounded source, problem, owner, affected surface, urgency, risk hints, and owner decision');
  const solutionAsProblem = input.requested_solution && input.problem_statement.trim().toLocaleLowerCase() === input.requested_solution.trim().toLocaleLowerCase();
  const expected = solutionAsProblem || input.duplicate_candidates.length ? 'clarify' : 'valid';
  if (input.decision.value !== expected) return result('blocked', 'INTAKE_DECISION_MISMATCH', solutionAsProblem ? 'problem statement merely repeats the requested solution' : 'duplicate candidates require clarification before discovery', expected, input, 'separate problem from solution and reconcile duplicate work');
  if (expected === 'clarify') return result('pass', 'INTAKE_CLARIFICATION_REQUIRED', 'intake is preserved but cannot advance until ambiguity is resolved', expected, input, 'return to the accountable owner with the duplicate/problem clarification');
  return result('pass', 'INTAKE_VALID', 'source-bound problem, owner, affected surface, urgency, and risk hints are explicit', expected, input, 'issue the role-authorized intake-valid lifecycle event');
}
