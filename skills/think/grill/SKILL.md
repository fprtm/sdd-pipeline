# SDD Grill

Interview the user relentlessly until a shared understanding is reached — BEFORE any spec is written or code is touched. This is where architecture, scope, and direction decisions get challenged, not rubber-stamped after the fact.

## Why This Exists

Most bad AI-agent outcomes trace back to a decision made casually in conversation ("let's use microservices", "we'll need real-time sync") that never got interrogated before it became a plan. By the time the orchestrator writes the spec and the ticket breakdown, the direction is often already locked. Grill runs *before* that lock-in, at the moment the decision is still soft.

## Trigger

**Manual**: user says "grill this", "brainstorm [topic]", "help me think through [architecture/approach]", or similar.

**Auto-suggest**: orchestrator detects a consequential decision being made casually — before a build/execute command — that matches:
- Architecture choice (pattern, framework, service split) stated without analysis
- Scope that sounds large/irreversible ("rewrite the whole...", "migrate to...")
- A choice arch-analyzer or complexity-analyzer would flag as risky if it were already in a plan

Before offering, check `docs/sdd/config.md` for a `grill:` block with `auto-suggest: false` — if set, skip the offer entirely for this project (manual invocation via "grill this" etc. still always works regardless of this setting; only the unprompted offer is what the config turns off). No `grill:` block, or `auto-suggest: true`, means the default behavior below applies.

When auto-suggest is active and a trigger is detected, SDD Pipeline asks once: *"This sounds like an architecture-level decision. Want to grill it first before we build?"* — user can decline, and SDD Pipeline proceeds straight to the SPEC step without complaint.

**Never auto-runs.** Grilling always requires explicit user engagement — it's an interview, not a silent gate.

## The Mechanic: Design Tree, Frontier, Rounds

Map the decision as a **design tree**: every choice branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every question whose prerequisites are already settled — askable *now* without guessing at unheard answers. Ask the whole frontier in one round, numbered, each with a recommendation:

```
❓ **Q1** - **<question title>**: <question body>

➡️ <SDD Pipeline's recommended answer>
```

**How this reaches the user**: per `skills/think/elicitation/`'s "How to Ask" rule — native structured question tool first (e.g. `AskUserQuestion` in Claude Code), plain text fallback otherwise. Map each frontier question to one tool question, with the recommendation as the first option. If the tool caps how many questions fit in one call and the frontier has more than that, split the round across consecutive tool calls rather than dropping to plain text for the overflow — it's still one round (all frontier questions asked before any answer is acted on), just spread across calls.

Each round's answers reshape the tree — settled decisions unblock the next frontier. Recompute and ask again. Session ends when the frontier is empty: every branch visited, nothing silently assumed.

**A question whose answer depends on another still-open question belongs to a LATER round** — never ask it prematurely.

## Where Recommendations Come From — This Is What Makes It "SDD Pipeline" Grill

Generic grilling gives recommendations from general reasoning. SDD Grill routes each question type through SDD Pipeline's own judgment engines:

| Question Type | Recommendation Source |
|---------------|----------------------|
| Architecture pattern choice | `skills/think/arch-analyzer/` — decision matrix, deletion test, adapter-count rule |
| Scope / blast radius | `skills/think/scope-guard/` — blast radius table by task type |
| Hidden complexity | `skills/think/complexity-analyzer/` — hidden complexity pattern table |
| Security implications | `skills/constraints/[domain]/` — domain security checklist |
| Technology/dependency choice | `skills/build/constraints/` — dependency limit, YAGNI rule |
| SDLC/process fit | `skills/think/sdlc-detector/` — methodology-specific guidance |

This means the `➡️` recommendation isn't "what sounds reasonable" — it's "what SDD Pipeline's own rule for this exact category says," so the recommendation stays consistent whether it comes from Grill, the spec, or a later constraint check.

## Be Critical — Grilling Is Not Polite Questioning

A grill session that only asks clarifying questions is an intake form, not a grill. The stance is adversarial-but-constructive:

