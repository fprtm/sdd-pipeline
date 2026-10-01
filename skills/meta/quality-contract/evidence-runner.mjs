import { canonicalJson, digest } from './parser.mjs';

const MAX_OUTPUT_BYTES = 64 * 1024;
const SECRET = /(?:\b(?:api[_-]?key|access[_-]?token|auth(?:orization)?|password|secret|s[eéèê]cret)\b\s*(?:=|:|\s)\s*|(?:密码|パスワード)\s*(?:=|:|：)\s*)(?:Bearer\s+)?[A-Za-z0-9._~+\/=:-]{8,}/gi;
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const INTEGER = /^(0|[1-9][0-9]{0,9})$/;
const TIME = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/;
const SUBJECT_KEYS = ['repository_digest', 'base_digest', 'candidate_digest', 'contract_digest', 'projection_digest', 'policy_digest', 'schema_digest', 'rules_digest', 'adapter_digest', 'ac_map_digest'];
const RESULT_KEYS = ['ac_id', 'assertion_status', 'matcher_id', 'matcher_version', 'expected_digest', 'observed_digest', 'evidence_class', 'negative_assertion_status', 'detail_digest'];
const RUN_KEYS = ['evidence_version', 'run_id', 'event_id', 'subject', 'ac_results', 'argv_digest', 'cwd_digest', 'environment_class', 'toolchain_digest', 'dependency_digest', 'exit_code', 'signal', 'duration_ms', 'output_digest', 'redactions', 'referenced_event_ids', 'started_at', 'completed_at', 'signature'];
const SEALED_KEYS = ['sealed_evidence_version', 'evidence', 'evidence_digest'];

function bounded(value, max = 4096) {
  return typeof value === 'string' && value === value.normalize('NFC') && Buffer.byteLength(value, 'utf8') <= max;
}
function secretLike(value) {
  if (typeof value !== 'string') return false;
  const direct = /(?:api[_-]?key|access[_-]?token|auth(?:orization)?|password|secret|s[eéèê]cret|密码|パスワード)/iu;
  if (direct.test(value)) return true;
  if (!/^[A-Za-z0-9+/_-]{8,}$/.test(value)) return false;
  try {
    const decoded = Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return decoded.length > 0 && direct.test(decoded);
  } catch { return false; }
}
function safeId(value) { return bounded(value, 128) && ID.test(value) && !secretLike(value); }

/**
 * Redaction happens before an evidence object can be returned or serialized.
 * It is deliberately conservative: matching output is not evidence of safety,
 * but an unredacted match must never enter the durable envelope.
 */
export function redactOutput(raw, limit = MAX_OUTPUT_BYTES) {
  if (!Number.isSafeInteger(limit) || limit <= 0 || limit > MAX_OUTPUT_BYTES) throw new TypeError('invalid output limit');
  if (typeof raw !== 'string') throw new TypeError('runner output must be a string');
  let output = raw.normalize('NFC');
  let truncated = false;
  if (Buffer.byteLength(output, 'utf8') > limit) {
    output = Buffer.from(output, 'utf8').subarray(0, limit).toString('utf8');
    truncated = true;
  }
  let matched = 0;
  output = output.replace(SECRET, (value) => {
    matched += 1;
    const split = value.search(/(?:Bearer\s+)?[A-Za-z0-9._~+\/=:-]{8,}$/i);
    return `${value.slice(0, Math.max(0, split))}[REDACTED]`;
  });
  const redactions = [];
  if (matched > 0) redactions.push(Object.freeze({ kind: 'secret-like', matched_count: String(matched) }));
  if (truncated) redactions.push(Object.freeze({ kind: 'output-truncated', matched_count: '1' }));
  return Object.freeze({ output, output_digest: digest(output), redactions: Object.freeze(redactions) });
}

