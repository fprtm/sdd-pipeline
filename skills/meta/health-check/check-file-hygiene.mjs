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
import { join, relative, basename, resolve, isAbsolute } from 'node:path';
import { execFileSync } from 'node:child_process';

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
const TICKET_TIER = /\*\*Tier\*\*:\s*(T1|T2|T3)/;
const ALGORITHM_HEADING = /^##\s+Algorithm\s*\/\s*Flow/mi;
const ALLOWED_SPEC_FILES = new Set(['fsd.md', 'sds.md', 'prd.md', 'threats.md', 'ux.md', 'erd.md', 'tests.md', 'dod.md', 'idea.md', 'deliberation.md']);
// Docs that must open with a nav-header link (see doc-generator's "Document
// Formats") — excludes dod.md (a checklist) and idea.md (an informal,
// optional Gear-1 note), neither of which are the reading-order-guided docs
// this rule targets.
const NAV_REQUIRED = new Set(['fsd.md', 'sds.md', 'prd.md', 'threats.md', 'ux.md', 'erd.md', 'tests.md']);
const NAV_LINK_RE = /\[[^\]]*\]\([^)]+\.md\)/;

if (!existsSync(dir)) {
  console.error(`No ${dir} — nothing to check (fine for a docs-less run).`);
  process.exit(0);
}

