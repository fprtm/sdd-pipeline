const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const STAGES = ['problem-fit', 'solution-fit'];
const OUTCOMES = ['supports', 'contradicts', 'inconclusive'];
const DECISIONS = ['proceed', 'revise', 'reject'];
const ASSUMPTION_STATUS = ['open', 'supported', 'invalidated'];

function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function bounded(value) { return typeof value === 'string' && value.length > 0 && Buffer.byteLength(value, 'utf8') <= 4096 && value === value.normalize('NFC'); }
function unique(value, key) { return Array.isArray(value) && value.length > 0 && value.length <= 256 && new Set(value.map((item) => item?.[key])).size === value.length; }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function result(status, code, cause, decision, next_state, remediation) { return freeze({ status, code, cause, risk: 'medium', owner: 'product-validation', remediation, decision, next_state, may_build: false }); }

function valid(input) {
  if (!exact(input, ['product_validation_version', 'subject_digest', 'stage', 'product_context', 'problem_evidence', 'assumptions', 'hypothesis', 'rejected_alternatives', 'observation', 'decision'])) return false;
  if (input.product_validation_version !== '1' || !DIGEST.test(input.subject_digest || '') || !STAGES.includes(input.stage)) return false;
  if (!exact(input.product_context, ['target_user_job', 'current_workaround', 'frequency_or_severity', 'cost_of_doing_nothing', 'opportunity_cost']) || !Object.values(input.product_context).every(bounded)) return false;
  if (!unique(input.problem_evidence, 'id') || !input.problem_evidence.every((item) => exact(item, ['id', 'source_digest', 'method', 'limitation']) && ID.test(item.id || '') && DIGEST.test(item.source_digest || '') && bounded(item.method) && bounded(item.limitation))) return false;
  if (!Array.isArray(input.assumptions) || input.assumptions.length > 256 || new Set(input.assumptions.map((item) => item?.id)).size !== input.assumptions.length || !input.assumptions.every((item) => exact(item, ['id', 'statement', 'material', 'status', 'evidence_digest']) && ID.test(item.id || '') && bounded(item.statement) && typeof item.material === 'boolean' && ASSUMPTION_STATUS.includes(item.status) && (item.evidence_digest === null || DIGEST.test(item.evidence_digest || '')))) return false;
  if (!exact(input.hypothesis, ['target_behavior', 'success_threshold', 'failure_threshold', 'kill_threshold', 'sample_rule', 'protocol_digest']) || ![input.hypothesis.target_behavior, input.hypothesis.success_threshold, input.hypothesis.failure_threshold, input.hypothesis.kill_threshold, input.hypothesis.sample_rule].every(bounded) || !DIGEST.test(input.hypothesis.protocol_digest || '')) return false;
  if (!Array.isArray(input.rejected_alternatives) || input.rejected_alternatives.length > 64 || new Set(input.rejected_alternatives).size !== input.rejected_alternatives.length || !input.rejected_alternatives.every(bounded)) return false;
  if (!exact(input.observation, ['outcome', 'sample_size', 'evidence_digest', 'observed_at']) || !OUTCOMES.includes(input.observation.outcome) || !Number.isInteger(input.observation.sample_size) || input.observation.sample_size < 0 || !DIGEST.test(input.observation.evidence_digest || '') || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(input.observation.observed_at || '')) return false;
  return exact(input.decision, ['value', 'role_id', 'decision_digest']) && DECISIONS.includes(input.decision.value) && input.decision.role_id === 'product-owner' && DIGEST.test(input.decision.decision_digest || '');
}

/** Evaluate a frozen product hypothesis; rejection and revision are valid outcomes. */
export function evaluateProductDecision(input = {}) {
  if (!valid(input)) return result('fail', 'PRODUCT_SCHEMA_INVALID', 'product validation input does not match strict v1 schema', null, null, 'supply bounded evidence, assumptions, frozen hypothesis, observation, and product-owner decision');
  const invalidated = input.assumptions.find(({ material, status }) => material && status === 'invalidated');
  const open = input.assumptions.find(({ material, status }) => material && status === 'open');
  const expected = invalidated || input.observation.outcome === 'contradicts' ? 'reject' : open || input.observation.outcome === 'inconclusive' ? 'revise' : 'proceed';
  if (input.decision.value !== expected) return result('blocked', 'PRODUCT_DECISION_MISMATCH', `frozen evidence requires ${expected}, not ${input.decision.value}`, expected, input.stage, 'record the evidence-consistent product-owner decision or create a new hypothesis revision before new results');
  if (expected === 'reject') return result('pass', 'PRODUCT_REJECTED', 'material assumption or frozen failure threshold invalidated the idea', 'reject', 'rejected', 'retain the rejected attempt in benchmark and decision accounting');
  if (expected === 'revise') return result('pass', 'PRODUCT_REVISION_REQUIRED', 'material uncertainty remains under the frozen decision rule', 'revise', input.stage === 'problem-fit' ? 'discovering' : 'validating', 'revise the hypothesis without rewriting the observed result');
  return result('pass', 'PRODUCT_PROCEED', 'frozen evidence supports the hypothesis with no open material assumption', 'proceed', input.stage, 'issue the corresponding role-authorized lifecycle transition');
}
