#!/usr/bin/env node
// check-parallel-safety.mjs — turn "eyeball the backlog for overlapping files"
// into a deterministic check. Parses docs/sdd/06-backlog.md (or a lite
// changes/<topic>.md using the same ticket shape), finds tickets that are
// eligible to start (not done, not claimed, dependencies met), and clusters
// them into groups with ZERO file overlap — the actual parallel-safety test
// `parallel-work` describes, done by a script instead of by hand.
//
// Usage:
//   node check-parallel-safety.mjs [docs/sdd/06-backlog.md]
//
// Output: eligible tickets found; strict-safe clusters (zero file overlap,
// safe to spawn one agent per cluster); near-safe pairs with a named shared
// file (flag for human judgment — small overlap may still be acceptable, per
// parallel-work's own worked example).
// Exits 0 (ran fine — clusters may still be empty), 2 (no backlog file found).
//
// This is a PLAN, not an action: it never spawns anything. The agent still
// confirms the plan with the user before spawning real workers.

import { readFileSync, existsSync } from 'node:fs';

const path = process.argv[2] ?? 'docs/sdd/06-backlog.md';

if (!existsSync(path)) {
  console.log(`No backlog file at ${path} — nothing to check.`);
  process.exit(2);
}

const text = readFileSync(path, 'utf8');
const blocks = text.split(/\n(?=### TICKET-)/).filter((b) => /^### TICKET-/.test(b));

function parseTicket(block) {
  const idMatch = block.match(/^### (TICKET-\d+)/);
  const filesMatch = block.match(/\*\*Files likely touched:\*\*(.*)/);
  const depsMatch = block.match(/\*\*Dependencies:\*\*(.*)/);
  const statusMatch = block.match(/\*\*Status:\*\*(.*)/);
  const claimedMatch = block.match(/\*\*Claimed by:\*\*(.*)/);

  const files = filesMatch
    ? [...filesMatch[1].matchAll(/`([^`]+)`/g)].map((m) => m[1])
    : [];
  const deps = depsMatch
    ? [...depsMatch[1].matchAll(/TICKET-\d+/g)].map((m) => m[0])
    : [];
  const status = statusMatch ? statusMatch[1].trim() : '';
  const done = /^✅/.test(status);
  const claimed = !!(claimedMatch && claimedMatch[1].trim() && !/^_/.test(claimedMatch[1].trim()));

  return { id: idMatch ? idMatch[1] : undefined, files, deps, status, done, claimed };
}

const tickets = blocks.map(parseTicket).filter((t) => t.id);
const doneIds = new Set(tickets.filter((t) => t.done).map((t) => t.id));

function depsMet(ticket) {
  return ticket.deps.every((d) => doneIds.has(d) || !tickets.some((t) => t.id === d));
}

const eligible = tickets.filter((t) => !t.done && !t.claimed && t.files.length > 0 && depsMet(t));

console.log(`Backlog: ${tickets.length} tickets total, ${eligible.length} eligible to start now`);
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

// Near-safe pairs: not in the same strict cluster, but overlap is small
// (<=2 files) — worth a human's call, same as the env.validation.ts case.
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
  console.log('Near-safe pairs (small shared file — human judgment call, not auto-clustered):');
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
