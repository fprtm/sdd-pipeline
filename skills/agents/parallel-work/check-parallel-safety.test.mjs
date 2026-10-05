// Behavioral tests for check-parallel-safety.mjs — runs the actual script as
// a subprocess against synthetic ticket trees in a scratch temp dir and
// asserts on its exit code and output. Zero dependencies (node:test +
// node:assert are built into Node >= 18), matching the script's own
// zero-dependency design.
//
// Run: node --test skills/agents/parallel-work/check-parallel-safety.test.mjs
// Or via the repo-wide runner: ./scripts/test-checkers.sh

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, 'check-parallel-safety.mjs');

function run(path, ...extraArgs) {
  try {
    const out = execFileSync('node', [SCRIPT, path, ...extraArgs], { encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout ?? '') + (e.stderr ?? '') };
  }
}

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), 'sdd-pw-'));
  return dir;
}

function ticket(id, { title = 'title', files = [], deps = [], status = '⬜ todo', claimed = '' } = {}) {
  const filesLine = files.length ? files.map((f) => `\`${f}\``).join(', ') : '';
  return `# ${id} — ${title}

**Files likely touched:** ${filesLine}
**Dependencies:** ${deps.join(', ') || 'none'}
**Status:** ${status}
**Claimed by:** ${claimed || '_(empty)_'}
`;
}

test('no path at all -> exit 2', () => {
  const { code, out } = run(join(scratch(), 'does-not-exist'));
  assert.equal(code, 2);
  assert.match(out, /no tickets to check/i);
});

test('empty tickets directory -> exit 2', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'tickets'));
  const { code, out } = run(join(dir, 'tickets'));
  assert.equal(code, 2);
  assert.match(out, /No TICKET-xxx blocks found/i);
  rmSync(dir, { recursive: true, force: true });
});

test('two tickets, zero file overlap -> clustered together, exit 0', () => {
  const dir = scratch();
  const tdir = join(dir, 'tickets');
  mkdirSync(tdir);
  writeFileSync(join(tdir, '01-a.md'), ticket('TICKET-001', { files: ['src/a.ts'] }));
  writeFileSync(join(tdir, '02-b.md'), ticket('TICKET-002', { files: ['src/b.ts'] }));
  const { code, out } = run(tdir);
  assert.equal(code, 0);
  assert.match(out, /2 eligible to start now/);
  assert.match(out, /Strict-safe clusters/);
  assert.match(out, /TICKET-001 \+ TICKET-002|TICKET-002 \+ TICKET-001/);
  rmSync(dir, { recursive: true, force: true });
});

test('two tickets sharing 3+ files -> neither clustered nor near-safe (solo only)', () => {
  const dir = scratch();
  const tdir = join(dir, 'tickets');
  mkdirSync(tdir);
  const shared = ['src/a.ts', 'src/b.ts', 'src/c.ts'];
  writeFileSync(join(tdir, '01-a.md'), ticket('TICKET-001', { files: shared }));
  writeFileSync(join(tdir, '02-b.md'), ticket('TICKET-002', { files: shared }));
  const { code, out } = run(tdir);
  assert.equal(code, 0);
  assert.doesNotMatch(out, /Strict-safe clusters:/);
  assert.doesNotMatch(out, /Near-safe pairs/);
  assert.match(out, /Solo only/);
  rmSync(dir, { recursive: true, force: true });
});

test('two tickets sharing 1-2 files -> flagged as near-safe, not auto-clustered', () => {
  const dir = scratch();
  const tdir = join(dir, 'tickets');
  mkdirSync(tdir);
  writeFileSync(join(tdir, '01-a.md'), ticket('TICKET-001', { files: ['src/a.ts', 'src/shared.ts'] }));
  writeFileSync(join(tdir, '02-b.md'), ticket('TICKET-002', { files: ['src/b.ts', 'src/shared.ts'] }));
  const { code, out } = run(tdir);
  assert.equal(code, 0);
  assert.match(out, /Near-safe pairs/);
  assert.match(out, /shared src\/shared\.ts/);
  rmSync(dir, { recursive: true, force: true });
});

