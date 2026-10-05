import { digest } from '../parser.mjs';

const CATEGORIES = Object.freeze(['tracked', 'untracked', 'ignored', 'deleted', 'renamed', 'mode', 'symlink', 'submodule']);
const KINDS = new Set(['add', 'modify', 'delete', 'rename', 'mode', 'symlink', 'submodule', 'untracked', 'ignored']);

function result(status, code, cause, remediation) {
  return { status, code, cause, risk: 'high', owner: 'scope-accounting', remediation };
}

function pathValid(path) {
  return typeof path === 'string' && path.length > 0 && !path.startsWith('/') && !path.includes('\0') && path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
}
function exact(value, keys) { return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }

function inDeclaredPath(path, declaration) {
  return path === declaration || path.startsWith(`${declaration}/`);
}

/**
 * This consumes a complete Git observation supplied by an adapter.  It does
 * not run Git itself, so callers cannot mistake an unavailable repository for
 * a clean one. `categories` makes every important change class explicit.
 */
/**
 * `expectedSubject` is the exact canonical subject selected by the trusted
 * preflight adapter, never merely a candidate-tree digest.  Accounting is a
 * statement about the whole subject (repository/base/candidate/contract and
 * policy), so accepting a candidate-only claim would allow a scope snapshot
 * to be replayed after a contract or policy transition.
 */
export function evaluateScopeAccounting(accounting, scope = {}, expectedSubject) {
  if (!accounting || accounting.git_available !== true) {
    return {
      change_accounting: result('unknown', 'SUBJECT_NO_GIT', 'Git subject/accounting is unavailable; report-only mode applies', 'run in a trusted Git worktree'),
      scope: result('unknown', 'SCOPE_INCOMPLETE', 'scope cannot be assured without a complete Git observation', 'run in a trusted Git worktree'),
    };
  }
  let expectedSubjectDigest;
  try { expectedSubjectDigest = digest(expectedSubject); } catch { expectedSubjectDigest = null; }
  if (!expectedSubject || typeof expectedSubject !== 'object' || Array.isArray(expectedSubject) || !expectedSubjectDigest) {
    return {
      change_accounting: result('fail', 'SCOPE_SUBJECT_MISMATCH', 'complete accounting requires the exact trusted canonical subject', 'supply accounting bound to the evaluated trusted subject'),
      scope: result('blocked', 'SCOPE_SUBJECT_MISMATCH', 'scope comparison cannot use an unbound accounting snapshot', 'supply the exact trusted canonical subject'),
    };
  }
  if (!exact(accounting, ['accounting_version', 'git_available', 'enumeration_complete', 'categories', 'changes', 'subject_digest']) || accounting.accounting_version !== '1' || typeof accounting.subject_digest !== 'string' || !accounting.subject_digest.startsWith('sha256:') || accounting.enumeration_complete !== true || !exact(accounting.categories, CATEGORIES) || CATEGORIES.some((name) => accounting.categories[name] !== true) || !Array.isArray(accounting.changes)) {
    return {
      change_accounting: result('fail', 'SCOPE_INCOMPLETE', 'one or more Git change categories were not enumerated', 'enumerate tracked, untracked, ignored, deletion, rename, mode, symlink, and submodule changes'),
      scope: result('blocked', 'SCOPE_INCOMPLETE', 'scope comparison requires complete accounting', 'complete change enumeration first'),
    };
  }
  if (accounting.subject_digest !== expectedSubjectDigest) {
    return {
      change_accounting: result('fail', 'SCOPE_SUBJECT_MISMATCH', 'accounting does not bind the exact evaluated canonical subject', 'regenerate accounting for the trusted subject'),
      scope: result('blocked', 'SCOPE_SUBJECT_MISMATCH', 'scope comparison cannot use accounting for another subject', 'regenerate accounting for the trusted subject'),
    };
  }
  const allowed = Array.isArray(scope.allowed_paths) ? scope.allowed_paths : [];
  const forbidden = Array.isArray(scope.forbidden_paths) ? scope.forbidden_paths : [];
  if (allowed.some((path) => !pathValid(path)) || forbidden.some((path) => !pathValid(path))) {
    return {
      change_accounting: result('pass', 'ACCOUNTING_COMPLETE', 'all Git change categories are enumerated', 'retain complete accounting'),
      scope: result('fail', 'SCOPE_PATH_ESCAPE', 'declared scope has an invalid repository-relative path', 'repair the canonical scope declaration'),
    };
  }
  for (const change of accounting.changes) {
    if (!exact(change, ['kind', 'path', 'old_path', 'canonical_path', 'canonical_old_path', 'path_alias', 'symlink_escape']) || !KINDS.has(change.kind) || !pathValid(change.path) || change.canonical_path !== change.path || (change.old_path !== null && !pathValid(change.old_path)) || (change.canonical_old_path !== null && change.canonical_old_path !== change.old_path) || (change.kind === 'rename' && change.old_path === null) || (change.kind !== 'rename' && change.old_path !== null) || typeof change.path_alias !== 'boolean' || typeof change.symlink_escape !== 'boolean' || change.path_alias === true || change.symlink_escape === true) {
      return {
        change_accounting: result('fail', 'SCOPE_PATH_ESCAPE', 'a changed path is invalid, aliased, or escapes through a symlink', 'resolve paths in the trusted repository snapshot'),
        scope: result('fail', 'SCOPE_PATH_ESCAPE', 'unsafe path cannot be compared to scope', 'resolve the path and re-run accounting'),
      };
    }
    const paths = [change.path, change.old_path].filter(Boolean);
    for (const path of paths) {
      if (forbidden.some((entry) => inDeclaredPath(path, entry)) || !allowed.some((entry) => inDeclaredPath(path, entry))) {
        return {
          change_accounting: result('pass', 'ACCOUNTING_COMPLETE', 'all Git change categories are enumerated', 'retain complete accounting'),
          scope: result('fail', 'SCOPE_OUT_OF_BOUNDS', `changed path is outside declared scope: ${path}`, 'narrow the change or obtain a revised canonical scope'),
        };
      }
    }
  }
  return {
    change_accounting: result('pass', 'ACCOUNTING_COMPLETE', 'all Git change categories are enumerated', 'retain complete accounting'),
    scope: result('pass', 'SCOPE_CONFORMANT', 'every observed path is within canonical scope', 'retain the exact scope and accounting snapshot'),
  };
}
