# Handoff — Make the Work Resumable by Anyone (or Any Model)

Compact the current state of the work into a self-contained document so another agent, another session, or a cheaper model picks up exactly where this one left off. Use when a run is getting long, when switching models/tools, when the user says "handoff / summarize progress / continue this later", or at the end of a work session.

Write to `docs/sdd/HANDOFF.md` — **overwrite the previous one; it's a snapshot, not a log.**

**The acceptance test**: a fresh agent — possibly a cheaper/smaller model, in a different tool — can read only this document plus the repo and continue correctly, **without your conversation history**. If it can't, the handoff failed.

## What It Must Contain

1. **Goal** — what we're building, one or two sentences, plain language.
2. **Mode & size** — the detected mode (standard/strict/…), task size, and any stop-point agreed with the user.
3. **Where we are** — current phase and gate state: what passed, what's in progress, what's blocked and why. Copy real state from the plan/change file, don't summarize from memory.
4. **What's done** — the artifacts that exist and are trustworthy (docs, code, tests), one line each.
5. **What's next** — the immediate next action(s), concretely: which ticket, which gate to clear. Ordered.
6. **Key decisions & assumptions** — the ADRs and any defaults chosen on the user's behalf, so the next agent doesn't silently reverse them. Point at `docs/sdd/decisions/` and the ID counters.
7. **Open questions / blockers** — anything needing a human; anything uncertain. Be explicit about what you're unsure of.
8. **How to run/verify** — exact commands (test, coverage gate, start) so the next agent confirms the baseline before changing anything.
9. **Pointers** — links to `index.md`, `traceability.md`, and the specific docs relevant to the next step.

## Rules

- **Self-contained.** No "as we discussed" — the next reader has no history.
- **Honest.** Carry the real state, including red rows and failing/missing tests. A handoff that oversells the state sabotages the next agent.
- **Point, don't duplicate.** Reference the SSOT docs rather than restating them; short enough to read in full.
- **Write for a cheaper model.** Short sentences, explicit steps, no cleverness.

## Exit

`docs/sdd/HANDOFF.md` exists and passes the acceptance test: someone with only the repo could take the named next action correctly. Tell the user it's ready and where it is.
