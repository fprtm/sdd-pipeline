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
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, 'check-file-hygiene.mjs');

function run(dir, env = {}) {
  const r = spawnSync('node', [SCRIPT, dir], { encoding: 'utf8', env: { ...process.env, ...env } });
  return { code: r.status, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), 'sdd-fh-'));
  return join(dir, 'docs', 'sdd');
}

function withIndex(dir, extra = '') {
  writeFileSync(join(dir, 'index.md'), `# Index\n\n${extra}`);
}

function withLifecyclePolicy(dir, extra = '') {
  writeFileSync(join(dir, 'config.md'), `# Config\n\nsdlc: solo\nsdlc-reason: single-maintainer repository\nartifact-policy-version: 1\nartifact-retention: git-history\n${extra}`);
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

test('retired pre-v5.8.0 dir is a non-failing LEGACY migration opportunity', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design'), { recursive: true });
  withIndex(dir);
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
  assert.match(out, /LEGACY: old naming: design\/ is a pre-v5\.8\.0 layout/);
  assert.doesNotMatch(out, /unknown directory: design\//);
  assert.match(out, /Compatibility pass/);
  assert.doesNotMatch(out, /File hygiene OK/);
});

test('pre-policy Git repo treats a newly added invalid artifact as a current violation', () => {
  const root = mkdtempSync(join(tmpdir(), 'sdd-fh-git-'));
  const dir = join(root, 'docs', 'sdd');
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'config.md'), '# Legacy Config\n\nsdlc: solo\nsdlc-reason: existing project\n');
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'legacy baseline'], { cwd: root });
  mkdirSync(join(dir, 'scratch'), { recursive: true });
  writeFileSync(join(dir, 'scratch', 'new.md'), '# New invalid artifact\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /unknown directory: scratch\//);
  assert.doesNotMatch(out, /LEGACY: unknown directory: scratch\//);
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
  writeFileSync(join(dir, 'specs', '001-my-feature', 'fsd.md'), '[← Back](fsd.md)\n\n# FSD: My Feature');
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
  for (const f of ['fsd.md', 'sds.md', 'prd.md', 'threats.md', 'erd.md', 'tests.md']) {
    writeFileSync(join(feat, f), `[← Back to fsd.md](fsd.md)\n\n# ${f}`);
  }
  writeFileSync(join(feat, 'ux.md'), '[← Back to fsd.md](fsd.md)\n\n# ux.md\n\n**Direction confirmed**: user picked option B\n');
  writeFileSync(join(feat, 'dod.md'), '# dod.md'); // exempt from nav-header requirement
  withIndex(dir, '- [Full Feature](specs/002-full-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('a spec doc (fsd.md) missing the nav-header link is flagged', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(feat, { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '# FSD\n\nNo link back to anywhere.');
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /missing a nav-header link/);
});

test('dod.md and idea.md are exempt from the nav-header requirement', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(feat, { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'dod.md'), '# DoD checklist, no link');
  writeFileSync(join(feat, 'idea.md'), '# Idea, no link');
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('ux.md missing "**Direction confirmed**:" is flagged', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(feat, { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'ux.md'), '[← Back](fsd.md)\n\n# UX\n\n## Direction\n\nSome direction, no confirmation record.');
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /missing "\*\*Direction confirmed\*\*:"/);
});

test('ux.md with "**Direction confirmed**:" passes', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(feat, { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(
    join(feat, 'ux.md'),
    '[← Back](fsd.md)\n\n# UX\n\n**Direction confirmed**: assumed default — prototype mode, not asked\n'
  );
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('config.md missing "sdlc:" is flagged', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'config.md'), '# Config\n\nmode: standard\n');
  withIndex(dir);
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /missing "sdlc:"/);
});

test('config.md with "sdlc:" but no "sdlc-reason:" is flagged', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'config.md'), '# Config\n\nsdlc: solo\n');
  withIndex(dir);
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /no "sdlc-reason:"/);
});

test('config.md with both sdlc: and sdlc-reason: passes', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'config.md'), '# Config\n\nsdlc: agile\nagile-framework: kanban\nsdlc-reason: WIP-limited board found\n');
  withIndex(dir);
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

test('tickets/ with ticket files but no fsd.md sibling is flagged (phase-gate: no SPEC evidence)', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# TICKET-001 — First\n');
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /has ticket files but no fsd\.md sibling/);
});

