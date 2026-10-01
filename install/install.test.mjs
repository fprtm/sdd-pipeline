import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, lstatSync, readlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { evaluateContractDocument } from '../skills/meta/quality-contract/quality-contract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const INSTALL = join(HERE, 'install.sh');
const COMMANDS = ['check', 'discover', 'docs', 'handoff', 'implement', 'learn', 'spec', 'update'];

test('plugin exposes exactly the eight public commands', () => {
  const plugin = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  const commands = plugin.skills
    .filter((entry) => entry.startsWith('./skills/commands/'))
    .map((entry) => entry.split('/').at(-1))
    .sort();
  assert.deepEqual(commands, COMMANDS);
  assert.equal(new Set(commands).size, 8);
});

test('docs and check command contracts retain their public routing semantics', () => {
  const docs = readFileSync(join(ROOT, 'skills', 'commands', 'docs', 'SKILL.md'), 'utf8');
  const check = readFileSync(join(ROOT, 'skills', 'commands', 'check', 'SKILL.md'), 'utf8');
  assert.match(docs, /docs\/system\//);
  assert.match(docs, /Consolidation Pass/);
  assert.match(docs, /Reuse Gate/);
  assert.match(docs, /distinct consumer or lifecycle/);
  assert.match(check, /YES → VERIFY/);
  assert.match(check, /NO  → AUDIT/);
  assert.match(check, /degraded independence/);
  assert.match(check, /artifact-lifecycle/);
});

test('selective command install exposes all eight commands and synchronized version', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-install-'));
  const dest = join(work, 'skills', 'sdd');
  const result = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--only', 'commands'], { cwd: work, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /v6\.11\.1/);
  assert.deepEqual(readdirSync(join(dest, 'commands')).sort(), COMMANDS);
  assert.match(readFileSync(join(dest, 'commands', 'handoff', 'SKILL.md'), 'utf8'), /^name: handoff$/m);
  assert.equal(existsSync(join(dest, 'meta', 'handoff', 'SKILL.md')), true);
  assert.equal(existsSync(join(dest, 'meta', 'artifact-lifecycle', 'SKILL.md')), true);
  assert.equal(existsSync(join(dest, 'prove', 'verification', 'SKILL.md')), true);
});

test('installed quality-contract runtime is complete and preserves facade JSON semantics', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-quality-contract-install-'));
  const dest = join(work, 'skills', 'sdd');
  const result = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--only', 'commands'], { cwd: work, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /quality-contract runtime release switched atomically/);

  const sourceRuntime = join(ROOT, 'skills', 'meta', 'quality-contract');
  const installedRuntime = join(dest, 'meta', 'quality-contract');
  assert.equal(lstatSync(installedRuntime).isSymbolicLink(), true, 'live runtime is an atomic release pointer');
  assert.match(readlinkSync(installedRuntime), /^\.quality-contract-releases\/release\./);
  const files = (root) => {
    const visit = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? visit(path).map((nested) => join(entry.name, nested)) : [entry.name];
    });
    return visit(root).sort();
  };
  assert.deepEqual(files(installedRuntime), files(sourceRuntime));
  assert.equal(existsSync(join(dest, 'commands', 'quality-contract')), false, 'the facade is not a public command');

  const fixture = JSON.parse(readFileSync(join(sourceRuntime, 'fixtures', 'core.json'), 'utf8'));
  const validPath = join(work, 'valid-contract.md');
  const invalidPath = join(work, 'invalid-contract.md');
  writeFileSync(validPath, fixture.valid);
  writeFileSync(invalidPath, fixture.unknown_key);
  for (const path of [validPath, invalidPath]) {
    const expected = evaluateContractDocument(readFileSync(path, 'utf8'));
    const invoked = spawnSync('node', [join(installedRuntime, 'quality-contract.mjs'), path, '--json'], { encoding: 'utf8' });
    assert.equal(invoked.status, expected.dimensions.parse.status === 'pass' ? 0 : 1, invoked.stderr);
    assert.deepEqual(JSON.parse(invoked.stdout), expected);
  }
  assert.deepEqual(readdirSync(join(dest, 'meta')).filter((name) => /^\.quality-contract\.(stage|next)\./.test(name)), []);
});

test('quality-contract CI selects GitHub SHAs and delegates without a new command', () => {
  const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'quality-contract.yml'), 'utf8');
  assert.match(workflow, /github\.event\.pull_request\.base\.sha/);
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /11bd71901bbe5b1630ceea73d27597364c9af683/);
  assert.match(workflow, /49933ea5288caeca8642d1e84afbd3f7d6820020/);
  assert.match(workflow, /block_count=.*grep -rh/);
  assert.match(workflow, /quality-contract\.mjs .*--json/);
  assert.match(workflow, /report-only legacy repository/);
  assert.doesNotMatch(workflow, /commands\/quality-contract/);
});

