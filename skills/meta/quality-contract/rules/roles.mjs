const DIGEST = /^sha256:[0-9a-f]{64}$/;
const TIME = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/;
const ASSURANCE = ['A0', 'A1', 'A2', 'A3'];
const QUALIFICATION = ['asserted', 'harness-attested', 'externally-attested'];
const ROLES = ['product-owner', 'ux-research', 'architect', 'implementer', 'verifier', 'security-reviewer', 'sre', 'release-authority', 'outcome-owner'];
const TRANSITION_OWNER = Object.freeze({
  'intake-valid': 'product-owner', 'problem-fit': 'product-owner', 'solution-fit': 'product-owner', 'design-ready': 'architect', 'ready-to-build': 'architect',
  'release-candidate': 'verifier', 'release-authorized': 'release-authority', 'outcome-reviewed': 'outcome-owner', 'exception-accepted': 'product-owner',
});
function contract(owns, may_approve, may_block, must_not_self_approve, required_inputs, required_outputs, required_evidence, escalates_when, fallback_when_unavailable) {
  return { owns, may_approve, may_block, must_not_self_approve, required_inputs, required_outputs, required_evidence, escalates_when, fallback_when_unavailable };
}
const DEFAULTS = {
  'product-owner': contract(['problem', 'target-user', 'outcome', 'priority', 'assumptions', 'hypothesis', 'opportunity-cost'], ['intake-valid', 'problem-fit', 'solution-fit', 'scope'], ['unsupported-value', 'unresolved-product-risk'], ['technical-safety', 'qa-evidence', 'production-readiness'], ['source-evidence', 'affected-surface'], ['problem-statement', 'thresholds', 'non-goals'], ['problem-evidence', 'decision-rationale'], ['material-assumption-open', 'opportunity-cost-unknown'], 'block-product-transition'),
  'ux-research': contract(['user-evidence', 'interaction-assumptions', 'usability', 'accessibility-intent', 'user-harm'], ['ux-evidence'], ['user-harm', 'unusable-flow'], ['backend-correctness', 'release-safety'], ['target-user', 'research-scope'], ['user-findings', 'accessibility-intent'], ['research-evidence'], ['unconsented-research', 'material-user-harm'], 'record-degraded-user-evidence'),
  architect: contract(['architecture-fitness', 'component-boundaries', 'compatibility', 'reversibility', 'migration-strategy', 'performance-budget', 'maintainability', 'operability'], ['design-ready', 'ready-to-build'], ['irreversible-design-gap', 'compatibility-break'], ['product-outcome', 'security-exception', 'production-release'], ['requirements', 'constraints', 'risk-profile'], ['architecture', 'migration', 'rollback', 'performance-budget'], ['fitness-evidence', 'compatibility-evidence'], ['irreversible-choice-unresolved'], 'block-design-transition'),
  implementer: contract(['implementation', 'local-tests', 'deviations', 'code-comprehension', 'bounded-change'], ['local-completion'], ['unimplementable-contract'], ['changed-criteria', 'independent-verification', 'A2-A3-acceptance'], ['approved-work-packet', 'acceptance-criteria'], ['candidate', 'tests', 'deviations', 'comprehension-evidence'], ['executed-local-evidence'], ['scope-or-contract-conflict'], 'return-to-planning'),
  verifier: contract(['product-risk', 'condition-matrix', 'oracle', 'negative-tests', 'regression', 'residual-risk'], ['release-candidate'], ['insufficient-evidence', 'oracle-weakness'], ['materially-self-implemented-work'], ['frozen-candidate', 'verification-plan'], ['verifier-packet', 'residual-risk'], ['independent-executed-evidence'], ['required-tool-unavailable', 'material-defect'], 'block-acceptance'),
  'security-reviewer': contract(['threats', 'abuse-cases', 'security-controls', 'dependency-provenance', 'exceptions'], ['security-evidence'], ['unmitigated-high-critical', 'expired-exception'], ['own-control-exception', 'business-risk'], ['threat-model', 'candidate', 'provenance'], ['security-verdict', 'exception-review'], ['executable-security-evidence'], ['critical-control-missing'], 'block-security-transition'),
  sre: contract(['slo', 'error-budget', 'observability', 'release-safety', 'capacity', 'backup-restore', 'incident-readiness', 'recovery'], ['operational-readiness'], ['recovery-unproven', 'capacity-unsafe'], ['product-value', 'production-release'], ['candidate', 'slo', 'environment'], ['readiness', 'runbook', 'rollback'], ['operational-evidence'], ['slo-or-recovery-unsafe'], 'block-readiness'),
  'release-authority': contract(['candidate', 'environment', 'window', 'rollback-authority', 'production-decision'], ['release-authorized'], ['readiness-insufficient', 'window-unsafe'], ['readiness-evidence'], ['immutable-candidate', 'readiness-result'], ['single-use-authorization'], ['external-human-approval'], ['target-or-candidate-changed'], 'remain-release-candidate'),
  'outcome-owner': contract(['product-technical-outcome'], ['outcome-reviewed'], ['outcome-evidence-missing'], ['post-result-threshold-change'], ['observation-plan', 'product-signals', 'technical-signals'], ['keep-iterate-rollback-retire'], ['bounded-outcome-evidence'], ['product-technical-conflict'], 'keep-observing'),
};

