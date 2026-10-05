const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/;
const OPERATIONAL = Object.freeze({ A0: [], A1: ['observability'], A2: ['slo', 'error_budget', 'observability', 'alerting', 'rollout', 'rollback', 'schema_compatibility', 'backup'], A3: ['slo', 'error_budget', 'observability', 'alerting', 'rollout', 'rollback', 'schema_compatibility', 'backup', 'restore', 'incident_runbook', 'capacity'] });
function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function result(status, code, cause, missing, remediation) { return freeze({ status, code, cause, risk: status === 'pass' ? 'medium' : 'critical', owner: 'security-sre-readiness', remediation, missing_evidence: missing, production_authority: 'external-required', may_release: false }); }
function valid(input) {
  if (!exact(input, ['readiness_version', 'subject_digest', 'assurance', 'standards', 'controls', 'exceptions', 'artifacts', 'operations', 'production_authority_external'])) return false;
  if (input.readiness_version !== '2' || !DIGEST.test(input.subject_digest || '') || !['A0', 'A1', 'A2', 'A3'].includes(input.assurance) || input.production_authority_external !== true) return false;
  if (!exact(input.standards, ['ssdf', 'asvs', 'samm']) || input.standards.ssdf !== 'NIST-SP-800-218-v1.1-final' || input.standards.asvs !== 'OWASP-ASVS-v5.0.0' || input.standards.samm !== 'OWASP-SAMM-v2.0') return false;
  if (!Array.isArray(input.controls) || input.controls.length > 256 || new Set(input.controls.map(({ id }) => id)).size !== input.controls.length || !input.controls.every((item) => exact(item, ['id', 'severity', 'executable_required', 'evidence_digest', 'evidence_status', 'mappings']) && ID.test(item.id || '') && ['low', 'medium', 'high', 'critical'].includes(item.severity) && typeof item.executable_required === 'boolean' && (item.evidence_digest === null || DIGEST.test(item.evidence_digest || '')) && ['pass', 'fail', 'skipped'].includes(item.evidence_status) && exact(item.mappings, ['ssdf', 'asvs', 'samm']) && Object.values(item.mappings).every((value) => Array.isArray(value) && value.length > 0 && value.every((ref) => ID.test(ref || ''))))) return false;
  if (!Array.isArray(input.exceptions) || input.exceptions.length > 256 || new Set(input.exceptions.map(({ control_id }) => control_id)).size !== input.exceptions.length || !input.exceptions.every((item) => exact(item, ['control_id', 'owner_role', 'subject_digest', 'issued_at', 'expires_at', 'status', 'approval_digest']) && ID.test(item.control_id || '') && item.owner_role === 'security-owner' && DIGEST.test(item.subject_digest || '') && ISO.test(item.issued_at || '') && ISO.test(item.expires_at || '') && ['active', 'expired', 'revoked'].includes(item.status) && DIGEST.test(item.approval_digest || ''))) return false;
  if (!exact(input.artifacts, ['sbom_digest', 'provenance_digest', 'signature_status']) || ![input.artifacts.sbom_digest, input.artifacts.provenance_digest].every((value) => value === null || DIGEST.test(value || '')) || !['pass', 'fail', 'unsupported'].includes(input.artifacts.signature_status)) return false;
  return exact(input.operations, ['slo', 'error_budget', 'observability', 'alerting', 'rollout', 'rollback', 'schema_compatibility', 'backup', 'restore', 'incident_runbook', 'capacity']) && Object.values(input.operations).every((value) => value === null || DIGEST.test(value || ''));
}

/** Evaluate evidence-bound security and operational readiness. Never grants production authority. */
export function evaluateReadiness(input = {}, { trustedNowMs } = {}) {
  if (!valid(input) || !Number.isFinite(trustedNowMs)) return result('fail', 'READINESS_SCHEMA_INVALID', 'readiness input or trusted evaluation time is invalid', [], 'supply strict v2 input and time from a trusted external clock');
  for (const exception of input.exceptions) {
    if (exception.subject_digest !== input.subject_digest) return result('blocked', 'READINESS_EXCEPTION_SUBJECT_MISMATCH', `exception for ${exception.control_id} targets another subject`, [], 'reissue the exception for the exact candidate or remove it');
    if (exception.status === 'active' && Date.parse(exception.expires_at) <= trustedNowMs) return result('blocked', 'READINESS_EXCEPTION_EXPIRED', `exception for ${exception.control_id} expired`, [], 'close or re-authorize the exception through external security authority');
  }
  const missingControls = input.controls.filter(({ severity, executable_required, evidence_digest, evidence_status }) => ['high', 'critical'].includes(severity) && (!executable_required || !evidence_digest || evidence_status !== 'pass')).map(({ id }) => `control:${id}`);
  if (missingControls.length) {
    const active = input.exceptions.find(({ control_id, status }) => status === 'active' && missingControls.includes(`control:${control_id}`));
    return result('blocked', active ? 'READINESS_EXCEPTION_ACTIVE' : 'READINESS_CONTROL_EVIDENCE_MISSING', active ? `active exception for ${active.control_id} is visible but cannot make High/Critical control green` : 'High/Critical control lacks passing executable evidence', missingControls, 'produce executable candidate-bound evidence; exceptions remain non-green risk decisions');
  }
  const missing = OPERATIONAL[input.assurance].filter((key) => !input.operations[key]).map((key) => `operations:${key}`);
  if (['A2', 'A3'].includes(input.assurance) && !input.artifacts.sbom_digest) missing.push('artifact:sbom');
  if (['A2', 'A3'].includes(input.assurance) && !input.artifacts.provenance_digest) missing.push('artifact:provenance');
  if (input.assurance === 'A3' && input.artifacts.signature_status !== 'pass') missing.push('artifact:signature');
  if (missing.length) return result('blocked', 'READINESS_OPERATIONAL_EVIDENCE_MISSING', 'mandatory supply-chain or operational evidence is missing', missing.sort(), 'produce each assurance-required artifact and operational proof');
  return result('pass', 'READINESS_VALID', 'security controls and assurance-derived operational evidence are present for this subject', [], 'request a separate externally authorized release decision');
}
