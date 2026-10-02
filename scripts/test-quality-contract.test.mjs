import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isResultCode } from '../skills/meta/quality-contract/codes.mjs';

const root = resolve(import.meta.dirname, '..');
const harness = resolve(root, 'scripts/test-quality-contract.sh');

function extractEsmHarness(source) {
  const marker = "node --input-type=module <<'NODE'";
  const start = source.indexOf(marker);
  if (start === -1) throw new Error('quality-contract ESM harness marker is missing');
  const bodyStart = source.indexOf('\n', start) + 1;
  const end = source.lastIndexOf('\nNODE');
  if (end === -1 || end <= bodyStart) throw new Error('quality-contract ESM harness terminator is missing');
  return source.slice(bodyStart, end)
    .replaceAll("from './", `from '${pathToFileURL(`${root}/`).href}`);
}

async function engineModules(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? engineModules(path) : entry.name.endsWith('.mjs') ? [path] : [];
  }));
  return nested.flat();
}

test('quality-contract harness imports every engine source module', async () => {
  const source = await readFile(harness, 'utf8');
  const imported = new Set([...source.matchAll(/from '\.\/skills\/meta\/quality-contract\/([^']+\.mjs)'/g)].map((match) => match[1]));
  const engineRoot = resolve(root, 'skills/meta/quality-contract');
  const expected = (await engineModules(engineRoot)).map((path) => relative(engineRoot, path)).sort();
  assert.deepEqual([...imported].sort(), expected, 'every Quality Contract source module must be imported into the measured engine scope');
});

test('every emitted Quality Contract machine code is in the stable v1 registry', async () => {
  const engineRoot = resolve(root, 'skills/meta/quality-contract');
  const sources = await Promise.all((await engineModules(engineRoot)).map((path) => readFile(path, 'utf8')));
  const emitted = new Set();
  for (const source of sources) {
    for (const match of source.matchAll(/['\"]([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)['\"]/g)) emitted.add(match[1]);
  }
  for (const code of emitted) assert.equal(isResultCode(code), true, `${code} is emitted without a stable registry entry`);
});

test('vNext benchmark execution, grading, comparison, and promotion boundaries', async () => {
  await import(`${pathToFileURL(resolve(root, 'scripts/test-vnext-benchmark.mjs')).href}?coverage-suite=1`);
});

test('quality-contract engine security and conformance suite', async () => {
  const source = await readFile(harness, 'utf8');
  const moduleSource = extractEsmHarness(source);
  await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
});