test('tickets/ with 00-index.md and valid ticket files passes', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '[← Back to tickets/00-index.md](tickets/00-index.md)\n\n# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# TICKET-001 — First\n\n**Status**: ⬜ todo\n');
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('tickets/ ticket file with no **Status**: line is flagged', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# TICKET-001 — First\n');
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /no valid \*\*Status\*\*: line found/);
});

test('a T2 ticket with no "## Algorithm / Flow" section is flagged', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(
    join(feat, 'tickets', '01-first.md'),
    '# TICKET-001 — First\n\n**Tier**: T2\n**Status**: ⬜ todo\n'
  );
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /Tier T2 ticket has no "## Algorithm \/ Flow" section/);
});

test('a T1 ticket with no "## Algorithm / Flow" section passes (not required below T2)', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(
    join(feat, 'tickets', '01-first.md'),
    '# TICKET-001 — First\n\n**Tier**: T1\n**Status**: ⬜ todo\n'
  );
  withIndex(dir, '- [x](specs/001-my-feature/)');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('a T3 ticket WITH "## Algorithm / Flow" passes', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(
    join(feat, 'tickets', '01-first.md'),
    '# TICKET-001 — First\n\n**Tier**: T3\n**Status**: ⬜ todo\n\n## Algorithm / Flow\n\n1. Step one\n2. Step two\n'
  );
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
  writeFileSync(join(dir, 'design-system', 'design.md'), '# Design\n\n**Design source**: ui-ux-pro-max\n');
  writeFileSync(
    join(dir, 'design-system', 'ux-screens', 'checkout.md'),
    '---\ndescription: checkout flow\npriority: Must\nupdated: 2026-08-20\n---\n# Checkout\n\n## Layout & Visual Composition\n\nSingle column.'
  );
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('design-system/ux-screens/ file missing "## Layout & Visual Composition" is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design-system', 'ux-screens'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'design-system', 'design.md'), '# Design\n\n**Design source**: ui-ux-pro-max\n');
  writeFileSync(
    join(dir, 'design-system', 'ux-screens', 'checkout.md'),
    '---\ndescription: checkout flow\npriority: Must\nupdated: 2026-08-20\n---\n# Checkout'
  );
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /missing "## Layout & Visual Composition"/);
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
  writeFileSync(join(dir, 'design-system', 'design.md'), '# Design\n\n**Design source**: ui-ux-pro-max\n');
  const crlf = ['---', 'description: checkout flow', 'priority: Must', 'updated: 2026-08-20', '---', '# Checkout', '', '## Layout & Visual Composition', '', 'Single column.'].join('\r\n');
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
  writeFileSync(join(dir, 'design-system', 'design.md'), '# Design\n\n**Design source**: ui-ux-pro-max\n');
  writeFileSync(join(dir, 'design-system', 'tokens.md'), '# Tokens');
  writeFileSync(join(dir, 'design-system', 'anything-an-external-skill-wrote.md'), '# Ext');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('design.md missing "**Design source**:" is flagged', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design-system'), { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'design-system', 'design.md'), '# Design\n\nNo source line at all.');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /missing "\*\*Design source\*\*:"/);
});

test('design.md with a custom design source reason passes', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design-system'), { recursive: true });
  withIndex(dir);
  writeFileSync(
    join(dir, 'design-system', 'design.md'),
    '# Design\n\n**Design source**: custom: internal brand guide, no catalog needed\n'
  );
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

test('legacy repository without lifecycle marker keeps old change contract compatible', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  withIndex(dir, '- [fix](changes/2026-08-20-fix.md)');
  writeFileSync(join(dir, 'changes', '2026-08-20-fix.md'), '---\ndescription: old format\nstatus: done\nupdated: 2026-08-20\n---\n# Fix');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('pre-policy repo treats a newly added artifact as a strict reactivation violation', () => {
  const root = mkdtempSync(join(tmpdir(), 'sdd-legacy-reactivate-'));
  const dir = join(root, 'docs', 'sdd');
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  writeFileSync(join(dir, 'config.md'), '# Config\n\nsdlc: solo\nsdlc-reason: legacy project\n');
  for (const args of [['init'], ['config', 'user.email', 'test@example.com'], ['config', 'user.name', 'Test'], ['add', '.'], ['commit', '-m', 'legacy baseline']]) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  mkdirSync(join(dir, 'scratch'), { recursive: true });
  writeFileSync(join(dir, 'scratch', 'new.md'), '# New work\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /unknown directory: scratch\//);
});

test('policy v1 change requires lifecycle and observable goal', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  withIndex(dir, '- [fix](changes/2026-08-20-fix.md)');
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'changes', '2026-08-20-fix.md'), '---\ndescription: new format\nstatus: active\nupdated: 2026-08-20\n---\n# Fix');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /missing valid "lifecycle:"/);
  assert.match(out, /missing "goal:" observable outcome/);
});