test('a claimed ticket is excluded from eligible', () => {
  const dir = scratch();
  const tdir = join(dir, 'tickets');
  mkdirSync(tdir);
  writeFileSync(join(tdir, '01-a.md'), ticket('TICKET-001', { files: ['src/a.ts'], claimed: 'agent-1, ../wt-1' }));
  writeFileSync(join(tdir, '02-b.md'), ticket('TICKET-002', { files: ['src/b.ts'] }));
  const { code, out } = run(tdir);
  assert.equal(code, 0);
  assert.match(out, /1 eligible to start now/);
  assert.doesNotMatch(out, /TICKET-001:/);
  rmSync(dir, { recursive: true, force: true });
});

test('a done ticket is excluded, and unblocks a dependent', () => {
  const dir = scratch();
  const tdir = join(dir, 'tickets');
  mkdirSync(tdir);
  writeFileSync(join(tdir, '01-a.md'), ticket('TICKET-001', { files: ['src/a.ts'], status: '✅ done' }));
  writeFileSync(join(tdir, '02-b.md'), ticket('TICKET-002', { files: ['src/b.ts'], deps: ['TICKET-001'] }));
  const { code, out } = run(tdir);
  assert.equal(code, 0);
  assert.match(out, /1 eligible to start now/);
  assert.match(out, /TICKET-002:/);
  rmSync(dir, { recursive: true, force: true });
});

test('a ticket with an unmet dependency is not eligible', () => {
  const dir = scratch();
  const tdir = join(dir, 'tickets');
  mkdirSync(tdir);
  writeFileSync(join(tdir, '01-a.md'), ticket('TICKET-001', { files: ['src/a.ts'] })); // not done
  writeFileSync(join(tdir, '02-b.md'), ticket('TICKET-002', { files: ['src/b.ts'], deps: ['TICKET-001'] }));
  const { code, out } = run(tdir);
  assert.equal(code, 0);
  assert.match(out, /1 eligible to start now/);
  assert.match(out, /TICKET-001:/);
  assert.doesNotMatch(out, /TICKET-002:/);
  rmSync(dir, { recursive: true, force: true });
});

test('a ticket with no Files-likely-touched is not eligible', () => {
  const dir = scratch();
  const tdir = join(dir, 'tickets');
  mkdirSync(tdir);
  writeFileSync(join(tdir, '01-a.md'), ticket('TICKET-001', { files: [] }));
  const { code, out } = run(tdir);
  assert.equal(code, 0);
  assert.match(out, /0 eligible to start now/);
  rmSync(dir, { recursive: true, force: true });
});

test('--board prints a kanban summary grouped by lane, exit 0', () => {
  const dir = scratch();
  const tdir = join(dir, 'tickets');
  mkdirSync(tdir);
  writeFileSync(join(tdir, '01-a.md'), ticket('TICKET-001', { files: ['src/a.ts'], status: '🔨 in progress' }));
  writeFileSync(join(tdir, '02-b.md'), ticket('TICKET-002', { files: ['src/b.ts'], status: '✅ done' }));
  const { code, out } = run(tdir, '--board');
  assert.equal(code, 0);
  assert.match(out, /Board — 2 tickets/);
  assert.match(out, /🔨 in progress \(1\)/);
  assert.match(out, /✅ done \(1\)/);
  rmSync(dir, { recursive: true, force: true });
});

test('single lite-changes-style markdown file with multiple ### TICKET- blocks works too', () => {
  const dir = scratch();
  const file = join(dir, 'changes.md');
  writeFileSync(
    file,
    `### TICKET-001 — first\n\n**Files likely touched:** \`src/a.ts\`\n**Dependencies:** none\n**Status:** ⬜ todo\n\n### TICKET-002 — second\n\n**Files likely touched:** \`src/b.ts\`\n**Dependencies:** none\n**Status:** ⬜ todo\n`
  );
  const { code, out } = run(file);
  assert.equal(code, 0);
  assert.match(out, /2 eligible to start now/);
  rmSync(dir, { recursive: true, force: true });
});
