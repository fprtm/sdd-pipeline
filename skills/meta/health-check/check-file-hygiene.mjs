#!/usr/bin/env node
// check-file-hygiene.mjs — mechanical enforcement of the docs/sdd/ tree
// conventions. Instructions in markdown are followed probabilistically; this
// catches what got missed mechanically. Run after writing/renaming any file
// under docs/sdd (and in CI via enforcement/ci/sdd-check.yml):
//
//   node tools/check-file-hygiene.mjs [docs/sdd]
//
// Checks (v3 tree — specs/ is folder-per-feature, one home for everything
// tied to a feature's spine number):
//   1. Root: only the known top-level .md files — index, config, glossary,
//      traceability, HANDOFF, stack-guide, analytics, insights — no stray
//      docs dumped at the root. (memory is a directory, not a root file —
//      see #9.)
//   2. Only known subdirectories: specs, plans, reports, decisions, changes,
//      stats, design-system, memory.
//   3. specs/{NNN}-{slug}/  — one folder per feature, {NNN} IS the spine
//      number (FSD-003 = specs/003-x/fsd.md). Inside: bare filenames only
//      — fsd.md, sds.md, prd.md, threats.md, ux.md, erd.md, tests.md,
//      dod.md, idea.md — plus an optional tickets/ subdirectory.
//   3b. specs/{NNN}-{slug}/tickets/  — {NN}-{slug}.md ticket files, each
//      containing a TICKET-xxx id and a valid **Status**: line (todo/in
//      progress/testing/done/blocked — an unstatused ticket is unworkable),
//      plus 00-index.md (required once any ticket file exists — it's the
//      feature's entry point, never skipped). tickets/ also can't exist
//      without an fsd.md sibling — a phase-gate: no writing tickets before
//      SPEC deliberation produced at least a minimal spec.
//   3c. No two specs/ folders may share the same leading {NNN} with a
//      different slug — that's a duplicate/collision, almost always an
//      agent regenerating a slug instead of finding the existing folder.
//   4. decisions/ {NNN}-{slug}.md
//   5. changes/  YYYY-MM-DD-{slug}.md + frontmatter with description, status,
//      and updated (bumped on every in-place revision — see the "how this
//      reaches" comment below), and no duplicate topic slug (one topic =
//      one file, updated in place).
//   6. design-system/ (if it exists at all) must contain design.md — the one
//      entry doc for the UI. An optional ux-screens/ subdirectory holds
//      <flow-slug>.md files with frontmatter (description, priority, updated)
//      — flows aren't tied to one feature number, so they live here, not in
//      a specs/ feature folder. Other filenames in design-system/ are
//      unconstrained on purpose: an external UI/UX skill's output is
//      redirected into it.
//   7. plans/    current.md only; plans/archive/ YYYY-MM-DD-NN-{slug}.md
//   8. memory/   INDEX.md + <slug>.md notes with description frontmatter,
//      every note listed in INDEX.md.
//   9. reports/  YYYY-MM-DD-{slug}.md · stats/ YYYY-MM.md
//  10. index.md exists, and every specs/ feature folder + changes/ file is
//      referenced in it (no orphan docs the index doesn't know about).
// Exits non-zero on any problem.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const dir = process.argv[2] ?? 'docs/sdd';
const SLUG = '[a-z0-9][a-z0-9-]*';
const ROOT_MD = new Set(['index.md', 'config.md', 'glossary.md', 'traceability.md', 'HANDOFF.md', 'stack-guide.md', 'analytics.md', 'insights.md']);
const KNOWN_DIRS = new Set(['specs', 'plans', 'reports', 'decisions', 'changes', 'stats', 'design-system', 'memory']);
// Pre-v5.8.0 top-level dirs, retired when specs/ became folder-per-feature (v5.8.0)
// and ux-screens/ moved under design-system/ — flagged with a migration hint,
// never auto-fixed (migration is manual by design, see CHANGELOG.md v5.8.0).
const RETIRED_DIRS = {
  design: 'renamed to specs/ in v5.8.0 — git mv design/ specs/, then reorganize each {NNN}-{slug}-*.md into specs/{NNN}-{slug}/{type}.md',
  erd: 'folded into specs/{NNN}-{slug}/erd.md in v5.8.0 — git mv each file into its feature folder',
  'test-plans': 'folded into specs/{NNN}-{slug}/tests.md in v5.8.0',
  dod: 'folded into specs/{NNN}-{slug}/dod.md in v5.8.0',
  tickets: 'moved under specs/{NNN}-{slug}/tickets/ in v5.8.0 — no longer a top-level dir',
  'ux-screens': 'moved to design-system/ux-screens/ in v5.8.0',
};
const DIR_RULES = {
  decisions: new RegExp(`^\\d{3}-${SLUG}\\.md$`),
  changes: new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${SLUG}\\.md$`),
  reports: new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${SLUG}\\.md$`),
  stats: new RegExp(`^\\d{4}-\\d{2}\\.md$`),
};
const ARCHIVE_RULE = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-\\d{2}-${SLUG}\\.md$`);
const FEATURE_DIR = new RegExp(`^(\\d{3})-(${SLUG})$`);
const TICKET_FILE = new RegExp(`^\\d{2}-${SLUG}\\.md$`);
const TICKET_STATUS = /\*\*Status\*\*:\s*(⬜ ?todo|🔨 ?in progress|🧪 ?testing\/review|✅ ?done|⛔ ?blocked)/;
const ALLOWED_SPEC_FILES = new Set(['fsd.md', 'sds.md', 'prd.md', 'threats.md', 'ux.md', 'erd.md', 'tests.md', 'dod.md', 'idea.md']);

if (!existsSync(dir)) {
  console.error(`No ${dir} — nothing to check (fine for a docs-less run).`);
  process.exit(0);
}

const problems = [];
const flag = (msg) => problems.push(msg);
const ls = (d) => (existsSync(d) ? readdirSync(d) : []);
// existsSync follows symlinks and checks the TARGET, so it's already false
// for a broken symlink — every isDir()/isMarkdownFile() call site below is
// therefore safe to call before ever touching statSync/readFileSync on one.
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
// Case-insensitive on purpose: a stray FOO.MD must be caught and flagged
// (it fails the exact-lowercase DIR_RULES regexes below, correctly, as a
// bad filename) rather than silently skipped by every check in this file
// the way a plain e.endsWith('.md') would skip it.
const isMarkdownFile = (p, e) => existsSync(p) && !isDir(p) && /\.md$/i.test(e);
// Frontmatter regexes below assume LF; a CRLF file (\r\n line endings) has
// "---\r\n" which doesn't match a literal "---\n", so every frontmatter
// check would false-positive "missing frontmatter" on a file that has one.
// Normalizing on read fixes it at the source for every caller.
const readText = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

// 1+2 — root files and known dirs
for (const e of ls(dir)) {
  const p = join(dir, e);
  if (isDir(p)) {
    if (!KNOWN_DIRS.has(e)) {
      if (RETIRED_DIRS[e]) flag(`old naming: ${e}/ is a pre-v5.8.0 layout — suggested fix (manual, not auto-applied): ${RETIRED_DIRS[e]}`);
      else flag(`unknown directory: ${e}/ — not part of the docs/sdd tree`);
    }
  } else if (isMarkdownFile(p, e)) {
    if (!ROOT_MD.has(e)) flag(`stray file at root: ${e} — docs belong in a subdirectory (specs/, changes/, …)`);
  }
}

// 4-9 — flat per-directory naming rules (decisions/changes/reports/stats)
for (const [d, re] of Object.entries(DIR_RULES)) {
  const sub = join(dir, d);
  for (const e of ls(sub)) {
    const p = join(sub, e);
    if (isDir(p)) { flag(`unexpected subdirectory: ${d}/${e}/`); continue; }
    if (!isMarkdownFile(p, e)) continue;
    if (!re.test(e)) flag(`bad filename: ${d}/${e} — expected ${re}`);
  }
}

// 3 — specs/{NNN}-{slug}/ — one folder per feature. Everything tied to a
// feature's spine number lives here: fsd/sds/prd/threats/ux/erd/tests/dod
// as bare filenames, plus an optional tickets/ subdirectory.
const specsDir = join(dir, 'specs');
const featureNumbers = new Map(); // NNN -> [folder names seen]
for (const e of ls(specsDir)) {
  const p = join(specsDir, e);
  if (!isDir(p)) { flag(`stray file at specs/${e} — specs/ should only contain feature folders ({NNN}-{slug}/)`); continue; }
  const m = FEATURE_DIR.exec(e);
  if (!m) { flag(`bad feature folder name: specs/${e} — expected {NNN}-{slug}/`); continue; }
  const num = m[1];
  if (!featureNumbers.has(num)) featureNumbers.set(num, []);
  featureNumbers.get(num).push(e);

  const siblingFiles = new Set(ls(p).filter(fe => isMarkdownFile(join(p, fe), fe)));
  for (const fe of ls(p)) {
    const fp = join(p, fe);
    if (isDir(fp)) {
      if (fe !== 'tickets') { flag(`unexpected subdirectory: specs/${e}/${fe}/ — only a tickets/ subdirectory is expected inside a feature folder`); continue; }
      // 3b — tickets/ subdirectory
      const ticketEntries = ls(fp);
      let hasTicketFile = false;
      for (const te of ticketEntries) {
        const tp = join(fp, te);
        if (isDir(tp)) { flag(`unexpected subdirectory: specs/${e}/tickets/${te}/`); continue; }
        if (!isMarkdownFile(tp, te)) continue;
        if (te === '00-index.md') continue; // validated for presence below, not against TICKET_FILE
        if (!TICKET_FILE.test(te)) { flag(`bad filename: specs/${e}/tickets/${te} — expected NN-slug.md`); continue; }
        hasTicketFile = true;
        const text = readText(tp);
        if (!/TICKET-\d+/.test(text)) flag(`specs/${e}/tickets/${te}: no global TICKET-xxx id found in the file`);
        if (!TICKET_STATUS.test(text)) flag(`specs/${e}/tickets/${te}: no valid **Status**: line found — a ticket without a status is unworkable (expected one of ⬜ todo, 🔨 in progress, 🧪 testing/review, ✅ done, ⛔ blocked)`);
      }
      if (hasTicketFile && !ticketEntries.includes('00-index.md')) {
        flag(`specs/${e}/tickets/: has ticket files but no 00-index.md — every feature with tickets needs its entry point (spec refs + How to Review + status table), never skipped`);
      }
      // Phase-gate: BUILD/PLAN artifacts (tickets) can't exist without SPEC evidence.
      // fsd.md is the one doc every task size above micro produces (see spec/SKILL.md's
      // "small: minimal spec... medium: FSD... large: full doc suite") — its absence
      // means tickets were written straight from a request, skipping deliberation.
      if (hasTicketFile && !siblingFiles.has('fsd.md')) {
        flag(`specs/${e}/tickets/: has ticket files but no fsd.md sibling — tickets must not be written before SPEC deliberation produced at least a minimal spec. Run spec first, or if this was intentionally skipped (micro task), tickets shouldn't exist as a folder at all.`);
      }
    } else if (isMarkdownFile(fp, fe)) {
      if (!ALLOWED_SPEC_FILES.has(fe)) flag(`bad filename: specs/${e}/${fe} — expected one of ${[...ALLOWED_SPEC_FILES].join(', ')}`);
    }
  }
}

