// Behavioral tests for check-file-hygiene.mjs — runs the actual script as a
// subprocess against synthetic docs/sdd trees and asserts on exit code and
// output. Zero dependencies (node:test + node:assert, built into Node >= 18).
// Several of these are regression tests for bugs found and fixed during the
// 2026-08-20 readiness audit — see the commit history for
// skills/meta/health-check/check-file-hygiene.mjs.
//
// Run: node --test skills/meta/health-check/check-file-hygiene.test.mjs
// Or via the repo-wide runner: ./scripts/test-checkers.sh

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, 'check-file-hygiene.mjs');

function run(dir) {
  const r = spawnSync('node', [SCRIPT, dir], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), 'sdd-fh-'));
  return join(dir, 'docs', 'sdd');
}

function withIndex(dir, extra = '') {
  writeFileSync(join(dir, 'index.md'), `# Index\n\n${extra}`);
}

test('no docs/sdd at all -> exit 0 (nothing to check)', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'sdd-fh-')), 'docs', 'sdd');
  const { code, out } = run(dir);
  assert.equal(code, 0);
  assert.match(out, /nothing to check/i);
});

test('empty docs/sdd with just index.md -> exit 0', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  const { code, out } = run(dir);
  assert.equal(code, 0);
  assert.match(out, /File hygiene OK/);
});

test('unknown root .md file is flagged', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'random-notes.md'), '# oops');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /stray file at root: random-notes\.md/);
});

test('unknown subdirectory is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'scratch'), { recursive: true });
  withIndex(dir);
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /unknown directory: scratch\//);
});

test('a bare file directly in specs/ (not inside a feature folder) is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'specs'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'specs', 'my-feature-fsd.md'), '# FSD');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /stray file at specs\/my-feature-fsd\.md/);
});

test('bad feature folder name (missing NNN- prefix) is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'specs', 'my-feature'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'specs', 'my-feature', 'fsd.md'), '# FSD');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /bad feature folder name: specs\/my-feature/);
});

test('bad filename inside a feature folder is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'specs', '001-my-feature'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'specs', '001-my-feature', '001-my-feature-fsd.md'), '# FSD');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /bad filename: specs\/001-my-feature\/001-my-feature-fsd\.md/);
});

test('correctly-named feature folder with bare fsd.md, referenced in index.md, passes', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'specs', '001-my-feature'), { recursive: true });
  writeFileSync(join(dir, 'specs', '001-my-feature', 'fsd.md'), '# FSD: My Feature');
  withIndex(dir, '- [My Feature](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('feature folder NOT referenced in index.md is an orphan', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'specs', '001-my-feature'), { recursive: true });
  writeFileSync(join(dir, 'specs', '001-my-feature', 'fsd.md'), '# FSD');
  withIndex(dir);
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /orphan: specs\/001-my-feature\/ not referenced in index\.md/);
});

test('all eight allowed spec filenames pass in one feature folder', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '002-full-feature');
  mkdirSync(feat, { recursive: true });
  for (const f of ['fsd.md', 'sds.md', 'prd.md', 'threats.md', 'ux.md', 'erd.md', 'tests.md', 'dod.md']) {
    writeFileSync(join(feat, f), `# ${f}`);
  }
  withIndex(dir, '- [Full Feature](specs/002-full-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('a subdirectory other than tickets/ inside a feature folder is flagged', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'scratch'), { recursive: true });
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /unexpected subdirectory: specs\/001-my-feature\/scratch\//);
});

test('duplicate feature number with different slugs is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'specs', '001-employee-branch-backup'), { recursive: true });
  mkdirSync(join(dir, 'specs', '001-branch-backup-employee'), { recursive: true });
  writeFileSync(join(dir, 'specs', '001-employee-branch-backup', 'fsd.md'), '# FSD');
  writeFileSync(join(dir, 'specs', '001-branch-backup-employee', 'fsd.md'), '# FSD');
  withIndex(dir, '- a\n- b');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /duplicate feature number 001/);
});

test('tickets/ file with no TICKET-xxx id is flagged', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order');
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# Just a title, no id');
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /no global TICKET-xxx id found/);
});

test('tickets/ with ticket files but no 00-index.md is flagged', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# TICKET-001 — First\n');
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /has ticket files but no 00-index\.md/);
});

