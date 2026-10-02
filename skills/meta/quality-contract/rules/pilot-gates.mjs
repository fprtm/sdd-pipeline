/** Read-only compatibility, lifecycle, and externally attested pilot gates. */
import { createHash } from 'node:crypto';
import { canonicalJson } from '../parser.mjs';

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const STATES = new Set(['allowed', 'deprecated', 'revoked']);
const COMPONENTS = ['schema', 'rules', 'evidence', 'adapter', 'policy'];
const OPERATIONS = new Set(['report', 'start', 'finish', 'accept']);
const METRICS = ['persistent_artifacts', 'active_work_artifacts', 'entry_documents', 'duplicated_authority', 'contract_projection_tokens', 'contract_projection_token_ratio', 'repeated_prose', 'responsibility_count', 'retrieval_time_ms', 'authoring_p50_ms', 'authoring_p90_ms', 'review_p50_ms', 'review_p90_ms', 'retrieval_p50_ms', 'retrieval_p90_ms'];
const FROZEN_PLAN_FIELDS = ['sampling', 'assignments', 'fixtures', 'rubric', 'formulas', 'missing_data', 'severity', 'stop_rules', 'segment_rules'];
const VERIFIED_PLANS = new WeakSet();
const VERIFIED_MEASUREMENTS = new WeakSet();
const MAX_ENVELOPE_BYTES = 256 * 1024;
const MAX_ENVELOPE_DEPTH = 32;
const MAX_ARRAY_ITEMS = 256;

