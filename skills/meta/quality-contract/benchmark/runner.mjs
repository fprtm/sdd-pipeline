import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const LOW_ASSURANCE_BUDGET = ['A0', 'A1'].join('_');
const METRICS = Object.freeze([
  'latency_ms', 'review_minutes', 'p0', 'p1', 'p2', 'p3',
  'defects_total', 'defects_escaped',
  'requirements_applicable', 'requirements_misunderstood',
  'regressions_applicable', 'regressions',
  'seeded_faults', 'oracle_weaknesses',
  'unnecessary_complexity_findings', 'review_corrections',
  'recovery_attempted', 'recovery_succeeded',
  'assumptions_adjudicated', 'escaped_assumptions',
  'product_decisions_applicable', 'product_decisions_correct',
  'comprehension_checks', 'comprehension_passed',
  'slo_windows_observed', 'slo_windows_healthy',
  'incidents_observed', 'incident_regressions_created',
  'rework_lines', 'change_failures', 'outcomes_eligible', 'outcomes_achieved',
]);
const METRIC_PAIRS = Object.freeze([['defects_escaped', 'defects_total'], ['requirements_misunderstood', 'requirements_applicable'], ['regressions', 'regressions_applicable'], ['oracle_weaknesses', 'seeded_faults'], ['recovery_succeeded', 'recovery_attempted'], ['escaped_assumptions', 'assumptions_adjudicated'], ['product_decisions_correct', 'product_decisions_applicable'], ['comprehension_passed', 'comprehension_checks'], ['slo_windows_healthy', 'slo_windows_observed'], ['incident_regressions_created', 'incidents_observed'], ['outcomes_achieved', 'outcomes_eligible']]);
const METRIC_DICTIONARY = Object.freeze({
  dictionary_version: '1',
  required_raw_metrics: METRICS,
  distributions: Object.freeze([
    Object.freeze({ id: 'latency_ms', unit: 'milliseconds', statistics: Object.freeze(['p50', 'p90']), direction: 'lower', gate: 'assurance-cost-budget' }),
    Object.freeze({ id: 'review_minutes', unit: 'minutes', statistics: Object.freeze(['p50', 'p90']), direction: 'lower', gate: 'assurance-cost-budget' }),
  ]),
  ratios: Object.freeze([
    Object.freeze({ id: 'defect_escape_rate', numerator: 'defects_escaped', denominator: 'defects_total', direction: 'lower' }),
    Object.freeze({ id: 'requirement_misunderstanding_rate', numerator: 'requirements_misunderstood', denominator: 'requirements_applicable', direction: 'lower' }),
    Object.freeze({ id: 'regression_rate', numerator: 'regressions', denominator: 'regressions_applicable', direction: 'lower' }),
    Object.freeze({ id: 'oracle_weakness_rate', numerator: 'oracle_weaknesses', denominator: 'seeded_faults', direction: 'lower' }),
    Object.freeze({ id: 'recovery_success_rate', numerator: 'recovery_succeeded', denominator: 'recovery_attempted', direction: 'higher' }),
    Object.freeze({ id: 'escaped_assumption_rate', numerator: 'escaped_assumptions', denominator: 'assumptions_adjudicated', direction: 'lower' }),
    Object.freeze({ id: 'product_decision_quality_rate', numerator: 'product_decisions_correct', denominator: 'product_decisions_applicable', direction: 'higher' }),
    Object.freeze({ id: 'reviewer_comprehension_rate', numerator: 'comprehension_passed', denominator: 'comprehension_checks', direction: 'higher' }),
    Object.freeze({ id: 'slo_health_rate', numerator: 'slo_windows_healthy', denominator: 'slo_windows_observed', direction: 'higher' }),
    Object.freeze({ id: 'incident_learning_rate', numerator: 'incident_regressions_created', denominator: 'incidents_observed', direction: 'higher' }),
    Object.freeze({ id: 'outcome_achievement_rate', numerator: 'outcomes_achieved', denominator: 'outcomes_eligible', direction: 'higher' }),
  ]),
  per_attempt_non_regression: Object.freeze(['p0', 'p1', 'p2', 'p3', 'defects_escaped', 'requirements_misunderstood', 'regressions', 'oracle_weaknesses', 'unnecessary_complexity_findings', 'review_corrections', 'escaped_assumptions', 'rework_lines', 'change_failures']),
  missing_required_result: 'INSUFFICIENT',
});
function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function bounded(value) { return typeof value === 'string' && value.length > 0 && Buffer.byteLength(value, 'utf8') <= 4096 && value === value.normalize('NFC'); }
function boundedList(value, validator = bounded) { return Array.isArray(value) && value.length > 0 && value.length <= 256 && value.every(validator); }
function canonical(value, seen = new Set()) {
  if (value === null) return 'null';
  if (typeof value === 'string') { if (value !== value.normalize('NFC')) throw new TypeError('non-canonical string'); return JSON.stringify(value); }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw new TypeError('non-finite number'); return JSON.stringify(value); }
  if (typeof value !== 'object') throw new TypeError('non-JSON value');
  if (seen.has(value)) throw new TypeError('cyclic value');
  seen.add(value);
  try {
    if (Array.isArray(value)) return `[${value.map((item) => canonical(item, seen)).join(',')}]`;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError('non-plain object');
    return `{${Object.keys(value).sort().map((key) => `${canonical(key, seen)}:${canonical(value[key], seen)}`).join(',')}}`;
  } finally { seen.delete(value); }
}
export function benchmarkDigest(value) { return `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`; }
export function normalizeBenchmark(value) { return canonical(value); }
function median(values) { const sorted = [...values].sort((a, b) => a - b); return sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2; }
function percentile(values, p) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.ceil(p * sorted.length) - 1]; }
function outcome(status, code, cause, report = null) { return Object.freeze({ status, code, cause, risk: status === 'PASS' ? 'medium' : 'critical', owner: 'benchmark-governance', report }); }
function protocolValid(p) {
  if (!exact(p, ['protocol_version', 'status', 'frozen_at', 'supersedes_protocol_digest', 'decision_refs', 'arms', 'cohorts', 'segments', 'required_case_categories', 'terminal_results', 'severity', 'metric_dictionary', 'grader_policy', 'cost_budgets', 'gates', 'corpus_policy']) || p.protocol_version !== '3' || p.status !== 'frozen' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(p.frozen_at || '') || !Number.isFinite(Date.parse(p.frozen_at)) || !DIGEST.test(p.supersedes_protocol_digest || '') || !boundedList(p.decision_refs, (value) => ID.test(value || '')) || JSON.stringify(p.arms) !== '["baseline","candidate"]') return false;
  if (!exact(p.cohorts, ['calibration', 'unseen']) || !Object.values(p.cohorts).every((cohort) => exact(cohort, ['minimum_runs_per_arm_per_segment']) && Number.isInteger(cohort.minimum_runs_per_arm_per_segment) && cohort.minimum_runs_per_arm_per_segment > 0)) return false;
  const segmentFields = ['id', 'repository_class', 'work_type', 'risk', 'assurance', 'executor_class', 'domain'];
  if (!Array.isArray(p.segments) || p.segments.length !== 6 || new Set(p.segments.map((segment) => segment?.id)).size !== p.segments.length || !p.segments.every((segment) => exact(segment, segmentFields) && ID.test(segment.id || '') && ['low', 'moderate', 'high', 'critical'].includes(segment.risk) && ['A0', 'A1', 'A2', 'A3'].includes(segment.assurance) && ['capable', 'specialist'].includes(segment.executor_class) && [segment.repository_class, segment.work_type, segment.domain].every(bounded))) return false;
  if (!boundedList(p.required_case_categories, (value) => ID.test(value || '')) || p.required_case_categories.length !== 12 || new Set(p.required_case_categories).size !== p.required_case_categories.length) return false;
  if (JSON.stringify(p.terminal_results) !== '["PASS","FAIL","INSUFFICIENT","INVALID"]' || JSON.stringify(p.severity) !== '["P0","P1","P2","P3"]') return false;
  if (canonical(p.metric_dictionary) !== canonical(METRIC_DICTIONARY)) return false;
  if (!exact(p.grader_policy, ['minimum_independent_graders', 'minimum_raw_agreement_percent', 'blind_arm_and_executor_when_practical', 'retain_pre_adjudication_scores']) || !Number.isInteger(p.grader_policy.minimum_independent_graders) || p.grader_policy.minimum_independent_graders < 2 || !Number.isFinite(p.grader_policy.minimum_raw_agreement_percent) || p.grader_policy.minimum_raw_agreement_percent < 0 || p.grader_policy.minimum_raw_agreement_percent > 100 || p.grader_policy.blind_arm_and_executor_when_practical !== true || p.grader_policy.retain_pre_adjudication_scores !== true) return false;
  const percentageBudget = (budget) => exact(budget, ['median_latency_regression_percent', 'review_time_regression_percent']) && Object.values(budget).every((value) => Number.isFinite(value) && value >= 0);
  if (!exact(p.cost_budgets, [LOW_ASSURANCE_BUDGET, 'A2', 'A3']) || !percentageBudget(p.cost_budgets[LOW_ASSURANCE_BUDGET]) || !percentageBudget(p.cost_budgets.A2) || !exact(p.cost_budgets.A3, ['hard_cap', 'requires_absolute_and_p90_report']) || p.cost_budgets.A3.hard_cap !== null || p.cost_budgets.A3.requires_absolute_and_p90_report !== true) return false;
  if (!exact(p.gates, ['maximum_p0', 'maximum_p1', 'allow_p2_per_run_regression', 'missing_required_metric', 'thin_segment', 'failing_critical_segment_blocks_aggregate']) || !Number.isInteger(p.gates.maximum_p0) || !Number.isInteger(p.gates.maximum_p1) || p.gates.maximum_p0 < 0 || p.gates.maximum_p1 < 0 || typeof p.gates.allow_p2_per_run_regression !== 'boolean' || p.gates.missing_required_metric !== 'INSUFFICIENT' || p.gates.thin_segment !== 'INSUFFICIENT' || p.gates.failing_critical_segment_blocks_aggregate !== true) return false;
  return exact(p.corpus_policy, ['requires_recorded_license_or_evaluation_authority', 'forbid_secrets_private_customer_data_and_unconsented_pii', 'calibration_and_unseen_lineages_disjoint', 'retain_invalid_stopped_failed_clarified_and_abandoned_attempts']) && Object.values(p.corpus_policy).every((value) => value === true);
}
function assignmentDigest(manifest) { return benchmarkDigest({ arms: ['baseline', 'candidate'], randomization_seed: manifest.randomization_seed, execution_order: manifest.execution_order, assignments: manifest.cases.map(({ case_id, segment_id, cohort }) => ({ case_id, segment_id, cohort })).sort((a, b) => a.case_id.localeCompare(b.case_id)) }); }
function corpusCaseValid(c) {
  if (!exact(c, ['case_id', 'segment_id', 'cohort', 'categories', 'lineage_digest', 'subject_digest', 'license_or_authority', 'license_authority_digest', 'source_provenance_digest', 'retention_policy_digest', 'repository_snapshot', 'user_request', 'hidden_facts', 'allowed_tools', 'authority_limits', 'expected_decisions', 'acceptable_solution_properties', 'unacceptable_shortcuts', 'security_traps', 'hidden_tests', 'maintainability_rubric', 'product_value_rubric', 'review_rubric', 'contamination_risk', 'privacy_review_digest']) || !ID.test(c.case_id || '') || !['calibration', 'unseen'].includes(c.cohort) || !boundedList(c.categories, (value) => ID.test(value || '')) || ![c.lineage_digest, c.subject_digest, c.license_authority_digest, c.source_provenance_digest, c.retention_policy_digest, c.repository_snapshot, c.maintainability_rubric, c.product_value_rubric, c.review_rubric, c.privacy_review_digest].every((value) => DIGEST.test(value || '')) || !bounded(c.license_or_authority) || ['unknown', 'none', 'pending', 'unlicensed'].includes(c.license_or_authority.trim().toLowerCase()) || !bounded(c.user_request) || !boundedList(c.hidden_facts) || !boundedList(c.allowed_tools, (value) => ID.test(value || '')) || !boundedList(c.authority_limits) || !boundedList(c.expected_decisions, (value) => ID.test(value || '')) || !boundedList(c.acceptable_solution_properties) || !boundedList(c.unacceptable_shortcuts) || !boundedList(c.security_traps) || !boundedList(c.hidden_tests, (value) => DIGEST.test(value || '')) || !['low', 'moderate', 'high'].includes(c.contamination_risk)) return false;
  let serialized;
  try { serialized = canonical(c); } catch { return false; }
  return !/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._-]{16,}|password\s*[:=]\s*[^\s",}]+/i.test(serialized);
}
function manifestValid(m, protocolDigest) {
  if (!exact(m, ['manifest_version', 'protocol_digest', 'evidence_class', 'randomization_seed', 'execution_order', 'assignment_digest', 'cases']) || m.manifest_version !== '1' || m.protocol_digest !== protocolDigest || !['synthetic-fixture', 'field-pilot'].includes(m.evidence_class) || !bounded(m.randomization_seed) || !DIGEST.test(m.assignment_digest || '') || !Array.isArray(m.cases) || m.cases.length === 0 || new Set(m.cases.map(({ case_id }) => case_id)).size !== m.cases.length || !m.cases.every(corpusCaseValid)) return false;
  const expected = m.cases.flatMap(({ case_id }) => [`${case_id}:baseline`, `${case_id}:candidate`]).sort();
  return Array.isArray(m.execution_order) && m.execution_order.length === expected.length && new Set(m.execution_order).size === expected.length && JSON.stringify([...m.execution_order].sort()) === JSON.stringify(expected) && m.assignment_digest === assignmentDigest(m);
}
function versionMap(value) { return object(value) && Object.keys(value).length > 0 && Object.keys(value).length <= 32 && Object.entries(value).every(([key, version]) => ID.test(key) && bounded(version)); }
function executorProfile(value) { return exact(value, ['executor_id', 'model_id', 'model_version', 'prompt_version', 'tool_versions']) && [value.executor_id, value.model_id].every((item) => ID.test(item || '')) && bounded(value.model_version) && bounded(value.prompt_version) && versionMap(value.tool_versions); }
function environmentProfile(value) { return exact(value, ['provider', 'os', 'architecture', 'runtime_versions']) && [value.provider, value.os, value.architecture].every(bounded) && versionMap(value.runtime_versions); }
function metricEnvelopeValid(metrics, metricMissing) {
  if (!exact(metrics, METRICS) || !object(metricMissing) || !Object.values(metrics).every((value) => value === null || (Number.isFinite(value) && value >= 0))) return false;
  const missing = METRICS.filter((key) => metrics[key] === null);
  if (Object.keys(metricMissing).length !== missing.length || !missing.every((key) => bounded(metricMissing[key]))) return false;
  return !METRIC_PAIRS.some(([numerator, denominator]) => metrics[numerator] !== null && metrics[denominator] !== null && metrics[numerator] > metrics[denominator]);
}
function attemptValid(a, evidenceClass) {
  if (!exact(a, ['attempt_id', 'case_id', 'arm', 'terminal_result', 'executor_profile', 'executor_profile_digest', 'environment_profile', 'environment_digest', 'pipeline_version', 'measurement', 'metrics', 'metric_missing', 'graders', 'adjudication']) || !ID.test(a.attempt_id || '') || !['baseline', 'candidate'].includes(a.arm) || !['PASS', 'FAIL', 'INSUFFICIENT', 'INVALID'].includes(a.terminal_result) || !executorProfile(a.executor_profile) || !environmentProfile(a.environment_profile) || a.executor_profile_digest !== benchmarkDigest(a.executor_profile) || a.environment_digest !== benchmarkDigest(a.environment_profile) || !bounded(a.pipeline_version) || !exact(a.measurement, ['started_at', 'ended_at', 'method']) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(a.measurement.started_at || '') || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(a.measurement.ended_at || '') || Date.parse(a.measurement.started_at) >= Date.parse(a.measurement.ended_at) || !bounded(a.measurement.method) || !metricEnvelopeValid(a.metrics, a.metric_missing)) return false;
  if (!Array.isArray(a.graders) || a.graders.length < 2 || new Set(a.graders.map(({ identity_attestation_digest }) => identity_attestation_digest)).size !== a.graders.length) return false;
  const validGraders = a.graders.every((g) => exact(g, ['grader_id', 'grader_class', 'identity_attestation_digest', 'qualification_class', 'conflict_disclosure', 'verdict', 'severity', 'abstention_reason', 'blind_arm', 'blind_executor', 'pre_adjudication_digest']) && ID.test(g.grader_id || '') && ['human', 'deterministic', 'synthetic'].includes(g.grader_class) && DIGEST.test(g.identity_attestation_digest || '') && bounded(g.qualification_class) && bounded(g.conflict_disclosure) && ['PASS', 'FAIL', 'ABSTAIN'].includes(g.verdict) && (g.verdict === 'ABSTAIN' ? g.severity === null && bounded(g.abstention_reason) : ['P0', 'P1', 'P2', 'P3'].includes(g.severity) && g.abstention_reason === null) && g.blind_arm === true && g.blind_executor === true && DIGEST.test(g.pre_adjudication_digest || ''));
  if (!validGraders || (evidenceClass === 'field-pilot' && a.graders.filter(({ grader_class }) => grader_class === 'human').length < 2)) return false;
  const scored = a.graders.filter(({ verdict }) => verdict !== 'ABSTAIN'); const first = scored[0]; const disagreed = scored.length > 1 && scored.slice(1).some((grader) => grader.verdict !== first.verdict || grader.severity !== first.severity);
  const validAdjudication = exact(a.adjudication, ['adjudicator_id', 'conflict_disclosure', 'final_verdict', 'final_severity', 'reason', 'adjudicator_attestation_digest']) && ID.test(a.adjudication?.adjudicator_id || '') && !a.graders.some(({ grader_id, identity_attestation_digest }) => grader_id === a.adjudication.adjudicator_id || identity_attestation_digest === a.adjudication.adjudicator_attestation_digest) && bounded(a.adjudication?.conflict_disclosure) && ['PASS', 'FAIL'].includes(a.adjudication?.final_verdict) && ['P0', 'P1', 'P2', 'P3'].includes(a.adjudication?.final_severity) && bounded(a.adjudication?.reason) && DIGEST.test(a.adjudication?.adjudicator_attestation_digest || '');
  return disagreed ? validAdjudication : a.adjudication === null;
}
function rate(numerator, denominator) { return denominator === 0 ? null : numerator / denominator; }
function sum(rows, key) { return rows.reduce((total, row) => total + row.metrics[key], 0); }
function percentDelta(candidate, baseline) { return baseline === 0 ? (candidate === 0 ? 0 : null) : 100 * (candidate - baseline) / baseline; }
function difference(candidate, baseline) { return candidate === null || baseline === null ? null : candidate - baseline; }
function uniqueProfiles(rows, profileKey, digestKey) { const profiles = new Map(rows.map((row) => [row[digestKey], row[profileKey]])); return [...profiles.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([digest, profile]) => ({ digest, profile })); }
function gradeAgreement(rows) {
  let agreements = 0; let pairs = 0; const confusion = new Map();
  for (const row of rows) {
    const first = row.graders[0];
    for (const grader of row.graders.slice(1)) {
      pairs += 1; const left = `${first.verdict}:${first.severity}`; const right = `${grader.verdict}:${grader.severity}`; const key = `${left}\u0000${right}`;
      confusion.set(key, (confusion.get(key) || 0) + 1); if (right === left) agreements += 1;
    }
  }
  return { agreement_percent: pairs ? (agreements / pairs) * 100 : 0, grader_pairs: pairs, confusion_table: [...confusion.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => { const [first_grade, other_grade] = key.split('\u0000'); return { first_grade, other_grade, count }; }) };
}
function summarizeArms(rows, protocol) {
  return Object.fromEntries(protocol.arms.map((arm) => {
    const selected = rows.filter((row) => row.arm === arm);
    const totals = Object.fromEntries(METRICS.filter((key) => !['latency_ms', 'review_minutes'].includes(key)).map((key) => [key, sum(selected, key)]));
    return [arm, {
      attempts: selected.length,
      executor_profiles: uniqueProfiles(selected, 'executor_profile', 'executor_profile_digest'),
      environment_profiles: uniqueProfiles(selected, 'environment_profile', 'environment_digest'),
      measurement_methods: [...new Set(selected.map((row) => row.measurement.method))].sort(),
      timeframe: { started_at: selected.map((row) => row.measurement.started_at).sort()[0], ended_at: selected.map((row) => row.measurement.ended_at).sort().at(-1) },
      terminal: Object.fromEntries(protocol.terminal_results.map((terminal) => [terminal, selected.filter((row) => row.terminal_result === terminal).length])),
      ...totals,
      defect_escape_rate: rate(totals.defects_escaped, totals.defects_total),
      requirement_misunderstanding_rate: rate(totals.requirements_misunderstood, totals.requirements_applicable),
      regression_rate: rate(totals.regressions, totals.regressions_applicable),
      oracle_weakness_rate: rate(totals.oracle_weaknesses, totals.seeded_faults),
      recovery_success_rate: rate(totals.recovery_succeeded, totals.recovery_attempted),
      escaped_assumption_rate: rate(totals.escaped_assumptions, totals.assumptions_adjudicated),
      product_decision_quality_rate: rate(totals.product_decisions_correct, totals.product_decisions_applicable),
      reviewer_comprehension_rate: rate(totals.comprehension_passed, totals.comprehension_checks),
      slo_health_rate: rate(totals.slo_windows_healthy, totals.slo_windows_observed),
      incident_learning_rate: rate(totals.incident_regressions_created, totals.incidents_observed),
      outcome_achievement_rate: rate(totals.outcomes_achieved, totals.outcomes_eligible),
      median_latency_ms: median(selected.map((row) => row.metrics.latency_ms)),
      p90_latency_ms: percentile(selected.map((row) => row.metrics.latency_ms), .9),
      median_review_minutes: median(selected.map((row) => row.metrics.review_minutes)),
      p90_review_minutes: percentile(selected.map((row) => row.metrics.review_minutes), .9),
    }];
  }));
}
function compareArms(arms, segment, protocol) {
  const lowerIsBetter = ['p0', 'p1', 'p2', 'p3', 'defects_escaped', 'requirements_misunderstood', 'regressions', 'oracle_weaknesses', 'unnecessary_complexity_findings', 'review_corrections', 'escaped_assumptions', 'rework_lines', 'change_failures'];
  const effects = {
    median_latency_delta_percent: percentDelta(arms.candidate.median_latency_ms, arms.baseline.median_latency_ms),
    p90_latency_delta_percent: percentDelta(arms.candidate.p90_latency_ms, arms.baseline.p90_latency_ms),
    median_review_delta_percent: percentDelta(arms.candidate.median_review_minutes, arms.baseline.median_review_minutes),
    p90_review_delta_percent: percentDelta(arms.candidate.p90_review_minutes, arms.baseline.p90_review_minutes),
    per_attempt_count_deltas: Object.fromEntries(lowerIsBetter.map((key) => [key, arms.candidate[key] / arms.candidate.attempts - arms.baseline[key] / arms.baseline.attempts])),
    rate_deltas: Object.fromEntries(['defect_escape_rate', 'requirement_misunderstanding_rate', 'regression_rate', 'oracle_weakness_rate', 'recovery_success_rate', 'escaped_assumption_rate', 'product_decision_quality_rate', 'reviewer_comprehension_rate', 'slo_health_rate', 'incident_learning_rate', 'outcome_achievement_rate'].map((key) => [key, difference(arms.candidate[key], arms.baseline[key])])),
  };
  const failures = [];
  if (arms.candidate.p0 > protocol.gates.maximum_p0) failures.push('P0');
  if (arms.candidate.p1 > protocol.gates.maximum_p1) failures.push('P1');
  if (!protocol.gates.allow_p2_per_run_regression && arms.candidate.p2 / arms.candidate.attempts > arms.baseline.p2 / arms.baseline.attempts) failures.push('P2-regression');
  for (const key of ['defects_escaped', 'requirements_misunderstood', 'regressions', 'oracle_weaknesses', 'unnecessary_complexity_findings', 'review_corrections', 'escaped_assumptions', 'rework_lines', 'change_failures']) if (arms.candidate[key] / arms.candidate.attempts > arms.baseline[key] / arms.baseline.attempts) failures.push(`${key}-regression`);
  for (const key of ['defect_escape_rate', 'requirement_misunderstanding_rate', 'regression_rate', 'oracle_weakness_rate', 'escaped_assumption_rate']) {
    if ((arms.baseline[key] === null) !== (arms.candidate[key] === null)) failures.push(`${key}-not-comparable`);
    else if (arms.baseline[key] !== null && arms.candidate[key] > arms.baseline[key]) failures.push(`${key}-regression`);
  }
  for (const key of ['recovery_success_rate', 'product_decision_quality_rate', 'reviewer_comprehension_rate', 'slo_health_rate', 'incident_learning_rate', 'outcome_achievement_rate']) {
    if ((arms.baseline[key] === null) !== (arms.candidate[key] === null)) failures.push(`${key}-not-comparable`);
    else if (arms.baseline[key] !== null && arms.candidate[key] < arms.baseline[key]) failures.push(`${key}-regression`);
  }
  if (arms.candidate.terminal.FAIL > 0 || arms.candidate.terminal.INSUFFICIENT > 0 || arms.candidate.terminal.INVALID > 0) failures.push('terminal');
  const budgetKey = segment.assurance === 'A2' ? 'A2' : LOW_ASSURANCE_BUDGET;
  const budget = segment.assurance === 'A3' ? null : protocol.cost_budgets[budgetKey];
  if (budget && ((effects.median_latency_delta_percent === null ? arms.candidate.median_latency_ms > 0 : effects.median_latency_delta_percent > budget.median_latency_regression_percent) || (effects.median_review_delta_percent === null ? arms.candidate.median_review_minutes > 0 : effects.median_review_delta_percent > budget.review_time_regression_percent))) failures.push('cost');
  return { arms, effects, failures: [...new Set(failures)] };
}

