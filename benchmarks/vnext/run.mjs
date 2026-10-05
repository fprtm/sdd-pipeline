import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { evaluateBenchmark, normalizeBenchmark } from '../../skills/meta/quality-contract/benchmark/runner.mjs';

function usage(cause) {
  process.stdout.write(`${JSON.stringify({ status: 'INVALID', code: 'BENCHMARK_INPUT_INVALID', cause, usage: 'node benchmarks/vnext/run.mjs <protocol.json> <manifest.json> <attempts.json>' })}\n`);
  process.exitCode = 2;
}

const paths = process.argv.slice(2);
if (paths.length !== 3) {
  usage('exactly three local JSON paths are required');
} else {
  try {
    const [protocol, manifest, attempts] = await Promise.all(paths.map(async (path) => JSON.parse(await readFile(resolve(path), 'utf8'))));
    const result = evaluateBenchmark(protocol, manifest, attempts);
    process.stdout.write(`${normalizeBenchmark(result)}\n`);
    process.exitCode = result.status === 'PASS' ? 0 : result.status === 'FAIL' ? 1 : 2;
  } catch (error) {
    usage(`unable to load bounded local benchmark input: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}
