#!/usr/bin/env node
// check-file-hygiene.mjs — mechanical enforcement of the docs/sdd/ tree
// conventions. Instructions in markdown are followed probabilistically; this
// catches what got missed mechanically. Run after writing/renaming any file
// under docs/sdd (and in CI via enforcement/ci/sdd-check.yml):
//
//   node tools/check-file-hygiene.mjs [docs/sdd]
//
// Checks (v2 tree = the SDD Pipeline structure + changes/):
//   1. Root: only the known top-level .md files (index/config/memory/glossary/
//      traceability/HANDOFF) — no stray docs dumped at the root.
//   2. Only known subdirectories (design, erd, dod, test-plans, tickets, plans,
//      reports, decisions, changes, stats).
//   3. design/   {NNN}-{slug}-(fsd|sdd|prd|threats).md
//   4. erd/      {NNN}-{slug}-erd.md · dod/ {NNN}-{slug}-dod.md ·
//      test-plans/ {NNN}-{slug}-tests.md
//   5. decisions/ {NNN}-{slug}.md
//   6. changes/  YYYY-MM-DD-{slug}.md + frontmatter with description & status,
//      and no duplicate topic slug (one topic = one file, updated in place).
//   7. plans/    current.md only; plans/archive/ YYYY-MM-DD-NN-{slug}.md
//   8. reports/  YYYY-MM-DD-{slug}.md · stats/ YYYY-MM.md
//   9. tickets/  {feature-slug}/{NN}-{slug}.md, each containing a TICKET-xxx id
//  10. index.md exists, and every design/ + changes/ file is referenced in it
//      (no orphan docs the index doesn't know about).
// Exits non-zero on any problem.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const dir = process.argv[2] ?? 'docs/sdd';
const SLUG = '[a-z0-9][a-z0-9-]*';
const ROOT_MD = new Set(['index.md', 'config.md', 'memory.md', 'glossary.md', 'traceability.md', 'HANDOFF.md', 'stack-guide.md', 'analytics.md']);
const KNOWN_DIRS = new Set(['design', 'erd', 'dod', 'test-plans', 'tickets', 'plans', 'reports', 'decisions', 'changes', 'stats', 'ux-screens', 'design-system']);
const DIR_RULES = {
  design: new RegExp(`^\\d{3}-${SLUG}-(fsd|sdd|prd|threats|ux)\\.md$`),
  erd: new RegExp(`^\\d{3}-${SLUG}-erd\\.md$`),
  dod: new RegExp(`^\\d{3}-${SLUG}-dod\\.md$`),
  'test-plans': new RegExp(`^\\d{3}-${SLUG}-tests\\.md$`),
  decisions: new RegExp(`^\\d{3}-${SLUG}\\.md$`),
  changes: new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${SLUG}\\.md$`),
  reports: new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${SLUG}\\.md$`),
  stats: new RegExp(`^\\d{4}-\\d{2}\\.md$`),
};
const ARCHIVE_RULE = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-\\d{2}-${SLUG}\\.md$`);
const TICKET_FILE = new RegExp(`^\\d{2}-${SLUG}\\.md$`);
const FEATURE_DIR = new RegExp(`^${SLUG}$`);

if (!existsSync(dir)) {
  console.error(`No ${dir} — nothing to check (fine for a docs-less run).`);
  process.exit(0);
}

const problems = [];
const flag = (msg) => problems.push(msg);
const ls = (d) => (existsSync(d) ? readdirSync(d) : []);
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

// 1+2 — root files and known dirs
for (const e of ls(dir)) {
  const p = join(dir, e);
  if (isDir(p)) {
    if (!KNOWN_DIRS.has(e)) flag(`unknown directory: ${e}/ — not part of the docs/sdd tree`);
  } else if (e.endsWith('.md')) {
    if (!ROOT_MD.has(e)) flag(`stray file at root: ${e} — docs belong in a subdirectory (design/, changes/, …)`);
  }
}

// 3-8 — per-directory naming rules
for (const [d, re] of Object.entries(DIR_RULES)) {
  const sub = join(dir, d);
  for (const e of ls(sub)) {
    const p = join(sub, e);
    if (isDir(p)) { flag(`unexpected subdirectory: ${d}/${e}/`); continue; }
    if (!e.endsWith('.md')) continue;
    if (!re.test(e)) flag(`bad filename: ${d}/${e} — expected ${re}`);
  }
}

// ux-screens/ — one flow per file, kebab slug (flows aren't chronological, so no
// date/number), frontmatter with description + priority (Must/Should/Could).
for (const e of ls(join(dir, 'ux-screens'))) {
  if (!e.endsWith('.md')) continue;
  const p = join(dir, 'ux-screens', e);
  if (isDir(p)) continue;
  if (!new RegExp(`^${SLUG}\\.md$`).test(e)) flag(`bad filename: ux-screens/${e} — expected <flow-slug>.md`);
  const text = readFileSync(p, 'utf8');
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) flag(`ux-screens/${e}: missing frontmatter (description/priority)`);
  else {
    if (!/^description:/m.test(fmMatch[1])) flag(`ux-screens/${e}: frontmatter missing "description:"`);
    if (!/^priority:\s*(Must|Should|Could)/m.test(fmMatch[1])) flag(`ux-screens/${e}: frontmatter missing "priority:" (Must/Should/Could)`);
  }
}

// changes/ — frontmatter + duplicate topic slug
const changeSlugs = new Map();
for (const e of ls(join(dir, 'changes'))) {
  if (!e.endsWith('.md')) continue;
  const p = join(dir, 'changes', e);
  if (isDir(p)) continue;
  const text = readFileSync(p, 'utf8');
  if (!/^---\n[\s\S]*?\n---/.test(text)) {
    flag(`changes/${e}: missing frontmatter (description/status)`);
  } else {
    const fm = text.match(/^---\n([\s\S]*?)\n---/)[1];
    if (!/^description:/m.test(fm)) flag(`changes/${e}: frontmatter missing "description:"`);
    if (!/^status:/m.test(fm)) flag(`changes/${e}: frontmatter missing "status:"`);
  }
  const m = e.match(new RegExp(`^\\d{4}-\\d{2}-\\d{2}-(${SLUG})\\.md$`));
  if (m) {
    if (changeSlugs.has(m[1])) flag(`changes/: duplicate topic slug "${m[1]}" (${changeSlugs.get(m[1])} and ${e}) — one topic = one file, update it in place`);
    else changeSlugs.set(m[1], e);
  }
}

// 7 — plans/
for (const e of ls(join(dir, 'plans'))) {
  const p = join(dir, 'plans', e);
  if (isDir(p)) {
    if (e !== 'archive') flag(`plans/${e}/: only plans/archive/ is expected`);
    else for (const a of ls(p)) {
      if (a.endsWith('.md') && !ARCHIVE_RULE.test(a)) flag(`bad filename: plans/archive/${a} — expected YYYY-MM-DD-NN-slug.md`);
    }
  } else if (e.endsWith('.md') && e !== 'current.md') {
    flag(`plans/${e}: only current.md lives at plans/ root — finished plans go to plans/archive/`);
  }
}

// 9 — tickets/
for (const feat of ls(join(dir, 'tickets'))) {
  const fp = join(dir, 'tickets', feat);
  if (!isDir(fp)) { flag(`tickets/${feat}: tickets live in a {feature-slug}/ subdirectory`); continue; }
  if (!FEATURE_DIR.test(feat)) flag(`tickets/${feat}/: feature directory should be a kebab-case slug`);
  for (const e of ls(fp)) {
    if (!e.endsWith('.md')) continue;
    if (!TICKET_FILE.test(e)) flag(`bad filename: tickets/${feat}/${e} — expected NN-slug.md`);
    const text = readFileSync(join(fp, e), 'utf8');
    if (!/TICKET-\d+/.test(text)) flag(`tickets/${feat}/${e}: no global TICKET-xxx id found in the file`);
  }
}

// 10 — index exists and knows every design/ + changes/ file
const indexPath = join(dir, 'index.md');
if (!existsSync(indexPath)) {
  flag(`index.md missing — the index is how anyone finds the right doc`);
} else {
  const index = readFileSync(indexPath, 'utf8');
  for (const d of ['design', 'changes']) {
    for (const e of ls(join(dir, d))) {
      if (e.endsWith('.md') && !index.includes(e)) flag(`orphan: ${d}/${e} not referenced in index.md`);
    }
  }
}

if (problems.length === 0) {
  console.log(`✓ File hygiene OK — ${dir} follows the tree conventions.`);
  process.exit(0);
}
console.log(`✖ File hygiene: ${problems.length} problem(s) in ${dir}\n`);
for (const p of [...new Set(problems)].sort()) console.log('  ' + p);
console.log('\nFix these — a tree that drifts from its own conventions stops being navigable.');
process.exit(1);