1. **Challenge the premise before refining it.** Before asking "how should we build X", ask whether X is the right thing at all: "You said microservices — what problem do you have that a monolith can't solve? Name it." If the user can't name it, that IS the finding.
2. **Every stated requirement gets one "why" or one counter-example.** Not endlessly — once per requirement. "You want real-time sync. What breaks if it's 5 seconds stale?" A requirement that survives one honest counter-question is much more trustworthy than one that was never poked.
3. **Attack the recommendation too — including your own.** After giving a `➡️` recommendation, name the strongest argument *against* it in one line. If you can't produce a real counter-argument, you haven't thought about it enough to recommend it.
4. **"I don't know" from the user is data, not a dead end.** It marks a branch the user hasn't thought through — that branch gets a deeper round, not a default answer quietly filled in.

## Three Subjects, Three Frontiers

The mechanic above is the same in every case, but what seeds the tree differs:

- **A single decision** ("should we use microservices", "is this scope right") — the tree is that decision and whatever hangs off it. This is the mid-session case, when the orchestrator spots something consequential being stated casually.
- **A whole product or feature** — the tree is seeded by the **five-seat agenda** in `skills/commands/discover/SKILL.md`: Why → Constraints → What → Data → Technical, in that dependency order. Each seat is a cluster of the tree, and its questions enter the frontier as its prerequisites settle. A seat is skipped only when the product has no such surface (no screens → no UI questions), never because of mode, size, or urgency.
- **A technical domain being shaped** — the tree is seeded by the **deliberation agenda** in the relevant think/ skill (`think/arch-analyzer`, `think/database-design`, `think/ux-design`), and the subject is HOW a domain's design decisions are made before a document is written. This is the SPEC-step case: discover already settled WHICH (which entities, which stack, which approach), and now the details need deliberation. The frontier is seeded by agenda topics (entity relationships, code patterns, interaction design, etc.) rather than by the five seats. A topic is skipped only when the product has no such surface, never because of mode — mode controls depth (one round vs full rounds), not whether the topic is raised.
  
  **Depth enforcement**: each deliberation agenda topic in the think/ skills has a **depth requirement** — the minimum granularity before the topic counts as settled. The agent's natural tendency is to label a topic ("we'll use 3NF", "cascade on delete") and move on. That's not settled — it's named. A topic is settled when the user has seen and confirmed the concrete detail (every table's columns, every FK's cascade, every endpoint's contract, every screen's interactions). If a topic was answered at headline level, it stays in the frontier.

How to tell which you're in:
- One decision on the table → single decision.
- A thing being defined from fog → whole product (five seats).
- A document about to be written by spec → technical domain deliberation (agenda topics).

## Council — Devil's Advocate for Consequential Decisions

For decisions that pass the rule-of-three bar (hard to reverse + surprising + real trade-off), a single line of questioning isn't enough. Before closing the session, run a **council pass**: examine the near-final decision from these fixed seats, each producing its sharpest objection (one or two lines, not essays):

| Seat | Asks |
|------|------|
| **Devil's advocate** | "What is the strongest case that this whole decision is wrong?" — argued sincerely, not as a formality. **Never stop at the objection**: when the case lands, follow it with 2-3 concrete alternatives (not vague "reconsider this") — each with its own tradeoff, plus which one you'd actually recommend and why. The user may not have the domain depth to invent the alternative themselves; refusing something without offering a way forward just stalls the session. A devil's advocate that only refutes is a critic; this seat is also the advisor. |
| **Maintainer, 1 year later** | "What will whoever inherits this curse us for?" |
| **Security** | "What's the attack surface this creates?" |
| **The bill** | "What does this cost in ongoing complexity/infra/time — and is the problem worth that price?" |
| **The user of the product** | "Does this actually make the end product better, or is it engineering self-indulgence?" |

Present the objections, let the user respond, then close. If multi-agent dispatch is available and the decision is big enough (see cost-benefit gate in `skills/agents/orchestration/`), the seats can run as parallel sub-agents — each seat gets genuinely independent reasoning instead of one mind role-playing five voices. Single-agent: run them sequentially, honestly.

An objection that lands doesn't kill the decision — it either reshapes it or gets an explicit, logged acceptance ("we accept the maintenance cost because X"). Objections that get no answer at all mean the frontier isn't actually empty.

### The Second Pass: Council Over the Whole Picture

When the subject was a whole product or feature (the seat agenda above), run **one more council pass at the end, over everything settled together** — not per decision.

