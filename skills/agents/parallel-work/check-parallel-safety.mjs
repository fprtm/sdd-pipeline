#!/usr/bin/env node
// check-parallel-safety.mjs — turn "eyeball the tickets for overlapping files"
// into a deterministic check. Reads the v2 ticket tree (docs/sdd/tickets/, one
// file per ticket) or a single markdown file containing ### TICKET- blocks (a
// lite changes/ file), finds tickets eligible to start (not done, not claimed,
// dependencies met), and clusters them into groups with ZERO file overlap —
// the actual parallel-safety test `parallel-work` describes, done by a script
// instead of by hand.
//
// Usage:
//   node check-parallel-safety.mjs [docs/sdd/tickets | path/to/file.md]
//   node check-parallel-safety.mjs [path] --board     # kanban view instead
//
// Default output: eligible tickets; strict-safe clusters (zero file overlap —
// safe to spawn one agent per cluster); near-safe pairs sharing 1-2 files
// (flagged for human judgment, neither silently included nor excluded).
// --board: a kanban summary of every ticket grouped by status
// (⬜ todo · 🔨 in progress · 🧪 testing/review · ✅ done · ⛔ blocked).
// Exits 0 (ran fine — clusters may be empty), 2 (no tickets found).
//
// This is a PLAN, not an action: it never spawns anything. The agent still
// confirms the plan with the user before spawning real workers.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const BOARD = args.includes('--board');
const path = args.find((a) => !a.startsWith('--')) ?? 'docs/sdd/tickets';

if (!existsSync(path)) {
  console.log(`Nothing at ${path} — no tickets to check.`);
  process.exit(2);
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

// Collect ticket blocks: from a directory, each file is one ticket; from a
// single file, split on ### TICKET- headings (lite changes/ shape).
let blocks = [];
if (statSync(path).isDirectory()) {
  for (const f of walk(path)) {
    const text = readFileSync(f, 'utf8');
    if (/^#{1,6}\s+TICKET-\d+/m.test(text)) blocks.push({ src: f, text });
  }
} else {
  const text = readFileSync(path, 'utf8');
  blocks = text
    .split(/\n(?=#{1,6}\s+TICKET-)/)
    .filter((b) => /^#{1,6}\s+TICKET-/.test(b))
    .map((b) => ({ src: path, text: b }));
}

function parseTicket({ src, text }) {
  const idMatch = text.match(/^#{1,6}\s+(TICKET-\d+)(?:\s*[—-]\s*(.*))?/m);
  const filesMatch = text.match(/\*\*Files likely touched:\*\*(.*)/);
  const depsMatch = text.match(/\*\*Dependencies:?\*\*:?(.*)/);
  const statusMatch = text.match(/\*\*Status:?\*\*:?(.*)/);
  const claimedMatch = text.match(/\*\*Claimed by:\*\*(.*)/);

  const files = filesMatch ? [...filesMatch[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]) : [];
  const deps = depsMatch ? [...depsMatch[1].matchAll(/TICKET-\d+/g)].map((m) => m[0]) : [];
  const status = statusMatch ? statusMatch[1].trim() : '';
  const lane =
    /✅/.test(status) ? 'done' :
    /🧪/.test(status) ? 'testing' :
    /⛔/.test(status) ? 'blocked' :
    /🔨/.test(status) ? 'in-progress' : 'todo';
  const claimedBy = claimedMatch && claimedMatch[1].trim() && !/^_/.test(claimedMatch[1].trim())
    ? claimedMatch[1].trim() : '';

  return {
    id: idMatch ? idMatch[1] : undefined,
    title: idMatch && idMatch[2] ? idMatch[2].trim() : '',
    src, files, deps, status, lane,
    done: lane === 'done',
    claimed: !!claimedBy,
    claimedBy,
  };
}

const tickets = blocks.map(parseTicket).filter((t) => t.id);
if (tickets.length === 0) {
  console.log(`No TICKET-xxx blocks found under ${path}.`);
  process.exit(2);
}

if (BOARD) {
  const LANES = [
    ['todo', '⬜ todo'],
    ['in-progress', '🔨 in progress'],
    ['testing', '🧪 testing/review'],
    ['blocked', '⛔ blocked'],
    ['done', '✅ done'],
  ];
  const counts = LANES.map(([key, label]) => `${label.split(' ')[0]} ${tickets.filter((t) => t.lane === key).length}`).join(' · ');
  console.log(`Board — ${tickets.length} tickets (${counts})\n`);
  for (const [key, label] of LANES) {
    const lane = tickets.filter((t) => t.lane === key);
    if (lane.length === 0) continue;
    console.log(`${label} (${lane.length})`);
    for (const t of lane) {
      const bits = [t.title, t.claimedBy && `claimed: ${t.claimedBy}`, t.deps.length > 0 && key === 'todo' && `deps: ${t.deps.join(', ')}`].filter(Boolean);
      console.log(`  ${t.id}${bits.length ? ' — ' + bits.join(' · ') : ''}`);
    }
    console.log();
  }
  process.exit(0);
}

const doneIds = new Set(tickets.filter((t) => t.done).map((t) => t.id));

function depsMet(ticket) {
  return ticket.deps.every((d) => doneIds.has(d) || !tickets.some((t) => t.id === d));
}

const eligible = tickets.filter((t) => !t.done && !t.claimed && t.files.length > 0 && depsMet(t));

console.log(`Tickets: ${tickets.length} total, ${eligible.length} eligible to start now`);
console.log('(not done, not claimed, dependencies met, has a Files-likely-touched list)\n');

if (eligible.length === 0) {
  console.log('Nothing eligible right now — nothing to parallelize.');
  process.exit(0);
}

for (const t of eligible) {
  console.log(`  ${t.id}: ${t.files.join(', ')}`);
}
console.log();

function overlap(a, b) {
  return a.files.filter((f) => b.files.includes(f));
}

// Greedy clustering: walk eligible tickets in order, add each to the first
// existing cluster with zero file overlap against every current member, else
// start a new cluster.
const clusters = [];
for (const t of eligible) {
  const home = clusters.find((c) => c.every((m) => overlap(m, t).length === 0));
  if (home) home.push(t);
  else clusters.push([t]);
}

const multi = clusters.filter((c) => c.length > 1);
if (multi.length > 0) {
  console.log('Strict-safe clusters (zero file overlap — one agent per cluster):');
  multi.forEach((c, i) => {
    console.log(`  Cluster ${i + 1}: ${c.map((t) => t.id).join(' + ')}`);
  });
  console.log();
} else {
  console.log('No zero-overlap cluster of 2+ found among eligible tickets.\n');
}

// Near-safe pairs: overlap is small (<=2 files) — worth a human's call.
const nearSafe = [];
for (let i = 0; i < eligible.length; i++) {
  for (let j = i + 1; j < eligible.length; j++) {
    const shared = overlap(eligible[i], eligible[j]);
    if (shared.length > 0 && shared.length <= 2) {
      nearSafe.push({ a: eligible[i].id, b: eligible[j].id, shared });
    }
  }
}
if (nearSafe.length > 0) {
  console.log('Near-safe pairs (small shared-file overlap — human judgment call, not auto-clustered):');
  for (const { a, b, shared } of nearSafe) {
    console.log(`  ${a} + ${b}: shared ${shared.join(', ')}`);
  }
  console.log();
}

const soloOnly = clusters.filter((c) => c.length === 1).map((c) => c[0].id);
if (soloOnly.length > 0) {
  console.log(`Solo only (overlaps everything eligible, or nothing else eligible): ${soloOnly.join(', ')}`);
}

process.exit(0);