test('canonical-block cardinality counts blocks, not just containing files', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-quality-contract-cardinality-'));
  const docs = join(work, 'docs', 'sdd');
  mkdirSync(docs, { recursive: true });
  writeFileSync(join(docs, 'owner.md'), '```quality-contract-json\n{}\n```\n```quality-contract-json\n{}\n```\n');
  const counted = spawnSync('bash', ['-lc', "grep -rh --include='*.md' '^```quality-contract-json$' \"$DOCS\" | wc -l | tr -d '[:space:]'"], {
    encoding: 'utf8', env: { ...process.env, DOCS: docs },
  });
  assert.equal(counted.status, 0, counted.stderr);
  assert.equal(counted.stdout, '2');
});

test('full install retains the orchestrator while staging the quality-contract runtime', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-full-install-'));
  const dest = join(work, 'skills', 'sdd');
  const result = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest], { cwd: work, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(existsSync(join(dest, 'orchestrator', 'SKILL.md')), true);
  assert.equal(existsSync(join(dest, 'meta', 'quality-contract', 'quality-contract.mjs')), true);
});

test('failed staged update leaves the prior quality-contract release readable', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-quality-contract-fault-'));
  const dest = join(work, 'skills', 'sdd');
  assert.equal(spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--only', 'commands'], { cwd: work, encoding: 'utf8' }).status, 0);
  const runtime = join(dest, 'meta', 'quality-contract');
  const prior = readlinkSync(runtime);
  const failed = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--update'], {
    cwd: work,
    encoding: 'utf8',
    env: { ...process.env, SDD_PIPELINE_TEST_FAIL_QUALITY_CONTRACT_STAGE: '1' },
  });
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /staging fault injected/);
  assert.equal(readlinkSync(runtime), prior);
  const fixture = JSON.parse(readFileSync(join(ROOT, 'skills', 'meta', 'quality-contract', 'fixtures', 'core.json'), 'utf8'));
  const contract = join(work, 'contract.md');
  writeFileSync(contract, fixture.valid);
  assert.equal(spawnSync('node', [join(runtime, 'quality-contract.mjs'), contract, '--json'], { encoding: 'utf8' }).status, 0);
});

test('concurrent facade readers see a complete release during an update', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-quality-contract-readers-'));
  const dest = join(work, 'skills', 'sdd');
  assert.equal(spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--only', 'commands'], { cwd: work, encoding: 'utf8' }).status, 0);
  const fixture = JSON.parse(readFileSync(join(ROOT, 'skills', 'meta', 'quality-contract', 'fixtures', 'core.json'), 'utf8'));
  const contract = join(work, 'contract.md');
  writeFileSync(contract, fixture.valid);
  const readers = spawnSync('bash', ['-lc', [
    'set -euo pipefail',
    'for _ in $(seq 1 48); do node "$FACADE" "$CONTRACT" --json >/dev/null & done',
    '"$INSTALLER" --agent generic --dest "$DEST" --update >/dev/null',
    'wait',
  ].join('\n')], {
    cwd: work,
    encoding: 'utf8',
    env: { ...process.env, FACADE: join(dest, 'meta', 'quality-contract', 'quality-contract.mjs'), CONTRACT: contract, INSTALLER: INSTALL, DEST: dest },
  });
  assert.equal(readers.status, 0, readers.stdout + readers.stderr);
});

test('with-ci distributes and uninstall removes the quality-contract workflow', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-quality-contract-ci-'));
  const dest = join(work, 'skills', 'sdd');
  const installed = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--with-ci'], { cwd: work, encoding: 'utf8' });
  assert.equal(installed.status, 0, installed.stdout + installed.stderr);
  const workflow = join(work, '.github', 'workflows', 'quality-contract.yml');
  assert.equal(existsSync(workflow), true);
  assert.match(readFileSync(workflow, 'utf8'), /Quality Contract Adapter/);
  assert.equal(existsSync(join(work, '.github', 'workflows', 'sdd-check.yml')), true);
  const ciRuntime = join(work, 'tools', 'quality-contract');
  assert.equal(lstatSync(ciRuntime).isSymbolicLink(), true);
  assert.equal(existsSync(join(ciRuntime, 'quality-contract.mjs')), true);
  assert.equal(existsSync(join(work, 'tools', '.quality-contract-releases', '.sdd-pipeline-quality-contract-runtime')), true);
  const uninstalled = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--uninstall'], { cwd: work, encoding: 'utf8' });
  assert.equal(uninstalled.status, 0, uninstalled.stdout + uninstalled.stderr);
  assert.equal(existsSync(workflow), false);
  assert.equal(existsSync(ciRuntime), false);
});