function exact(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function evidenceShape(run) {
  return exact(run, RUN_KEYS)
    && run.evidence_version === '1'
    && safeId(run.run_id) && safeId(run.event_id)
    && exact(run.subject, SUBJECT_KEYS) && SUBJECT_KEYS.every((key) => DIGEST.test(run.subject[key]))
    && Array.isArray(run.ac_results) && run.ac_results.length > 0 && run.ac_results.length <= 256
    && run.ac_results.every((item) => exact(item, RESULT_KEYS) && safeId(item.ac_id) && ['pass', 'fail'].includes(item.assertion_status) && safeId(item.matcher_id) && safeId(item.matcher_version) && DIGEST.test(item.expected_digest) && DIGEST.test(item.observed_digest) && safeId(item.evidence_class) && ['pass', 'fail'].includes(item.negative_assertion_status) && (item.detail_digest === null || DIGEST.test(item.detail_digest)))
    && new Set(run.ac_results.map((item) => item.ac_id)).size === run.ac_results.length
    && DIGEST.test(run.argv_digest) && DIGEST.test(run.cwd_digest) && ['isolated', 'local-disposable'].includes(run.environment_class)
    && DIGEST.test(run.toolchain_digest) && DIGEST.test(run.dependency_digest)
    && INTEGER.test(run.exit_code) && (run.signal === null || ID.test(run.signal)) && INTEGER.test(run.duration_ms) && DIGEST.test(run.output_digest)
    && Array.isArray(run.redactions) && run.redactions.length <= 256 && run.redactions.every((item) => exact(item, ['kind', 'matched_count']) && ['secret-like', 'output-truncated'].includes(item.kind) && INTEGER.test(item.matched_count))
    && Array.isArray(run.referenced_event_ids) && run.referenced_event_ids.length > 0 && run.referenced_event_ids.length <= 256 && run.referenced_event_ids.every((id) => safeId(id)) && new Set(run.referenced_event_ids).size === run.referenced_event_ids.length
    && TIME.test(run.started_at) && TIME.test(run.completed_at) && Date.parse(run.started_at) <= Date.parse(run.completed_at)
    && bounded(run.signature, 16384);
}

/** Strict, portable evidence schema used before any seal or persistence. */
export function isValidEvidenceEnvelope(run) { return evidenceShape(run); }

/** Canonical bytes for an externally signed evidence envelope. */
export function signedEvidencePayload(evidence) {
  if (!evidenceShape(evidence)) throw new TypeError('invalid evidence envelope');
  const copy = structuredClone(evidence);
  delete copy.signature;
  return `quality-contract-evidence/v1\0${canonicalJson(copy)}`;
}

/** A serialized seal remains verifiable because it relies on signature checks, not process-local identity. */
export function isPortableSealedEvidence(value) {
  return exact(value, SEALED_KEYS) && value.sealed_evidence_version === '1' && evidenceShape(value.evidence) && value.evidence_digest === digest(value.evidence);
}

/** Only an external runner adapter may mint a verifier-consumable envelope. */
export async function sealEvidenceRun(run, adapter) {
  if (!adapter || adapter.kind !== 'external-evidence-attestor-v1' || typeof adapter.verify !== 'function') throw new TypeError('external evidence attestor is required');
  if (!run || typeof run !== 'object' || Array.isArray(run) || !evidenceShape(run)) throw new TypeError('invalid evidence envelope');
  if (Object.hasOwn(run, 'raw_output') || Object.hasOwn(run, 'stdout') || Object.hasOwn(run, 'stderr') || Object.hasOwn(run, 'environment')) throw new TypeError('raw runner material is forbidden in durable evidence');
  let verified;
  try { verified = await adapter.verify({ evidence: structuredClone(run), evidence_digest: digest(run) }); } catch { throw new TypeError('external evidence attestation verification failed'); }
  if (!verified || verified.ok !== true || verified.evidence_digest !== digest(run)) throw new TypeError('external evidence attestation was not verified for this exact envelope');
  return Object.freeze({ sealed_evidence_version: '1', evidence: Object.freeze(structuredClone(run)), evidence_digest: digest(run) });
}

/** Backwards-compatible name; no WeakSet branding is relied on for trust. */
export function isSealedEvidence(value) { return isPortableSealedEvidence(value); }
