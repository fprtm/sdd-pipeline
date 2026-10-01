#!/usr/bin/env node
// Read-only retirement gate for transient SDD artifacts.
// Usage: node check-retirement.mjs <repo-root> <transient-path> <canonical-path>

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';

const [repoArg, transientArg, canonicalArg] = process.argv.slice(2);

function fail(message) {
  console.error(`BLOCKED: ${message}`);
  process.exit(1);
}

if (!repoArg || !transientArg || !canonicalArg) {
  fail('usage: check-retirement.mjs <repo-root> <transient-path> <canonical-path>');
}

const repo = resolve(repoArg);
if (!existsSync(repo) || !statSync(repo).isDirectory()) fail(`repository root does not exist: ${repoArg}`);

function confined(label, input) {
  if (isAbsolute(input)) fail(`${label} must be repository-relative: ${input}`);
  const absolute = resolve(repo, input);
  const rel = relative(repo, absolute);
  if (!rel || rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
    fail(`${label} must resolve to a file inside the repository: ${input}`);
  }
  return { absolute, relative: rel.replaceAll('\\', '/') };
}

const transient = confined('transient path', transientArg);
const canonical = confined('canonical path', canonicalArg);
if (transient.absolute === canonical.absolute) fail('canonical outcome must be distinct from the transient artifact');
if (!existsSync(transient.absolute) || !statSync(transient.absolute).isFile()) fail(`transient artifact does not exist: ${transient.relative}`);
if (!existsSync(canonical.absolute)) fail(`canonical outcome does not exist: ${canonical.relative}`);

const ignoredDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'vendor']);
function markdownFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) found.push(...markdownFiles(path));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) found.push(path);
  }
  return found;
}

const references = [];
const transientStem = basename(transient.relative).replace(/\.md$/i, '');
function targetsTransient(file, rawCandidate, wiki = false) {
  let raw = rawCandidate.trim().replace(/^<|>$/g, '').split('#')[0].split('|')[0].trim();
  if (!raw || /^(?:[a-z][a-z0-9+.-]*:|#)/i.test(raw)) return false;
  try { raw = decodeURIComponent(raw); } catch { /* malformed links are another checker's concern */ }
  if (wiki && !raw.includes('/') && !/\.md$/i.test(raw)) return raw === transientStem;
  const candidates = raw.startsWith('/')
    ? [resolve(repo, `.${raw}`)]
    : [resolve(dirname(file), raw), resolve(repo, raw)];
  return candidates.includes(transient.absolute);
}

for (const file of markdownFiles(repo)) {
  if (file === transient.absolute) continue;
  const text = readFileSync(file, 'utf8');
  const inline = [...text.matchAll(/\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g)].map((match) => [match[1], false]);
  const definitions = [...text.matchAll(/^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)].map((match) => [match[1], false]);
  const wikiLinks = [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map((match) => [match[1], true]);
  if ([...inline, ...definitions, ...wikiLinks].some(([candidate, wiki]) => targetsTransient(file, candidate, wiki))) {
    references.push(relative(repo, file).replaceAll('\\', '/'));
  }
}
if (references.length) fail(`live reference(s) still target ${transient.relative}: ${references.join(', ')}`);

const configPath = resolve(repo, 'docs/sdd/config.md');
const config = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
const archivePolicy = /^artifact-retention:\s*archive\s*$/mi.test(config);

let recoverable = false;
try {
  execFileSync('git', ['-C', repo, 'rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
  execFileSync('git', ['-C', repo, 'ls-files', '--error-unmatch', '--', transient.relative], { stdio: 'ignore' });
  const dirty = execFileSync('git', ['-C', repo, 'status', '--porcelain=v1', '--untracked-files=all', '--', transient.relative], { encoding: 'utf8' }).trim();
  const history = execFileSync('git', ['-C', repo, 'log', '--format=%H', '-n', '1', '--', transient.relative], { encoding: 'utf8' }).trim();
  recoverable = history.length > 0 && dirty.length === 0;
} catch {
  recoverable = false;
}

if (!recoverable) {
  if (archivePolicy) {
    console.error(`ARCHIVE REQUIRED: ${transient.relative} is not recoverable from Git; preserve it under the configured archive policy before retirement.`);
    process.exit(2);
  }
  fail(`${transient.relative} is not recoverable from committed Git history and no archive retention policy is active`);
}

console.log(`SAFE TO RETIRE (preview only): ${transient.relative}; canonical outcome: ${canonical.relative}. No files were changed.`);
