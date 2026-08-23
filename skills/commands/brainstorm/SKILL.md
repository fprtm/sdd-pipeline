---
name: brainstorm
description: Mature a vague idea through open conversation and research — no plan, no spec, no pressure toward execution. For when the idea is still foggy and needs shaping before it's worth discovering/designing.
disable-model-invocation: true
---

# /sdd-pipeline:brainstorm

The pre-everything command. For "gua ada ide tapi masih kabur" — the idea isn't sharp enough to interrogate decisions about it (`/sdd-pipeline:discover`), let alone design or build it. This is where it ripens.

## What This Is (and Isn't)

**Is**: open conversation, honest sparring partner, research on demand. Explore the idea from angles the user hasn't considered, find out what already exists, poke at assumptions gently, suggest adjacent possibilities.

**Isn't**: an intake funnel. No frontier/rounds mechanic, no plan file, no spec, no DoD, no doc generation, no pipeline. The SDD Pipeline execution machinery stays completely OFF. Nothing about this session pressures the user toward building anything.

## Behavior

1. **Converse, don't interrogate.** Questions here are curious, not gating — "what sparked this idea?", "who'd actually use it?", "what's the closest existing thing and why isn't it enough?" One or two at a time, woven into discussion. This is explicitly NOT grill mode — no batched question rounds, no recommendations-per-question format.
2. **Research on demand.** When the conversation needs facts — does a library for this exist, how do competitors do it, is this technically feasible — dispatch a research lookup (web search, codebase scan) and bring the findings back into the conversation. The user should never have to leave the session to go check something.
3. **Contribute, don't just reflect.** Offer genuine takes: "this part is the interesting bit", "this half already exists as X, the novel part is Y", "the hard part will be Z". A brainstorm partner with no opinions is a mirror, not a partner.
4. **Devil's advocate on demand — never uninvited.** When the user explicitly asks for pushback ("serang ide ini", "apa kelemahannya", "roast this", "main devil's advocate"), run a light adversarial pass: borrow the council seats from `skills/think/grill/` (devil's advocate, maintainer-a-year-later, security, cost, end-user) **conversationally** — sharpest objection per seat, one or two lines each, no frontier/rounds machinery, no verdict. Then return to open conversation. Unprompted, this stays OFF: attacking a half-formed idea kills it before it has a shape worth attacking — the full council runs at `/sdd-pipeline:discover`, when there's an actual decision to stress-test.
5. **Let it end wherever it ends.** A brainstorm that concludes "this idea isn't worth it" or just trails off is a *successful* session. Never steer toward "so, ready to build?"

## Output — Optional, Only on Request

If (and only if) the user wants to keep the result, write a short idea brief to `docs/sdd/design/{NNN}-{slug}-idea.md`:

```markdown
# Idea: [name]

**Status**: RIPENING | READY FOR DISCOVERY | PARKED

## The idea in two sentences
## What makes it interesting
## What already exists / prior art found
## Open questions (the fog that remains)
## Hard parts spotted early
```

Unprompted, produce nothing — the conversation itself was the output.

## Hand-off

When the idea firms up and the user signals they want to get serious ("oke gua mau seriusin ini"), offer — don't auto-start — the next step: `/sdd-pipeline:discover` to interrogate the real decisions, which flows into spec → implement → check. The idea brief (if written) feeds discover so nothing discussed gets re-asked.

## Position in the Command Flow

```
/sdd-pipeline:brainstorm   idea is fog → shape it          (this command)
/sdd-pipeline:discover     decisions forming → interrogate them
/sdd-pipeline:spec         solution shaping → architecture + specs (+ auto ticket split if large)
/sdd-pipeline:implement    build under guardrails
/sdd-pipeline:check        verify the change / audit the codebase + impact summary
```
