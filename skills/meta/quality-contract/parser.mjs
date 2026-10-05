import { createHash } from 'node:crypto';

export const CONTRACT_SCHEMA_VERSION = '1';
export const MAX_DOCUMENT_BYTES = 256 * 1024;
export const MAX_JSON_DEPTH = 32;
export const MAX_ARRAY_ITEMS = 256;

const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const INTEGER = /^(0|[1-9][0-9]{0,9})$/;
const TOP_LEVEL_KEYS = new Set([
  'schema_version', 'contract_id', 'revision', 'goal', 'requirements',
  'acceptance_criteria', 'ac_evidence_map', 'scope', 'requirements_digest',
  'ac_map_digest', 'scope_digest', 'risk', 'tier', 'executor_class',
  'base_subject', 'policy_digest', 'landmarks', 'decision_revisions',
]);

/** A deliberately small error shape that never exposes unbounded input. */
export class ContractParseError extends Error {
  constructor(code, cause) {
    super(cause);
    this.code = code;
  }
}

function fail(code, cause) {
  throw new ContractParseError(code, cause);
}

function assertString(value, name, max = 4096) {
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > max || value !== value.normalize('NFC')) {
    fail('PARSE_FIELD_TYPE', `${name} must be a bounded NFC string`);
  }
}

function assertId(value, name) {
  assertString(value, name, 128);
  if (!ID.test(value)) fail('PARSE_FIELD_TYPE', `${name} is not a valid ID`);
}

function assertDigest(value, name) {
  assertString(value, name, 71);
  if (!DIGEST.test(value)) fail('PARSE_FIELD_TYPE', `${name} must be a SHA-256 digest`);
}

function assertInteger(value, name) {
  assertString(value, name, 10);
  if (!INTEGER.test(value)) fail('PARSE_FIELD_TYPE', `${name} must be a decimal integer string`);
}

function assertKeys(object, keys, name) {
  if (!object || Array.isArray(object) || typeof object !== 'object') fail('PARSE_FIELD_TYPE', `${name} must be an object`);
  for (const key of Object.keys(object)) if (!keys.includes(key)) fail('PARSE_FIELD_TYPE', `${name}.${key} is not allowed`);
  for (const key of keys) if (!(key in object)) fail('PARSE_REQUIRED_FIELD', `${name}.${key} is required`);
}

function assertArray(value, name) {
  if (!Array.isArray(value) || value.length > MAX_ARRAY_ITEMS) fail('PARSE_FIELD_TYPE', `${name} must be an array of at most ${MAX_ARRAY_ITEMS} items`);
}

function uniqueBy(items, key, name) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item[key])) fail('PARSE_DUPLICATE_KEY', `${name} contains duplicate ${key}`);
    seen.add(item[key]);
  }
}

function validateRequirement(item) {
  assertKeys(item, ['id', 'text', 'priority'], 'requirement');
  assertId(item.id, 'requirement.id');
  assertString(item.text, 'requirement.text');
  if (!['must', 'should', 'could'].includes(item.priority)) fail('PARSE_FIELD_TYPE', 'requirement.priority is invalid');
}

function validateAc(item) {
  assertKeys(item, ['id', 'requirement_id', 'observable'], 'acceptance criterion');
  assertId(item.id, 'acceptance_criterion.id');
  assertId(item.requirement_id, 'acceptance_criterion.requirement_id');
  assertString(item.observable, 'acceptance_criterion.observable');
}

function validateAcMap(item) {
  assertKeys(item, ['ac_id', 'setup_digest', 'action', 'expected', 'negative_assertion', 'evidence_class'], 'AC evidence map');
  assertId(item.ac_id, 'ac_evidence_map.ac_id');
  assertDigest(item.setup_digest, 'ac_evidence_map.setup_digest');
  for (const key of ['action', 'expected', 'negative_assertion', 'evidence_class']) assertString(item[key], `ac_evidence_map.${key}`);
}