const problems = [];
const legacyFindings = [];
const notices = [];
let legacyMode = false;
let reactivatedPaths = [];
const isReactivatedFinding = (msg) => reactivatedPaths.some((path) => {
  const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : path;
  return msg.includes(path) || (parent && msg.includes(parent));
});
const flag = (msg) => (legacyMode && !isReactivatedFinding(msg) ? legacyFindings : problems).push(msg);
const strictFlag = (msg) => problems.push(msg);
const legacy = (msg) => legacyFindings.push(msg);
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
const configPath = join(dir, 'config.md');
const configText = existsSync(configPath) ? readText(configPath) : '';
const lifecyclePolicy = /^artifact-policy-version:\s*1\s*$/mi.test(configText);
const archivePolicy = /^artifact-retention:\s*archive\s*$/mi.test(configText);
legacyMode = existsSync(configPath) && !lifecyclePolicy;
if (legacyMode) {
  try {
    const repoRoot = resolve(dir, '..', '..');
    const scope = relative(repoRoot, resolve(dir));
    reactivatedPaths = execFileSync('git', ['-C', repoRoot, 'status', '--porcelain=v1', '--untracked-files=all', '--', scope], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter(Boolean)
      .map((line) => line.slice(3).split(' -> ').at(-1))
      .map((path) => path.startsWith(`${scope}/`) ? path.slice(scope.length + 1) : path);
  } catch {
    reactivatedPaths = [];
    notices.push('NOTICE: legacy/new artifact classification is unavailable without Git; keep this tree read-only until an approved migration enables artifact-policy-version: 1');
  }
}
const field = (text, name) => new RegExp(`^-?[ \\t]*(?:\\*\\*)?${name}(?:\\*\\*)?:[ \\t]*(.+)$`, 'mi').exec(text)?.[1]?.trim();
const sectionBody = (text, heading) => {
  const start = new RegExp(`^##\\s+${heading}\\s*$`, 'mi').exec(text);
  if (!start) return '';
  const tail = text.slice(start.index + start[0].length);
  const next = /^##\s+/m.exec(tail);
  return (next ? tail.slice(0, next.index) : tail).trim();
};
const listField = (text, name) => {
  const scalar = field(text, name);
  if (scalar) return [scalar];
  const start = new RegExp(`^${name}:\\s*$`, 'mi').exec(text);
  if (!start) return [];
  const tail = text.slice(start.index + start[0].length);
  const values = [];
  for (const line of tail.split('\n')) {
    if (!line.trim()) continue;
    const item = /^-\s*(\S.*)$/.exec(line);
    if (!item) break;
    values.push(item[1].trim());
  }
  return values;
};

function validateGoalContract(text, label) {
  if (!/^goal:\s*\S+/mi.test(text) && !sectionBody(text, 'Goal')) {
    flag(`${label}: missing goal — state the observable outcome, not the work to perform`);
  }
  if (!/^supports:\s*\S+/mi.test(text) && !sectionBody(text, 'Supports')) {
    flag(`${label}: missing supports — cite the existing REQ/FSD/ADR/TICKET spine where applicable, or explicitly state none`);
  }
  if (!/^success:\s*\S+/mi.test(text) && !sectionBody(text, 'Success')) {
    flag(`${label}: missing success — add at least one observable success condition`);
  }
}

function validateMixedResponsibilities(text, label) {
  const groups = [
    /^##\s+(Design|Architecture)\b/mi,
    /^##\s+(Progress|Implementation Log|Work Log)\b/mi,
    /^##\s+(Raw Evidence|Command Output|Raw Command Output)\b/mi,
    /^##\s+(Runbook|Operations)\b/mi,
    /^##\s+(Final Report|Verification Report)\b/mi,
  ];
  const found = groups.filter((pattern) => pattern.test(text)).length;
  if (found >= 3) flag(`${label}: mixes ${found} responsibilities (design/progress/raw evidence/runbook/final report) — compact canonical outcomes and split only by consumer or lifecycle`);
}

function validateHandoff(text) {
  const label = 'HANDOFF.md';
  if (!/^protocol:\s*sdd-handoff\/v1\s*$/mi.test(text)) flag(`${label}: unsupported or missing protocol (expected sdd-handoff/v1)`);
  const form = field(text, 'form');
  if (!['reference', 'portable'].includes(form)) flag(`${label}: form must be reference or portable`);
  const state = field(text, 'state');
  if (!['active', 'consumed'].includes(state)) flag(`${label}: state must be active or consumed`);
  if (state === 'consumed') flag(`${label}: consumed transient handoff remains in the active working set — confirm recovery and retire it`);
  for (const heading of ['Resume Goal', 'Transition', 'Integrity', 'Authority', 'Capabilities', 'Evidence', 'Pointers']) {
    if (!new RegExp(`^##\\s+${heading}\\s*$`, 'mi').test(text)) flag(`${label}: missing "## ${heading}" section`);
  }
  if (!/^target_state:\s*\S+/mi.test(text)) flag(`${label}: missing resume goal target_state`);
  if (!/^success_when:\s*$/mi.test(text) || !/^success_when:\s*\n-\s*\S+/mi.test(text)) flag(`${label}: missing observable success_when item`);
  const createdAt = field(text, 'created_at');
  if (!createdAt || Number.isNaN(Date.parse(createdAt)) || !/^\d{4}-\d{2}-\d{2}T/.test(createdAt)) flag(`${label}: created_at must be an ISO-8601 timestamp`);
  if (!/^producer_actor:\s*\S+/mi.test(text)) flag(`${label}: producer_actor is required`);
  if (!/^phase:\s*(ASK|SPEC|PLAN|BUILD|CHECK)\s*$/mi.test(text)) flag(`${label}: missing valid transition phase`);
  if (!/^next_action:\s*\S+/mi.test(text)) flag(`${label}: missing transition next_action`);
  if (!/^repo_head:\s*\S+/mi.test(text) || !/^dirty:\s*(true|false|unknown)\s*$/mi.test(text)) flag(`${label}: repo_head and dirty state are required`);
  if (!/^relevant_paths:\s*\n-\s*\S+/mi.test(text)) flag(`${label}: at least one relevant_paths item is required`);
  const baseline = listField(text, 'baseline');
  const carried = listField(text, 'carried');
  if (baseline.length === 0 || carried.length === 0) flag(`${label}: authority baseline and carried values are required`);
  for (const authority of carried) {
    if (!baseline.includes(authority)) flag(`${label}: carried authority expands beyond baseline: ${authority}`);
  }
  if (!/^required:\s*\S+/mi.test(text)) flag(`${label}: missing required capabilities`);
  const declaredCapabilities = (process.env.SDD_CAPABILITIES ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  if (declaredCapabilities.length > 0) {
    const required = listField(text, 'required').flatMap((item) => item.split(',')).map((item) => item.trim()).filter((item) => item && item !== 'none');
    for (const capability of required) if (!declaredCapabilities.includes(capability)) flag(`${label}: required capability unavailable: ${capability}`);
    const optional = listField(text, 'optional').flatMap((item) => item.split(',')).map((item) => item.trim()).filter((item) => item && item !== 'none');
    for (const capability of optional) if (!declaredCapabilities.includes(capability)) notices.push(`DEGRADED: ${label}: optional capability unavailable: ${capability}`);
  }
  if (!/^##\s+Evidence\s*\n-\s*\S+/mi.test(text)) flag(`${label}: at least one evidence item is required`);
  if (!/^##\s+Pointers\s*\n-\s*\S+/mi.test(text)) flag(`${label}: at least one canonical pointer is required`);
  if (form === 'portable' && !sectionBody(text, 'Minimum State')) flag(`${label}: portable form requires non-empty "## Minimum State"`);
  if (form === 'reference') {
    const pointers = sectionBody(text, 'Pointers').split('\n').filter((line) => /^-\s*\S+/.test(line)).map((line) => line.replace(/^-\s*/, '').replace(/`/g, '').trim());
    const repoRoot = resolve(dir, '..', '..');
    for (const pointer of pointers) {
      const resolved = resolve(repoRoot, pointer);
      const rel = relative(repoRoot, resolved);
      if (isAbsolute(pointer) || rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) flag(`${label}: reference pointer escapes repository: ${pointer}`);
      else if (!existsSync(resolved)) flag(`${label}: reference pointer does not resolve: ${pointer}`);
    }
    const handoffHead = field(text, 'repo_head');
    const relevantPaths = [];
    for (const rawPath of listField(text, 'relevant_paths')) {
      const planned = rawPath.startsWith('planned:');
      const candidate = planned ? rawPath.slice('planned:'.length).trim() : rawPath;
      const resolved = resolve(repoRoot, candidate);
      const rel = relative(repoRoot, resolved);
      if (isAbsolute(candidate) || rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) flag(`${label}: relevant path escapes repository: ${rawPath}`);
      else if (!planned && !existsSync(resolved)) flag(`${label}: relevant path does not exist (use planned:<path> only for intended new files): ${candidate}`);
      else relevantPaths.push(candidate);
    }
    if (handoffHead && handoffHead !== 'unavailable') {
      try {
        const currentHead = execFileSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        if (currentHead !== handoffHead) {
          const changed = execFileSync('git', ['-C', repoRoot, 'diff', '--name-only', `${handoffHead}..HEAD`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n').filter(Boolean);
          const relevantDrift = changed.filter((changedPath) => relevantPaths.some((relevantPath) => changedPath === relevantPath || changedPath.startsWith(`${relevantPath}/`) || relevantPath.startsWith(`${changedPath}/`)));
          if (relevantDrift.length > 0) flag(`${label}: relevant repository state changed since repo_head: ${relevantDrift.join(', ')}`);
        }
        const dirtyRelevant = execFileSync('git', ['-C', repoRoot, 'status', '--porcelain=v1', '--', ...relevantPaths], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        if (dirtyRelevant && field(text, 'dirty') === 'false') flag(`${label}: relevant paths are dirty but handoff declares dirty: false`);
      } catch {
        flag(`${label}: repo_head could not be verified in the referenced repository`);
      }
    }
  }
}

// 1+2 — root files and known dirs
for (const e of ls(dir)) {
  const p = join(dir, e);
  if (isDir(p)) {
    if (!KNOWN_DIRS.has(e)) {
      if (RETIRED_DIRS[e] && !lifecyclePolicy) legacy(`old naming: ${e}/ is a pre-v5.8.0 layout — migration opportunity (preview only): ${RETIRED_DIRS[e]}`);
      else if (RETIRED_DIRS[e]) flag(`old naming: ${e}/ is a pre-v5.8.0 layout in a policy-v1 tree — preview and approve migration: ${RETIRED_DIRS[e]}`);
      else flag(`unknown directory: ${e}/ — not part of the docs/sdd tree`);
    }
  } else if (isMarkdownFile(p, e)) {
    if (!ROOT_MD.has(e)) flag(`stray file at root: ${e} — docs belong in a subdirectory (specs/, changes/, …)`);
    // config.md must declare an SDLC model — "mandatory, never skipped" (see
    // sdlc-detector/SKILL.md) was, until this check existed, only a written
    // instruction with no mechanical backstop, and got silently skipped in
    // real usage (found live in the isikelas project, Codex/GPT-5.6-Terra).
    if (e === 'config.md') {
      const text = readText(p);
      if (!/^sdlc:\s*\S+/mi.test(text)) {
        strictFlag(`config.md: missing "sdlc:" — SDLC model is mandatory (never skipped, never left undeclared), see skills/think/sdlc-detector/SKILL.md`);
      } else if (!/^sdlc-reason:\s*\S+/mi.test(text)) {
        strictFlag(`config.md: has "sdlc:" but no "sdlc-reason:" — every SDLC value must be set with a one-sentence reason, see skills/think/sdlc-detector/SKILL.md`);
      }
    }
    if (e === 'HANDOFF.md' && lifecyclePolicy) validateHandoff(readText(p));
  }
}

// 4-9 — flat per-directory naming rules (decisions/changes/reports/stats)
for (const [d, re] of Object.entries(DIR_RULES)) {
  const sub = join(dir, d);
  for (const e of ls(sub)) {
    const p = join(sub, e);
    if (isDir(p)) {
      if (e === 'archive' && !lifecyclePolicy) legacy(`${d}/archive/ is retained from a pre-policy layout — preview references and recoverability before migration`);
      else if (e === 'archive' && archivePolicy) { /* policy-retained history */ }
      else flag(`unexpected subdirectory: ${d}/${e}/`);
      continue;
    }
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
        if (isDir(tp)) {
          if (te === 'archive' && !lifecyclePolicy) legacy(`specs/${e}/tickets/archive/ is retained from a pre-policy layout — preview references and recoverability before migration`);
          else if (te === 'archive' && archivePolicy) { /* policy-retained history */ }
          else flag(`unexpected subdirectory: specs/${e}/tickets/${te}/`);
          continue;
        }
        if (!isMarkdownFile(tp, te)) continue;
        if (te === '00-index.md') continue; // validated for presence below, not against TICKET_FILE
        if (!TICKET_FILE.test(te)) { flag(`bad filename: specs/${e}/tickets/${te} — expected NN-slug.md`); continue; }
        hasTicketFile = true;
        const text = readText(tp);
        if (!/TICKET-\d+/.test(text)) flag(`specs/${e}/tickets/${te}: no global TICKET-xxx id found in the file`);
        if (!TICKET_STATUS.test(text)) flag(`specs/${e}/tickets/${te}: no valid **Status**: line found — a ticket without a status is unworkable (expected one of ⬜ todo, 🔨 in progress, 🧪 testing/review, ✅ done, ⛔ blocked)`);
        if (lifecyclePolicy) {
          validateGoalContract(text, `specs/${e}/tickets/${te}`);
          if (/\*\*Status\*\*:\s*🧪 ?testing\/review/i.test(text)) {
            const actors = Object.fromEntries(['implementer', 'reviewer', 'verifier', 'security_reviewer'].map((name) => [name, field(text, name)]));
            const independence = field(text, 'independence');
            if (!actors.implementer) flag(`specs/${e}/tickets/${te}: testing/review requires implementer actor ID`);
            if (!['independent', 'degraded independence'].includes(independence)) flag(`specs/${e}/tickets/${te}: testing/review requires a valid independence state`);
            if (independence === 'independent' && (!actors.reviewer || !actors.verifier)) flag(`specs/${e}/tickets/${te}: independent testing/review requires reviewer and verifier actor IDs`);
            if (independence === 'degraded independence' && !sectionBody(text, 'Human Review')) flag(`specs/${e}/tickets/${te}: degraded independence requires non-empty "## Human Review" items`);
            const securitySensitive = /^\*\*Security-sensitive\*\*:\s*true\s*$/mi.test(text);
            if (securitySensitive && !actors.security_reviewer) flag(`specs/${e}/tickets/${te}: security-sensitive review requires security_reviewer actor ID`);
            const present = Object.entries(actors).filter(([, value]) => value);
            for (let i = 0; i < present.length; i += 1) for (let j = i + 1; j < present.length; j += 1) {
              if (present[i][1] === present[j][1]) flag(`specs/${e}/tickets/${te}: ${present[i][0]} and ${present[j][0]} actor IDs must differ`);
            }
          }
          if (/\*\*Status\*\*:\s*✅ ?done/i.test(text)) {
            flag(`specs/${e}/tickets/${te}: completed transient ticket remains in the active working set — compact its durable outcome, remove live references, confirm Git recovery, then retire it`);
          }
        }
        // T2/T3 tickets need the Algorithm/Flow section — a bare file+function
        // manifest leaves the actual logic/branching to be guessed, which is
        // exactly the ambiguity a junior dev or cheap model can't resolve on
        // its own (unlike T1, where there's genuinely one obvious way to do it).
        const tierMatch = text.match(TICKET_TIER);
        if (tierMatch && (tierMatch[1] === 'T2' || tierMatch[1] === 'T3') && !ALGORITHM_HEADING.test(text)) {
          flag(`specs/${e}/tickets/${te}: Tier ${tierMatch[1]} ticket has no "## Algorithm / Flow" section — required above T1, see ticket-decomposition/SKILL.md's "Ticket Format"`);
        }
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
      if (fe === 'deliberation.md' && lifecyclePolicy) {
        const ledger = readText(fp);
        for (const required of ['decision_goal', 'exit_when', 'supports']) {
          if (!new RegExp(`^${required}:\\s*\\S+`, 'mi').test(ledger)) flag(`specs/${e}/deliberation.md: missing "${required}:" discussion goal contract`);
        }
        const ledgerStatus = field(ledger, 'status');
        if (!['active', 'verified'].includes(ledgerStatus)) flag(`specs/${e}/deliberation.md: status must be active or verified`);
        if (ledgerStatus === 'verified') flag(`specs/${e}/deliberation.md: verified transient ledger remains in the active working set — confirm recovery and retire it`);
      }
      if (lifecyclePolicy) validateMixedResponsibilities(readText(fp), `specs/${e}/${fe}`);
      // Nav header — "every generated doc opens with one line back to its
      // feature's entry point" (doc-generator/SKILL.md's "Document Formats").
      // Written-only rule, found silently skipped in real usage (isikelas) —
      // exempts dod.md/idea.md (checklists/informal notes, not the reading-
      // order-guided docs this rule targets).
      if (NAV_REQUIRED.has(fe)) {
        const firstLines = readText(fp).split('\n').slice(0, 6).join('\n');
        if (!NAV_LINK_RE.test(firstLines)) {
          flag(`specs/${e}/${fe}: missing a nav-header link back to the feature's entry point in the first few lines (e.g. "[← Back to 00-index.md](00-index.md)") — see doc-generator/SKILL.md's "Document Formats"`);
        }
      }
      // ux.md must record whether direction was actually confirmed with the
      // user, respected from existing design, or assumed — same audit-trail
      // principle as sdlc-reason/Design source. A direction that "sounds
      // thought-through" is not proof §0's confirm-first step actually ran.
      if (fe === 'ux.md' && !/\*\*Direction confirmed\*\*:\s*\S+/i.test(readText(fp))) {
        flag(`specs/${e}/ux.md: missing "**Direction confirmed**:" — see skills/think/ux-design/SKILL.md's "§0 Confirm Direction First"`);
      }
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
  } else {
    // "Design source" is not optional — a direction with no recorded
    // grounding (ui-ux-pro-max / a style-catalog file / respect-existing /
    // an explicit custom reason) can't be told apart from one invented in
    // the moment, the same audit gap sdlc-reason closes for SDLC.
    const designText = readText(join(dir, 'design-system', 'design.md'));
    if (!/\*\*Design source\*\*:\s*\S+/i.test(designText)) {
      flag(`design-system/design.md: missing "**Design source**:" — must state ui-ux-pro-max, a docs/design-system-styles/<slug>.md file, respect-existing, or custom + reason (see skills/think/ux-design/SKILL.md's "Style Grounding")`);
    }
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
    // "## Layout & Visual Composition" is the UI half of a screen spec (the
    // bullets in ux-design/SKILL.md §3 are the UX half) — required on every
    // screen so the file is usable by a design-gen tool (Stitch/Figma AI/
    // Claude design) and a coding agent, not just a behavior description.
    if (!/^##\s+Layout\s*&\s*Visual Composition/mi.test(text)) {
      flag(`design-system/ux-screens/${e}: missing "## Layout & Visual Composition" — see skills/think/ux-design/SKILL.md's "§3 Key Screens & Flows"`);
    }
  }
}

// changes/ — frontmatter + duplicate topic slug
const changeSlugs = new Map();
for (const e of ls(join(dir, 'changes'))) {
  const p = join(dir, 'changes', e);
  if (!isMarkdownFile(p, e)) continue;
  const text = readText(p);
  if (lifecyclePolicy) validateMixedResponsibilities(text, `changes/${e}`);
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
    if (lifecyclePolicy) {
      if (!/^lifecycle:\s*(canonical|active|transient|historical)\s*$/mi.test(fm)) flag(`changes/${e}: frontmatter missing valid "lifecycle:"`);
      if (!/^goal:\s*\S+/mi.test(fm)) flag(`changes/${e}: frontmatter missing "goal:" observable outcome`);
      const status = field(fm, 'status');
      const lifecycle = field(fm, 'lifecycle');
      if (/^(done|complete|completed|closed)$/i.test(status ?? '') && /^(active|transient)$/i.test(lifecycle ?? '')) {
        flag(`changes/${e}: completed ${lifecycle} artifact remains in the active working set — compact and retire it after guarded-retirement checks`);
      }
      const actors = Object.fromEntries(['implementer', 'reviewer', 'verifier', 'security_reviewer'].map((name) => [name, field(text, name)]));
      const independence = field(text, 'independence');
      const securitySensitive = /^security-sensitive:\s*true\s*$/mi.test(text) || /^\*\*Security-sensitive\*\*:\s*true\s*$/mi.test(text);
      if (!actors.implementer) flag(`changes/${e}: missing implementer actor ID`);
      if (!independence || !/^(independent|degraded independence)$/i.test(independence)) flag(`changes/${e}: missing valid independence state (independent | degraded independence)`);
      if (/^independent$/i.test(independence ?? '') && (!actors.reviewer || !actors.verifier)) flag(`changes/${e}: independent review requires reviewer and verifier actor IDs`);
      if (securitySensitive && !actors.security_reviewer) flag(`changes/${e}: security-sensitive work requires security_reviewer actor ID`);
      if (/^degraded independence$/i.test(independence ?? '') && (/\*\*Size\*\*:\s*medium/i.test(text) || /^security-sensitive:\s*true\s*$/mi.test(text)) && !sectionBody(text, 'Human Review')) {
        flag(`changes/${e}: medium/security work with degraded independence requires non-empty "## Human Review" items`);
      }
      const present = Object.entries(actors).filter(([, value]) => value);
      for (let i = 0; i < present.length; i += 1) for (let j = i + 1; j < present.length; j += 1) {
        if (present[i][1] === present[j][1]) flag(`changes/${e}: ${present[i][0]} and ${present[j][0]} actor IDs must differ`);
      }
    }
  }
  const m = e.match(new RegExp(`^\\d{4}-\\d{2}-\\d{2}-(${SLUG})\\.md$`));
  if (m) {
    if (changeSlugs.has(m[1])) flag(`changes/: duplicate topic slug "${m[1]}" (${changeSlugs.get(m[1])} and ${e}) — one topic = one file, update it in place`);
    else changeSlugs.set(m[1], e);
  }
}

if (lifecyclePolicy) {
  for (const e of ls(join(dir, 'reports'))) {
    const p = join(dir, 'reports', e);
    if (!isMarkdownFile(p, e)) continue;
    const text = readText(p);
    if (/^(?:\*\*)?Status(?:\*\*)?:\s*RESOLVED\s*$/mi.test(text)) flag(`reports/${e}: resolved transient report remains in the active working set — compact findings, confirm recovery, and retire it`);
    validateMixedResponsibilities(text, `reports/${e}`);
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
if (lifecyclePolicy && isDir(join(dir, 'plans', 'archive')) && !archivePolicy) {
  flag(`plans/archive/: archive exists without artifact-retention: archive — Git history is the default; record an audit/compliance/no-Git policy or retire guarded artifacts`);
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
  if (lifecyclePolicy && /^##\s+Recent Activity\s*$/mi.test(index)) {
    flag(`index.md: "Recent Activity" is an append-only history ledger — keep only active work and canonical entry points; use Git for history`);
  }
  if (lifecyclePolicy) {
    const activeHeading = /^##\s+Active(?: Work)?\s*$/mi.exec(index);
    let active = '';
    if (activeHeading) {
      const tail = index.slice(activeHeading.index + activeHeading[0].length);
      const nextHeading = /^##\s+/m.exec(tail);
      active = nextHeading ? tail.slice(0, nextHeading.index) : tail;
    }
    const activeLinks = [...active.matchAll(/\[[^\]]+\]\([^)]+\)/g)].length;
    for (const line of active.split('\n')) {
      if (/\[[^\]]+\]\([^)]+\)/.test(line) && /\b(done|complete|completed|closed|historical)\b/i.test(line)) {
        flag(`index.md: completed/historical row remains under Active Work: ${line.trim()}`);
      }
    }
    const configuredBudget = Number(field(configText, 'active-entry-budget') ?? 3);
    const budgetReason = field(configText, 'active-entry-budget-reason');
    if (!Number.isInteger(configuredBudget) || configuredBudget < 1) flag(`config.md: active-entry-budget must be a positive integer`);
    if (configuredBudget > 3 && !budgetReason) flag(`config.md: active-entry-budget above 3 requires active-entry-budget-reason (distinct lifecycle, consumer, reviewer, or independent owner)`);
    if (activeLinks > configuredBudget) flag(`index.md: Active Work has ${activeLinks} entry documents — configured budget is ${configuredBudget}; consolidate or justify a large-scope independent lifecycle/consumer`);
  }
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
  for (const p of [...new Set(legacyFindings)].sort()) console.log('LEGACY: ' + p);
  for (const p of [...new Set(notices)].sort()) console.log(p);
  if (legacyFindings.length > 0) {
    console.log(`✓ Compatibility pass — ${dir} has no new/reactivated violations; ${new Set(legacyFindings).size} legacy migration finding(s) remain.`);
  } else {
    console.log(`✓ File hygiene OK — ${dir} follows the tree conventions.`);
  }
  process.exit(0);
}
console.log(`✖ File hygiene: ${problems.length} problem(s) in ${dir}\n`);
for (const p of [...new Set(problems)].sort()) console.log('  ' + p);
for (const p of [...new Set(legacyFindings)].sort()) console.log('  LEGACY: ' + p);
for (const p of [...new Set(notices)].sort()) console.log('  ' + p);
console.log('\nFix these — a tree that drifts from its own conventions stops being navigable.');
process.exit(1);