function evaluateBenchmarkUnsafe(protocol, manifest, attempts) {
  if (!protocolValid(protocol)) return outcome('INVALID', 'BENCHMARK_PROTOCOL_INVALID', 'protocol is not the frozen v3 shape');
  const protocol_digest = benchmarkDigest(protocol);
  if (!manifestValid(manifest, protocol_digest) || !Array.isArray(attempts) || new Set(attempts.map(({ attempt_id }) => attempt_id)).size !== attempts.length || !attempts.every((attempt) => attemptValid(attempt, manifest.evidence_class))) return outcome('INVALID', 'BENCHMARK_INPUT_INVALID', 'manifest or attempt schema/digest is invalid');
  const caseMap = new Map(manifest.cases.map((c) => [c.case_id, c]));
  if (attempts.some(({ case_id }) => !caseMap.has(case_id))) return outcome('INVALID', 'BENCHMARK_LINEAGE_INVALID', 'attempt references an unknown case');
  const segmentIds = new Set(protocol.segments.map(({ id }) => id));
  if (manifest.cases.some(({ segment_id }) => !segmentIds.has(segment_id))) return outcome('INVALID', 'BENCHMARK_LINEAGE_INVALID', 'case references an unknown frozen segment');
  const categoryIds = new Set(protocol.required_case_categories);
  if (manifest.cases.some(({ categories }) => categories.some((category) => !categoryIds.has(category)))) return outcome('INVALID', 'BENCHMARK_INPUT_INVALID', 'case references an unknown frozen category');
  const category_coverage = {};
  for (const cohort of ['calibration', 'unseen']) {
    const observed = new Set(manifest.cases.filter((entry) => entry.cohort === cohort).flatMap(({ categories }) => categories));
    const missing_categories = protocol.required_case_categories.filter((category) => !observed.has(category));
    if (missing_categories.length) return outcome('INSUFFICIENT', 'BENCHMARK_REQUIRED_CATEGORY_MISSING', `${cohort} does not cover every frozen case category`, { cohort, status: 'INSUFFICIENT', missing_categories });
    category_coverage[cohort] = protocol.required_case_categories.map((category) => ({ category, cases: manifest.cases.filter((entry) => entry.cohort === cohort && entry.categories.includes(category)).length }));
  }
  const assignments = attempts.map(({ case_id, arm }) => `${case_id}\u0000${arm}`);
  if (new Set(assignments).size !== assignments.length || manifest.cases.some(({ case_id }) => protocol.arms.some((arm) => !assignments.includes(`${case_id}\u0000${arm}`)))) return outcome('INVALID', 'BENCHMARK_ASSIGNMENT_INVALID', 'every frozen case requires exactly one retained attempt per arm');
  const calibration = new Set(manifest.cases.filter((c) => c.cohort === 'calibration').map((c) => c.lineage_digest));
  if (manifest.cases.some((c) => c.cohort === 'unseen' && calibration.has(c.lineage_digest))) return outcome('INVALID', 'BENCHMARK_LINEAGE_INVALID', 'calibration and unseen lineage overlap');
  const segmentReports = [];
  for (const segment of protocol.segments) {
    const rows = attempts.filter((a) => caseMap.get(a.case_id).segment_id === segment.id);
    for (const cohort of ['calibration', 'unseen']) for (const arm of protocol.arms) {
      const expected = protocol.cohorts[cohort].minimum_runs_per_arm_per_segment;
      const count = rows.filter((a) => a.arm === arm && caseMap.get(a.case_id).cohort === cohort).length;
      if (count < expected) return outcome('INSUFFICIENT', 'BENCHMARK_THIN_SEGMENT', `${segment.id}/${cohort}/${arm} has ${count}/${expected} attempts`, { segment_id: segment.id, status: 'INSUFFICIENT', cohort, arm, expected_attempts: expected, observed_attempts: count, missing_attempts: expected - count });
    }
    const missingMetrics = rows.flatMap((attempt) => Object.entries(attempt.metrics).filter(([, value]) => value === null).map(([metric]) => ({ attempt_id: attempt.attempt_id, metric, reason: attempt.metric_missing[metric] })));
    if (missingMetrics.length) return outcome('INSUFFICIENT', 'BENCHMARK_REQUIRED_METRIC_MISSING', `${segment.id} has one or more missing frozen metrics`, { segment_id: segment.id, status: 'INSUFFICIENT', missing_metrics: missingMetrics });
    const abstentions = rows.flatMap((attempt) => attempt.graders.filter(({ verdict }) => verdict === 'ABSTAIN').map((grader) => ({ attempt_id: attempt.attempt_id, grader_id: grader.grader_id, reason: grader.abstention_reason })));
    if (abstentions.length) return outcome('INSUFFICIENT', 'BENCHMARK_GRADER_ABSTENTION', `${segment.id} contains one or more preserved grader abstentions`, { segment_id: segment.id, status: 'INSUFFICIENT', abstentions });
    const overallAgreement = gradeAgreement(rows);
    const cohort_agreement = Object.fromEntries(['calibration', 'unseen'].map((cohort) => [cohort, gradeAgreement(rows.filter((row) => caseMap.get(row.case_id).cohort === cohort))]));
    const unseenAgreement = cohort_agreement.unseen;
    if (unseenAgreement.agreement_percent < protocol.grader_policy.minimum_raw_agreement_percent) return outcome('INSUFFICIENT', 'BENCHMARK_GRADER_DISAGREEMENT', `${segment.id} unseen raw agreement is ${unseenAgreement.agreement_percent}%`, { segment_id: segment.id, cohort: 'unseen', status: 'INSUFFICIENT', agreement_percent: unseenAgreement.agreement_percent, minimum_agreement_percent: protocol.grader_policy.minimum_raw_agreement_percent, grader_pairs: unseenAgreement.grader_pairs, confusion_table: unseenAgreement.confusion_table, cohort_agreement });
    const combined = compareArms(summarizeArms(rows, protocol), segment, protocol);
    const cohort_comparisons = Object.fromEntries(['calibration', 'unseen'].map((cohort) => [cohort, compareArms(summarizeArms(rows.filter((row) => caseMap.get(row.case_id).cohort === cohort), protocol), segment, protocol)]));
    const failures = [...new Set([...combined.failures, ...cohort_comparisons.calibration.failures, ...cohort_comparisons.unseen.failures])];
    segmentReports.push({ segment_id: segment.id, status: failures.length ? 'FAIL' : 'PASS', assurance: segment.assurance, agreement_percent: overallAgreement.agreement_percent, confusion_table: overallAgreement.confusion_table, cohort_agreement, confidence: { eligible_attempts: rows.length, grader_pairs: overallAgreement.grader_pairs, unseen_grader_pairs: unseenAgreement.grader_pairs, interpretation: 'descriptive segment evidence; no universal population inference' }, missing_attempts: 0, arms: combined.arms, effects: combined.effects, cohort_comparisons, failures });
  }
  const failed = segmentReports.filter(({ failures }) => failures.length);
  const report = { evidence_class: manifest.evidence_class, benchmark_gate_passed: failed.length === 0, human_promotion_required: true, protocol_digest, manifest_digest: benchmarkDigest(manifest), attempt_digest: benchmarkDigest(attempts), attempts: attempts.length, category_coverage, segments: segmentReports, failed_segments: failed.map(({ segment_id }) => segment_id), normalized_digest: benchmarkDigest({ category_coverage, segments: segmentReports }) };
  if (failed.length) return outcome('FAIL', failed.some(({ segment_id }) => segment_id === 'SEG-04') ? 'BENCHMARK_CRITICAL_SEGMENT_FAILED' : 'BENCHMARK_GATE_FAILED', 'one or more segment-level gates failed', report);
  return outcome('PASS', manifest.evidence_class === 'field-pilot' ? 'BENCHMARK_PASS' : 'BENCHMARK_MECHANICS_PASS', manifest.evidence_class === 'field-pilot' ? 'every frozen segment gate passed without aggregate masking' : 'synthetic mechanics passed; result is not promotion evidence', report);
}