Per-decision councils are blind to how decisions *interact*. Each choice can be individually defensible while the combination is a v1 twice the size anyone intended: "ship both flows" + "solo builder" + "no scheduling backend" each survive their own council and collectively describe a build nobody sized. Only a pass that sees them at once catches that.

The question this pass asks: **given everything above, is this shape actually buildable by whoever is building it, within the time and budget from the Constraints seat?** Same five seats, one subject — the assembled picture. An objection here either reshapes scope or gets an explicit, logged acceptance.

## Facts vs Decisions

Finding *facts* is SDD Pipeline's job — never ask the user for something that can be looked up. Both kinds:

- **Internal facts** (what's in the codebase, what pattern is already in use, how many adapters currently exist, git history) — dispatch a sub-agent to scan the repo.
- **External facts** (does a library for this exist, what can framework X actually do in its current version, how do existing products solve this, what do the official docs say) — research them: web search, or a docs tool like context7 when available. A grill round that asks the user "is there a library for this?" is asking the user to do the agent's research.

Facts don't block the rest of the round; only questions genuinely downstream of that lookup wait. Findings come back *into* the round — cited, so a recommendation grounded in research is distinguishable from one grounded in memory.

The *decisions* are always the user's. Put each to them, wait for the answer.

## Judgment Heuristics Available During Grilling

Borrow these directly when the frontier touches architecture:

- **Deletion test**: "If we deleted this module, does the complexity vanish (it was a pass-through) or reappear elsewhere (it was earning its keep)?"
- **1 adapter = hypothetical, 2 adapters = real**: Don't recommend a port/abstraction unless something actually varies across two real implementations today.
- **Git-history-weighted scoping**: If the user hasn't named a direction, check `git log --oneline` for hot spots — recently-churned files are where the highest-value decisions usually live.

## Output — What Happens When the Frontier Is Empty

1. **Glossary update**: any new domain term that surfaced gets written to `docs/sdd/glossary.md` (see `skills/meta/glossary/`) — live, not batched.
2. **Decision gate**: run each crystallized decision through the rule-of-three test (see `skills/meta/decision-log/`). Only decisions that are hard-to-reverse, surprising, and the result of a real trade-off get an ADR file.
3. **Hand-off to spec, not straight to plan**: if the user follows up with "build this" / "let's do it", the next step is `/sdd-pipeline:spec` (or the orchestrator's own SPEC step, if grilling happened mid-session rather than via the standalone command) — turning the shared understanding into the FSD/SDS/PRD/tickets the task's size actually calls for, per `skills/build/doc-generator/`'s own task-type table. Do not write specs or tickets directly and do not jump to suggesting `/sdd-pipeline:implement` — that skips the fixed sequence's SPEC step (see orchestrator's "The Fixed Sequence — Ask Before Execute, Always": ASK → SPEC → PLAN → BUILD → CHECK; grilling is ASK, not a shortcut past SPEC). THINK-phase questions already settled in the grill are NOT re-asked by elicitation or spec's own confirmation steps.
4. **No forced artifact**: if the user just wanted to think out loud and walks away, nothing is created beyond glossary/ADR entries that already passed their gates. Grilling that doesn't end in "build" still isn't wasted — the ADRs and glossary persist for next time.

## Rules

1. Do not act on the design until the user confirms shared understanding is reached — grilling is discussion, not a green light to start coding.
2. Never ask the user something SDD Pipeline (or a sub-agent) can look up.
3. Batch the whole frontier per round — don't drip questions one at a time, don't dump everything ignoring dependency order.
4. If the user wants to stop early ("enough, just build it with X"), stop immediately and treat their answer as the frontier's final state — don't insist on finishing every branch.
5. Grilling never writes specs, tickets, or a `changes/` file. It writes glossary/ADR entries only. Those belong to the SPEC step, triggered by an explicit build signal.

## Mode Interaction

| Mode | Grill Behavior |
|------|----------------|
| **prototype** | Auto-suggest disabled. Manual invoke still works if user asks. |
| **vibe** | Auto-suggest disabled (would break invisibility). Manual invoke works. |
| **standard** | Auto-suggest enabled for architecture/large-scope decisions. |
| **strict** | Auto-suggest enabled and stronger — architecture decisions without a grill session get flagged in the plan approval step. |
| **emergency** | Disabled entirely. No time for interviews during an outage. |