test('policy v1 rejects completed transient change in active tree', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  withIndex(dir, '- [fix](changes/2026-08-20-fix.md)');
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'changes', '2026-08-20-fix.md'), '---\ndescription: new format\nstatus: done\nlifecycle: transient\ngoal: login succeeds\nupdated: 2026-08-20\n---\n# Fix');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /completed transient artifact remains in the active working set/);
});

test('policy v1 ticket requires goal supports success and cannot remain done', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  withIndex(dir, '- [x](specs/001-my-feature/)');
  withLifecyclePolicy(dir);
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# TICKET-001 — First\n\n**Status**: ✅ done\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /missing goal/);
  assert.match(out, /missing supports/);
  assert.match(out, /missing success/);
  assert.match(out, /completed transient ticket remains/);
});

test('policy v1 valid active goal ticket passes', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  withIndex(dir, '- [x](specs/001-my-feature/)');
  withLifecyclePolicy(dir);
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# TICKET-001 — First\n\n**Status**: ⬜ todo\n\n## Goal\nUser can sign in.\n\n## Supports\nFSD-001\n\n## Success\n- Valid credentials create a session.\n');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('policy v1 security ticket enforces four distinct review actors', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  withIndex(dir, '- [x](specs/001-my-feature/)');
  withLifecyclePolicy(dir);
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# TICKET-001 — First\n\n**Status**: 🧪 testing/review\n**Security-sensitive**: true\n**Implementer**: agent-a\n**Reviewer**: agent-b\n**Verifier**: agent-c\n**Security_reviewer**: agent-c\n**Independence**: independent\n\n## Goal\nUser can sign in.\n\n## Supports\nFSD-001\n\n## Success\n- Valid credentials create a session.\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /verifier and security_reviewer actor IDs must differ/);
});

test('policy v1 testing ticket from documented bold actor template passes with four distinct actors', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(join(feat, 'tickets'), { recursive: true });
  withIndex(dir, '- [x](specs/001-my-feature/)');
  withLifecyclePolicy(dir);
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'tickets', '00-index.md'), '# Work Order\n\nTICKET-001\n');
  writeFileSync(join(feat, 'tickets', '01-first.md'), '# TICKET-001 — First\n\n**Status**: 🧪 testing/review\n**Security-sensitive**: true\n**Implementer**: agent-a\n**Reviewer**: agent-b\n**Verifier**: agent-c\n**Security_reviewer**: agent-d\n**Independence**: independent\n\n## Goal\nUser can sign in.\n\n## Supports\nFSD-001\n\n## Success\n- Valid credentials create a session.\n');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('policy v1 rejects Recent Activity ledger and actor identity collisions', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  withIndex(dir, '## Recent Activity\n- old task\n\n- [fix](changes/2026-08-20-fix.md)');
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'changes', '2026-08-20-fix.md'), '---\ndescription: new format\nstatus: active\nlifecycle: active\ngoal: login succeeds\nupdated: 2026-08-20\n---\n# Fix\n\nimplementer: agent-a\nreviewer: agent-a\nverifier: agent-a\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /Recent Activity/);
  assert.match(out, /implementer and reviewer actor IDs must differ/);
  assert.match(out, /implementer and verifier actor IDs must differ/);
});

test('policy v1 accepts distinct implementation review and verification actors', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  withIndex(dir, '- [fix](changes/2026-08-20-fix.md)');
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'changes', '2026-08-20-fix.md'), '---\ndescription: new format\nstatus: active\nlifecycle: active\ngoal: login succeeds\nupdated: 2026-08-20\n---\n# Fix\n\n- implementer: agent-a\n- reviewer: agent-b\n- verifier: agent-c\n- independence: independent\n');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('policy v1 security-sensitive change requires a distinct security reviewer', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  withIndex(dir, '- [fix](changes/2026-08-20-fix.md)');
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'changes', '2026-08-20-fix.md'), '---\ndescription: auth change\nstatus: active\nlifecycle: active\ngoal: secure login\nupdated: 2026-08-20\n---\n# Fix\n\n**Size**: medium\nsecurity-sensitive: true\n\n- implementer: agent-a\n- reviewer: agent-b\n- verifier: agent-c\n- independence: independent\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /security-sensitive work requires security_reviewer actor ID/);
});