export function evaluateBenchmark(protocol, manifest, attempts) {
  try { if (!protocolValid(protocol)) return outcome('INVALID', 'BENCHMARK_PROTOCOL_INVALID', 'protocol is not the frozen v3 shape'); }
  catch { return outcome('INVALID', 'BENCHMARK_PROTOCOL_INVALID', 'protocol is malformed or non-canonical'); }
  try { return evaluateBenchmarkUnsafe(protocol, manifest, attempts); }
  catch { return outcome('INVALID', 'BENCHMARK_INPUT_INVALID', 'benchmark input is malformed or non-canonical'); }
}

export function validateIsolatedRunnerAdapter(adapter) {
  return Boolean(adapter && adapter.kind === 'isolated-local-runner-v1' && adapter.network === false && adapter.disposable_workspace === true && typeof adapter.run === 'function');
}

export function validateGraderAdapter(adapter) {
  return Boolean(adapter && ['deterministic-grader-v1', 'externally-attested-grader-v1'].includes(adapter.kind) && adapter.blind_arm === true && adapter.retain_pre_adjudication === true && typeof adapter.grade === 'function');
}

export { METRIC_DICTIONARY as BENCHMARK_METRIC_DICTIONARY };

/**
 * Execute one already-authorized case through an injected local adapter. This
 * function owns only disposable workspace, timeout, output bounds, and sealing;
 * it does not fetch corpus material, enable network, grade, or grant authority.
 */
