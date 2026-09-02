# Multi-Agent Orchestration

How to split SDD Pipeline work across multiple agents for speed and quality.

## Cost-Benefit Gate — Check This Before Spawning Anything

Spawning agents has real cost: spin-up overhead, duplicated context across agents, and merge overhead when results come back. For small tasks this cost exceeds the benefit. **Don't parallelize by default — gate on task size first.**

| Task size | Parallelize THINK? | Parallelize BUILD (by component)? | Parallelize PROVE? |
|-----------|--------------------|-----------------------------------|---------------------|
| micro | No — single agent, skip THINK almost entirely anyway | No | No — skip most of PROVE too |
| small | No — THINK is already light; parallelizing 2-3 quick lookups costs more than it saves | No — single component, nothing to split | Optional — only if PROVE layers are all running anyway (verification+lint are usually near-free to run together) |
| medium | Yes, if 3+ independent THINK skills apply | Only if there are genuinely independent components (rare at this size) | Yes — 4 layers, real parallel benefit |
| large | Yes | Yes, per independently-workable component (see `skills/build/ticket-decomposition/`) | Yes |

**Rule of thumb**: if the "work" a sub-agent would do is smaller than the cost of spinning it up and passing it context, run it inline instead. Parallel dispatch is a tool for tasks big enough to absorb the overhead — not a default posture.

**Hard cap: 6 parallel agents.** If a dispatch plan would spawn more than 6 agents at once, STOP and do not spawn. Two reasons, and both must be told to the user:

1. **Decomposition smell** — needing >6 parallel agents usually means the ticket decomposition was too fine-grained. Re-consolidate first.
2. **Review capacity** (research-backed, see `skills/prove/judgment/`) — agents generate output far faster than a human can judge it. More parallel agents than the user can review = comprehension debt, not speed.

The cap is overridable — if the user explicitly says "spawn them all anyway", explain the risk (unreviewable output volume, platform session limits may also cut it off) and proceed if they accept. Log the override. Never silently exceed the cap, and never refuse outright when the user insists.

**Parallel implementation tickets on one repo** (several agents writing code concurrently) have their own protocol on top of this gate — worktree isolation, the `check-parallel-safety.mjs` file-overlap check, ticket claiming, and merge order: `skills/agents/parallel-work/`. Always confirm its plan with the user before spawning, every mode.

## Parallelization Rules

```
THINK (parallel)          BUILD (depends on THINK)      PROVE (depends on BUILD)
├─ elicitation    ─┐      ├─ constraint check           ├─ verification    ─┐
├─ context-loader  ├─→    ├─ change-plan                ├─ adversarial      ├─→ REPORT
├─ scope-guard    ─┘      ├─ implementation              ├─ diagnose  ─┘
├─ complexity     ─┘      │   ├─ component A (parallel)  ├─ performance    ─┘
                          │   ├─ component B (parallel)
                          │   └─ component C (parallel)
                          └─ anti-pattern check
```

**Sequential dependencies**:
- BUILD waits for THINK to complete (needs context + scope + requirements).
- PROVE waits for BUILD to complete (needs code to verify).

**Parallel within phases**:
- All THINK skills are independent — run simultaneously.
- BUILD implementation can be split by file/component if they're independent.
- All PROVE layers are independent — run simultaneously.

## Multi-Agent Dispatch Pattern

```
Main Agent (orchestrator):
  1. Assess task → determine mode, size, domain
  2. Spawn THINK agents in parallel
  3. Merge THINK results
  4. Create change plan from merged results
  5. Spawn BUILD agents (one per independent component)
  6. Merge BUILD results
  7. Spawn PROVE agents in parallel (one per verification layer)
  8. Merge PROVE results
  9. Generate: report + comprehension + decision log
```

## Context Sharing Between Agents

Each sub-agent receives ONLY what it needs:

| Agent Type | Receives |
|------------|----------|
| THINK agent | Task description + project file listing |
| BUILD agent | Task + THINK output + scope assignment + constraint rules |
| PROVE agent | Task + THINK spec + BUILD code output |

Keep context minimal. Don't pass entire codebase to every agent.

## Conflict Resolution

"Assign an owner and have the other agent pass along requirements" is not a full mechanism on its own — it doesn't say what the owner does with conflicting requirements, or what happens when they arrive at different times relative to the owner's own edits. Use this protocol instead:

### Step 1 — Detect overlap before spawning, not after

`skills/build/change-plan/` already declares which files each component/ticket touches before BUILD starts. Compute the overlap up front: any file appearing in more than one agent's declared scope is a **shared file**. Everything else is exclusive — those agents just write directly, no coordination needed.

### Step 2 — Exclusive files: no coordination

Agents write their exclusive files freely and in parallel. This is the common case (vertical-slice tickets from `skills/build/ticket-decomposition/` are specifically designed to minimize shared files) and needs nothing beyond normal parallel dispatch.

### Step 3 — Shared files: patch-request, not direct write

For each shared file, agents do **not** write to it directly. Instead, each agent that needs a change to that file produces a **patch request**: a structured description of the change it needs (what to add/modify, and why), not a full rewritten file. This avoids agents overwriting each other's in-flight edits, since none of them ever touches the shared file themselves.

### Step 4 — Serialize application in dependency order

One actor (the orchestrator, or a designated owner agent) applies patch requests to each shared file **one at a time**, re-reading the file's current state immediately before each application — never applying against a stale copy. Order is determined by the same blocking-edge information `ticket-decomposition` already computes: if ticket A blocks ticket B, A's patch request to a shared file applies first.

If there's no dependency ordering between the agents involved (fully parallel, no blocking edge), order by declaration sequence and apply first-come — but always re-read before applying, not just first-come at request time.

### Step 5 — Re-verify the merged result

After all patch requests are applied to a shared file, run `skills/build/anti-patterns/` and `skills/build/constraints/` against that file again. Individually-reasonable patches can combine into a problem no single agent could see — e.g. two agents both registering a route under the same path. Catch this at the merge point, not later in PROVE.

### Step 6 — Escalate irreconcilable conflicts, never silently pick one

If two patch requests to the same file genuinely conflict (not just adjacent changes, but contradictory ones — e.g. different agents expect the same exported function to return different shapes), do not silently choose one. Surface it: state both requests, what each depends on it for, and ask which should win. This mirrors the ADR-conflict handling rule in `skills/think/arch-analyzer/` — tension gets surfaced, never silently resolved by whichever agent happened to run first.

## Agent Tool Usage

**Claude Code**: use the `Agent` tool with scoped prompts for each sub-agent.

**Codex**: Codex CLI supports real subagent spawning — define agent roles (model, instructions, sandbox mode, MCP servers per role) in `config.toml`, then either let Codex decide when to spawn automatically or request it explicitly ("spawn one agent for security risks, one for test gaps, one for maintainability"). Codex handles spawn, wait, and result consolidation itself. For batch-style parallel work across many similar items, `spawn_agents_on_csv` fans out one agent per row. Map SDD Pipeline's phase split onto this: define a `think`, `build`, and `prove` agent role in `config.toml` (or reuse per-skill roles — e.g. a `diagnose` role, an `arch-analyzer` role) with instructions pointing at the matching `skills/*/SKILL.md` file, then request the spawn explicitly at each phase boundary rather than relying on Codex to infer SDD Pipeline's specific pipeline structure on its own.

**OpenCode**: see `subagent-patterns/SKILL.md` for sequential simulation.

**Cursor**: single-agent only. Run phases sequentially.
