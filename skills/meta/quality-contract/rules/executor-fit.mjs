const RANK = Object.freeze({ low_cost: 0, capable: 1, specialist: 2 });

function outcome(status, code, cause, remediation) {
  return { status, code, cause, risk: 'high', owner: 'executor-fit', remediation };
}

/**
 * Establish suitability from declared policy facts, not a self-described model
 * capability.  The caller is responsible for obtaining `attested_class` from
 * a trusted scheduler or human process.
 */
export function evaluateExecutorFit(contract, executor = {}) {
  if (!contract || !Object.hasOwn(RANK, contract.executor_class)) {
    return outcome('fail', 'EXECUTOR_UNFIT', 'contract executor policy is missing or invalid', 'repair the canonical executor policy');
  }
  const keys = ['attestation_version', 'issuer', 'attested_class', 'work_kind', 'independent_review', 'subject_digest', 'expires_at'];
  if (!executor || typeof executor !== 'object' || Array.isArray(executor) || Object.keys(executor).length !== keys.length || !keys.every((key) => Object.hasOwn(executor, key)) || executor.attestation_version !== '1' || typeof executor.issuer !== 'string' || !executor.issuer || typeof executor.subject_digest !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(executor.subject_digest) || typeof executor.expires_at !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(executor.expires_at) || typeof executor.work_kind !== 'string' || typeof executor.independent_review !== 'boolean') {
    return outcome('unknown', 'EXECUTOR_ATTESTATION_MISSING', 'executor attestation is absent or not typed', 'supply a complete externally verified executor attestation');
  }
  const actual = executor.attested_class;
  if (!Object.hasOwn(RANK, actual)) {
    return outcome('unknown', 'EXECUTOR_ATTESTATION_MISSING', 'no trusted executor-class attestation was supplied', 'supply a scheduler or human attestation');
  }
  if (RANK[actual] < RANK[contract.executor_class]) {
    return outcome('fail', 'EXECUTOR_UNFIT', `attested executor ${actual} is below required ${contract.executor_class}`, 'assign an executor at or above the declared class');
  }
  // A cheap executor is deliberately narrow even if a contract was malformed
  // upstream: it may only take a reviewed low-risk T1 mechanical slice.
  if (actual === 'low_cost' && (contract.risk !== 'low' || contract.tier !== 'T1' || executor.independent_review !== true || executor.work_kind !== 'mechanical')) {
    return outcome('fail', 'EXECUTOR_UNFIT', 'low-cost execution requires low-risk T1 reviewed mechanical work', 'use a capable executor or record independent review for a mechanical T1 slice');
  }
  return { status: 'pass', code: 'EXECUTOR_FIT', cause: 'trusted executor class satisfies contract policy', risk: contract.risk, owner: 'executor-fit', remediation: 'retain the attested executor assignment' };
}
