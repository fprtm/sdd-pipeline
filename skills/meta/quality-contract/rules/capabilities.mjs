const ID = /^[A-Za-z0-9._:-]{1,128}$/;
function object(value) { return Boolean(value) && !Array.isArray(value) && typeof value === 'object'; }
function exact(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
function result(status, code, cause, missing, remediation, mode) { return freeze({ status, code, cause, risk: status === 'supported' ? 'medium' : 'high', owner: 'compatibility', remediation, missing_capabilities: missing, mode, provider_neutral_core: true, may_enforce: status === 'supported' && mode === 'vnext-enforced' }); }

export function negotiateCapabilities(input = {}) {
  if (!exact(input, ['capability_version', 'provider_id', 'legacy', 'vnext_marker', 'operation', 'capabilities']) || input.capability_version !== '1' || !ID.test(input.provider_id || '') || typeof input.legacy !== 'boolean' || typeof input.vnext_marker !== 'boolean' || !['report', 'migrate', 'enforce', 'downgrade'].includes(input.operation) || !Array.isArray(input.capabilities) || new Set(input.capabilities.map(({ id }) => id)).size !== input.capabilities.length || !input.capabilities.every((c) => exact(c, ['id', 'required', 'available', 'provenance']) && ID.test(c.id || '') && typeof c.required === 'boolean' && typeof c.available === 'boolean' && ['declared', 'tool-attested', 'externally-attested'].includes(c.provenance))) return result('blocked', 'CAPABILITY_SCHEMA_INVALID', 'capability negotiation input violates strict v1 schema', [], 'supply explicit provider capabilities and migration marker', 'invalid');
  if (input.legacy && !input.vnext_marker) return input.operation === 'report' || input.operation === 'downgrade'
    ? result('degraded', 'CAPABILITY_LEGACY_REPORT_ONLY', 'legacy consumer remains report-only until explicit migration', [], 'preview and apply an explicit vNext migration to enforce', 'legacy-report-only')
    : result('blocked', 'CAPABILITY_MIGRATION_REQUIRED', 'legacy consumer cannot start vNext enforcement implicitly', [], 'set the explicit migration marker through user-authorized migration', 'legacy-report-only');
  if (input.operation === 'downgrade') return result('degraded', 'CAPABILITY_DOWNGRADE_PREVIEW', 'downgrade preview removes vNext enforcement without reinterpreting vNext authority', [], 'require explicit user authorization before changing the marker', 'downgrade-preview');
  const required = input.capabilities.filter((c) => c.required && !c.available).map(({ id }) => id).sort();
  if (required.length) return result('blocked', 'CAPABILITY_REQUIRED_MISSING', 'one or more required provider capabilities are unavailable', required, 'install/enable required capabilities or lower scope through authorized policy change', 'vnext-blocked');
  const optional = input.capabilities.filter((c) => !c.required && !c.available).map(({ id }) => id).sort();
  if (optional.length) return result('degraded', 'CAPABILITY_OPTIONAL_MISSING', 'optional provider capabilities are unavailable', optional, 'continue with explicit degraded evidence and no upgraded authority', input.vnext_marker ? 'vnext-degraded' : 'report-only');
  return result('supported', 'CAPABILITY_SUPPORTED', 'all declared required capabilities are available', [], 'preserve provider-neutral evidence and handoff fields', input.vnext_marker ? 'vnext-enforced' : 'report-only');
}
