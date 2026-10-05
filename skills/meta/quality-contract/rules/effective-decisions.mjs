import { digest } from '../parser.mjs';

function failure(code, cause) { return { status: 'fail', code, cause }; }

/** Resolve only a single, non-ambiguous accepted terminal value per decision key. */
export function resolveEffectiveDecisions(revisions, options = {}) {
  if (!Array.isArray(revisions)) return failure('DECISION_CONFLICT', 'decision revisions are not an array');
  const digestRevision = options.digest || digest;
  if (typeof digestRevision !== 'function') throw new TypeError('decision digest must be a function');
  const byKey = new Map();
  for (const revision of revisions) {
    const list = byKey.get(revision.decision_key) || [];
    list.push(revision); byKey.set(revision.decision_key, list);
  }
  const effective = {};
  for (const [key, list] of byKey) {
    const byDigest = new Map(list.map((revision) => [digestRevision(revision), revision]));
    const predecessorReferences = new Set(list.map((revision) => revision.predecessor_digest).filter(Boolean));
    for (const revision of list) {
      if (revision.predecessor_digest && !byDigest.has(revision.predecessor_digest)) return failure('DECISION_MISSING_PREDECESSOR', `${key} references a missing predecessor`);
      if (revision.predecessor_digest) {
        const prior = byDigest.get(revision.predecessor_digest);
        if (Number(revision.authority_level) < Number(prior.authority_level)) return failure('DECISION_AUTHORITY_DOWNGRADE', `${key} lowers predecessor authority`);
      }
    }
    for (const start of list) {
      const visited = new Set(); let current = start;
      while (current?.predecessor_digest) {
        const currentDigest = digestRevision(current);
        if (visited.has(currentDigest)) return failure('DECISION_CYCLE', `${key} has a predecessor cycle`);
        visited.add(currentDigest); current = byDigest.get(current.predecessor_digest);
      }
    }
    const terminalAccepted = list.filter((revision) => revision.status === 'accepted' && !predecessorReferences.has(digestRevision(revision)));
    if (terminalAccepted.length !== 1) return failure('DECISION_CONFLICT', `${key} must have exactly one terminal accepted revision`);
    if (list.some((revision) => revision.status === 'revoked')) return failure('DECISION_CONFLICT', `${key} contains a revoked revision`);
    effective[key] = terminalAccepted[0];
  }
  return { status: 'pass', code: 'DECISIONS_RESOLVED', cause: 'one accepted terminal revision per decision key', effective };
}
