# Design It Twice — Generating Genuinely Different Candidates

Companion reference for `skills/think/arch-analyzer/SKILL.md`. Read this when the main skill's "When to Use This" trigger below is met — not part of the default architecture flow.

The decision matrices and heuristics in the main skill (deletion test, adapter-count rule, git-history-weighted scoping) produce **one well-reasoned recommendation with alternatives noted**. That's sufficient for most decisions. But for a genuinely high-stakes, ambiguous architecture call — the kind where getting it wrong is expensive to reverse — a single reasoning pass has a blind spot problem: one line of reasoning tends to converge on one answer, even when it lists "alternatives considered."

When multi-agent dispatch is available and the decision warrants it (see trigger below), generate real diversity instead of one agent's first idea plus a few dismissed alternatives.

## When to Use This

Only when **both** are true:
- The decision is architecture-level, hard to reverse, and the cost of being wrong is high (matches the same bar as the rule-of-three decision gate in `skills/meta/decision-log/`)
- Multi-agent dispatch is available (see `skills/agents/orchestration/` — and check the cost-benefit gate there; this is inherently a `medium`+ size decision, never spawn this for a small task)

For everything else, the standard single-pass analysis in `SKILL.md` is enough. This is not the default architecture flow — it's reserved for decisions worth the extra dispatch cost.

## The Mechanic

Spawn 3-4 agents, each given the **same problem** but a **different explicit constraint**:

| Agent | Constraint |
|-------|-----------|
| A | Minimize the public interface — smallest possible surface area, even if it costs implementation flexibility |
| B | Maximize flexibility for likely future requirements — optimize for change, even if the interface is larger |
| C | Optimize for the most common caller — shape the design around the dominant use case, treat edge cases as secondary |
| D (optional) | Ports & adapters — assume a second real implementation will exist; design the seam now |

Each agent produces, independently and without seeing the others' work:
- The proposed interface/structure
- A usage example
- What's hidden behind the interface vs. what's exposed
- Dependency strategy (what it depends on, what depends on it)
- Explicit tradeoffs — what this constraint sacrifices to win on its own axis

## Comparing Results

Once all candidates are in, compare them on:
- **Depth** — interface size vs. implementation complexity (favor deep: small interface, real leverage)
- **Locality** — does related complexity stay in one place, or does the design scatter it?
- **Seam placement** — apply the 1-adapter-hypothetical/2-adapter-real rule to any port/adapter split a candidate proposes

**Give an opinionated recommendation, not a menu.** The point of generating diversity was to see real tradeoffs clearly — don't hand the user four options and ask them to pick blind. State which candidate wins and why, using the depth/locality/seam criteria above. Propose a hybrid only if two candidates each solve a problem the other doesn't, and combining them doesn't reintroduce the flaw either one avoided alone.

## Output

Feeds into the visual report (see `SKILL.md`) when there are enough distinct candidates to warrant one, or directly into `/sdd-pipeline:discover` (`skills/think/grill/`) for a frontier/round session to work through the chosen candidate's remaining open questions.
