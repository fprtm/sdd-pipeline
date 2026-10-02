import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const names = ['vnext-adoption.md', 'vnext-lifecycle.md', 'vnext-roles.md', 'vnext-assurance.md', 'vnext-benchmark.md', 'vnext-migration.md', 'vnext-examples.md'];
const texts = [];
for (const name of names) {
  const path = resolve(root, 'docs/guides', name);
  await access(path);
  const text = await readFile(path, 'utf8');
  assert.doesNotMatch(text, /```quality-contract-json/, `${name} must not duplicate the normative contract`);
  texts.push(text);
}
const corpus = texts.join('\n');
for (const label of ['[Policy]', '[Mechanical]', '[Runtime]', '[Host-dependent]']) assert.match(corpus, new RegExp(`\\${label}`), `${label} classification is missing`);
for (const owner of ['rules/lifecycle.mjs', 'rules/roles.mjs', 'rules/axes.mjs', 'rules/delivery.mjs', 'rules/engineering.mjs', 'benchmark/runner.mjs', 'rules/capabilities.mjs']) assert.ok(corpus.includes(owner), `canonical owner ${owner} is not linked`);
const readme = await readFile(resolve(root, 'README.md'), 'utf8');
assert.match(readme, /docs\/guides\/vnext-adoption\.md/);
const productTemplate = await readFile(resolve(root, 'skills/build/doc-generator/formats.md'), 'utf8');
const discover = await readFile(resolve(root, 'skills/commands/discover/SKILL.md'), 'utf8');
const ticketTemplate = await readFile(resolve(root, 'skills/build/ticket-decomposition/SKILL.md'), 'utf8');
const infra = await readFile(resolve(root, 'skills/build/infra/SKILL.md'), 'utf8');
for (const field of ['Current workaround', 'Frequency / severity', 'Cost of doing nothing', 'Opportunity cost', 'Kill threshold', 'Rejected alternatives']) assert.ok(productTemplate.includes(field), `product template is missing ${field}`);
for (const field of ['success_threshold:', 'failure_threshold:', 'error_budget:']) assert.ok(productTemplate.includes(field), `vNext readiness/observation template is missing ${field}`);
for (const concept of ['current workaround', 'frequency/severity', 'cost of doing nothing', 'opportunity cost', 'success/failure/kill thresholds', 'rejected alternatives']) assert.ok(discover.includes(concept), `discover flow is missing ${concept}`);
for (const field of ['**Risk**:', '**Assurance**:', '## Evidence Requirements', '## Rollback / Recovery', '## Stop Conditions and Deviations']) assert.ok(ticketTemplate.includes(field), `ticket work-packet template is missing ${field}`);
for (const field of ['immutable candidate digest', 'deployment/migration/rollback plan digests', 'release-notes digest', 'monitoring query digest', 'on-call actor']) assert.ok(infra.includes(field), `release package guidance is missing ${field}`);
console.log('vNext docs: 7/7 guides present; claim taxonomy and canonical links valid');
