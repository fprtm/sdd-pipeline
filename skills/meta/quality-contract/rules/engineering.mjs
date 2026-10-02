const DIMENSIONS = Object.freeze(['architecture-fitness', 'dependency-api-compatibility', 'migration-reversibility', 'maintainability', 'performance-budget', 'operability']);
const ASSURANCE = ['A0', 'A1', 'A2', 'A3'];
const LEVELS = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const PROVENANCE = ['self-reported', 'tool-attested', 'independently-attested', 'externally-attested'];
const ENVIRONMENTAL_A3 = new Set(['migration-reversibility', 'performance-budget', 'operability']);
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;

function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function bounded(value) { return typeof value === 'string' && value.length > 0 && Buffer.byteLength(value, 'utf8') <= 4096 && value === value.normalize('NFC'); }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function evidenceFloor(assurance, dimension) {
  if (assurance === 'A0') return 'E1';
  if (assurance === 'A1') return 'E2';
  if (assurance === 'A2') return 'E3';
  return ENVIRONMENTAL_A3.has(dimension) ? 'E5' : 'E4';
}
function output(status, code, cause, checks, remediation) {
  const gaps = checks.filter(({ status: state }) => state !== 'pass').map(({ dimension, status: state }) => ({ dimension, status: state }));
  return freeze({ status, code, cause, risk: gaps.length ? 'high' : 'medium', owner: 'architect', remediation, checks: structuredClone(checks), gaps, may_accept: false });
}

function valid(input) {
  if (!exact(input, ['engineering_profile_version', 'profile_id', 'subject_digest', 'assurance', 'checks'])) return false;
  if (input.engineering_profile_version !== '1' || !ID.test(input.profile_id || '') || !DIGEST.test(input.subject_digest || '') || !ASSURANCE.includes(input.assurance)) return false;
  if (!Array.isArray(input.checks) || input.checks.length !== DIMENSIONS.length || new Set(input.checks.map(({ dimension }) => dimension)).size !== DIMENSIONS.length || !DIMENSIONS.every((dimension) => input.checks.some((item) => item.dimension === dimension))) return false;
  return input.checks.every((item) => exact(item, ['dimension', 'applicable', 'applicability_rationale', 'criterion', 'status', 'evidence_level', 'evidence_digest', 'environment_digest', 'producer_actor', 'verifier_actor', 'provenance']) && DIMENSIONS.includes(item.dimension) && typeof item.applicable === 'boolean' && bounded(item.applicability_rationale) && bounded(item.criterion) && ['not-required', 'pass', 'fail'].includes(item.status) && LEVELS.includes(item.evidence_level) && (item.evidence_digest === null || DIGEST.test(item.evidence_digest || '')) && (item.environment_digest === null || DIGEST.test(item.environment_digest || '')) && ID.test(item.producer_actor || '') && ID.test(item.verifier_actor || '') && PROVENANCE.includes(item.provenance));
}

/** Evaluate all six engineering concerns as shadow evidence; lifecycle authority remains external. */
export function evaluateEngineeringProfile(input = {}) {
  if (!valid(input)) return output('fail', 'ENGINEERING_SCHEMA_INVALID', 'engineering profile does not match strict v1 schema', [], 'supply every engineering dimension with explicit applicability, criterion, subject-bound evidence, and provenance');
  for (const check of input.checks) {
    if (!check.applicable) {
      if (check.status !== 'not-required' || check.evidence_level !== 'E0' || check.evidence_digest !== null || check.environment_digest !== null) return output('fail', 'ENGINEERING_STATUS_INVALID', `${check.dimension} is inapplicable but its evidence state is inconsistent`, input.checks, 'record inapplicable dimensions as not-required with E0 and no evidence/environment digest');
      continue;
    }
    if (!['pass', 'fail'].includes(check.status) || !check.evidence_digest) return output('fail', 'ENGINEERING_EVIDENCE_MISSING', `${check.dimension} is applicable without an executed verdict and evidence`, input.checks, 'record pass/fail evidence for every applicable engineering dimension');
    const floor = evidenceFloor(input.assurance, check.dimension);
    if (LEVELS.indexOf(check.evidence_level) < LEVELS.indexOf(floor)) return output('blocked', 'ENGINEERING_EVIDENCE_LEVEL_INSUFFICIENT', `${check.dimension} evidence is below the ${floor} floor for ${input.assurance}`, input.checks, 'raise the evidence level without changing the frozen criterion');
    if (LEVELS.indexOf(check.evidence_level) >= LEVELS.indexOf('E5') && !check.environment_digest) return output('blocked', 'ENGINEERING_ENVIRONMENT_MISSING', `${check.dimension} claims E5/E6 without an environment binding`, input.checks, 'bind realistic or field evidence to the observed environment');
    if (['A2', 'A3'].includes(input.assurance) && check.provenance === 'self-reported') return output('blocked', 'ENGINEERING_EVIDENCE_WEAK', `${check.dimension} is self-reported at ${input.assurance}`, input.checks, 'use tool, independent, or external attestation appropriate to the criterion');
    if (['A2', 'A3'].includes(input.assurance) && check.producer_actor === check.verifier_actor) return output('blocked', 'ENGINEERING_VERIFIER_NOT_INDEPENDENT', `${check.dimension} is self-verified at ${input.assurance}`, input.checks, 'assign a distinct verifier and regenerate exact-subject evidence');
    if (check.status === 'fail') return output('fail', 'ENGINEERING_CHECK_FAILED', `${check.dimension} failed its frozen criterion`, input.checks, 'rework the candidate or explicitly revise the criterion through the approved change path');
  }
  return output('pass', 'ENGINEERING_PROFILE_VALID', 'all applicable engineering dimensions meet their assurance-derived evidence floor', input.checks, 'submit this non-authoritative profile with the delivery verifier packet');
}

export { DIMENSIONS as ENGINEERING_DIMENSIONS };