function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
export const DEFAULT_ROLE_CONTRACTS = freeze(structuredClone(DEFAULTS));
function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function ids(value, allowed = null) { return Array.isArray(value) && value.length <= 32 && new Set(value).size === value.length && value.every((item) => typeof item === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(item) && (!allowed || allowed.includes(item))); }
function finding(status, code, cause, remediation) { return freeze({ status, code, cause, risk: 'high', owner: 'role-authority', remediation }); }

function assignmentValid(value) {
  return exact(value, ['role_id', 'actor_id', 'work_subject_digest', 'qualification_class', 'valid_from', 'expires_at', 'issuer', 'conflicts', 'attestation_digest'])
    && ROLES.includes(value.role_id) && typeof value.actor_id === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value.actor_id)
    && DIGEST.test(value.work_subject_digest || '') && QUALIFICATION.includes(value.qualification_class)
    && TIME.test(value.valid_from || '') && TIME.test(value.expires_at || '') && Date.parse(value.valid_from) < Date.parse(value.expires_at)
    && typeof value.issuer === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value.issuer) && ids(value.conflicts) && DIGEST.test(value.attestation_digest || '');
}

function schemaValid(input) {
  return exact(input, ['role_schema_version', 'work_subject_digest', 'assurance', 'transition', 'evaluated_at', 'implementer_actor_id', 'security_sensitive', 'required_roles', 'optional_roles', 'assignments'])
    && input.role_schema_version === '1' && DIGEST.test(input.work_subject_digest || '') && ASSURANCE.includes(input.assurance)
    && Object.hasOwn(TRANSITION_OWNER, input.transition) && TIME.test(input.evaluated_at || '') && Number.isFinite(Date.parse(input.evaluated_at))
    && typeof input.implementer_actor_id === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(input.implementer_actor_id)
    && typeof input.security_sensitive === 'boolean' && ids(input.required_roles, ROLES) && ids(input.optional_roles, ROLES)
    && input.required_roles.every((role) => !input.optional_roles.includes(role)) && Array.isArray(input.assignments) && input.assignments.length <= 64
    && input.assignments.every(assignmentValid);
}