test('policy v1 medium degraded independence requires and accepts explicit human review items', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'changes'), { recursive: true });
  withIndex(dir, '- [fix](changes/2026-08-20-fix.md)');
  withLifecyclePolicy(dir);
  const base = '---\ndescription: new format\nstatus: active\nlifecycle: active\ngoal: login succeeds\nupdated: 2026-08-20\n---\n# Fix\n\n**Size**: medium\n\n- implementer: agent-a\n- independence: degraded independence\n';
  writeFileSync(join(dir, 'changes', '2026-08-20-fix.md'), base);
  let result = run(dir);
  assert.equal(result.code, 1);
  assert.match(result.out, /degraded independence requires non-empty "## Human Review"/);
  writeFileSync(join(dir, 'changes', '2026-08-20-fix.md'), `${base}\n## Human Review\n- Verify login lockout behavior.\n`);
  result = run(dir);
  assert.equal(result.code, 0, result.out);
});

test('policy v1 retains canonical feature specs after transient work retires', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-login');
  mkdirSync(feat, { recursive: true });
  withLifecyclePolicy(dir);
  withIndex(dir, '## Canonical Documents\n- [login](specs/001-login/)\n');
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD: Login\n');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('policy v1 validates reference and portable handoff structure', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'HANDOFF.md'), '# SDD Handoff\n\nprotocol: sdd-handoff/v1\nform: portable\nstate: active\ncreated_at: 2026-09-30T00:00:00Z\nproducer_actor: agent-a\n\n## Resume Goal\ntarget_state: checker passes\nsuccess_when:\n- tests are green\n\n## Transition\nphase: CHECK\nnext_action: run tests\n\n## Integrity\nrepo_head: abc\ndirty: false\nrelevant_paths:\n- tools/check.mjs\n\n## Authority\nbaseline:\n- repository-write\ncarried:\n- repository-write\n\n## Capabilities\nrequired: shell\n\n## Evidence\n- unverified\n\n## Pointers\n- index.md\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /portable form requires non-empty "## Minimum State"/);
});

test('policy v1 reference handoff requires pointers that resolve', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'HANDOFF.md'), '# SDD Handoff\n\nprotocol: sdd-handoff/v1\nform: reference\nstate: active\ncreated_at: 2026-09-30T00:00:00Z\nproducer_actor: agent-a\n\n## Resume Goal\ntarget_state: checker passes\nsuccess_when:\n- tests are green\n\n## Transition\nphase: CHECK\nnext_action: run tests\n\n## Integrity\nrepo_head: abc\ndirty: false\nrelevant_paths:\n- tools/check.mjs\n\n## Authority\nbaseline:\n- repository-read\ncarried:\n- repository-read\n\n## Capabilities\nrequired: shell\n\n## Evidence\n- tests pending\n\n## Pointers\n- missing.md\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /reference pointer does not resolve: missing\.md/);
});

test('policy v1 handoff cannot expand authority and consumed snapshots retire', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'HANDOFF.md'), '# SDD Handoff\n\nprotocol: sdd-handoff/v1\nform: portable\nstate: consumed\ncreated_at: 2026-09-30T00:00:00Z\nproducer_actor: agent-a\n\n## Resume Goal\ntarget_state: checker passes\nsuccess_when:\n- tests are green\n\n## Transition\nphase: CHECK\nnext_action: run tests\n\n## Integrity\nrepo_head: unavailable\ndirty: unknown\nrelevant_paths:\n- tools/check.mjs\n\n## Authority\nbaseline:\n- repository-read\ncarried:\n- repository-read\n- deploy-production\n\n## Capabilities\nrequired: shell\n\n## Evidence\n- tests pending\n\n## Pointers\n- index.md\n\n## Minimum State\nReady to run.\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /carried authority expands beyond baseline: deploy-production/);
  assert.match(out, /consumed transient handoff remains/);
});

