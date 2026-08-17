#!/usr/bin/env node
// File & folder hygiene checker (zero-dependency). Backstops the "File & folder
// management" rule in SKILL.md with a deterministic check — instructions in
// markdown are followed probabilistically, this catches what got missed
// mechanically instead of hoping the next session notices. Run in CI (the
// `infra` skill wires it in) and locally:
//
//   node tools/check-file-hygiene.mjs [docs/sdd]
//
// Checks:
//   1. docs/sdd/changes/*.md filenames are date-prefixed: YYYY-MM-DD-<slug>.md
//   2. Every changes/*.md has frontmatter `description:` (the index relevance hook)
//   3. Every changes/*.md is referenced by filename somewhere in 00-overview.md
//      (no orphaned topic file missing from the index)
//   4. docs/sdd/decisions/*.md filenames are timestamped: YYYY-MM-DD-HHMM-<slug>.md
//   5. Every decisions/*.md has frontmatter `status:` (proposed|decided|locked|superseded)
//   6. docs/sdd/memory/*.md (excluding INDEX.md) has frontmatter `description:`
//   7. Every memory note is referenced in memory/INDEX.md (by filename or [[slug]])
//   8. docs/sdd/ux-screens/*.md filenames are kebab-slug: <flow-slug>.md
//   9. Every ux-screens/*.md has frontmatter `description:` and `priority:`
//      (Must|Should|Could)
//  10. Every ux-screens/*.md is referenced by filename in 04-ux-design.md
//      (no orphaned flow missing from the §3 index)
// Exits 0 clean, 10 violations found, 2 nothing to check (no docs/sdd dir).

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'docs/sdd';

if (!existsSync(dir)) {
  console.log(`No spec dir at ${dir} — nothing to check.`);
  process.exit(2);
}

const CHANGE_NAME_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$/;
const DECISION_NAME_RE = /^\d{4}-\d{2}-\d{2}-\d{4}-[a-z0-9]+(-[a-z0-9]+)*\.md$/;
const SLUG_NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;
const STATUS_RE = /^status:\s*(proposed|decided|locked|superseded)\s*$/m;
const DESCRIPTION_RE = /^description:\s*.+$/m;
const PRIORITY_RE = /^priority:\s*(Must|Should|Could)\s*$/m;

const problems = [];
const listMd = (sub) => {
  const p = join(dir, sub);
  return existsSync(p) ? readdirSync(p).filter((f) => f.endsWith('.md')) : [];
};
const frontmatter = (path) => {
  const text = readFileSync(path, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
}

// --- changes/ ---
const changeFiles = listMd('changes');
const overviewPath = join(dir, '00-overview.md');
const overviewText = existsSync(overviewPath) ? readFileSync(overviewPath, 'utf8') : '';
for (const f of changeFiles) {
  if (!CHANGE_NAME_RE.test(f)) {
    problems.push(`changes/${f}: filename must be YYYY-MM-DD-<topic-slug>.md (dated, kebab)`);
  }
  const fm = frontmatter(join(dir, 'changes', f));
  if (!DESCRIPTION_RE.test(fm)) {
    problems.push(`changes/${f}: missing frontmatter "description:" (the index relevance hook)`);
  }
  if (!overviewText.includes(f)) {
    problems.push(`changes/${f}: not referenced in 00-overview.md's topic index — orphaned topic`);
  }
}
if (changeFiles.length && !existsSync(overviewPath)) {
  problems.push(`docs/sdd/changes/ has files but 00-overview.md doesn't exist — no index`);
}

// --- decisions/ ---
for (const f of listMd('decisions')) {
  if (!DECISION_NAME_RE.test(f)) {
    problems.push(`decisions/${f}: filename must be YYYY-MM-DD-HHMM-<topic-slug>.md (timestamped)`);
  }
  const fm = frontmatter(join(dir, 'decisions', f));
  if (!STATUS_RE.test(fm)) {
    problems.push(`decisions/${f}: missing/invalid frontmatter "status:" (proposed|decided|locked|superseded)`);
  }
}

// --- memory/ ---
const memoryFiles = listMd('memory').filter((f) => f !== 'INDEX.md');
const indexPath = join(dir, 'memory', 'INDEX.md');
const indexText = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
for (const f of memoryFiles) {
  const slug = f.replace(/\.md$/, '');
  const fm = frontmatter(join(dir, 'memory', f));
  if (!DESCRIPTION_RE.test(fm)) {
    problems.push(`memory/${f}: missing frontmatter "description:" (the index relevance hook)`);
  }
  if (!indexText.includes(f) && !indexText.includes(`[[${slug}]]`)) {
    problems.push(`memory/${f}: not referenced in memory/INDEX.md — orphaned note`);
  }
}
if (memoryFiles.length && !existsSync(indexPath)) {
  problems.push(`docs/sdd/memory/ has notes but INDEX.md doesn't exist — no index`);
}

// --- ux-screens/ ---
const uxFiles = listMd('ux-screens');
const uxIndexPath = join(dir, '04-ux-design.md');
const uxIndexText = existsSync(uxIndexPath) ? readFileSync(uxIndexPath, 'utf8') : '';
for (const f of uxFiles) {
  if (!SLUG_NAME_RE.test(f)) {
    problems.push(`ux-screens/${f}: filename must be <flow-slug>.md (kebab, no date needed)`);
  }
  const fm = frontmatter(join(dir, 'ux-screens', f));
  if (!DESCRIPTION_RE.test(fm)) {
    problems.push(`ux-screens/${f}: missing frontmatter "description:" (the index relevance hook)`);
  }
  if (!PRIORITY_RE.test(fm)) {
    problems.push(`ux-screens/${f}: missing/invalid frontmatter "priority:" (Must|Should|Could)`);
  }
  if (!uxIndexText.includes(f)) {
    problems.push(`ux-screens/${f}: not referenced in 04-ux-design.md's §3 index — orphaned flow`);
  }
}
if (uxFiles.length && !existsSync(uxIndexPath)) {
  problems.push(`docs/sdd/ux-screens/ has files but 04-ux-design.md doesn't exist — no index`);
}

if (problems.length === 0) {
  console.log('File hygiene: clean (naming, frontmatter, indexing all consistent).');
  process.exit(0);
}
console.log(`File hygiene: ${problems.length} problem(s):`);
for (const p of problems) console.log(`  - ${p}`);
process.exit(10);