test('tickets/ with 00-index.md and valid ticket files passes', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# TICKET-001 — First\n');
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('design-system/ux-screens/ file missing updated: frontmatter is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design-system', 'ux-screens'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'design-system', 'design.md'), '# Design');
  writeFileSync(join(dir, 'design-system', 'ux-screens', 'checkout.md'), '---\ndescription: checkout flow\npriority: Must\n---\n# Checkout');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /design-system\/ux-screens\/checkout\.md: frontmatter missing "updated: YYYY-MM-DD"/);
});

test('design-system/ux-screens/ file with all required frontmatter passes', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design-system', 'ux-screens'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'design-system', 'design.md'), '# Design');
  writeFileSync(
    join(dir, 'design-system', 'ux-screens', 'checkout.md'),
    '---\ndescription: checkout flow\npriority: Must\nupdated: 2026-08-20\n---\n# Checkout'
  );
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('changes/ file missing status: frontmatter is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  withIndex(dir, '- [fix](changes/2026-08-20-fix.md)');
  writeFileSync(join(dir, 'changes', '2026-08-20-fix.md'), '---\ndescription: a fix\nupdated: 2026-08-20\n---\n# Fix');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /frontmatter missing "status:"/);
});

test('changes/ duplicate topic slug (two files, same slug) is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  const fm = '---\ndescription: d\nstatus: DONE\nupdated: 2026-08-20\n---\n# X';
  writeFileSync(join(dir, 'changes', '2026-08-20-fix-login.md'), fm);
  writeFileSync(join(dir, 'changes', '2026-08-21-fix-login.md'), fm);
  withIndex(dir, '- a\n- b');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /duplicate topic slug "fix-login"/);
});

test('decisions/ bad filename (no NNN- prefix) is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'decisions'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'decisions', 'use-postgres.md'), '# Decision');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /bad filename: decisions\/use-postgres\.md/);
});

test('memory/ note not listed in INDEX.md is an orphan', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'memory'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'memory', 'INDEX.md'), '# Memory Index\n\nNo notes yet.');
  writeFileSync(join(dir, 'memory', 'auth-gotcha.md'), '---\ndescription: why auth serializes\n---\nBody.');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /orphan: memory\/auth-gotcha\.md not listed in memory\/INDEX\.md/);
});

// --- Regressions from the 2026-08-20 audit fix pass ---

test('regression: insights.md at root is allowed (was previously flagged)', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'insights.md'), '# Insights');
  const { code } = run(dir);
  assert.equal(code, 0);
});

test('regression: CRLF line endings in frontmatter no longer false-positive "missing frontmatter"', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design-system', 'ux-screens'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'design-system', 'design.md'), '# Design');
  const crlf = ['---', 'description: checkout flow', 'priority: Must', 'updated: 2026-08-20', '---', '# Checkout'].join('\r\n');
  writeFileSync(join(dir, 'design-system', 'ux-screens', 'checkout.md'), crlf);
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('regression: uppercase .MD extension is caught, not silently skipped', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'decisions'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'decisions', '001-use-postgres.MD'), '# Decision');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /bad filename: decisions\/001-use-postgres\.MD/);
});

test('regression: a broken symlink does not crash the checker', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  withIndex(dir);
  symlinkSync('/nonexistent/target', join(dir, 'changes', '2026-08-20-ghost.md'));
  const { code, out } = run(dir);
  // Must not throw an uncaught exception (would show a Node stack trace and
  // exit 1 via an uncaught-exception path rather than the script's own exit).
  assert.doesNotMatch(out, /at Object\.<anonymous>|ENOENT.*at /);
  assert.equal(code, 0);
});

test('design-system/ without design.md is flagged (missing UI entry doc)', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design-system'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'design-system', 'tokens.md'), '# Tokens');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /design-system\/ exists but has no design\.md/);
});

test('design-system/ with design.md passes, whatever else it splits into', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design-system'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'design-system', 'design.md'), '# Design');
  writeFileSync(join(dir, 'design-system', 'tokens.md'), '# Tokens');
  writeFileSync(join(dir, 'design-system', 'anything-an-external-skill-wrote.md'), '# Ext');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('no design-system/ at all is fine (API-only/CLI project has no UI)', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
  assert.doesNotMatch(out, /design\.md/);
});