test('handoff blocks when the current harness lacks a required capability', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'HANDOFF.md'), '# SDD Handoff\n\nprotocol: sdd-handoff/v1\nform: portable\nstate: active\ncreated_at: 2026-09-30T00:00:00Z\nproducer_actor: agent-a\n\n## Resume Goal\ntarget_state: checker passes\nsuccess_when:\n- tests are green\n\n## Transition\nphase: CHECK\nnext_action: run tests\n\n## Integrity\nrepo_head: unavailable\ndirty: unknown\nrelevant_paths:\n- tools/check.mjs\n\n## Authority\nbaseline:\n- repository-read\ncarried:\n- repository-read\n\n## Capabilities\nrequired: shell, browser\n\n## Evidence\n- tests pending\n\n## Pointers\n- index.md\n\n## Minimum State\nReady to run.\n');
  const { code, out } = run(dir, { SDD_CAPABILITIES: 'shell' });
  assert.equal(code, 1);
  assert.match(out, /required capability unavailable: browser/);
});

test('handoff reports DEGRADED when an optional capability is unavailable', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'HANDOFF.md'), '# SDD Handoff\n\nprotocol: sdd-handoff/v1\nform: portable\nstate: active\ncreated_at: 2026-09-30T00:00:00Z\nproducer_actor: agent-a\n\n## Resume Goal\ntarget_state: checker passes\nsuccess_when:\n- tests are green\n\n## Transition\nphase: CHECK\nnext_action: run tests\n\n## Integrity\nrepo_head: unavailable\ndirty: unknown\nrelevant_paths:\n- tools/check.mjs\n\n## Authority\nbaseline:\n- repository-read\ncarried:\n- repository-read\n\n## Capabilities\nrequired: shell\noptional: browser\n\n## Evidence\n- tests pending\n\n## Pointers\n- index.md\n\n## Minimum State\nReady.\n');
  const { code, out } = run(dir, { SDD_CAPABILITIES: 'shell' });
  assert.equal(code, 0, out);
  assert.match(out, /DEGRADED: HANDOFF\.md: optional capability unavailable: browser/);
});

test('handoff rejects malformed created_at timestamp', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'HANDOFF.md'), '# SDD Handoff\n\nprotocol: sdd-handoff/v1\nform: portable\nstate: active\ncreated_at: yesterday\nproducer_actor: agent-a\n\n## Resume Goal\ntarget_state: checker passes\nsuccess_when:\n- tests are green\n\n## Transition\nphase: CHECK\nnext_action: run tests\n\n## Integrity\nrepo_head: unavailable\ndirty: unknown\nrelevant_paths:\n- planned:tools/check.mjs\n\n## Authority\nbaseline:\n- repository-read\ncarried:\n- repository-read\n\n## Capabilities\nrequired: shell\n\n## Evidence\n- tests pending\n\n## Pointers\n- index.md\n\n## Minimum State\nReady.\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /created_at must be an ISO-8601 timestamp/);
});

test('reference handoff rejects absolute or escaping repository paths', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  withLifecyclePolicy(dir);
  writeFileSync(join(dir, 'HANDOFF.md'), '# SDD Handoff\n\nprotocol: sdd-handoff/v1\nform: reference\nstate: active\ncreated_at: 2026-09-30T00:00:00Z\nproducer_actor: agent-a\n\n## Resume Goal\ntarget_state: checker passes\nsuccess_when:\n- tests are green\n\n## Transition\nphase: CHECK\nnext_action: run tests\n\n## Integrity\nrepo_head: unavailable\ndirty: unknown\nrelevant_paths:\n- /etc/passwd\n\n## Authority\nbaseline:\n- repository-read\ncarried:\n- repository-read\n\n## Capabilities\nrequired: shell\n\n## Evidence\n- tests pending\n\n## Pointers\n- ../../../../etc/passwd\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /relevant path escapes repository/);
  assert.match(out, /reference pointer escapes repository/);
});

