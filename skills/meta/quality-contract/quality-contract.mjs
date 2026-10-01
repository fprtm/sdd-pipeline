#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseContractDocument } from './parser.mjs';
import { evaluateParsedContract } from './evaluator.mjs';

export function evaluateContractDocument(document, options = {}) {
  return evaluateParsedContract(parseContractDocument(document), options);
}

function human(result) {
  const rows = Object.entries(result.dimensions).map(([name, value]) => `${name}: ${value.status} (${value.code})`);
  return [...rows, `execution_eligible: ${result.predicates.execution_eligible}`, `may_dispatch: ${result.predicates.may_dispatch}`, `may_accept: ${result.predicates.may_accept}`, `may_retire: ${result.predicates.may_retire}`].join('\n');
}

// Installed releases are reached through an atomic symlink. Resolve the argv
// path before comparing it to this module URL so CLI behavior is identical
// for source, a direct installed path, and the live release pointer.
function isCliInvocation() {
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (isCliInvocation()) {
  const [path, mode] = process.argv.slice(2);
  if (!path || (mode && mode !== '--json')) {
    process.stderr.write('usage: quality-contract.mjs <contract.md> [--json]\n');
    process.exitCode = 2;
  } else {
    const result = evaluateContractDocument(await readFile(path, 'utf8'));
    process.stdout.write(`${mode === '--json' ? JSON.stringify(result, null, 2) : human(result)}\n`);
    process.exitCode = result.dimensions.parse.status === 'pass' ? 0 : 1;
  }
}