test('workflow-equivalent target project invokes its own staged runtime for a canonical block', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-quality-contract-target-ci-'));
  const dest = join(work, 'skills', 'sdd');
  const fixture = JSON.parse(readFileSync(join(ROOT, 'skills', 'meta', 'quality-contract', 'fixtures', 'core.json'), 'utf8'));
  const docs = join(work, 'docs', 'sdd');
  mkdirSync(docs, { recursive: true });
  const contract = join(docs, 'canonical.md');
  writeFileSync(contract, fixture.valid);
  const installed = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--with-ci'], { cwd: work, encoding: 'utf8' });
  assert.equal(installed.status, 0, installed.stdout + installed.stderr);
  const workflow = readFileSync(join(work, '.github', 'workflows', 'quality-contract.yml'), 'utf8');
  assert.match(workflow, /node tools\/quality-contract\/quality-contract\.mjs/);
  const result = spawnSync('bash', ['-lc', [
    'set -euo pipefail',
    "block_count=\"$(grep -rh --include='*.md' '^```quality-contract-json$' docs/sdd | wc -l | tr -d '[:space:]')\"",
    'test "$block_count" -eq 1',
    "contract=\"$(grep -rl --include='*.md' '^```quality-contract-json$' docs/sdd | head -n 1)\"",
    'node tools/quality-contract/quality-contract.mjs "$contract" --json',
  ].join('\n')], { cwd: work, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), evaluateContractDocument(fixture.valid));
});

test('template install creates only the current hygiene-clean tree', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-template-'));
  const dest = join(work, 'skills', 'sdd');
  const result = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--with-templates'], { cwd: work, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const retired of ['tickets', 'design', 'design-system', 'erd', 'test-plans', 'dod', 'ux-screens']) {
    assert.equal(existsSync(join(work, 'docs', 'sdd', retired)), false, `${retired}/ must be lazy or retired`);
  }
  const hygiene = spawnSync('node', [join(work, 'tools', 'check-file-hygiene.mjs'), join(work, 'docs', 'sdd')], { encoding: 'utf8' });
  assert.equal(hygiene.status, 0, hygiene.stdout + hygiene.stderr);
  assert.equal(existsSync(join(work, 'tools', 'check-retirement.mjs')), true);
});

test('unknown selective phase fails before creating a partial install', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-install-invalid-'));
  const dest = join(work, 'skills', 'sdd');
  const result = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--only', 'commands,unknown'], { cwd: work, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(existsSync(dest), false);
});

test('template install preserves existing project state and does not opt legacy repo into policy v1', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-template-existing-'));
  const dest = join(work, 'skills', 'sdd');
  const docs = join(work, 'docs', 'sdd');
  mkdirSync(docs, { recursive: true });
  writeFileSync(join(docs, 'config.md'), '# Legacy Config\n\nsdlc: solo\nsdlc-reason: existing project\nlegacy-sentinel: keep\n');
  writeFileSync(join(docs, 'index.md'), '# Existing Index\n');
  const result = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--with-templates'], { cwd: work, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const config = readFileSync(join(docs, 'config.md'), 'utf8');
  assert.match(config, /legacy-sentinel: keep/);
  assert.doesNotMatch(config, /artifact-policy-version/);
  assert.equal(readFileSync(join(docs, 'index.md'), 'utf8'), '# Existing Index\n');
});

test('template install gives an existing no-config tree a legacy marker, not policy v1', () => {
  const work = mkdtempSync(join(tmpdir(), 'sdd-template-noconfig-'));
  const dest = join(work, 'skills', 'sdd');
  const docs = join(work, 'docs', 'sdd');
  mkdirSync(docs, { recursive: true });
  writeFileSync(join(docs, 'index.md'), '# Existing Index\n');
  const result = spawnSync(INSTALL, ['--agent', 'generic', '--dest', dest, '--with-templates'], { cwd: work, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const config = readFileSync(join(docs, 'config.md'), 'utf8');
  assert.match(config, /artifact-policy-version: legacy/);
  assert.doesNotMatch(config, /^artifact-policy-version: 1$/m);
  assert.equal(readFileSync(join(docs, 'index.md'), 'utf8'), '# Existing Index\n');
});
