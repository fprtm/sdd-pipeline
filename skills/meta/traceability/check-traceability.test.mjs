// Behavioral tests for check-traceability.mjs — runs the actual script as a
// subprocess against synthetic docs/sdd trees and asserts on exit code and
// output. Zero dependencies (node:test + node:assert, built into Node >= 18).
// Several of these are regression tests for bugs found and fixed during the
// 2026-08-20 readiness audit — see the commit history for
// skills/meta/traceability/check-traceability.mjs.
//
// Run: node --test skills/meta/traceability/check-traceability.test.mjs
// Or via the repo-wide runner: ./scripts/test-checkers.sh

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, 'check-traceability.mjs');

function run(dir) {
  const r = spawnSync('node', [SCRIPT, dir], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

function scratch() {
  return join(mkdtempSync(join(tmpdir(), 'sdd-tr-')), 'docs', 'sdd');
}

test('no dir at all -> exit 0 (nothing to check)', () => {
  const { code, out } = run(join(scratch(), 'missing'));
  assert.equal(code, 0);
  assert.match(out, /nothing to check/i);
});

test('a REQ defined with no traceability.md at all -> not flagged as orphan (size-tier exemption)', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design'), { recursive: true });
  writeFileSync(
    join(dir, 'design', '001-login-fsd.md'),
    '# FSD: Login\n\n| REQ-001 | User can log in | Must |\n'
  );
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
  assert.doesNotMatch(out, /Spine orphans/);
});

test('REQ defined and cited in an existing matrix -> passes', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design'), { recursive: true });
  writeFileSync(join(dir, 'design', '001-login-fsd.md'), '# FSD: Login\n\n| REQ-001 | Login | Must |\n');
  writeFileSync(
    join(dir, 'traceability.md'),
    '| REQ | FSD | ADR | SEC | Ticket | Test | Status |\n|---|---|---|---|---|---|---|\n| REQ-001 | FSD-001 | - | - | - | - | not built |\n'
  );
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('REQ defined but missing from an EXISTING matrix -> flagged as orphan', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design'), { recursive: true });
  writeFileSync(
    join(dir, 'design', '001-login-fsd.md'),
    '# FSD: Login\n\n| REQ-001 | Login | Must |\n| REQ-002 | Logout | Must |\n'
  );
  writeFileSync(
    join(dir, 'traceability.md'),
    '| REQ | FSD | ADR | SEC | Ticket | Test | Status |\n|---|---|---|---|---|---|---|\n| REQ-001 | FSD-001 | - | - | - | - | not built |\n'
  );
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /Spine orphans/);
  assert.match(out, /REQ-002/);
});

test('matrix cites an id that is never defined -> broken ref', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'traceability.md'),
    '| REQ | FSD | ADR | SEC | Ticket | Test | Status |\n|---|---|---|---|---|---|---|\n| REQ-099 | FSD-001 | - | - | - | - | not built |\n'
  );
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /Broken refs/);
  assert.match(out, /REQ-099/);
});

test('a TICKET with no upstream REQ/FSD/SEC/ADR nearby -> freelance', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'tickets', 'feat'), { recursive: true });
  writeFileSync(
    join(dir, 'tickets', 'feat', '01-x.md'),
    '# TICKET-018 — Do a thing\n\nJust some unrelated prose with no upstream id anywhere nearby.\n'
  );
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /Freelance tickets\/tests/);
  assert.match(out, /TICKET-018/);
});

test('a TICKET citing its parent FSD nearby is not freelance', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'tickets', 'feat'), { recursive: true });
  writeFileSync(
    join(dir, 'tickets', 'feat', '01-x.md'),
    '# TICKET-018 — Do a thing\n\n**Refs**: FSD-003\n'
  );
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('the same id defined in two different files -> duplicate', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design'), { recursive: true });
  writeFileSync(join(dir, 'design', '001-a-fsd.md'), '# FSD: A\n\n| REQ-001 | thing | Must |\n');
  writeFileSync(join(dir, 'design', '002-b-fsd.md'), '# FSD: B\n\n| REQ-001 | different thing | Must |\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /Duplicate ID definitions|duplicate/i);
  assert.match(out, /REQ-001/);
});

test('a dead relative markdown link is caught', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.md'), 'See [my doc](nonexistent-file.md) for details.\n');
  const { code, out } = run(dir);
  assert.equal(code, 1);
  assert.match(out, /Dead links/);
  assert.match(out, /nonexistent-file\.md/);
});

test('an http(s) link is never treated as a dead relative link', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.md'), 'See [external](https://example.com/x) for details.\n');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

// --- Regressions from the 2026-08-20 audit fix pass ---

test('regression: a [text](path) example inside inline code is not a dead link', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'index.md'),
    'Row format: `- [file](path) — one-line description`\n'
  );
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('regression: a [text](path) example inside a fenced code block is not a dead link', () => {
  const dir = scratch();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.md'), '# Doc\n\n```\nExample: [file](path)\n```\n');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('regression: an ID reference INSIDE a code span is still tracked (unlike link-checking, this must not be stripped)', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design'), { recursive: true });
  writeFileSync(join(dir, 'design', '001-a-fsd.md'), '# FSD: A\n\n| REQ-001 | thing | Must |\n');
  writeFileSync(
    join(dir, 'traceability.md'),
    '| REQ | FSD | ADR | SEC | Ticket | Test | Status |\n|---|---|---|---|---|---|---|\n| `REQ-001` | FSD-001 | - | - | - | - | not built |\n'
  );
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
});

test('regression: Updated/Version/Status doc-header lines produce no phantom ids', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design'), { recursive: true });
  writeFileSync(
    join(dir, 'design', '001-a-fsd.md'),
    '# FSD: A\n\n**Date**: 2026-08-20\n**Updated**: 2026-08-20\n**Version**: v1\n**Status**: DRAFT\n\n| REQ-001 | thing | Must |\n'
  );
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
  // Exactly 2: the filename itself defines FSD-001 (file-level id), the
  // table row defines REQ-001 (item-level) — the Date/Updated/Version/Status
  // header lines must contribute zero additional (phantom) ids.
  assert.match(out, /defined: 2/);
});

test('a -sds.md file defines SDS-NNN (Software Design Specification, not FSD/PRD)', () => {
  const dir = scratch();
  mkdirSync(join(dir, 'design'), { recursive: true });
  writeFileSync(join(dir, 'design', '002-payment-sds.md'), '# SDS: Payment Refund\n\n**Date**: 2026-08-20\n');
  const { code, out } = run(dir);
  assert.equal(code, 0, out);
  assert.match(out, /defined: 1/);
});