export async function executeIsolatedAdapter(adapter, request, limits = {}) {
  if (!validateIsolatedRunnerAdapter(adapter) || !exact(request, ['case_id', 'arm', 'case_record']) || !ID.test(request.case_id || '') || !['baseline', 'candidate'].includes(request.arm) || !object(request.case_record)) return outcome('INVALID', 'BENCHMARK_RUNNER_INVALID', 'isolated adapter or exact run request is invalid');
  const timeout_ms = limits.timeout_ms ?? 120000;
  const maximum_output_bytes = limits.maximum_output_bytes ?? 256 * 1024;
  if (!Number.isInteger(timeout_ms) || timeout_ms < 1 || timeout_ms > 600000 || !Number.isInteger(maximum_output_bytes) || maximum_output_bytes < 1 || maximum_output_bytes > 1024 * 1024) return outcome('INVALID', 'BENCHMARK_RUNNER_INVALID', 'runner limits are outside the bounded policy');
  let input;
  try { input = canonical(request.case_record); } catch { return outcome('INVALID', 'BENCHMARK_RUNNER_INVALID', 'case record is not canonical JSON data'); }
  if (typeof input !== 'string' || Buffer.byteLength(input, 'utf8') > 256 * 1024) return outcome('INVALID', 'BENCHMARK_RUNNER_INVALID', 'case record exceeds the bounded input policy');
  const workspace = await mkdtemp(join(tmpdir(), 'sdd-vnext-benchmark-'));
  const controller = new AbortController();
  let timer;
  try {
    const case_path = join(workspace, 'case.json');
    await writeFile(case_path, `${input}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    const timeout = new Promise((resolve) => { timer = setTimeout(() => { resolve(Symbol.for('benchmark-timeout')); controller.abort(); }, timeout_ms); });
    let measurement;
    try { measurement = await Promise.race([adapter.run({ case_id: request.case_id, arm: request.arm, case_path, workspace, network: false, signal: controller.signal }), timeout]); } catch { return outcome('INVALID', 'BENCHMARK_RUNNER_INVALID', 'isolated adapter failed'); }
    if (measurement === Symbol.for('benchmark-timeout')) return outcome('INSUFFICIENT', 'BENCHMARK_RUNNER_TIMEOUT', 'isolated adapter exceeded the frozen time limit');
    let sealed;
    try { sealed = canonical(measurement); } catch { return outcome('INVALID', 'BENCHMARK_RUNNER_INVALID', 'adapter measurement is not canonical JSON data'); }
    if (typeof sealed !== 'string' || !exact(measurement, ['terminal_result', 'metrics', 'metric_missing']) || !['PASS', 'FAIL', 'INSUFFICIENT', 'INVALID'].includes(measurement.terminal_result) || !metricEnvelopeValid(measurement.metrics, measurement.metric_missing)) return outcome('INVALID', 'BENCHMARK_RUNNER_INVALID', 'adapter measurement is not a strict allowlisted metric envelope');
    if (Buffer.byteLength(sealed, 'utf8') > maximum_output_bytes) return outcome('INSUFFICIENT', 'BENCHMARK_RUNNER_OUTPUT_EXCEEDED', 'adapter measurement exceeded the bounded output limit');
    return outcome('PASS', 'BENCHMARK_RUN_COMPLETED', 'isolated adapter completed within frozen bounds', { case_id: request.case_id, arm: request.arm, measurement_digest: benchmarkDigest(measurement), measurement: structuredClone(measurement) });
  } finally {
    clearTimeout(timer);
    controller.abort();
    await rm(workspace, { recursive: true, force: true });
  }
}

/** Invoke a blind grader through the same bounded, abortable data-only seam. */
export async function executeGraderAdapter(adapter, request, limits = {}) {
  if (!validateGraderAdapter(adapter) || !exact(request, ['artifact_digest', 'rubric_digest', 'normalized_artifact']) || !DIGEST.test(request.artifact_digest || '') || !DIGEST.test(request.rubric_digest || '')) return outcome('INVALID', 'BENCHMARK_GRADER_ADAPTER_INVALID', 'grader adapter or exact blind request is invalid');
  const timeout_ms = limits.timeout_ms ?? 60000;
  const maximum_output_bytes = limits.maximum_output_bytes ?? 64 * 1024;
  if (!Number.isInteger(timeout_ms) || timeout_ms < 1 || timeout_ms > 600000 || !Number.isInteger(maximum_output_bytes) || maximum_output_bytes < 1 || maximum_output_bytes > 1024 * 1024) return outcome('INVALID', 'BENCHMARK_GRADER_ADAPTER_INVALID', 'grader limits are outside the bounded policy');
  let normalized;
  try { normalized = canonical(request.normalized_artifact); } catch { return outcome('INVALID', 'BENCHMARK_GRADER_ADAPTER_INVALID', 'normalized artifact is not canonical JSON data'); }
  if (typeof normalized !== 'string' || Buffer.byteLength(normalized, 'utf8') > 256 * 1024) return outcome('INVALID', 'BENCHMARK_GRADER_ADAPTER_INVALID', 'normalized artifact exceeds the bounded input policy');
  const controller = new AbortController();
  let timer;
  try {
    const timeout = new Promise((resolve) => { timer = setTimeout(() => { resolve(Symbol.for('grader-timeout')); controller.abort(); }, timeout_ms); });
    let grade;
    try { grade = await Promise.race([adapter.grade({ artifact_digest: request.artifact_digest, rubric_digest: request.rubric_digest, normalized_artifact: structuredClone(request.normalized_artifact), blind_arm: true, blind_executor: true, signal: controller.signal }), timeout]); } catch { return outcome('INVALID', 'BENCHMARK_GRADER_ADAPTER_INVALID', 'grader adapter failed'); }
    if (grade === Symbol.for('grader-timeout')) return outcome('INSUFFICIENT', 'BENCHMARK_GRADER_ADAPTER_TIMEOUT', 'grader adapter exceeded the frozen time limit');
    let sealed;
    try { sealed = canonical(grade); } catch { return outcome('INVALID', 'BENCHMARK_GRADER_ADAPTER_INVALID', 'grader output is not canonical JSON data'); }
    if (typeof sealed !== 'string' || Buffer.byteLength(sealed, 'utf8') > maximum_output_bytes) return outcome('INSUFFICIENT', 'BENCHMARK_GRADER_OUTPUT_EXCEEDED', 'grader output exceeded the bounded output limit');
    const expectedClass = adapter.kind === 'externally-attested-grader-v1' ? 'human' : 'deterministic';
    const valid = exact(grade, ['grader_id', 'grader_class', 'identity_attestation_digest', 'qualification_class', 'conflict_disclosure', 'verdict', 'severity', 'abstention_reason', 'blind_arm', 'blind_executor', 'pre_adjudication_digest']) && ID.test(grade.grader_id || '') && grade.grader_class === expectedClass && [grade.identity_attestation_digest, grade.pre_adjudication_digest].every((value) => DIGEST.test(value || '')) && bounded(grade.qualification_class) && bounded(grade.conflict_disclosure) && ['PASS', 'FAIL', 'ABSTAIN'].includes(grade.verdict) && (grade.verdict === 'ABSTAIN' ? grade.severity === null && bounded(grade.abstention_reason) : ['P0', 'P1', 'P2', 'P3'].includes(grade.severity) && grade.abstention_reason === null) && grade.blind_arm === true && grade.blind_executor === true;
    if (!valid) return outcome('INVALID', 'BENCHMARK_GRADER_ADAPTER_INVALID', 'grader output is not exact, blind, attested, and pre-adjudication-retaining');
    return outcome('PASS', 'BENCHMARK_GRADER_COMPLETED', 'blind grader completed within frozen bounds', { grade_digest: benchmarkDigest(grade), grade: structuredClone(grade) });
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
