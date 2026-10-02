import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, lstatSync, readlinkSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { evaluateContractDocument } from '../skills/meta/quality-contract/quality-contract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const INSTALL = join(HERE, 'install.sh');
const COMMANDS = ['check', 'discover', 'docs', 'handoff', 'implement', 'learn', 'spec', 'update'];

function validatorFixture() {
  const work = mkdtempSync(join(tmpdir(), 'sdd-validator-'));
  for (const path of ['skills', 'scripts', '.claude-plugin', 'install', 'enforcement', 'templates']) {
    cpSync(join(ROOT, path), join(work, path), { recursive: true });
  }
  for (const file of ['README.md', 'AGENTS.md', 'LICENSE', '.gitignore']) {
    cpSync(join(ROOT, file), join(work, file));
  }
  return work;
}

test('validator follows the orchestrator-owned unified mode matrix', () => {
  const result = spawnSync('bash', [join(ROOT, 'scripts', 'validate-skills.sh')], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Total skills found: 65/);
  assert.match(result.stdout, /unified matrix has THINK, BUILD, PROVE, and META tables/);
  assert.doesNotMatch(result.stdout, /modes\/.*missing (?:behavior table|written-record handling|stats config|critical phases)/);
});

test('validator rejects a mode that stops delegating to the unified matrix', () => {
  const work = validatorFixture();
  const mode = join(work, 'skills', 'modes', 'prototype', 'SKILL.md');
  writeFileSync(mode, readFileSync(mode, 'utf8').replace('**Phase behavior**:', '**Local behavior**:'));
  const result = spawnSync('bash', [join(work, 'scripts', 'validate-skills.sh')], { cwd: work, encoding: 'utf8' });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /modes\/prototype: missing canonical unified-matrix delegation marker/);
});

test('canonical policy owners retain safety and evidence precedence', () => {
  const orchestrator = readFileSync(join(ROOT, 'skills', 'orchestrator', 'SKILL.md'), 'utf8');
  const engine = readFileSync(join(ROOT, 'skills', 'build', 'constraints', 'SKILL.md'), 'utf8');
  const universal = readFileSync(join(ROOT, 'skills', 'constraints', 'universal', 'SKILL.md'), 'utf8');
  const verification = readFileSync(join(ROOT, 'skills', 'prove', 'verification', 'SKILL.md'), 'utf8');
  const sdlc = readFileSync(join(ROOT, 'skills', 'think', 'sdlc-detector', 'SKILL.md'), 'utf8');
  const docs = readFileSync(join(ROOT, 'skills', 'build', 'doc-generator', 'SKILL.md'), 'utf8');

  assert.match(engine, /`OVERRIDE: None` are hard stops and cannot be overridden/);
  assert.match(engine, /universal rules: `skills\/constraints\/universal\/SKILL\.md`/);
  assert.doesNotMatch(engine, /New functions with non-trivial logic need at least 1 test/);
  assert.match(universal, /two real adapters are enough because the variation already exists/);
  assert.match(orchestrator, /Quick smoke test \+ applicable small\+ coverage gate/);
  assert.match(orchestrator, /mandatory applicable coverage in post-fix follow-up/);
  assert.match(orchestrator, /Do not close an unresolved discovery seat or skip an applicable evidence gate/);
  assert.match(verification, /mandatory post-fix follow-up before ordinary acceptance/);
  assert.match(sdlc, /Identification is mandatory/);
  assert.doesNotMatch(sdlc, /SDLC skipped\. Fix first/);
  assert.match(docs, /prototype.*minimum DoD/);
  assert.match(docs, /emergency.*required retrospective record/);
});

test('public docs and examples track the canonical skill and command surface', () => {
  const architecture = readFileSync(join(ROOT, 'docs', 'ARCHITECTURE.md'), 'utf8');
  const install = readFileSync(join(ROOT, 'docs', 'INSTALL.md'), 'utf8');
  const prototype = readFileSync(join(ROOT, 'skills', 'modes', 'prototype', 'SKILL.md'), 'utf8');
  const emergency = readFileSync(join(ROOT, 'skills', 'modes', 'emergency', 'SKILL.md'), 'utf8');
  const parallel = readFileSync(join(ROOT, 'skills', 'agents', 'parallel-work', 'SKILL.md'), 'utf8');

  const countSkills = (directory) => readdirSync(directory, { withFileTypes: true }).reduce(
    (total, entry) => total + (entry.isDirectory()
      ? countSkills(join(directory, entry.name))
      : Number(entry.name === 'SKILL.md')),
    0,
  );
  const skillCount = countSkills(join(ROOT, 'skills'));

  assert.equal(skillCount, 65);
  assert.ok(architecture.includes(`This repo has ${skillCount} \`SKILL.md\` modules`));
  assert.match(architecture, /What happens to the 56 without frontmatter/);
  assert.match(install, new RegExp(`currently ${skillCount} in a full install`));
  assert.match(architecture, /unified matrix.*single source of truth/);
  assert.doesNotMatch(architecture, /Full per-skill tables live in each/);
  assert.match(prototype, /\/sdd-pipeline:check/);
  assert.match(emergency, /\/sdd-pipeline:check/);
  assert.doesNotMatch(parallel, /docs\/sdd\/tickets/);
  assert.match(parallel, /docs\/sdd\/specs\/\{NNN\}-\{slug\}\/tickets/);
});

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
  for (const relative of files(sourceRuntime)) assert.equal(existsSync(join(installedRuntime, relative)), true, `installed runtime missing ${relative}`);
  assert.equal(existsSync(join(installedRuntime, 'packs', 'developer-tooling', 'pack.json')), true);
  assert.equal(existsSync(join(installedRuntime, 'packs', 'high-risk-api', 'pack.json')), true);
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

test('distributed CI keeps legacy report-only and vNext opt-in fail-closed', () => {
  const workflow = readFileSync(join(ROOT, 'enforcement', 'ci', 'sdd-check.yml'), 'utf8');
  assert.match(workflow, /\.sdd\/vnext-enforced/);
  assert.match(workflow, /legacy\/report-only repository/);
  assert.match(workflow, /missing required checker blocks CI/);
  for (const checker of ['capabilities.mjs', 'lifecycle.mjs', 'readiness.mjs']) assert.match(workflow, new RegExp(checker.replace('.', '\\.')));
  assert.doesNotMatch(workflow, /touch .*vnext-enforced|mkdir .*\.sdd/, 'CI must never opt a project in implicitly');
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