test('reference handoff blocks when a relevant path changed after repo_head', () => {
  const root = mkdtempSync(join(tmpdir(), 'sdd-handoff-git-'));
  const dir = join(root, 'docs', 'sdd');
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(dir, { recursive: true });
  withIndex(dir);
  withLifecyclePolicy(dir);
  writeFileSync(join(root, 'src', 'feature.txt'), 'v1\n');
  for (const args of [['init'], ['config', 'user.email', 'test@example.com'], ['config', 'user.name', 'Test'], ['add', '.'], ['commit', '-m', 'baseline']]) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  const oldHead = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  writeFileSync(join(root, 'src', 'feature.txt'), 'v2\n');
  assert.equal(spawnSync('git', ['add', 'src/feature.txt'], { cwd: root }).status, 0);
  assert.equal(spawnSync('git', ['commit', '-m', 'relevant change'], { cwd: root }).status, 0);
  writeFileSync(join(dir, 'HANDOFF.md'), `# SDD Handoff\n\nprotocol: sdd-handoff/v1\nform: reference\nstate: active\ncreated_at: 2026-09-30T00:00:00Z\nproducer_actor: agent-a\n\n## Resume Goal\ntarget_state: checker passes\nsuccess_when:\n- tests are green\n\n## Transition\nphase: CHECK\nnext_action: run tests\n\n## Integrity\nrepo_head: ${oldHead}\ndirty: true\nrelevant_paths:\n- src/feature.txt\n\n## Authority\nbaseline:\n- repository-read\ncarried:\n- repository-read\n\n## Capabilities\nrequired: shell\n\n## Evidence\n- tests pending\n\n## Pointers\n- docs/sdd/index.md\n`);
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /relevant repository state changed since repo_head: src\/feature\.txt/);
});

test('policy v1 deliberation ledger requires decision goal, exit condition, and support', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(feat, { recursive: true });
  withIndex(dir, '- [x](specs/001-my-feature/)');
  withLifecyclePolicy(dir);
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD');
  writeFileSync(join(feat, 'deliberation.md'), 'status: active\n\n| Question | Answer |\n|---|---|');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /missing "decision_goal:"/);
  assert.match(out, /missing "exit_when:"/);
  assert.match(out, /missing "supports:"/);
});

test('policy v1 active index enforces a three-entry default budget', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withLifecyclePolicy(dir);
  withIndex(dir, '## Active Work\n- [a](a)\n- [b](b)\n- [c](c)\n- [d](d)\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /Active Work has 4 entry documents/);
});

test('policy v1 rejects completed rows under Active Work', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withLifecyclePolicy(dir);
  withIndex(dir, '## Active Work\n- [old](changes/old.md) · done\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /completed\/historical row remains under Active Work/);
});

test('policy v1 allows an explicitly justified large-scope entry budget', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  withLifecyclePolicy(dir, 'active-entry-budget: 4\nactive-entry-budget-reason: independent BE FE review and verification consumers\n');
  withIndex(dir, '## Active Work\n- [a](a)\n- [b](b)\n- [c](c)\n- [d](d)\n');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('policy v1 rejects archive without explicit archive retention policy', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'plans', 'archive'), { recursive: true });
  withLifecyclePolicy(dir);
  withIndex(dir);
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /archive exists without artifact-retention: archive/);
});

test('legacy ticket and report archives are non-failing migration findings', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'reports', 'archive'), { recursive: true });
  mkdirSync(join(dir, 'specs', '001-old', 'tickets', 'archive'), { recursive: true });
  withIndex(dir, '- [old](specs/001-old/)');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
  assert.match(out, /LEGACY: reports\/archive\//);
  assert.match(out, /LEGACY: specs\/001-old\/tickets\/archive\//);
});

test('policy v1 flags resolved reports, verified ledgers, and mixed-responsibility god files', () => {
  const dir = scratch();
  const feat = join(dir, 'specs', '001-my-feature');
  mkdirSync(feat, { recursive: true });
  mkdirSync(join(dir, 'reports'), { recursive: true });
  withIndex(dir, '- [x](specs/001-my-feature/)');
  withLifecyclePolicy(dir);
  writeFileSync(join(feat, 'fsd.md'), '[← Back](fsd.md)\n\n# FSD\n\n## Design\nA\n\n## Progress\nB\n\n## Raw Command Output\nC\n');
  writeFileSync(join(feat, 'deliberation.md'), 'decision_goal: settle behavior\nexit_when: confirmed\nsupports: FSD-001\nstatus: verified\n');
  writeFileSync(join(dir, 'reports', '2026-09-30-check.md'), '# Check\n\nStatus: RESOLVED\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /verified transient ledger remains/);
  assert.match(out, /resolved transient report remains/);
  assert.match(out, /mixes 3 responsibilities/);
});
