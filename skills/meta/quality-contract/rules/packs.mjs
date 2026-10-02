import { createHash } from 'node:crypto';
const ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SAFE_PATH = /^(?!\/|.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/;
const LEVEL = { A0: 0, A1: 1, A2: 2, A3: 3 };
function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function bounded(value) { return typeof value === 'string' && value.length > 0 && Buffer.byteLength(value, 'utf8') <= 4096 && value === value.normalize('NFC'); }
function boundedList(value, validator = bounded) { return Array.isArray(value) && value.length <= 128 && new Set(value.map((item) => typeof item === 'string' ? item : canonical(item))).size === value.length && value.every(validator); }
function canonical(value) { if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; if (object(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`; return JSON.stringify(value); }
function digest(value) { return `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`; }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function result(status, code, cause, remediation, merged = null) { return freeze({ status, code, cause, risk: status === 'pass' ? 'medium' : 'high', owner: 'pack-policy', remediation, merged, merged_digest: merged ? digest(merged) : null }); }
function validPolicy(p) { return exact(p, ['minimum_assurance', 'hard_stops', 'allowed_paths', 'required_evidence']) && Object.hasOwn(LEVEL, p.minimum_assurance) && [p.hard_stops, p.allowed_paths, p.required_evidence].every(Array.isArray) && p.hard_stops.every((x) => ID.test(x)) && p.required_evidence.every((x) => ID.test(x)) && p.allowed_paths.every((x) => SAFE_PATH.test(x)); }
function validContext(c) {
  if (!exact(c, ['approved_stacks', 'approved_dependencies', 'architecture_boundaries', 'coding_conventions', 'data_classification', 'privacy_and_retention', 'security_baseline', 'deployment_platform', 'slo_templates', 'incident_severity', 'ownership_map', 'release_authorities', 'required_assurance_overrides'])) return false;
  if (![c.approved_stacks, c.approved_dependencies, c.data_classification, c.security_baseline, c.deployment_platform, c.slo_templates, c.incident_severity, c.release_authorities].every((items) => boundedList(items, (value) => ID.test(value || '')))) return false;
  if (![c.architecture_boundaries, c.coding_conventions, c.privacy_and_retention].every((items) => boundedList(items))) return false;
  return boundedList(c.ownership_map, (item) => exact(item, ['surface', 'owner_role']) && ID.test(item.surface || '') && ID.test(item.owner_role || '')) && boundedList(c.required_assurance_overrides, (item) => exact(item, ['trigger', 'minimum_assurance']) && ID.test(item.trigger || '') && Object.hasOwn(LEVEL, item.minimum_assurance));
}
function validPack(p) { return exact(p, ['pack_version', 'pack_id', 'layer', 'content_type', 'minimum_assurance', 'hard_stops', 'allowed_paths', 'required_evidence', 'controls', 'privacy', 'context']) && p.pack_version === '1' && ID.test(p.pack_id || '') && ['domain', 'organization'].includes(p.layer) && p.content_type === 'data-only' && Object.hasOwn(LEVEL, p.minimum_assurance) && [p.hard_stops, p.allowed_paths, p.required_evidence].every(Array.isArray) && p.hard_stops.every((x) => ID.test(x)) && p.required_evidence.every((x) => ID.test(x)) && p.allowed_paths.every((x) => SAFE_PATH.test(x)) && Array.isArray(p.controls) && new Set(p.controls.map(({ id }) => id)).size === p.controls.length && p.controls.every((c) => exact(c, ['id', 'minimum_assurance', 'evidence_class']) && ID.test(c.id || '') && Object.hasOwn(LEVEL, c.minimum_assurance) && ID.test(c.evidence_class || '')) && exact(p.privacy, ['allow_raw_source', 'allow_pii']) && p.privacy.allow_raw_source === false && p.privacy.allow_pii === false && validContext(p.context); }

export function mergePolicyPacks(globalPolicy, packs = []) {
  if (!validPolicy(globalPolicy) || !Array.isArray(packs) || !packs.every(validPack)) return result('fail', 'PACK_SCHEMA_INVALID', 'global policy or pack violates strict data-only v1 schema', 'remove unknown/executable/link/path content and use normalized identifiers');
  const precedence = { domain: 0, organization: 1 };
  const ordered = [...packs].sort((a, b) => precedence[a.layer] - precedence[b.layer] || a.pack_id.localeCompare(b.pack_id));
  let merged = structuredClone(globalPolicy);
  for (const pack of ordered) {
    if (LEVEL[pack.minimum_assurance] < LEVEL[merged.minimum_assurance]) return result('blocked', 'PACK_POLICY_WEAKENING', `${pack.pack_id} lowers minimum assurance`, 'raise or omit the weaker policy value');
    if (merged.hard_stops.some((stop) => !pack.hard_stops.includes(stop))) return result('blocked', 'PACK_POLICY_WEAKENING', `${pack.pack_id} deletes a mandatory hard stop`, 'retain every inherited hard stop');
    if (pack.allowed_paths.some((path) => !merged.allowed_paths.some((base) => path === base || path.startsWith(`${base}/`)))) return result('blocked', 'PACK_SCOPE_BROADENING', `${pack.pack_id} broadens allowed scope`, 'narrow paths within inherited scope');
    if (merged.required_evidence.some((evidence) => !pack.required_evidence.includes(evidence))) return result('blocked', 'PACK_POLICY_WEAKENING', `${pack.pack_id} removes required evidence`, 'retain inherited evidence and add stricter requirements only');
    const controlIds = new Set(pack.controls.map(({ id }) => id));
    if (controlIds.size !== pack.controls.length) return result('blocked', 'PACK_POLICY_CONFLICT', `${pack.pack_id} has conflicting controls`, 'use one deterministic definition per control id');
    merged = { minimum_assurance: pack.minimum_assurance, hard_stops: [...new Set(pack.hard_stops)].sort(), allowed_paths: [...new Set(pack.allowed_paths)].sort(), required_evidence: [...new Set(pack.required_evidence)].sort(), controls: [...(merged.controls || []), ...pack.controls].sort((a, b) => a.id.localeCompare(b.id)), pack_context: [...(merged.pack_context || []), { pack_id: pack.pack_id, layer: pack.layer, context: structuredClone(pack.context) }], applied_packs: [...(merged.applied_packs || []), pack.pack_id] };
    if (new Set(merged.controls.map(({ id }) => id)).size !== merged.controls.length) return result('blocked', 'PACK_POLICY_CONFLICT', `${pack.pack_id} conflicts with an inherited control`, 'rename or reconcile the control under one owner');
  }
  return result('pass', 'PACK_POLICY_VALID', 'packs merged deterministically and monotonically', 'bind the merged digest into the effective policy', merged);
}
