import { canonicalJson, digest, validateContract } from '../parser.mjs';
import { verifyExecutionAuthorityEvent } from '../trusted-events.mjs';

export const PROJECTION_VERSION = '1';

const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;

function result(ok, code, cause, details = {}) {
  return { ok, code, cause, ...details };
}

function equal(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function isObject(value) {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function boundedString(value, max = 4096) {
  return typeof value === 'string' && value === value.normalize('NFC') && Buffer.byteLength(value, 'utf8') <= max;
}

function validPath(value) {
  return boundedString(value, 1024) && value.length > 0 && !value.startsWith('/') && !value.includes('\0') && !value.split('/').includes('..');
}

function unique(items, value) {
  return new Set(items.map(value)).size === items.length;
}

function contractFrom(input) {
  if (input?.ok !== true || !isObject(input.contract) || !DIGEST.test(input.contract_digest) || input.contract_digest !== digest(input.contract)) return null;
  try { validateContract(input.contract); } catch { return null; }
  return input;
}

function selectAcRecords(contract, acIds) {
  const criteria = new Map(contract.acceptance_criteria.map((item) => [item.id, item]));
  const maps = new Map(contract.ac_evidence_map.map((item) => [item.ac_id, item]));
  return acIds.map((id) => ({ acceptance_criterion: criteria.get(id), evidence_map: maps.get(id) }));
}

function validExecutionPayload(value) {
  if (!isObject(value) || Object.keys(value).length !== 2 || !Object.hasOwn(value, 'baseline') || !Object.hasOwn(value, 'stop_conditions')) return false;
  const { baseline, stop_conditions } = value;
  if (!isObject(baseline) || Object.keys(baseline).length !== 2 || !DIGEST.test(baseline.argv_digest) || typeof baseline.expected_exit_code !== 'string' || !/^(0|[1-9][0-9]{0,9})$/.test(baseline.expected_exit_code)) return false;
  if (!Array.isArray(stop_conditions) || stop_conditions.length === 0 || stop_conditions.length > 256 || !unique(stop_conditions, (item) => item?.code)) return false;
  return stop_conditions.every((item) => isObject(item)
    && Object.keys(item).length === 2
    && typeof item.code === 'string' && ID.test(item.code)
    && boundedString(item.remediation));
}

function executionPayload(value) {
  return validExecutionPayload(value) ? value : null;
}

function materializationInput(input) {
  if (!isObject(input) || !boundedString(input.ticket_id, 128) || !ID.test(input.ticket_id)) return null;
  return executionPayload(input.execution_payload);
}

function materializeProjection(parsed, input, payload) {
  const { contract } = parsed;
  const acIds = input.ac_ids === undefined ? contract.acceptance_criteria.map((item) => item.id) : input.ac_ids;
  if (!Array.isArray(acIds) || acIds.length === 0 || !unique(acIds, (id) => id) || acIds.some((id) => typeof id !== 'string' || !contract.acceptance_criteria.some((item) => item.id === id))) {
    throw new TypeError('ac_ids must be a non-empty unique subset of canonical acceptance criteria');
  }
  const ac_subset = selectAcRecords(contract, acIds);
  if (ac_subset.some((item) => !item.acceptance_criterion || !item.evidence_map)) throw new TypeError('every projected AC requires one canonical evidence map');
  return {
    projection_version: PROJECTION_VERSION,
    contract_digest: parsed.contract_digest,
    ticket_id: input.ticket_id,
    goal: contract.goal,
    risk: contract.risk,
    tier: contract.tier,
    executor_class: contract.executor_class,
    base_subject: contract.base_subject,
    allowed_paths: structuredClone(contract.scope.allowed_paths),
    forbidden_paths: structuredClone(contract.scope.forbidden_paths),
    landmarks: structuredClone(contract.landmarks),
    baseline: structuredClone(payload.baseline),
    stop_conditions: structuredClone(payload.stop_conditions),
    execution_digest: digest(payload),
    ac_subset,
    ac_subset_digest: digest(ac_subset),
  };
}

async function verifiedExecutionAuthority(event, verificationOptions, parsed, projection, payload) {
  const verified = await verifyExecutionAuthorityEvent(event, {
    ...verificationOptions,
    expected_exit_code: payload.baseline.expected_exit_code,
    stop_conditions: payload.stop_conditions,
  });
  if (!verified.ok) return result(false, verified.code, verified.cause);
  const { event: trustedEvent, execution_authority: authority } = verified;
  const projection_digest = digest(projection);
  if (authority.execution_digest !== digest(payload)
    || trustedEvent.subjects.contract_digest !== parsed.contract_digest
    || trustedEvent.subjects.projection_digest !== projection_digest
    || trustedEvent.subjects.base_digest !== parsed.contract.base_subject
    || trustedEvent.argv_digest !== payload.baseline.argv_digest
    || trustedEvent.snapshot !== authority.execution_digest) {
    return result(false, 'PROJECTION_EXECUTION_EVENT_MISMATCH', 'trusted execution event does not bind this exact contract, projection, baseline, and stop-condition payload');
  }
  return result(true, 'PROJECTION_EXECUTION_EVENT_VALID', 'externally verified event binds exact execution authority', { authority, event: trustedEvent });
}

/**
 * Materialize an immutable worker-facing view. All authority-bearing values
 * are copied from the canonical contract, never accepted from caller input.
 */
export function projectionBindingDigest(contractInput, input = {}) {
  const parsed = contractFrom(contractInput);
  const payload = materializationInput(input);
  if (!parsed || !payload) throw new TypeError('projection binding requires a parsed canonical contract, valid ticket_id, and complete execution payload');
  return digest(materializeProjection(parsed, input, payload));
}

/** Materialization succeeds only with an externally verified authority event. */
export async function createProjection(contractInput, input = {}, event, verificationOptions = {}) {
  const parsed = contractFrom(contractInput);
  const payload = materializationInput(input);
  if (!parsed || !payload) throw new TypeError('createProjection requires a parsed canonical contract, valid ticket_id, and complete execution payload');
  const projection = materializeProjection(parsed, input, payload);
  const authority = await verifiedExecutionAuthority(event, verificationOptions, parsed, projection, payload);
  if (!authority.ok) throw new TypeError(`${authority.code}: ${authority.cause}`);
  return projection;
}

function validateShape(projection) {
  if (!isObject(projection)) return result(false, 'PROJECTION_FIELD_TYPE', 'projection must be an object');
  const keys = [
    'projection_version', 'contract_digest', 'ticket_id', 'goal', 'risk', 'tier', 'executor_class', 'base_subject',
    'allowed_paths', 'forbidden_paths', 'landmarks', 'baseline', 'stop_conditions', 'execution_digest', 'ac_subset', 'ac_subset_digest',
  ];
  if (Object.keys(projection).length !== keys.length || !keys.every((key) => Object.hasOwn(projection, key))) {
    return result(false, 'PROJECTION_REQUIRED_FIELD', 'projection has missing or unknown fields');
  }
  if (projection.projection_version !== PROJECTION_VERSION) return result(false, 'VERSION_UNSUPPORTED', 'projection version is unsupported');
  if (!DIGEST.test(projection.contract_digest) || !DIGEST.test(projection.ac_subset_digest)) return result(false, 'PROJECTION_FIELD_TYPE', 'projection digests must be SHA-256 digests');
  if (!boundedString(projection.ticket_id, 128) || !ID.test(projection.ticket_id)) return result(false, 'PROJECTION_FIELD_TYPE', 'ticket_id is invalid');
  if (!boundedString(projection.goal) || !boundedString(projection.base_subject, 71) || !DIGEST.test(projection.base_subject)) return result(false, 'PROJECTION_FIELD_TYPE', 'goal or base_subject is invalid');
  if (!['low', 'medium', 'high'].includes(projection.risk) || !['T1', 'T2', 'T3'].includes(projection.tier) || !['low_cost', 'capable', 'specialist'].includes(projection.executor_class)) {
    return result(false, 'PROJECTION_FIELD_TYPE', 'risk, tier, or executor class is invalid');
  }
  if (!Array.isArray(projection.allowed_paths) || !Array.isArray(projection.forbidden_paths) || projection.allowed_paths.some((path) => !validPath(path)) || projection.forbidden_paths.some((path) => !validPath(path))) {
    return result(false, 'PROJECTION_FIELD_TYPE', 'projection scope paths are invalid');
  }
  if (!Array.isArray(projection.landmarks) || !unique(projection.landmarks, (item) => item?.path) || projection.landmarks.some((item) => !isObject(item) || !['existing', 'new'].includes(item.kind) || !validPath(item.path) || !DIGEST.test(item.shape_digest))) {
    return result(false, 'PROJECTION_FIELD_TYPE', 'projection landmarks are invalid or ambiguous');
  }
  const execution_payload = { baseline: projection.baseline, stop_conditions: projection.stop_conditions };
  if (!validExecutionPayload(execution_payload) || !DIGEST.test(projection.execution_digest) || digest(execution_payload) !== projection.execution_digest) return result(false, 'PROJECTION_EXECUTION_DRIFT', 'baseline and stop conditions are not a valid digest-pinned execution payload');
  if (!Array.isArray(projection.ac_subset) || projection.ac_subset.length === 0 || !unique(projection.ac_subset, (item) => item?.acceptance_criterion?.id)) return result(false, 'PROJECTION_FIELD_TYPE', 'AC subset must be non-empty and unique');
  for (const item of projection.ac_subset) {
    if (!isObject(item) || Object.keys(item).length !== 2 || !isObject(item.acceptance_criterion) || !isObject(item.evidence_map)) return result(false, 'PROJECTION_FIELD_TYPE', 'AC subset records must contain typed AC and map records');
    if (item.acceptance_criterion.id !== item.evidence_map.ac_id) return result(false, 'PROJECTION_AC_MAP_DRIFT', 'projected evidence map is not bound to its AC');
  }
  if (digest(projection.ac_subset) !== projection.ac_subset_digest) return result(false, 'PROJECTION_AC_MAP_DRIFT', 'AC subset digest does not match its content');
  return result(true, 'PROJECTION_VALID', 'projection schema is valid');
}

/** Validate that duplicated worker fields still exactly mirror canonical truth. */
export async function validateProjection(contractInput, projection, event, verificationOptions = {}) {
  const parsed = contractFrom(contractInput);
  if (!parsed) return result(false, 'PROJECTION_CONTRACT_INVALID', 'canonical contract must be parsed before projection validation');
  const shape = validateShape(projection);
  if (!shape.ok) return shape;
  const { contract } = parsed;
  if (projection.contract_digest !== parsed.contract_digest) return result(false, 'PROJECTION_CONTRACT_STALE', 'projection is pinned to a different canonical contract');
  for (const key of ['goal', 'risk', 'tier', 'executor_class', 'base_subject']) {
    if (projection[key] !== contract[key]) return result(false, 'PROJECTION_NON_AUTHORITATIVE', `${key} differs from canonical contract`);
  }
  if (!equal(projection.allowed_paths, contract.scope.allowed_paths) || !equal(projection.forbidden_paths, contract.scope.forbidden_paths)) {
    return result(false, 'PROJECTION_SCOPE_DRIFT', 'projection scope differs from canonical contract');
  }
  if (!equal(projection.landmarks, contract.landmarks)) return result(false, 'PROJECTION_LANDMARK_DRIFT', 'projection landmarks differ from canonical contract');
  const canonicalAc = new Map(contract.acceptance_criteria.map((item) => [item.id, item]));
  const canonicalMaps = new Map(contract.ac_evidence_map.map((item) => [item.ac_id, item]));
  for (const item of projection.ac_subset) {
    const id = item.acceptance_criterion.id;
    if (!equal(item.acceptance_criterion, canonicalAc.get(id)) || !equal(item.evidence_map, canonicalMaps.get(id))) {
      return result(false, 'PROJECTION_AC_MAP_DRIFT', `projected AC ${id} differs from canonical AC evidence mapping`);
    }
  }
  const authority = await verifiedExecutionAuthority(event, verificationOptions, parsed, projection, { baseline: projection.baseline, stop_conditions: projection.stop_conditions });
  if (!authority.ok) return authority;
  return result(true, 'PROJECTION_VALID', 'projection is digest-pinned and non-authoritative', {
    projection_digest: digest(projection), contract_digest: parsed.contract_digest,
  });
}

/**
 * Resolver returns zero or more matches with an optional shape_digest. A
 * caller supplies repository I/O; this pure rule never reads or mutates it.
 */
export function validateProjectionLandmarks(projection, resolver) {
  const shape = validateShape(projection);
  if (!shape.ok) return shape;
  if (typeof resolver !== 'function') return result(false, 'PROJECTION_LANDMARK_RESOLVER_MISSING', 'a landmark resolver is required');
  for (const landmark of projection.landmarks) {
    let matches;
    try { matches = resolver(landmark); } catch { return result(false, 'PROJECTION_LANDMARK_RESOLUTION_FAILED', `could not resolve ${landmark.path}`); }
    if (!Array.isArray(matches)) return result(false, 'PROJECTION_LANDMARK_RESOLUTION_FAILED', `resolver returned invalid matches for ${landmark.path}`);
    if (landmark.kind === 'existing') {
      if (matches.length === 0) return result(false, 'PROJECTION_LANDMARK_MISSING', `existing landmark is absent: ${landmark.path}`);
      if (matches.length !== 1) return result(false, 'PROJECTION_LANDMARK_AMBIGUOUS', `existing landmark is not unique: ${landmark.path}`);
      if (matches[0]?.shape_digest !== landmark.shape_digest) return result(false, 'PROJECTION_LANDMARK_DRIFT', `existing landmark shape drifted: ${landmark.path}`);
    } else if (matches.length !== 0) {
      return result(false, 'PROJECTION_LANDMARK_EXISTS', `new landmark already exists: ${landmark.path}`);
    }
  }
  return result(true, 'PROJECTION_LANDMARKS_VALID', 'all existing/new landmark declarations are unambiguous');
}
