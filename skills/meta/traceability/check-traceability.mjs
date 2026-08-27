#!/usr/bin/env node
// Traceability drift checker (zero-dependency). Keeps the matrix honest instead
// of decorative. Run in CI (enforcement/ci/sdd-check.yml wires it in) and locally:
//
//   node tools/check-traceability.mjs [docs/sdd]
//
// Understands the v2 hybrid ID spine:
//   - FILE-level IDs from filenames: specs/003-x-fsd.md defines FSD-003 (same
//     for -sds/-prd), erd/003-x-erd.md defines ERD-003, decisions/005-y.md
//     defines ADR-005.
//   - ITEM-level IDs from headings/table rows: REQ/REQ-NF/SEC/TEST/TICKET, and
//     sub-IDs like FSD-003.2 inside an FSD file.
//   - A sub-ID citation (FSD-003.2) resolves as defined if its parent file ID
//     (FSD-003) is defined.
//
// Checks:
//   1. Spine in the matrix — every REQ / REQ-NF / FSD / SEC defined anywhere is
//      referenced in traceability.md (nothing speced but untracked).
//   2. No broken refs — every id referenced in the matrix is actually defined.
//   3. Upstream trace — every TICKET and TEST references something upstream
//      (REQ/FSD/SEC/ADR) near its own definition (no freelance ticket/test).
//   4. No dead relative markdown links.
//   5. No duplicate id definitions (copy-paste/renumbering bug).
// Exits non-zero on any problem.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, basename } from 'node:path';

const dir = process.argv[2] ?? 'docs/sdd';
const MATRIX = 'traceability.md';
const TYPES = 'REQ-NF|REQ|FSD|SDS|PRD|ERD|ADR|SEC|TICKET|TEST';
const ID_RE = new RegExp(`\\b(?:${TYPES})-\\d+(?:\\.\\d+)?\\b`, 'g');
const typeOf = (id) => id.match(new RegExp(`^(${TYPES})`))[1];
const parentOf = (id) => id.replace(/\.\d+$/, ''); // FSD-003.2 -> FSD-003
// A DEFINITION is an id at the *start* of a heading or table row (its own
// entry), not an id merely cited later in the line.
const HEADING_DEF = new RegExp(`^#{1,6}\\s+((?:${TYPES})-\\d+(?:\\.\\d+)?)\\b`);
const ROW_DEF = new RegExp(`^\\s*\\|\\s*((?:${TYPES})-\\d+(?:\\.\\d+)?)\\b`);

const SPINE = new Set(['REQ-NF', 'REQ', 'FSD', 'SEC']); // must appear in the matrix
const UPSTREAM = new Set(['REQ-NF', 'REQ', 'FSD', 'SEC', 'ADR']); // valid parents
// Files/dirs that cite ids but never define them (reports, plans, indexes).
const NON_DEFINING_FILES = new Set([MATRIX, 'index.md', 'glossary.md', 'config.md', 'HANDOFF.md']);
const NON_DEFINING_DIRS = new Set(['plans', 'reports', 'stats', 'dod', 'memory']);
// Filename -> file-level ID definitions.
const FILE_ID_RULES = [
  { dir: 'specs', re: /^(\d{3})-.+-(fsd|sds|prd)\.md$/, type: (m) => m[2].toUpperCase() },
  { dir: 'erd', re: /^(\d{3})-.+-erd\.md$/, type: () => 'ERD' },
  { dir: 'decisions', re: /^(\d{3})-.+\.md$/, type: () => 'ADR' },
];

if (!existsSync(dir)) {
  console.error(`No spec dir at ${dir} — nothing to check (fine for a docs-less run).`);
  process.exit(0);
}

function walk(d) {
  const out = [];
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.md')) out.push(p);
  }
  return out;
}
const files = walk(dir);

const defined = new Map();          // id -> file (first/canonical definition)
const definedAt = new Map();        // id -> [{file, line, text}] every occurrence
const matrixRefs = new Set();
const problems = { orphan: [], broken: [], freelance: [], deadLink: [], duplicate: [] };

const addDef = (id, occ) => {
  if (!definedAt.has(id)) definedAt.set(id, []);
  definedAt.get(id).push(occ);
  if (!defined.has(id)) defined.set(id, occ.file);
};

