---
name: parallel-work
description: >-
  Split implementation across several agents working the SAME repo at the same
  time — worktree isolation (not separate clones), vertical-slice ticket
  assignment, a lightweight claim so two agents never silently duplicate work,
  and a merge protocol. Use when the user says "split this across agents /
  run these in parallel / spawn agents for this / I want 2 on backend 2 on
  frontend", or whenever ≥2 backlog tickets are marked parallel-safe and the
  user wants them actually run concurrently, not just noted as safe. Requires
  contracts (FSD/schema/API) already locked — this is an implementation-phase
  skill, not a design one.
---

# parallel-work — several agents, one repo, no forking

Contracts are locked; the backlog has independent tickets; you want them built
at the same time instead of one agent working through all of them in sequence.
This skill is the protocol for that — worktree isolation, vertical-slice
assignment, a cheap claim so nobody duplicates work, and a merge order. It works
on any agent runtime (the protocol is manual steps); on **Claude Code**
specifically, the `Agent` tool can execute it directly — spawn each worker with
`isolation: "worktree"`, several `run_in_background: true` in one turn.

**Not for OpenCode's own subagent mechanism** — verified against OpenCode's own
docs (`opencode.ai/docs/agents`): its subagents are **sequential child sessions**
(cycled via keybind), not concurrent workers with isolated workspaces. On
OpenCode (or any runtime without real concurrent-agent + worktree support), this
protocol still applies — you (the human) open one terminal/session per worktree
and run the steps below manually. Don't claim automated parallelism a runtime
doesn't actually have.

## 1. Isolation — git worktree, not a separate clone

A second full clone shares no history with the first — two clones can drift, and
the "is this a fork?" fear is justified. A **worktree** shares the same `.git`
(one object database, one set of remotes/history) but gives each agent its own
working directory checked out to its own branch — not a fork, just another
checkout:

```bash
git worktree add ../xplorenusa-ticket112 -b feat/ticket-112-llm-adapter
git worktree add ../xplorenusa-ticket113 -b feat/ticket-113-resend-email
```

Each agent works entirely inside its own worktree directory; no two agents ever
share a working tree. Remove with `git worktree remove <path>` once merged.

## 2. Pick genuinely independent tickets (vertical-slice, not layer) — run the checker, don't eyeball it

Assign **one full vertical slice per agent** (route → service → domain → tests
→ docs for one operation), not one layer per agent (e.g. "agent A = all
backend, agent B = all frontend"). A layer split makes both agents' work
interdependent on the other's in-progress shape even with a locked contract —
edge cases surface during coding, and neither side is independently mergeable
until both land. A slice split is fully independent and mergeable in any order.

**Run the bundled checker first — this is the actual test, not a guess:**

```bash
node skills/parallel-work/check-parallel-safety.mjs docs/sdd/06-backlog.md
```

It parses the backlog, finds tickets that are eligible right now (not done, not
claimed, dependencies met), and groups them into **strict-safe clusters** — sets
of tickets whose `Files likely touched` lists (from `backlog-leveling`'s ticket
template) share **zero** files — plus a separate list of **near-safe pairs**
that share one or two files, flagged for a human judgment call rather than
silently included or silently excluded. Use its cluster output as the starting
plan; don't hand-pick tickets by memory. (Real example the checker's design is
grounded in: two "independent-looking" adapter tickets both needed to edit the
same `notification.module.ts` factory function — a shared file two tickets both
need to edit is a real collision waiting to happen on merge, even with
perfectly separate business logic, and the checker surfaces it instead of
requiring someone to notice it by reading two file lists side by side.)

## Always confirm the plan before spawning — every mode, no exception

Spawning several background agents is a real commitment (time, tokens, a batch
of real diffs to review) — **present the checker's plan (which clusters, which
tickets, the near-safe calls) and get an explicit yes before spawning any
agent, in autopilot and copilot alike.** This is stricter than the pack's usual
autopilot-batches-routine-decisions default, deliberately — unlike a single
ticket's implementation choices, this is a go/no-go on committing real
resources to several parallel threads of work at once.

## 3. Claim before starting — cheap, prevents silent duplication

Before an agent starts a ticket, mark it in the backlog file:
`**Claimed by:** <agent-id>, <worktree path>`. Check this **before** claiming —
if another agent already claimed it, pick a different ticket. Release (delete
the line) when the ticket's branch is merged. This is the same discipline as
reserving ID ranges before parallel work already required elsewhere in this
pack — cheap insurance, not process for its own sake.

## 4. Roles — who's actually concurrent

- **`test-plan` is upstream, not a peer.** It's phase 7, completed *before*
  implementation tickets are assigned — one agent (or the human) finishes it
  first; parallel implementation agents then execute test-first against an
  already-locked plan. Don't spawn a "test-plan agent" alongside implementation
  agents expecting it to run at the same time — it doesn't fit that shape.
- **`code-review` is genuinely concurrent-compatible.** A review agent (or the
  human) can review each ticket's branch as it's opened, independent of what
  stage the *other* implementation agents are at.
- **Implementation agents** each own one claimed vertical slice, working
  test-first inside their own worktree per `implement`'s normal rules — nothing
  about being parallel changes the code-quality bar, the local-DB-only test
  rule, or scope discipline.

## 5. Merge order — trial-merge in its own worktree too

Merge in the **same wave-dependency order `backlog-leveling` already tracked**
(don't merge a Wave-2 ticket's branch before its Wave-1 dependency is in). Per
ticket: `code-review` passes → rebase onto the current base branch → merge (one
PR per ticket, per `git-workflow`'s existing convention — nothing new here,
multiple agents just means multiple PRs landing in dependency order instead of
one). If two merged branches conflict despite the file-overlap check in step 2,
that's a real signal the tickets weren't actually independent — fix it now,
and tighten the check next time rather than treating it as normal friction.

**If you trial-merge branches to verify they combine cleanly before opening
real PRs, do that in its own worktree too — never in the repo's main
checkout.** The main checkout is exactly the working directory a human (or
another concurrent agent session) is most likely to be actively using; checking
out a temporary integration branch there races with anything else touching that
same directory — a `git checkout` from another live session can silently move
you off the branch you think you're on mid-trial. A dedicated worktree for the
trial-merge has no such risk, same as any other worktree in this protocol.

## Exit gate

`check-parallel-safety.mjs` ran and its plan was **confirmed with the user
before any agent was spawned**; every ticket assigned to a parallel agent
passed the file-overlap check; each was claimed before starting and released
on merge; each agent worked inside its own worktree, never a shared working
tree — including any trial-merge/verify step; merges landed in wave-dependency
order through the normal per-ticket review/PR flow. If a runtime without real
concurrent-agent support was used, say so plainly rather than implying
automation that didn't happen.