// 3c — duplicate feature number: same {NNN}, different slug. Almost always
// an agent regenerating a slug instead of finding the existing folder by
// number — exactly the failure mode a folder-per-feature layout is at risk
// of that a flat numbered-filename layout wasn't (there, same-number files
// still sorted together regardless of slug drift; here, a slug mismatch
// creates a whole separate folder).
for (const [num, folders] of featureNumbers) {
  if (folders.length > 1) {
    flag(`duplicate feature number ${num}: ${folders.map((f) => `specs/${f}/`).join(' vs ')} — same number, different slugs. Look up the existing folder by its {NNN} prefix before writing a new document for this feature; never regenerate the slug and create a second folder. Merge these into one.`);
  }
}

// design-system/ — must have design.md, the single entry doc for the UI.
// ux-screens/ lives here (not in a specs/ feature folder): a flow isn't
// owned by one feature number the way fsd/sds/erd are — it can be touched
// again by a later feature, so it's project-level living content, same as
// design.md itself. The rest of design-system/ is deliberately
// unconstrained: an external UI/UX skill's output is redirected into it.
// Only checked when the directory exists: an API-only or CLI project has no
// UI and should not be nagged for a design doc it has no reason to own.
if (isDir(join(dir, 'design-system'))) {
  const entries = ls(join(dir, 'design-system'));
  if (!entries.includes('design.md')) {
    flag(`design-system/ exists but has no design.md — the UI needs one entry doc, however many files the content splits into (see skills/think/ux-design/)`);
  }
  const uxScreensDir = join(dir, 'design-system', 'ux-screens');
  for (const e of ls(uxScreensDir)) {
    const p = join(uxScreensDir, e);
    if (!isMarkdownFile(p, e)) continue;
    if (!new RegExp(`^${SLUG}\\.md$`).test(e)) flag(`bad filename: design-system/ux-screens/${e} — expected <flow-slug>.md`);
    const text = readText(p);
    const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) flag(`design-system/ux-screens/${e}: missing frontmatter (description/priority/updated)`);
    else {
      if (!/^description:/m.test(fmMatch[1])) flag(`design-system/ux-screens/${e}: frontmatter missing "description:"`);
      if (!/^priority:\s*(Must|Should|Could)/m.test(fmMatch[1])) flag(`design-system/ux-screens/${e}: frontmatter missing "priority:" (Must/Should/Could)`);
      if (!/^updated:\s*\d{4}-\d{2}-\d{2}/m.test(fmMatch[1])) flag(`design-system/ux-screens/${e}: frontmatter missing "updated: YYYY-MM-DD"`);
    }
  }
}