for (const path of files) {
  const rel = relative(dir, path);
  const name = basename(path);
  const topDir = rel.includes('/') ? rel.split('/')[0] : '';
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  const nonDefining = NON_DEFINING_FILES.has(rel) || NON_DEFINING_DIRS.has(topDir);

  // FILE-level definitions from the filename (hybrid spine).
  for (const rule of FILE_ID_RULES) {
    if (topDir !== rule.dir) continue;
    const m = name.match(rule.re);
    if (m) addDef(`${rule.type(m)}-${m[1]}`, { file: rel, line: 0, text: `(filename) ${name}` });
  }

  // ITEM-level definitions: an id anchored at the start of a heading or table row.
  if (!nonDefining) {
    lines.forEach((line, i) => {
      const m = HEADING_DEF.exec(line) ?? ROW_DEF.exec(line);
      if (!m) return;
      const id = m[1];
      addDef(id, { file: rel, line: i + 1, text: line.trim().slice(0, 80) });
      // UPSTREAM trace for TICKET/TEST: this line + a small window must name a parent.
      const t = typeOf(id);
      if ((t === 'TICKET' || t === 'TEST') && defined.get(id) === rel) {
        const window = lines.slice(i, i + 10).join(' ');
        const parents = (window.match(ID_RE) ?? []).filter((x) => UPSTREAM.has(typeOf(x)));
        if (parents.length === 0) problems.freelance.push(`${id} (${rel}) traces to nothing upstream`);
      }
    });
  }
  if (rel === MATRIX) {
    // Skip the "Next free:" counter line — those ids are allocations, not refs.
    for (const line of lines) {
      if (/next\s*free/i.test(line)) continue;
      for (const id of line.match(ID_RE) ?? []) matrixRefs.add(id);
    }
  }

  // Dead relative links. Strip fenced/inline code first — a doc illustrating
  // markdown syntax itself (e.g. a template explaining "rows look like
  // `[file](path) — description`") would otherwise be flagged as a literal
  // dead link to a file named "path". This stripped copy is used ONLY for
  // the link check below — ID_RE scanning above deliberately still looks
  // inside code spans, since that's the normal way this repo cites IDs like
  // `FSD-003` in prose, and stripping there would break real ID tracking.
  const textForLinkCheck = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const lm of textForLinkCheck.matchAll(/\]\(([^)]+)\)/g)) {
    let target = lm[1].trim();
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    target = target.split('#')[0];
    if (target && !existsSync(resolve(dirname(path), target))) {
      problems.deadLink.push(`${rel}: link -> ${lm[1]}`);
    }
  }
}

const isDefined = (id) => defined.has(id) || defined.has(parentOf(id));

// The matrix itself is only required at large/full tier — medium projects use
// a lite inline Refs trail instead, and small/micro skip it entirely (see
// skills/meta/traceability/SKILL.md's gates-by-size table). A project with no
// traceability.md hasn't opted into full traceability yet; that's a valid,
// documented tier, not spec drift — so there's nothing to check every REQ/FSD
// against, and every one of them being reported as an "orphan" simply because
// no matrix exists yet would contradict the tiering rule. Only enforce spine
// coverage once a matrix actually exists (i.e. once the project claims to be
// keeping one — from that point on, it must be kept honest).
const matrixExists = existsSync(join(dir, MATRIX));

// A parent file id (FSD-003) counts as tracked when the matrix cites it OR any
// of its sub-items (FSD-003.2); a sub-item counts when the matrix cites it, its
// parent, or a sibling sub-item of the same parent.
const matrixParents = new Set([...matrixRefs].map(parentOf));
if (matrixExists) {
  for (const [id, f] of defined) {
    if (!SPINE.has(typeOf(id))) continue;
    if (matrixRefs.has(id) || matrixParents.has(parentOf(id))) continue;
    problems.orphan.push(`${id} (defined in ${f})`);
  }
}
for (const id of matrixRefs) {
  if (!isDefined(id)) problems.broken.push(id);
}
// Duplicate definitions: the same id defined more than once (copy-paste or a
// renumbering slip). Filename + first heading inside the same file is fine.
for (const [id, occs] of definedAt) {
  const distinctFiles = new Set(occs.map((o) => o.file));
  if (occs.length > 1 && distinctFiles.size > 1) {
    const where = occs.map((o) => `${o.file}:${o.line} "${o.text}"`).join('  |  ');
    problems.duplicate.push(`${id} defined ${occs.length}x — ${where}`);
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
show('Duplicate id definitions', problems.duplicate);
show('Dead links', problems.deadLink);

if (total === 0) {
  console.log('\n✓ Traceability is consistent — spine tracked, no broken refs, no duplicate ids, no dead links or freelance items.');
  process.exit(0);
}
console.log(`\n${total} problem(s). The matrix isn't honest until these are resolved.`);
process.exit(1);
