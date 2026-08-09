#!/usr/bin/env node
// Traceability drift checker (zero-dependency). Keeps the matrix honest instead
// of decorative. Run in CI (the `infra` skill wires it in) and locally:
//
//   node tools/check-traceability.mjs [docs/sdd]
//
// Checks:
//   1. Spine in the matrix — every REQ / REQ-NF / FSD / SEC defined in a spec
//      doc is referenced in traceability.md (nothing speced but untracked).
//   2. No broken refs — every id referenced in the matrix is actually defined.
//   3. Upstream trace — every TICKET (backlog) and TEST (test-plan) references
//      something upstream (REQ/FSD/SEC/ADR) in its own section (no freelance
//      ticket/test).
//   4. No dead relative markdown links.
// Exits non-zero on any problem.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const dir = process.argv[2] ?? 'docs/sdd';
const MATRIX = 'traceability.md';
const ID_RE = /\b(REQ-NF|REQ|FSD|ADR-FE|ADR|SEC|TICKET|TEST|DEC)-\d+\b/g;
const typeOf = (id) => id.match(/^(REQ-NF|REQ|FSD|ADR-FE|ADR|SEC|TICKET|TEST|DEC)/)[1];

const SPINE = new Set(['REQ-NF', 'REQ', 'FSD', 'SEC']); // must appear in the matrix
const UPSTREAM = new Set(['REQ-NF', 'REQ', 'FSD', 'SEC', 'ADR', 'ADR-FE']); // valid parents
const NON_DEFINING = new Set([MATRIX, '00-overview.md', '00-codebase-map.md']);

if (!existsSync(dir)) {
  console.error(`No spec dir at ${dir} — nothing to check (fine for a docs-less run).`);
  process.exit(0);
}
const files = readdirSync(dir).filter((f) => f.endsWith('.md'));

const defined = new Map();          // id -> file
const matrixRefs = new Set();
const problems = { orphan: [], broken: [], freelance: [], deadLink: [] };

for (const file of files) {
  const path = join(dir, file);
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');

  // DEFINITIONS: first id on a heading line or table row, in the spec docs.
  if (!NON_DEFINING.has(file)) {
    lines.forEach((line, i) => {
      if (!/^#{1,6}\s/.test(line) && !/^\s*\|/.test(line)) return;
      const ids = line.match(ID_RE);
      if (!ids) return;
      const id = ids[0];
      if (defined.has(id)) return; // only check each id at its first (canonical) definition
      defined.set(id, file);
      // UPSTREAM trace for TICKET/TEST: this line + a small window must name a parent.
      const t = typeOf(id);
      if (t === 'TICKET' || t === 'TEST') {
        const window = lines.slice(i, i + 8).join(' ');
        const parents = (window.match(ID_RE) ?? []).filter((x) => UPSTREAM.has(typeOf(x)));
        if (parents.length === 0) problems.freelance.push(`${id} (${file}) traces to nothing upstream`);
      }
    });
  }
  if (file === MATRIX) for (const id of text.match(ID_RE) ?? []) matrixRefs.add(id);

  // Dead relative links.
  for (const lm of text.matchAll(/\]\(([^)]+)\)/g)) {
    let target = lm[1].trim();
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    target = target.split('#')[0];
    if (target && !existsSync(resolve(dirname(path), target))) {
      problems.deadLink.push(`${file}: link -> ${lm[1]}`);
    }
  }
}

for (const [id, f] of defined) {
  if (SPINE.has(typeOf(id)) && !matrixRefs.has(id)) problems.orphan.push(`${id} (defined in ${f})`);
}
for (const id of matrixRefs) {
  if (!defined.has(id) && typeOf(id) !== 'ADR' && typeOf(id) !== 'ADR-FE' && typeOf(id) !== 'DEC') {
    problems.broken.push(id);
  }
}

const total = Object.values(problems).reduce((n, a) => n + a.length, 0);
const show = (title, arr) => {
  if (!arr.length) return;
  console.log(`\n✖ ${title}: ${arr.length}`);
  [...new Set(arr)].sort().forEach((x) => console.log('  ' + x));
};
console.log(`Traceability check — ${files.length} docs in ${dir}`);
console.log(`  defined: ${defined.size} · matrix refs: ${matrixRefs.size}`);
show('Spine orphans (defined but not in the matrix)', problems.orphan);
show('Broken refs (in the matrix but never defined)', problems.broken);
show('Freelance tickets/tests (trace to nothing upstream)', problems.freelance);
show('Dead links', problems.deadLink);

if (total === 0) {
  console.log('\n✓ Traceability is consistent — spine tracked, no broken refs, dead links, or freelance items.');
  process.exit(0);
}
console.log(`\n${total} problem(s). The matrix isn't honest until these are resolved.`);
process.exit(1);