function finding(status, code, cause, remediation = 'repair the externally attested rollout input') { return { status, code, cause, risk: 'high', owner: 'quality-contract-pilot', remediation }; }
function isObject(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function finiteNonNegative(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
function utc(value) { return typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value) && Number.isFinite(Date.parse(value)); }
function compatibleVersion(value) { return typeof value === 'string' && /^[A-Za-z0-9._-]{1,64}$/.test(value); }
function exactKeys(value, keys) { return isObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function pilotJson(value, state = { seen: new Set(), depth: 0 }) {
  if (state.depth > MAX_ENVELOPE_DEPTH) throw new TypeError('pilot envelope exceeds depth limit');
  if (value === null) return 'null';
  if (typeof value === 'string') {
    if (Buffer.byteLength(value, 'utf8') > 4096 || value !== value.normalize('NFC')) throw new TypeError('pilot envelope contains an invalid string');
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS || state.seen.has(value)) throw new TypeError('pilot envelope contains an invalid array');
    state.seen.add(value); const next = { ...state, depth: state.depth + 1 };
    const out = `[${value.map((item) => pilotJson(item, next)).join(',')}]`; state.seen.delete(value); return out;
  }
  if (isObject(value)) {
    if (state.seen.has(value) || Object.keys(value).length > 32) throw new TypeError('pilot envelope contains an invalid object');
    state.seen.add(value); const next = { ...state, depth: state.depth + 1 };
    const out = `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key.normalize('NFC'))}:${pilotJson(value[key], next)}`).join(',')}}`; state.seen.delete(value); return out;
  }
  throw new TypeError('pilot envelope contains an invalid value');
}
function pilotDigest(value) { const serialized = pilotJson(value); if (Buffer.byteLength(serialized, 'utf8') > MAX_ENVELOPE_BYTES) throw new TypeError('pilot envelope exceeds byte limit'); return `sha256:${createHash('sha256').update(serialized, 'utf8').digest('hex')}`; }
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function evaluateCompatibility(input = {}, policy = {}) {
  if (!isObject(input) || !isObject(policy) || !isObject(policy.components) || !OPERATIONS.has(input.operation)) return finding('fail', 'VERSION_UNSUPPORTED', 'compatibility input or frozen policy is malformed');
  if (input.legacy === true) return input.operation === 'report'
    ? { ...finding('pass', 'VERSION_SUPPORTED', 'legacy input is explicitly limited to read-only reporting'), mode: 'report-only', may_execute: false, may_accept: false }
    : { ...finding('fail', 'VERSION_UNSUPPORTED', 'legacy input is report-only until an explicit migration'), mode: 'report-only', may_execute: false, may_accept: false };
  if (!isObject(input.versions) || !utc(input.now)) return finding('fail', 'VERSION_UNSUPPORTED', 'versions and trusted evaluation time are required');
  let deprecated = false;
  for (const component of COMPONENTS) {
    const version = input.versions[component]; const entries = policy.components[component];
    if (!compatibleVersion(version) || !isObject(entries) || !isObject(entries[version])) return finding('fail', 'VERSION_UNSUPPORTED', `${component} version is unknown`);
    const entry = entries[version];
    if (!STATES.has(entry.state) || entry.state === 'revoked') return finding('fail', 'VERSION_UNSUPPORTED', `${component} version is revoked or invalid`);
    if (entry.state === 'deprecated') {
      deprecated = true;
      if (!utc(entry.sunset_at) || Date.parse(input.now) >= Date.parse(entry.sunset_at) || input.operation !== 'finish') return finding('fail', 'VERSION_UNSUPPORTED', `${component} version is deprecated and cannot perform this operation`);
    }
  }
  return { ...finding('pass', 'VERSION_SUPPORTED', deprecated ? 'all pinned deprecated components may finish before sunset' : 'all pinned components are allowed'), mode: deprecated ? 'finish-only' : 'normal', may_execute: !deprecated && input.operation === 'start', may_accept: !deprecated && input.operation === 'accept' };
}

/** Decision-only retirement check; this module has no deletion capability. */
export function evaluateRetirement(input = {}) {
  if (!isObject(input) || input.git_available !== true || input.target_sealed !== true || !['projection', 'raw_evidence'].includes(input.target_kind)) return finding('fail', 'RETIRE_UNRECOVERABLE', 'retirement requires a sealed transient target in a trusted Git subject');
  if (!DIGEST.test(input.durable_outcome_digest || '')) return finding('fail', 'RETIRE_DURABLE_OUTCOME_MISSING', 'a durable accepted outcome digest is required');
  if (!Number.isInteger(input.live_dependency_count) || input.live_dependency_count !== 0) return finding('fail', 'RETIRE_LIVE_DEPENDENCY', 'live dependency count must be zero');
  if (input.recovery_verified !== true) return finding('fail', 'RETIRE_UNRECOVERABLE', 'recoverability has not been independently verified');
  if (input.sole_canonical_truth_or_evidence !== false) return finding('fail', 'RETIRE_CANONICAL_ONLY', 'sole canonical truth or evidence must be preserved');
  return finding('pass', 'RETIRE_READY', 'sealed transient target has durable outcome, no live dependency, recovery, and preserved canonical evidence', 'perform any retention action outside this read-only rule');
}

function completeMetrics(metrics) { return isObject(metrics) && METRICS.every((metric) => finiteNonNegative(metrics[metric])); }
function exactMetrics(metrics) { return exactKeys(metrics, METRICS) && completeMetrics(metrics); }
function tupleKey(tuple) {
  if (!exactKeys(tuple, ['repository', 'executor_class', 'risk', 'tier', 'security_fixture', 'work_size']) || !['small', 'medium', 'large'].includes(tuple.work_size) || !['low_cost', 'capable', 'specialist'].includes(tuple.executor_class) || !['low', 'medium', 'high'].includes(tuple.risk) || !['T1', 'T2', 'T3'].includes(tuple.tier) || typeof tuple.repository !== 'string' || typeof tuple.security_fixture !== 'string') return null;
  return canonicalJson({ repository: tuple.repository, executor_class: tuple.executor_class, risk: tuple.risk, tier: tuple.tier, security_fixture: tuple.security_fixture, work_size: tuple.work_size });
}
function validFrozenPlan(plan) {
  if (!exactKeys(plan, ['plan_version', 'frozen', 'calibration', 'unseen_validation', 'tuples', 'measurements_schema_digest']) || plan.plan_version !== '1' || !exactKeys(plan.frozen, FROZEN_PLAN_FIELDS) || !exactKeys(plan.calibration, ['cohort_digest', 'minimum_runs']) || !exactKeys(plan.unseen_validation, ['cohort_digest']) || !Array.isArray(plan.tuples) || plan.tuples.length === 0 || plan.tuples.length > MAX_ARRAY_ITEMS || !DIGEST.test(plan.measurements_schema_digest || '')) return false;
  if (!FROZEN_PLAN_FIELDS.every((field) => DIGEST.test(plan.frozen[field] || ''))) return false;
  if (!DIGEST.test(plan.calibration.cohort_digest || '') || !Number.isInteger(plan.calibration.minimum_runs) || plan.calibration.minimum_runs < 1 || !DIGEST.test(plan.unseen_validation.cohort_digest || '')) return false;
  const seen = new Set();
  for (const tuple of plan.tuples) { const key = tupleKey(tuple); if (!key || seen.has(key)) return false; seen.add(key); }
  return true;
}

/** External plan attestation binds registered tuples, cohorts, formulas, and measurement schema. */
export async function verifyFrozenPilotPlan(plan, adapter) {
  if (!validFrozenPlan(plan) || !adapter || adapter.kind !== 'external-pilot-plan-attestor-v1' || typeof adapter.verify !== 'function') throw new TypeError('externally verified frozen pilot plan is required');
  const plan_digest = pilotDigest(plan); let trusted;
  try { trusted = await adapter.verify({ plan_digest, plan: structuredClone(plan) }); } catch { throw new TypeError('pilot plan verification failed'); }
  if (!trusted || trusted.ok !== true || trusted.plan_digest !== plan_digest || !DIGEST.test(trusted.envelope_digest || '') || pilotJson(trusted.plan) !== pilotJson(plan)) throw new TypeError('pilot plan envelope is not bound to the exact frozen plan');
  const verified = deepFreeze({ plan: structuredClone(plan), plan_digest, envelope_digest: trusted.envelope_digest }); VERIFIED_PLANS.add(verified); return verified;
}

function cohortMap(cohort, expectedDigest, tupleCount) {
  if (!exactKeys(cohort, ['cohort_digest', 'segments']) || cohort.cohort_digest !== expectedDigest || !Array.isArray(cohort.segments) || cohort.segments.length !== tupleCount) return null;
  const byTuple = new Map();
  for (const segment of cohort.segments) {
    const tuple = isObject(segment) ? Object.fromEntries(Object.entries(segment).filter(([key]) => ['repository', 'executor_class', 'risk', 'tier', 'security_fixture', 'work_size'].includes(key))) : null;
    const key = tupleKey(tuple); if (!key || byTuple.has(key)) return null; byTuple.set(key, segment);
  }
  return byTuple;
}

/** External measurement attestation binds calibration and unseen evidence to one frozen plan. */
export async function verifyPilotMeasurements(verifiedPlan, measurements, adapter) {
  if (!VERIFIED_PLANS.has(verifiedPlan) || !exactKeys(measurements, ['measurement_version', 'plan_digest', 'calibration', 'unseen_validation']) || measurements.measurement_version !== '1' || measurements.plan_digest !== verifiedPlan.plan_digest || !adapter || adapter.kind !== 'external-pilot-measurement-attestor-v1' || typeof adapter.verify !== 'function') throw new TypeError('externally verified pilot measurements are required');
  if (!cohortMap(measurements.calibration, verifiedPlan.plan.calibration.cohort_digest, verifiedPlan.plan.tuples.length) || !cohortMap(measurements.unseen_validation, verifiedPlan.plan.unseen_validation.cohort_digest, verifiedPlan.plan.tuples.length)) throw new TypeError('pilot measurement cohorts are not bound to the frozen plan');
  const measurement_digest = pilotDigest(measurements); let trusted;
  try { trusted = await adapter.verify({ plan_digest: verifiedPlan.plan_digest, plan_envelope_digest: verifiedPlan.envelope_digest, measurement_digest, measurements: structuredClone(measurements) }); } catch { throw new TypeError('pilot measurement verification failed'); }
  if (!trusted || trusted.ok !== true || trusted.plan_digest !== verifiedPlan.plan_digest || trusted.measurement_digest !== measurement_digest || !DIGEST.test(trusted.envelope_digest || '')) throw new TypeError('pilot measurement envelope is not bound to the exact plan and measurement');
  const verified = deepFreeze({ plan_digest: verifiedPlan.plan_digest, measurement_digest, envelope_digest: trusted.envelope_digest, measurements: structuredClone(measurements) }); VERIFIED_MEASUREMENTS.add(verified); return verified;
}

function segmentGate(segment, tuple, minimumRuns) {
  const expected = ['repository', 'executor_class', 'risk', 'tier', 'security_fixture', 'work_size', 'eligible_runs', 'p1_count', 'baseline_p2_per_run', 'candidate_p2_per_run', 'baseline', 'candidate', 'archive_or_index_only_movement', 'mixed_responsibility_file'];
  if (!exactKeys(segment, expected) || tupleKey(Object.fromEntries(Object.entries(segment).filter(([key]) => ['repository', 'executor_class', 'risk', 'tier', 'security_fixture', 'work_size'].includes(key)))) !== tupleKey(tuple) || !Number.isInteger(segment.eligible_runs) || segment.eligible_runs < minimumRuns) return 'thin';
  if (!Number.isInteger(segment.p1_count) || segment.p1_count !== 0) return 'p1';
  if (!finiteNonNegative(segment.baseline_p2_per_run) || !finiteNonNegative(segment.candidate_p2_per_run) || segment.candidate_p2_per_run > segment.baseline_p2_per_run) return 'p2';
  if (!exactMetrics(segment.baseline) || !exactMetrics(segment.candidate)) return 'metrics-missing';
  if ((tuple.work_size === 'small' || tuple.work_size === 'medium') && (segment.candidate.active_work_artifacts > 1 || segment.candidate.duplicated_authority !== 0 || segment.candidate.entry_documents > 3)) return 'caps';
  for (const metric of METRICS) if (segment.candidate[metric] > segment.baseline[metric]) return `regression:${metric}`;
  if (segment.archive_or_index_only_movement === true) return 'archive-index-only';
  if (segment.mixed_responsibility_file === true) return 'mixed-responsibility';
  return 'pass';
}

/** No aggregate exists: both calibrated and unseen cohorts gate each canonical tuple. */
export function evaluatePilotGates(input = {}) {
  const plan = input?.verified_plan; const measurement = input?.verified_measurements;
  const scoped = (value) => ({ ...value, authority_scope: 'quality-contract-v1-artifact-efficiency', may_promote_vnext: false });
  if (!VERIFIED_PLANS.has(plan) || !VERIFIED_MEASUREMENTS.has(measurement) || measurement.plan_digest !== plan.plan_digest || pilotDigest(plan.plan) !== plan.plan_digest || pilotDigest(measurement.measurements) !== measurement.measurement_digest) return scoped(finding('blocked', 'VERSION_UNSUPPORTED', 'externally verified frozen plan and measurements are required'));
  const segment_results = [];
  for (const [name, cohortPlan] of [['calibration', plan.plan.calibration], ['unseen_validation', plan.plan.unseen_validation]]) {
    const map = cohortMap(measurement.measurements[name], cohortPlan.cohort_digest, plan.plan.tuples.length);
    if (!map) return scoped(finding('blocked', 'VERSION_UNSUPPORTED', `${name} is not bound to every canonical tuple`));
    for (const tuple of plan.plan.tuples) {
      const result = segmentGate(map.get(tupleKey(tuple)), tuple, name === 'unseen_validation' ? 1 : cohortPlan.minimum_runs);
      segment_results.push({ cohort: name, tuple: tupleKey(tuple), result });
    }
  }
  const failed = segment_results.find(({ result }) => result !== 'pass');
  return scoped(failed ? { ...finding('blocked', 'VERSION_UNSUPPORTED', `${failed.cohort} tuple is ${failed.result}; aggregate results cannot offset it`), segment_results } : { ...finding('pass', 'VERSION_SUPPORTED', 'every Quality Contract v1 calibration and unseen tuple passed matched artifact-efficiency gates; this is not a vNext promotion decision'), segment_results });
}
