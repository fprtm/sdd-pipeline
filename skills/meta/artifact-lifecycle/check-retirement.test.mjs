import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'check-retirement.mjs');

function repo({ archive = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'sdd-retire-'));
  mkdirSync(join(root, 'docs', 'sdd', 'changes'), { recursive: true });
  mkdirSync(join(root, 'docs', 'system'), { recursive: true });
  writeFileSync(join(root, 'docs', 'sdd', 'config.md'), `artifact-policy-version: 1\nartifact-retention: ${archive ? 'archive' : 'git-history'}\n`);
  writeFileSync(join(root, 'docs', 'sdd', 'changes', '2026-09-30-work.md'), '# Transient work\n');
  writeFileSync(join(root, 'docs', 'system', 'overview.md'), '# Canonical outcome\n');
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: root });
  return root;
}

function run(root) {
  const result = spawnSync('node', [SCRIPT, root, 'docs/sdd/changes/2026-09-30-work.md', 'docs/system/overview.md'], { encoding: 'utf8' });
  return { code: result.status, out: `${result.stdout}${result.stderr}` };
}

test('blocks retirement while a live markdown reference targets the transient artifact', () => {
  const root = repo();
  writeFileSync(join(root, 'README.md'), '[active work](docs/sdd/changes/2026-09-30-work.md)\n');
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.out, /live reference.*README\.md/);
});

test('allows preview when outcome exists, references are clear, and Git can recover the artifact', () => {
  const root = repo();
  const before = readFileSync(join(root, 'docs', 'sdd', 'changes', '2026-09-30-work.md'), 'utf8');
  const statusBefore = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  const result = run(root);
  assert.equal(result.code, 0, result.out);
  assert.match(result.out, /SAFE TO RETIRE \(preview only\)/);
  assert.equal(readFileSync(join(root, 'docs', 'sdd', 'changes', '2026-09-30-work.md'), 'utf8'), before);
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }), statusBefore);
});

test('blocks an untracked and therefore unrecoverable transient artifact', () => {
  const root = repo();
  execFileSync('git', ['rm', '--cached', 'docs/sdd/changes/2026-09-30-work.md'], { cwd: root, stdio: 'ignore' });
  const result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.out, /not recoverable from committed Git history/);
});

test('blocks a tracked artifact whose current bytes are not committed', () => {
  const root = repo();
  writeFileSync(join(root, 'docs', 'sdd', 'changes', '2026-09-30-work.md'), '# Uncommitted current evidence\n');
  let result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.out, /not recoverable from committed Git history/);
  execFileSync('git', ['add', 'docs/sdd/changes/2026-09-30-work.md'], { cwd: root });
  result = run(root);
  assert.equal(result.code, 1);
  assert.match(result.out, /not recoverable from committed Git history/);
});

test('requires preservation instead of deletion when archive policy covers an unrecoverable artifact', () => {
  const root = repo({ archive: true });
  execFileSync('git', ['rm', '--cached', 'docs/sdd/changes/2026-09-30-work.md'], { cwd: root, stdio: 'ignore' });
  const result = run(root);
  assert.equal(result.code, 2, result.out);
  assert.match(result.out, /ARCHIVE REQUIRED/);
  assert.doesNotMatch(result.out, /SAFE TO RETIRE/);
});

test('rejects using the transient artifact itself as the canonical outcome', () => {
  const root = repo();
  const path = 'docs/sdd/changes/2026-09-30-work.md';
  const result = spawnSync('node', [SCRIPT, root, path, path], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(`${result.stdout}${result.stderr}`, /canonical outcome must be distinct/);
});

test('blocks reference-style, angle-bracket, and wiki links to the transient artifact', () => {
  for (const reference of [
    '[work]: <docs/sdd/changes/2026-09-30-work.md>\n',
    '[work](<docs/sdd/changes/2026-09-30-work.md>)\n',
    '[[docs/sdd/changes/2026-09-30-work.md]]\n',
    '[[2026-09-30-work]]\n',
  ]) {
    const root = repo();
    writeFileSync(join(root, 'README.md'), reference);
    const result = run(root);
    assert.equal(result.code, 1, `${reference}: ${result.out}`);
    assert.match(result.out, /live reference/);
  }
});

test('rejects traversal outside the repository', () => {
  const root = repo();
  const result = spawnSync('node', [SCRIPT, root, '../outside.md', 'docs/system/overview.md'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(`${result.stdout}${result.stderr}`, /must resolve to a file inside/);
});