function validatePath(path, name) {
  assertString(path, name, 1024);
  if (!path || path.startsWith('/') || path.includes('\0') || path.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')) fail('PARSE_FIELD_TYPE', `${name} must be a canonical repository-relative path`);
}

function validateScope(scope) {
  assertKeys(scope, ['allowed_paths', 'forbidden_paths'], 'scope');
  for (const key of ['allowed_paths', 'forbidden_paths']) {
    assertArray(scope[key], `scope.${key}`);
    for (const path of scope[key]) validatePath(path, `scope.${key}`);
  }
}

function validateLandmark(item) {
  assertKeys(item, ['kind', 'path', 'shape_digest'], 'landmark');
  if (!['existing', 'new'].includes(item.kind)) fail('PARSE_FIELD_TYPE', 'landmark.kind is invalid');
  validatePath(item.path, 'landmark.path');
  assertDigest(item.shape_digest, 'landmark.shape_digest');
}

function validateDecision(item) {
  assertKeys(item, ['decision_key', 'revision_id', 'value_digest', 'status', 'predecessor_digest', 'authority_level', 'accepted_at'], 'decision revision');
  assertId(item.decision_key, 'decision_revisions.decision_key');
  assertId(item.revision_id, 'decision_revisions.revision_id');
  assertDigest(item.value_digest, 'decision_revisions.value_digest');
  if (!['proposed', 'assumed', 'unresolved', 'rejected', 'accepted', 'superseded', 'revoked'].includes(item.status)) fail('PARSE_FIELD_TYPE', 'decision_revisions.status is invalid');
  if (item.predecessor_digest !== null) assertDigest(item.predecessor_digest, 'decision_revisions.predecessor_digest');
  if (!['0', '1', '2'].includes(item.authority_level)) fail('PARSE_FIELD_TYPE', 'decision_revisions.authority_level is invalid');
  assertString(item.accepted_at, 'decision_revisions.accepted_at', 32);
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(item.accepted_at)) fail('PARSE_FIELD_TYPE', 'decision_revisions.accepted_at must be RFC3339 UTC');
}

/** Stable, recursive canonical JSON. It is intentionally not JSON.stringify's insertion order. */
export function canonicalJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value.normalize('NFC'));
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key.normalize('NFC'))}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  fail('PARSE_FIELD_TYPE', 'JSON numbers are forbidden; encode integers as strings');
}

export function digest(value) {
  return `sha256:${createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex')}`;
}

/* JSON.parse accepts duplicate members. Scan source first so it cannot silently
 * turn a candidate's duplicate authority into a last-write-wins value. */
function rejectDuplicateKeysAndNumbers(source) {
  let index = 0;
  const whitespace = /[\t\n\r ]/;
  const skip = () => { while (whitespace.test(source[index] || '')) index += 1; };
  const string = () => {
    if (source[index++] !== '"') fail('PARSE_FIELD_TYPE', 'invalid JSON string');
    while (index < source.length) {
      const char = source[index++];
      if (char === '"') return;
      if (char === '\\') index += 1;
      else if (char.charCodeAt(0) < 0x20) fail('PARSE_FIELD_TYPE', 'control character in string');
    }
    fail('PARSE_FIELD_TYPE', 'unterminated JSON string');
  };
  const value = (depth) => {
    if (depth > MAX_JSON_DEPTH) fail('PARSE_FIELD_TYPE', 'JSON nesting exceeds limit');
    skip();
    if (source[index] === '"') return string();
    if (source[index] === '{') {
      index += 1; skip(); const keys = new Set();
      if (source[index] === '}') { index += 1; return; }
      while (true) {
        skip(); const start = index; string(); const raw = source.slice(start, index);
        let key;
        try { key = JSON.parse(raw); } catch { fail('PARSE_FIELD_TYPE', 'invalid JSON key'); }
        if (keys.has(key)) fail('PARSE_DUPLICATE_KEY', `duplicate JSON key: ${key}`);
        keys.add(key); skip();
        if (source[index++] !== ':') fail('PARSE_FIELD_TYPE', 'object member missing colon');
        value(depth + 1); skip();
        if (source[index] === '}') { index += 1; return; }
        if (source[index++] !== ',') fail('PARSE_FIELD_TYPE', 'object member missing comma');
      }
    }
    if (source[index] === '[') {
      index += 1; skip(); let count = 0;
      if (source[index] === ']') { index += 1; return; }
      while (true) {
        if (++count > MAX_ARRAY_ITEMS) fail('PARSE_FIELD_TYPE', 'array exceeds item limit');
        value(depth + 1); skip();
        if (source[index] === ']') { index += 1; return; }
        if (source[index++] !== ',') fail('PARSE_FIELD_TYPE', 'array item missing comma');
      }
    }
    for (const literal of ['true', 'false', 'null']) if (source.startsWith(literal, index)) { index += literal.length; return; }
    fail('PARSE_FIELD_TYPE', 'JSON numbers and invalid values are forbidden');
  };
  value(0); skip();
  if (index !== source.length) fail('PARSE_FIELD_TYPE', 'trailing JSON input');
}

