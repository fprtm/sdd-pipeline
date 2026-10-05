import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { BENCHMARK_METRIC_DICTIONARY, benchmarkDigest, evaluateBenchmark, executeGraderAdapter, executeIsolatedAdapter, normalizeBenchmark, validateGraderAdapter, validateIsolatedRunnerAdapter } from '../skills/meta/quality-contract/benchmark/runner.mjs';
import { evaluatePromotionReadiness, verifyPromotionDecision } from '../skills/meta/quality-contract/benchmark/promotion.mjs';
const protocolV1Bytes = await readFile(new URL('../benchmarks/vnext/protocol-v1.json', import.meta.url));
const protocolV2Bytes = await readFile(new URL('../benchmarks/vnext/protocol-v2.json', import.meta.url));
const protocolBytes = await readFile(new URL('../benchmarks/vnext/protocol-v3.json', import.meta.url));
assert.equal(createHash('sha256').update(protocolV1Bytes).digest('hex'), '5efbd71b3f8c3246af70bada2be2000ac81d674e32895cdb15190e8287d4200c');
assert.equal(createHash('sha256').update(protocolV2Bytes).digest('hex'), '8f9fda35a09533fe45f9916749f3c4ccf72517bf1953380351e3a704e480e38c');
assert.equal(createHash('sha256').update(protocolBytes).digest('hex'), '0e2e56548e99c0c7b8246efaf200b1db791ed265e761dd9ec1d4e4585a551106');
const protocolV1 = JSON.parse(protocolV1Bytes);
const protocolV2 = JSON.parse(protocolV2Bytes);
const protocol = JSON.parse(protocolBytes);
assert.equal(benchmarkDigest(protocolV1), protocolV2.supersedes_protocol_digest);
assert.equal(benchmarkDigest(protocolV2), protocol.supersedes_protocol_digest);
assert.equal(benchmarkDigest(protocol), 'sha256:5c2cf1fad8c4a3b5c984b3e926d42641965ea201c28de56b0b5c58f21414eba7');
assert.deepEqual(protocol.metric_dictionary, BENCHMARK_METRIC_DICTIONARY);
const promotion = JSON.parse(await readFile(new URL('../skills/meta/quality-contract/fixtures/vnext/promotion.json', import.meta.url), 'utf8'));
const cases = [];
const categoryCursor = { calibration: 0, unseen: 0 };
for (const segment of protocol.segments) for (const [cohort, count] of [['calibration', 5], ['unseen', 3]]) for (let i = 0; i < count; i += 1) cases.push({
  case_id: `${segment.id}-${cohort}-${i}`, segment_id: segment.id, cohort,
  categories: [protocol.required_case_categories[categoryCursor[cohort]++ % protocol.required_case_categories.length]],
  lineage_digest: `sha256:${(cohort === 'calibration' ? 'a' : 'b')}${segment.id.slice(-1)}${String(i).padStart(2, '0')}${'0'.repeat(60)}`.slice(0, 71), subject_digest: `sha256:${String(i + 1).repeat(64).slice(0, 64)}`,
  license_or_authority: 'synthetic-fixture-authority', repository_snapshot: `sha256:${'c'.repeat(64)}`, user_request: 'execute the bounded synthetic benchmark case',
  license_authority_digest: `sha256:${'3'.repeat(64)}`, source_provenance_digest: `sha256:${'4'.repeat(64)}`, retention_policy_digest: `sha256:${'5'.repeat(64)}`,
  hidden_facts: ['synthetic seeded behavior'], allowed_tools: ['node'], authority_limits: ['local disposable workspace only'], expected_decisions: ['complete'],
  acceptable_solution_properties: ['matches frozen observable behavior'], unacceptable_shortcuts: ['do not bypass the oracle'], security_traps: ['untrusted input stays inert'],
  hidden_tests: [`sha256:${'d'.repeat(64)}`], maintainability_rubric: `sha256:${'e'.repeat(64)}`, product_value_rubric: `sha256:${'f'.repeat(64)}`, review_rubric: `sha256:${'1'.repeat(64)}`,
  contamination_risk: 'low', privacy_review_digest: `sha256:${'2'.repeat(64)}`,
});
const manifest = { manifest_version: '1', protocol_digest: benchmarkDigest(protocol), evidence_class: 'synthetic-fixture', randomization_seed: 'synthetic-seed-v1', execution_order: cases.flatMap(({ case_id }) => [`${case_id}:baseline`, `${case_id}:candidate`]), assignment_digest: '', cases };
manifest.assignment_digest = benchmarkDigest({ arms: protocol.arms, randomization_seed: manifest.randomization_seed, execution_order: manifest.execution_order, assignments: cases.map(({ case_id, segment_id, cohort }) => ({ case_id, segment_id, cohort })).sort((a, b) => a.case_id.localeCompare(b.case_id)) });
function metrics(arm) {
  return {
    latency_ms: arm === 'baseline' ? 100 : 105, review_minutes: arm === 'baseline' ? 20 : 21,
    p0: 0, p1: 0, p2: 0, p3: 0, defects_total: 1, defects_escaped: 0,
    requirements_applicable: 1, requirements_misunderstood: 0, regressions_applicable: 1, regressions: 0,
    seeded_faults: 1, oracle_weaknesses: 0, unnecessary_complexity_findings: 0, review_corrections: 0,
    recovery_attempted: 1, recovery_succeeded: 1, assumptions_adjudicated: 1, escaped_assumptions: 0,
    product_decisions_applicable: 1, product_decisions_correct: 1, rework_lines: 0, change_failures: 0,
    comprehension_checks: 1, comprehension_passed: 1, slo_windows_observed: 1, slo_windows_healthy: 1,
    incidents_observed: 1, incident_regressions_created: 1,
    outcomes_eligible: 1, outcomes_achieved: 1,
  };
}
function grader(index) {
  const digit = String(index);
  return { grader_id: `grader-${index}`, grader_class: 'synthetic', identity_attestation_digest: `sha256:${digit.repeat(64)}`, qualification_class: 'synthetic benchmark grader', conflict_disclosure: 'synthetic fixture; no real independence claim', verdict: 'PASS', severity: 'P3', abstention_reason: null, blind_arm: true, blind_executor: true, pre_adjudication_digest: `sha256:${String(index + 2).repeat(64)}` };
}
const executorProfile = { executor_id: 'synthetic-executor', model_id: 'synthetic-model', model_version: '1.0.0', prompt_version: 'synthetic-prompt-v1', tool_versions: { node: process.versions.node } };
const environmentProfile = { provider: 'local-synthetic', os: process.platform, architecture: process.arch, runtime_versions: { node: process.versions.node } };
const attempts = cases.flatMap((entry) => protocol.arms.map((arm) => ({ attempt_id: `${entry.case_id}-${arm}`, case_id: entry.case_id, arm, terminal_result: 'PASS', executor_profile: structuredClone(executorProfile), executor_profile_digest: benchmarkDigest(executorProfile), environment_profile: structuredClone(environmentProfile), environment_digest: benchmarkDigest(environmentProfile), pipeline_version: arm === 'baseline' ? 'legacy' : 'vnext-opt-in', measurement: { started_at: '2026-10-02T00:00:00Z', ended_at: '2026-10-02T00:01:00Z', method: 'synthetic deterministic fixture' }, metrics: metrics(arm), metric_missing: {}, graders: [grader(1), grader(2)], adjudication: null })));
assert.equal(attempts.length, 96);
const pass = evaluateBenchmark(protocol, manifest, attempts);
assert.equal(pass.code, 'BENCHMARK_MECHANICS_PASS');
assert.equal(pass.report.benchmark_gate_passed, true); assert.equal(pass.report.human_promotion_required, true);
assert.equal(pass.report.segments[0].arms.candidate.outcome_achievement_rate, 1);
assert.equal(pass.report.segments.length, 6);
assert.equal(pass.report.category_coverage.calibration.length, 12);
assert.equal(pass.report.category_coverage.unseen.length, 12);
assert.ok(pass.report.category_coverage.unseen.every(({ cases: count }) => count > 0));
assert.deepEqual(pass.report.segments.map(({ status }) => status), Array(6).fill('PASS'));
assert.equal(normalizeBenchmark(pass.report), normalizeBenchmark(structuredClone(pass.report)));
assert.equal(pass.report.segments[0].effects.median_latency_delta_percent, 5);
assert.equal(pass.report.segments[0].effects.rate_deltas.product_decision_quality_rate, 0);
assert.equal(pass.report.segments[0].effects.rate_deltas.reviewer_comprehension_rate, 0);
assert.equal(pass.report.segments[0].effects.rate_deltas.slo_health_rate, 0);
assert.equal(pass.report.segments[0].effects.rate_deltas.incident_learning_rate, 0);
assert.deepEqual(pass.report.segments[0].arms.candidate.measurement_methods, ['synthetic deterministic fixture']);
assert.equal(pass.report.segments[0].arms.candidate.environment_profiles[0].digest, benchmarkDigest(environmentProfile));
assert.deepEqual(pass.report.segments[0].arms.candidate.environment_profiles[0].profile, environmentProfile);
assert.throws(() => benchmarkDigest({ invalid: undefined }), /non-JSON/);
const cyclicDigestInput = {}; cyclicDigestInput.self = cyclicDigestInput; assert.throws(() => benchmarkDigest(cyclicDigestInput), /cyclic/);
assert.equal(evaluateBenchmark({ ...protocol, segments: null }, manifest, attempts).code, 'BENCHMARK_PROTOCOL_INVALID');
const tamperedMetricDictionary = structuredClone(protocol); tamperedMetricDictionary.metric_dictionary.ratios[0].direction = 'higher';
assert.equal(evaluateBenchmark(tamperedMetricDictionary, manifest, attempts).code, 'BENCHMARK_PROTOCOL_INVALID');
const omittedMetricDictionary = structuredClone(protocol); delete omittedMetricDictionary.metric_dictionary;
assert.equal(evaluateBenchmark(omittedMetricDictionary, manifest, attempts).code, 'BENCHMARK_PROTOCOL_INVALID');
const duplicateSegmentProtocol = structuredClone(protocol); duplicateSegmentProtocol.segments[1].id = duplicateSegmentProtocol.segments[0].id;
assert.equal(evaluateBenchmark(duplicateSegmentProtocol, manifest, attempts).code, 'BENCHMARK_PROTOCOL_INVALID');
assert.equal(evaluateBenchmark(protocol, { ...manifest, cases: [null] }, attempts).code, 'BENCHMARK_INPUT_INVALID');
const thinManifest = structuredClone(manifest); thinManifest.cases = thinManifest.cases.filter(({ case_id }) => case_id !== 'SEG-01-calibration-0');
thinManifest.execution_order = thinManifest.execution_order.filter((entry) => !entry.startsWith('SEG-01-calibration-0:'));
thinManifest.assignment_digest = benchmarkDigest({ arms: protocol.arms, randomization_seed: thinManifest.randomization_seed, execution_order: thinManifest.execution_order, assignments: thinManifest.cases.map(({ case_id, segment_id, cohort }) => ({ case_id, segment_id, cohort })).sort((a, b) => a.case_id.localeCompare(b.case_id)) });
const thin = attempts.filter(({ case_id }) => case_id !== 'SEG-01-calibration-0');
const thinResult = evaluateBenchmark(protocol, thinManifest, thin); assert.equal(thinResult.code, 'BENCHMARK_THIN_SEGMENT'); assert.equal(thinResult.report.status, 'INSUFFICIENT'); assert.equal(thinResult.report.missing_attempts, 1);
const critical = structuredClone(attempts); const criticalAttempt = critical.find(({ attempt_id }) => attempt_id.startsWith('SEG-04') && attempt_id.endsWith('candidate')); criticalAttempt.metrics.p1 = 1;
assert.equal(evaluateBenchmark(protocol, manifest, critical).code, 'BENCHMARK_CRITICAL_SEGMENT_FAILED');
const missing = structuredClone(attempts); missing[0].metrics.latency_ms = null;
assert.equal(evaluateBenchmark(protocol, manifest, missing).code, 'BENCHMARK_INPUT_INVALID');
const explainedMissing = structuredClone(attempts); explainedMissing[0].metrics.latency_ms = null; explainedMissing[0].metric_missing.latency_ms = 'external timer unavailable';
const missingResult = evaluateBenchmark(protocol, manifest, explainedMissing); assert.equal(missingResult.code, 'BENCHMARK_REQUIRED_METRIC_MISSING'); assert.equal(missingResult.report.missing_metrics[0].reason, 'external timer unavailable');
const overlap = structuredClone(manifest); overlap.cases.find(({ cohort }) => cohort === 'unseen').lineage_digest = overlap.cases.find(({ cohort }) => cohort === 'calibration').lineage_digest;
assert.equal(evaluateBenchmark(protocol, overlap, attempts).code, 'BENCHMARK_LINEAGE_INVALID');
const missingCategory = structuredClone(manifest); for (const entry of missingCategory.cases.filter(({ cohort, categories }) => cohort === 'unseen' && categories.includes(protocol.required_case_categories[0]))) entry.categories = [protocol.required_case_categories[1]];
assert.equal(evaluateBenchmark(protocol, missingCategory, attempts).code, 'BENCHMARK_REQUIRED_CATEGORY_MISSING');
const unknownCategory = structuredClone(manifest); unknownCategory.cases[0].categories = ['not-frozen'];
assert.equal(evaluateBenchmark(protocol, unknownCategory, attempts).code, 'BENCHMARK_INPUT_INVALID');
const unknownAuthority = structuredClone(manifest); unknownAuthority.cases[0].license_or_authority = 'unknown';
assert.equal(evaluateBenchmark(protocol, unknownAuthority, attempts).code, 'BENCHMARK_INPUT_INVALID');
const secretCorpus = structuredClone(manifest); secretCorpus.cases[0].hidden_facts = ['password=do-not-retain'];
assert.equal(evaluateBenchmark(protocol, secretCorpus, attempts).code, 'BENCHMARK_INPUT_INVALID');
const tamperedAssignment = structuredClone(manifest); tamperedAssignment.randomization_seed = 'changed-after-freeze';
assert.equal(evaluateBenchmark(protocol, tamperedAssignment, attempts).code, 'BENCHMARK_INPUT_INVALID');
const adjudication = { adjudicator_id: 'adjudicator-1', conflict_disclosure: 'no grader or executor role', final_verdict: 'FAIL', final_severity: 'P2', reason: 'independent adjudicator resolved the preserved disagreement', adjudicator_attestation_digest: `sha256:${'4'.repeat(64)}` };
const tolerableDisagreement = structuredClone(attempts); tolerableDisagreement.find(({ case_id }) => case_id.startsWith('SEG-01')).graders[1].verdict = 'FAIL'; tolerableDisagreement.find(({ case_id }) => case_id.startsWith('SEG-01')).graders[1].severity = 'P2'; tolerableDisagreement.find(({ case_id }) => case_id.startsWith('SEG-01')).adjudication = structuredClone(adjudication);
const tolerableResult = evaluateBenchmark(protocol, manifest, tolerableDisagreement); assert.equal(tolerableResult.code, 'BENCHMARK_MECHANICS_PASS'); assert.ok(tolerableResult.report.segments[0].confusion_table.some(({ first_grade, other_grade }) => first_grade !== other_grade));
const calibrationDisagreement = structuredClone(attempts); for (const attempt of calibrationDisagreement.filter(({ case_id }) => case_id.startsWith('SEG-01') && case_id.includes('-calibration-'))) { attempt.graders[1].verdict = 'FAIL'; attempt.graders[1].severity = 'P2'; attempt.adjudication = structuredClone(adjudication); }
const calibrationDisagreementResult = evaluateBenchmark(protocol, manifest, calibrationDisagreement); assert.equal(calibrationDisagreementResult.code, 'BENCHMARK_MECHANICS_PASS'); assert.equal(calibrationDisagreementResult.report.segments[0].cohort_agreement.calibration.agreement_percent, 0); assert.equal(calibrationDisagreementResult.report.segments[0].cohort_agreement.unseen.agreement_percent, 100);
const disagreement = structuredClone(attempts); for (const attempt of disagreement.filter(({ case_id }) => case_id.startsWith('SEG-02'))) { attempt.graders[1].verdict = 'FAIL'; attempt.graders[1].severity = 'P2'; attempt.adjudication = structuredClone(adjudication); }
assert.equal(evaluateBenchmark(protocol, manifest, disagreement).code, 'BENCHMARK_GRADER_DISAGREEMENT');
const abstained = structuredClone(attempts); const abstainingGrade = abstained.find(({ case_id }) => case_id.startsWith('SEG-03')).graders[1]; abstainingGrade.verdict = 'ABSTAIN'; abstainingGrade.severity = null; abstainingGrade.abstention_reason = 'insufficient domain qualification';
const abstentionResult = evaluateBenchmark(protocol, manifest, abstained); assert.equal(abstentionResult.code, 'BENCHMARK_GRADER_ABSTENTION'); assert.equal(abstentionResult.report.abstentions[0].reason, 'insufficient domain qualification');
const erasedDisagreement = structuredClone(tolerableDisagreement); erasedDisagreement.find(({ case_id }) => case_id.startsWith('SEG-01')).adjudication = null;
assert.equal(evaluateBenchmark(protocol, manifest, erasedDisagreement).code, 'BENCHMARK_INPUT_INVALID');
const selfAdjudicated = structuredClone(tolerableDisagreement); selfAdjudicated.find(({ case_id }) => case_id.startsWith('SEG-01')).adjudication.adjudicator_id = 'grader-1';
assert.equal(evaluateBenchmark(protocol, manifest, selfAdjudicated).code, 'BENCHMARK_INPUT_INVALID');
const fakeField = structuredClone(manifest); fakeField.evidence_class = 'field-pilot';
assert.equal(evaluateBenchmark(protocol, fakeField, attempts).code, 'BENCHMARK_INPUT_INVALID');
const fieldShape = structuredClone(attempts); for (const attempt of fieldShape) for (const item of attempt.graders) item.grader_class = 'human';
const fieldShapePass = evaluateBenchmark(protocol, fakeField, fieldShape);
assert.equal(fieldShapePass.code, 'BENCHMARK_PASS'); assert.equal(fieldShapePass.report.benchmark_gate_passed, true); assert.equal(fieldShapePass.report.human_promotion_required, true);
const duplicateAssignment = structuredClone(attempts); duplicateAssignment.push({ ...structuredClone(attempts[0]), attempt_id: 'duplicate-assignment' });
assert.equal(evaluateBenchmark(protocol, manifest, duplicateAssignment).code, 'BENCHMARK_ASSIGNMENT_INVALID');
const qualityRegression = structuredClone(attempts); for (const attempt of qualityRegression.filter(({ case_id, arm }) => case_id.startsWith('SEG-03') && arm === 'candidate')) attempt.metrics.review_corrections = 1;
assert.equal(evaluateBenchmark(protocol, manifest, qualityRegression).code, 'BENCHMARK_GATE_FAILED');
const unseenMaskedRegression = structuredClone(attempts);
for (const attempt of unseenMaskedRegression.filter(({ case_id, arm }) => case_id.startsWith('SEG-01') && case_id.includes('-calibration-') && arm === 'baseline')) attempt.metrics.review_corrections = 1;
for (const attempt of unseenMaskedRegression.filter(({ case_id, arm }) => case_id.startsWith('SEG-01') && case_id.includes('-unseen-') && arm === 'candidate')) attempt.metrics.review_corrections = 1;
const unseenMaskedResult = evaluateBenchmark(protocol, manifest, unseenMaskedRegression);
assert.equal(unseenMaskedResult.code, 'BENCHMARK_GATE_FAILED');
assert.equal(unseenMaskedResult.report.segments[0].effects.per_attempt_count_deltas.review_corrections < 0, true, 'combined result would look better');
assert.ok(unseenMaskedResult.report.segments[0].cohort_comparisons.unseen.failures.includes('review_corrections-regression'));
const rateRegression = structuredClone(attempts); for (const attempt of rateRegression.filter(({ case_id }) => case_id.startsWith('SEG-01'))) { attempt.metrics.defects_escaped = 1; attempt.metrics.defects_total = attempt.arm === 'baseline' ? 10 : 1; }
assert.ok(evaluateBenchmark(protocol, manifest, rateRegression).report.segments[0].failures.includes('defect_escape_rate-regression'));
assert.equal(validateIsolatedRunnerAdapter({ kind: 'isolated-local-runner-v1', network: false, disposable_workspace: true, run() {} }), true);
assert.equal(validateIsolatedRunnerAdapter({ kind: 'isolated-local-runner-v1', network: true, disposable_workspace: true, run() {} }), false);
let isolatedWorkspace;
const isolatedRun = await executeIsolatedAdapter({ kind: 'isolated-local-runner-v1', network: false, disposable_workspace: true, async run({ case_path, workspace, network }) { isolatedWorkspace = workspace; await access(workspace); assert.equal(JSON.parse(await readFile(case_path, 'utf8')).subject_digest, `sha256:${'a'.repeat(64)}`); assert.equal(network, false); return { terminal_result: 'PASS', metrics: metrics('candidate'), metric_missing: {} }; } }, { case_id: 'isolated-case', arm: 'candidate', case_record: { subject_digest: `sha256:${'a'.repeat(64)}` } }, { timeout_ms: 1000, maximum_output_bytes: 4096 });
assert.equal(isolatedRun.code, 'BENCHMARK_RUN_COMPLETED'); assert.match(isolatedRun.report.measurement_digest, /^sha256:[a-f0-9]{64}$/); await assert.rejects(() => access(isolatedWorkspace));
const timedOutRun = await executeIsolatedAdapter({ kind: 'isolated-local-runner-v1', network: false, disposable_workspace: true, run({ signal }) { return new Promise((resolve) => signal.addEventListener('abort', () => resolve({ terminal_result: 'PASS', metrics: metrics('baseline'), metric_missing: {} }), { once: true })); } }, { case_id: 'timeout-case', arm: 'baseline', case_record: { bounded: true } }, { timeout_ms: 1, maximum_output_bytes: 4096 });
assert.equal(timedOutRun.code, 'BENCHMARK_RUNNER_TIMEOUT');
const oversizedRun = await executeIsolatedAdapter({ kind: 'isolated-local-runner-v1', network: false, disposable_workspace: true, async run() { return { terminal_result: 'PASS', metrics: metrics('candidate'), metric_missing: {} }; } }, { case_id: 'large-output', arm: 'candidate', case_record: { bounded: true } }, { timeout_ms: 1000, maximum_output_bytes: 32 });
assert.equal(oversizedRun.code, 'BENCHMARK_RUNNER_OUTPUT_EXCEEDED');
assert.equal((await executeIsolatedAdapter({ kind: 'isolated-local-runner-v1', network: false, disposable_workspace: true, async run() { return { raw_log: 'must not enter durable measurement' }; } }, { case_id: 'raw-output', arm: 'candidate', case_record: {} })).code, 'BENCHMARK_RUNNER_INVALID');
assert.equal((await executeIsolatedAdapter({ kind: 'isolated-local-runner-v1', network: true, disposable_workspace: true, async run() {} }, { case_id: 'bad-adapter', arm: 'candidate', case_record: {} })).code, 'BENCHMARK_RUNNER_INVALID');
assert.equal(validateGraderAdapter({ kind: 'deterministic-grader-v1', blind_arm: true, retain_pre_adjudication: true, grade() {} }), true);
assert.equal(validateGraderAdapter({ kind: 'deterministic-grader-v1', blind_arm: false, retain_pre_adjudication: true, grade() {} }), false);
const deterministicGrade = { grader_id: 'deterministic-1', grader_class: 'deterministic', identity_attestation_digest: `sha256:${'8'.repeat(64)}`, qualification_class: 'frozen deterministic rubric', conflict_disclosure: 'no mutable arm-specific input', verdict: 'PASS', severity: 'P3', abstention_reason: null, blind_arm: true, blind_executor: true, pre_adjudication_digest: `sha256:${'9'.repeat(64)}` };
const graded = await executeGraderAdapter({ kind: 'deterministic-grader-v1', blind_arm: true, retain_pre_adjudication: true, async grade({ blind_arm, blind_executor }) { assert.equal(blind_arm, true); assert.equal(blind_executor, true); return deterministicGrade; } }, { artifact_digest: `sha256:${'a'.repeat(64)}`, rubric_digest: `sha256:${'b'.repeat(64)}`, normalized_artifact: { behavior: 'bounded' } });
assert.equal(graded.code, 'BENCHMARK_GRADER_COMPLETED'); assert.match(graded.report.grade_digest, /^sha256:[a-f0-9]{64}$/);
const badGrade = structuredClone(deterministicGrade); badGrade.blind_arm = false;
assert.equal((await executeGraderAdapter({ kind: 'deterministic-grader-v1', blind_arm: true, retain_pre_adjudication: true, async grade() { return badGrade; } }, { artifact_digest: `sha256:${'a'.repeat(64)}`, rubric_digest: `sha256:${'b'.repeat(64)}`, normalized_artifact: {} })).code, 'BENCHMARK_GRADER_ADAPTER_INVALID');
assert.equal((await executeGraderAdapter({ kind: 'deterministic-grader-v1', blind_arm: true, retain_pre_adjudication: true, grade({ signal }) { return new Promise((resolve) => signal.addEventListener('abort', () => resolve(deterministicGrade), { once: true })); } }, { artifact_digest: `sha256:${'a'.repeat(64)}`, rubric_digest: `sha256:${'b'.repeat(64)}`, normalized_artifact: {} }, { timeout_ms: 1, maximum_output_bytes: 1024 })).code, 'BENCHMARK_GRADER_ADAPTER_TIMEOUT');
assert.equal(evaluatePromotionReadiness(promotion.pending).code, 'PILOT_EVIDENCE_INCOMPLETE');
const syntheticBenchmarkPacket = structuredClone(promotion.pending); syntheticBenchmarkPacket.benchmark.evidence_class = 'synthetic-fixture'; syntheticBenchmarkPacket.benchmark.code = 'BENCHMARK_MECHANICS_PASS';
assert.equal(evaluatePromotionReadiness(syntheticBenchmarkPacket).code, 'PILOT_BENCHMARK_NOT_FIELD');
const completeShape = promotion.synthetic_complete_shape;
assert.equal(evaluatePromotionReadiness(completeShape).code, 'PILOT_AUTHORITY_ATTESTATION_REQUIRED');
const awaitingHuman = structuredClone(completeShape); awaitingHuman.authority = null; awaitingHuman.decision = null; awaitingHuman.rationale = null; awaitingHuman.decided_at = null;
assert.equal(evaluatePromotionReadiness(awaitingHuman).code, 'PILOT_HUMAN_DECISION_REQUIRED');
const partialDecision = structuredClone(completeShape); partialDecision.rationale = null;
assert.equal(evaluatePromotionReadiness(partialDecision).code, 'PILOT_PROMOTION_SCHEMA_INVALID');
assert.equal((await verifyPromotionDecision(completeShape, { kind: 'external-promotion-authority-v1', async verify() { return { ok: true }; } })).code, 'PILOT_AUTHORITY_ATTESTATION_INVALID');
const packetDigest = benchmarkDigest(completeShape);
const verifiedDecision = await verifyPromotionDecision(completeShape, { kind: 'external-promotion-authority-v1', async verify() { return { ok: true, packet_digest: packetDigest, envelope_digest: `sha256:${'e'.repeat(64)}`, actor_id: completeShape.authority.actor_id, decision: completeShape.decision }; } });
assert.equal(verifiedDecision.code, 'PILOT_PROMOTION_DECISION_VALID'); assert.equal(verifiedDecision.may_promote_default, false);
const promoteShape = structuredClone(completeShape); promoteShape.decision = 'promote';
const promoteDigest = benchmarkDigest(promoteShape);
const promoted = await verifyPromotionDecision(promoteShape, { kind: 'external-promotion-authority-v1', async verify() { return { ok: true, packet_digest: promoteDigest, envelope_digest: `sha256:${'f'.repeat(64)}`, actor_id: promoteShape.authority.actor_id, decision: 'promote' }; } });
assert.equal(promoted.may_promote_default, true);
const cliUsage = spawnSync(process.execPath, [fileURLToPath(new URL('../benchmarks/vnext/run.mjs', import.meta.url))], { encoding: 'utf8' });
assert.equal(cliUsage.status, 2); assert.equal(JSON.parse(cliUsage.stdout).code, 'BENCHMARK_INPUT_INVALID');
console.log('vnext benchmark: 96/96 synthetic attempts; 6/6 segments MECHANICS PASS (not promotion evidence)');
