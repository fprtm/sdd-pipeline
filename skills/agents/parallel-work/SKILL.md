# Parallel Work — Several Agents, One Repo, No Forking

Contracts are locked (FSD/schema/API); the tickets are independent; you want them built at the same time instead of in sequence. This is the protocol: worktree isolation, vertical-slice assignment, a cheap claim so nobody duplicates work, and a merge order. **Implementation-phase only** — not a design tool. It complements (never replaces) `skills/agents/orchestration/`'s cost-benefit gate and hard cap of 6.

Works on any agent runtime (the protocol is manual steps). On **Claude Code**, the `Agent` tool executes it directly — spawn each worker with `isolation: "worktree"`, several `run_in_background: true` in one turn. On a runtime without real concurrent agents (e.g. OpenCode's sequential child sessions), the human opens one terminal per worktree and runs the steps manually — don't claim automated parallelism a runtime doesn't have.

## 1. Isolation — git worktree, Not a Second Clone

A second clone shares no state with the first — two clones can drift. A **worktree** shares the same `.git` (one object database, one history) but gives each agent its own working directory on its own branch — not a fork, just another checkout:

```bash
git worktree add ../myapp-ticket112 -b feat/ticket-112-llm-adapter
git worktree add ../myapp-ticket113 -b feat/ticket-113-resend-email
```

Each agent works entirely inside its own worktree; no two agents ever share a working tree. `git worktree remove <path>` once merged.

## 2. Pick Genuinely Independent Tickets — Run the Checker, Don't Eyeball It

Assign **one full vertical slice per agent** (route → service → domain → tests → docs for one operation), never one layer per agent — a layer split makes both agents' work interdependent on the other's in-progress shape, and neither side is independently mergeable.

**The checker is the actual test, not a guess:**

```bash
node skills/agents/parallel-work/check-parallel-safety.mjs docs/sdd/tickets
```

It parses the tickets (each ticket's `Files likely touched:` / `Dependencies:` / `Status:` / `Claimed by:` fields — see `skills/build/ticket-decomposition/`'s format), finds those eligible right now (not done, not claimed, dependencies met), and outputs **strict-safe clusters** (zero shared files) plus **near-safe pairs** (1–2 shared files — a human judgment call, neither silently included nor excluded). Use its output as the starting plan. Real grounding: two "independent-looking" adapter tickets both needed to edit the same module factory — a shared file is a merge collision waiting to happen even with perfectly separate business logic, and the checker surfaces it instead of hoping someone notices by reading two file lists side by side.

## 3. Always Confirm the Plan Before Spawning — Every Mode, No Exception

Spawning several background agents is a real commitment (time, tokens, a batch of real diffs to review). **Present the checker's plan (clusters, tickets, the near-safe calls) and get an explicit yes before spawning any agent — in every mode, autopilot or not.** Ask per `skills/think/elicitation/`'s "How to Ask" rule: native question tool first, plain text only as fallback. This is deliberately stricter than the usual batch-routine-decisions default: it's a go/no-go on committing real resources to several parallel threads at once, and it's also the review-capacity throttle (`skills/prove/judgment/`) doing its job before the diffs exist.

## 4. Claim Before Starting — Cheap, Prevents Silent Duplication

Before starting a ticket, the agent sets `**Claimed by:** <agent-id>, <worktree path>` in the ticket file. Check before claiming — already claimed means pick another ticket. Delete the line when the ticket's branch merges. Same discipline as reserving an ID range before parallel doc work: cheap insurance, not ceremony.

## 5. Roles — Who's Actually Concurrent

- **Test plan is upstream, not a peer** — completed *before* implementation tickets are assigned; parallel agents execute test-first against an already-locked plan.
- **Review is genuinely concurrent-compatible** — the ticket status flow is the coordination surface: an implementation agent flips its ticket to **🧪 testing/review** when the branch/PR opens, and a review agent (or the human) picks up 🧪 tickets independently of the other agents' 🔨 work. `node skills/agents/parallel-work/check-parallel-safety.mjs docs/sdd/tickets --board` shows the live kanban (⬜/🔨/🧪/⛔/✅ + who claimed what) — one glance answers "who's doing what" without opening every ticket file.
- **Implementation agents** each own one claimed vertical slice, test-first, inside their own worktree — parallelism changes nothing about the code-quality bar, the LOCAL-only test rule, or scope discipline.

## 6. Merge Order — Trial-Merge in Its Own Worktree Too

Merge in dependency-wave order (never a dependent ticket's branch before its dependency lands). Per ticket: review passes → rebase onto current base → merge (one PR per ticket, per `skills/build/git-workflow/`). If two merged branches conflict despite the overlap check, that's a signal the tickets weren't actually independent — fix now, tighten the file lists next time.

**Trial-merging branches to verify they combine cleanly happens in its own worktree too — never in the repo's main checkout.** The main checkout is exactly the directory a human or another live session is most likely using; a `git checkout` from another session can silently move you off the branch mid-trial. A dedicated worktree has no such race.

## Exit Gate

Checker ran and its plan was **confirmed with the user before any spawn**; every parallel ticket passed the overlap check; each was claimed before start and released on merge; each agent (including any trial-merge) worked in its own worktree; merges landed in dependency order through the normal per-ticket review/PR flow. On a runtime without real concurrency, that was said plainly.
