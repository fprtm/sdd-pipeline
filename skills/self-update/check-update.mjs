#!/usr/bin/env node
// check-update.mjs — is the installed sdd-pipeline behind its remote?
// Zero-dependency. Compares the local .claude-plugin/plugin.json version against
// the highest release tag (or raw plugin.json) on the remote repo.
//
// Usage:
//   node check-update.mjs                 # resolve pack root from this script's location
//   node check-update.mjs --root <dir>    # point at an installed pack root explicitly
//   node check-update.mjs --repo <url>    # override the remote (else read from plugin.json)
//
// Exit codes: 0 = up to date, 10 = update available, 2 = couldn't determine.
// The printed lines are the SSOT — the skill reads those, not just the code.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(arg('--root') || resolve(here, '..', '..'));

function readLocal() {
  try {
    const j = JSON.parse(readFileSync(resolve(root, '.claude-plugin', 'plugin.json'), 'utf8'));
    return { version: j.version, repo: j.repository };
  } catch {
    return { version: undefined, repo: undefined };
  }
}

const parse = (v) => String(v || '').replace(/^v/, '').split('.').map((n) => parseInt(n, 10));
function cmp(a, b) {
  const x = parse(a), y = parse(b);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); }
  return 0;
}

function normRepo(url) {
  if (!url) return undefined;
  return url.replace(/\.git$/, '').replace(/\/$/, '');
}

function remoteViaTags(repo) {
  const out = execFileSync('git', ['ls-remote', '--tags', repo + '.git'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000,
  });
  const tags = out.split('\n')
    .map((l) => (l.match(/refs\/tags\/(v\d+\.\d+\.\d+)(?:\^\{\})?$/) || [])[1])
    .filter(Boolean)
    .map((t) => t.replace(/\^\{\}$/, ''));
  if (!tags.length) return undefined;
  return tags.sort(cmp).at(-1);
}

async function remoteViaRaw(repo) {
  const m = repo.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) return undefined;
  for (const branch of ['main', 'master']) {
    const u = `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${branch}/.claude-plugin/plugin.json`;
    try {
      const res = await fetch(u);
      if (res.ok) return (await res.json()).version;
    } catch { /* try next */ }
  }
  return undefined;
}

const { version: local, repo: repoField } = readLocal();
const repo = normRepo(arg('--repo') || repoField);

if (!repo) {
  console.log('Could not determine the remote repo (no --repo and no "repository" in plugin.json).');
  process.exit(2);
}

let latest;
try { latest = remoteViaTags(repo); } catch { /* fall back to raw */ }
if (!latest) latest = await remoteViaRaw(repo);

console.log(`repo:    ${repo}`);
console.log(`local:   ${local ? 'v' + local : '(unknown — no plugin.json at pack root)'}`);
console.log(`latest:  ${latest ? 'v' + latest.replace(/^v/, '') : '(could not reach remote)'}`);

if (!latest) { console.log('RESULT: could not reach the remote — check network / repo URL.'); process.exit(2); }
if (!local) { console.log(`RESULT: latest remote is v${latest.replace(/^v/, '')}; installed version unknown — treat as update-available.`); process.exit(10); }

const c = cmp(latest, local);
if (c > 0) { console.log(`RESULT: UPDATE AVAILABLE — v${local} → v${latest.replace(/^v/, '')}. See CHANGELOG.md for the range.`); process.exit(10); }
console.log(`RESULT: UP TO DATE (v${local}).`);
process.exit(0);