function extractBlock(document) {
  assertString(document, 'document', MAX_DOCUMENT_BYTES);
  const blocks = [...document.matchAll(/^```([^\r\n]*)\r?\n([\s\S]*?)^```[ \t]*$/gm)];
  const typed = blocks.filter((match) => match[1] === 'quality-contract-json');
  if (typed.length !== 1) {
    if (typed.length > 1) fail('PARSE_DUPLICATE_KEY', 'exactly one canonical contract block is allowed');
    if (blocks.some((match) => match[1].includes('quality-contract'))) fail('PARSE_BLOCK_NAME', 'contract block must be named quality-contract-json');
    fail('PARSE_REQUIRED_FIELD', 'exactly one quality-contract-json block is required');
  }
  return typed[0][2];
}

export function validateContract(contract) {
  if (!contract || Array.isArray(contract) || typeof contract !== 'object') fail('PARSE_FIELD_TYPE', 'contract must be an object');
  for (const key of Object.keys(contract)) if (!TOP_LEVEL_KEYS.has(key)) fail('PARSE_FIELD_TYPE', `contract.${key} is not allowed`);
  for (const key of TOP_LEVEL_KEYS) if (!(key in contract)) fail('PARSE_REQUIRED_FIELD', `contract.${key} is required`);
  if (contract.schema_version !== CONTRACT_SCHEMA_VERSION) fail('VERSION_UNSUPPORTED', 'unsupported contract schema version');
  assertId(contract.contract_id, 'contract_id'); assertInteger(contract.revision, 'revision'); assertString(contract.goal, 'goal');
  if (!['low', 'medium', 'high'].includes(contract.risk)) fail('PARSE_FIELD_TYPE', 'risk is invalid');
  if (!['T1', 'T2', 'T3'].includes(contract.tier)) fail('PARSE_FIELD_TYPE', 'tier is invalid');
  if (!['low_cost', 'capable', 'specialist'].includes(contract.executor_class)) fail('PARSE_FIELD_TYPE', 'executor_class is invalid');
  for (const key of ['requirements_digest', 'ac_map_digest', 'scope_digest', 'base_subject', 'policy_digest']) assertDigest(contract[key], key);
  for (const [key, validator] of [['requirements', validateRequirement], ['acceptance_criteria', validateAc], ['ac_evidence_map', validateAcMap], ['landmarks', validateLandmark], ['decision_revisions', validateDecision]]) {
    assertArray(contract[key], key); contract[key].forEach(validator);
  }
  uniqueBy(contract.requirements, 'id', 'requirements'); uniqueBy(contract.acceptance_criteria, 'id', 'acceptance_criteria');
  uniqueBy(contract.ac_evidence_map, 'ac_id', 'ac_evidence_map'); uniqueBy(contract.decision_revisions, 'revision_id', 'decision_revisions');
  const requirementIds = new Set(contract.requirements.map((item) => item.id));
  const acIds = new Set(contract.acceptance_criteria.map((item) => item.id));
  for (const ac of contract.acceptance_criteria) if (!requirementIds.has(ac.requirement_id)) fail('PARSE_FIELD_TYPE', `AC ${ac.id} references an unknown requirement`);
  for (const map of contract.ac_evidence_map) if (!acIds.has(map.ac_id)) fail('PARSE_FIELD_TYPE', `AC map ${map.ac_id} references an unknown AC`);
  const mappedAcIds = new Set(contract.ac_evidence_map.map((item) => item.ac_id));
  for (const acId of acIds) if (!mappedAcIds.has(acId)) fail('PARSE_REQUIRED_FIELD', `AC ${acId} requires exactly one frozen evidence map`);
  validateScope(contract.scope);
  if (digest(contract.requirements) !== contract.requirements_digest || digest(contract.ac_evidence_map) !== contract.ac_map_digest || digest(contract.scope) !== contract.scope_digest) fail('PARSE_FIELD_TYPE', 'contract digest binding does not match content');
  return contract;
}

export function parseContractDocument(document) {
  try {
    const source = extractBlock(document);
    if (Buffer.byteLength(source, 'utf8') > MAX_DOCUMENT_BYTES) fail('PARSE_FIELD_TYPE', 'contract block exceeds byte limit');
    rejectDuplicateKeysAndNumbers(source);
    let contract;
    try { contract = JSON.parse(source); } catch { fail('PARSE_FIELD_TYPE', 'invalid JSON contract'); }
    validateContract(contract);
    return { ok: true, contract, contract_digest: digest(contract), canonical: canonicalJson(contract) };
  } catch (error) {
    if (error instanceof ContractParseError) return { ok: false, code: error.code, cause: error.message };
    return { ok: false, code: 'PARSE_FIELD_TYPE', cause: 'unable to parse contract' };
  }
}