/** Evaluate accountable role coverage without creating identity or authority. */
export function evaluateRoleAuthority(input = {}) {
  if (!schemaValid(input)) return freeze({ status: 'fail', code: 'ROLE_SCHEMA_INVALID', cause: 'role authority input does not match strict v1 schema', assignments: [], missing_roles: [], conflicts: [], shadow: { may_approve: false, may_release: false } });
  const now = Date.parse(input.evaluated_at);
  const relevant = input.assignments.filter(({ role_id }) => input.required_roles.includes(role_id) || input.optional_roles.includes(role_id) || role_id === TRANSITION_OWNER[input.transition]);
  const subjectMismatch = relevant.find(({ work_subject_digest }) => work_subject_digest !== input.work_subject_digest);
  if (subjectMismatch) return freeze({ ...finding('blocked', 'ROLE_SUBJECT_MISMATCH', `${subjectMismatch.role_id} assignment targets another subject`, 'reissue assignment for the exact work subject'), assignments: relevant, missing_roles: [], conflicts: [], shadow: { may_approve: false, may_release: false } });
  const stale = relevant.find(({ valid_from, expires_at }) => now < Date.parse(valid_from) || now >= Date.parse(expires_at));
  if (stale) return freeze({ ...finding('blocked', 'ROLE_ASSIGNMENT_STALE', `${stale.role_id} assignment is not live`, 'supply a live non-revoked assignment'), assignments: relevant, missing_roles: [], conflicts: [], shadow: { may_approve: false, may_release: false } });

  const required = new Set([...input.required_roles, TRANSITION_OWNER[input.transition]]);
  if (input.assurance === 'A2' || input.assurance === 'A3') required.add('verifier');
  if (input.security_sensitive && (input.assurance === 'A2' || input.assurance === 'A3')) required.add('security-reviewer');
  if (input.transition === 'release-authorized') required.add('release-authority');
  const byRole = new Map(relevant.map((assignment) => [assignment.role_id, assignment]));
  const missing = [...required].filter((role) => !byRole.has(role));
  if (missing.length) return freeze({ ...finding('blocked', 'ROLE_AUTHORITY_MISSING', `required roles are missing: ${missing.join(', ')}`, 'assign every assurance-required role or remain report-only'), assignments: relevant, missing_roles: missing, conflicts: [], shadow: { may_approve: false, may_release: false } });

  const independentRoles = ['verifier', 'security-reviewer', 'release-authority'].filter((role) => byRole.has(role));
  const selfApproval = independentRoles.find((role) => byRole.get(role).actor_id === input.implementer_actor_id);
  if (selfApproval && (input.assurance === 'A2' || input.assurance === 'A3')) return freeze({ ...finding('blocked', 'ROLE_SELF_APPROVAL', `${selfApproval} is the implementer`, 'assign an independent actor subject'), assignments: relevant, missing_roles: [], conflicts: [selfApproval], shadow: { may_approve: false, may_release: false } });
  const declaredConflict = relevant.find(({ conflicts }) => conflicts.includes('self-approval') || conflicts.includes('same-control-implementer'));
  if (declaredConflict && (input.assurance === 'A2' || input.assurance === 'A3')) return freeze({ ...finding('blocked', 'ROLE_CONFLICT', `${declaredConflict.role_id} has an incompatible declared conflict`, 'resolve the conflict with a distinct qualified assignment'), assignments: relevant, missing_roles: [], conflicts: declaredConflict.conflicts, shadow: { may_approve: false, may_release: false } });

  const minimumQualification = input.assurance === 'A3' ? 'externally-attested' : input.assurance === 'A2' ? 'harness-attested' : 'asserted';
  const minimumRank = QUALIFICATION.indexOf(minimumQualification);
  const insufficient = [...required].map((role) => byRole.get(role)).find(({ qualification_class }) => QUALIFICATION.indexOf(qualification_class) < minimumRank);
  if (insufficient) return freeze({ ...finding('blocked', 'ROLE_ATTESTATION_INSUFFICIENT', `${insufficient.role_id} is only ${insufficient.qualification_class}`, `supply ${minimumQualification} assignment evidence`), assignments: relevant, missing_roles: [], conflicts: [], shadow: { may_approve: false, may_release: false } });

  const a1SelfReview = input.assurance === 'A1' && independentRoles.some((role) => byRole.get(role).actor_id === input.implementer_actor_id);
  const result = a1SelfReview
    ? finding('degraded', 'ROLE_AUTHORITY_DEGRADED', 'A1 multi-hat work lacks independent verification', 'record human review items or assign a distinct verifier')
    : finding('pass', 'ROLE_AUTHORITY_VALID', 'required live role assignments satisfy the assurance separation policy', 'retain exact-subject assignments');
  return freeze({ ...result, assignments: relevant, missing_roles: [], conflicts: a1SelfReview ? ['multi-hat-self-review'] : [], shadow: { may_approve: false, may_release: false } });
}