// changes/ — frontmatter + duplicate topic slug
const changeSlugs = new Map();
for (const e of ls(join(dir, 'changes'))) {
  const p = join(dir, 'changes', e);
  if (!isMarkdownFile(p, e)) continue;
  const text = readText(p);
  if (!/^---\n[\s\S]*?\n---/.test(text)) {
    flag(`changes/${e}: missing frontmatter (description/status/updated)`);
  } else {
    const fm = text.match(/^---\n([\s\S]*?)\n---/)[1];
    if (!/^description:/m.test(fm)) flag(`changes/${e}: frontmatter missing "description:"`);
    if (!/^status:/m.test(fm)) flag(`changes/${e}: frontmatter missing "status:"`);
    // The filename date is when the topic was FIRST opened; changes/ files get
    // updated in place (one topic = one file), so that date alone goes stale
    // the moment the file is revised — updated: is the only honest signal.
    if (!/^updated:\s*\d{4}-\d{2}-\d{2}/m.test(fm)) flag(`changes/${e}: frontmatter missing "updated: YYYY-MM-DD"`);
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

// memory/ — knowledge graph: INDEX.md + kebab-slug notes with description
// frontmatter, every note listed in INDEX.md (index-first is what makes the
// graph cheap to read — an unindexed note is invisible).
const memDir = join(dir, 'memory');
if (existsSync(memDir)) {
  const memIndexPath = join(memDir, 'INDEX.md');
  const memIndex = existsSync(memIndexPath) ? readText(memIndexPath) : null;
  if (!memIndex) flag('memory/INDEX.md missing — the index is how the graph gets read cheaply');
  for (const e of ls(memDir)) {
    const mp = join(memDir, e);
    if (e === 'INDEX.md' || !isMarkdownFile(mp, e)) continue;
    if (!new RegExp(`^${SLUG}\\.md$`).test(e)) flag(`bad filename: memory/${e} — expected <slug>.md`);
    const fm = readText(mp).match(/^---\n([\s\S]*?)\n---/);
    if (!fm) flag(`memory/${e}: missing frontmatter (description/type)`);
    else if (!/^description:/m.test(fm[1])) flag(`memory/${e}: frontmatter missing "description:"`);
    if (memIndex && !memIndex.includes(e.replace(/\.md$/, ''))) flag(`orphan: memory/${e} not listed in memory/INDEX.md`);
  }
}

// 10 — index exists and knows every specs/ feature folder + changes/ file.
// specs/ is checked at the FOLDER level (not per-file inside it) — index.md
// is a project-level directory of features, not of every fsd/sds/erd file;
// the per-feature breakdown lives in the feature's own tickets/00-index.md
// (large scope) or is just the folder listing (medium scope, few files).
const indexPath = join(dir, 'index.md');
if (!existsSync(indexPath)) {
  flag(`index.md missing — the index is how anyone finds the right doc`);
} else {
  const index = readText(indexPath);
  for (const e of ls(specsDir)) {
    if (isDir(join(specsDir, e)) && FEATURE_DIR.test(e) && !index.includes(e)) {
      flag(`orphan: specs/${e}/ not referenced in index.md`);
    }
  }
  for (const e of ls(join(dir, 'changes'))) {
    if (isMarkdownFile(join(dir, 'changes', e), e) && !index.includes(e)) flag(`orphan: changes/${e} not referenced in index.md`);
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
