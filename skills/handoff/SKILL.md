---
name: handoff
description: >-
  Compact the current state of the work into a self-contained handoff document so
  another agent, another session, or a cheaper model can pick up exactly where you
  left off. Use when a run is getting long, when switching models/tools, when the
  user says "handoff / summarize progress / continue this later", or at the end of
  a work session.
---

# handoff — make the work resumable by anyone (or any model)

The test of a handoff: a fresh agent — possibly a cheaper/smaller model, in a
different tool (opencode, Claude Code, …) — can read only this document plus the
repo and continue correctly, without your conversation history.

Write it to `docs/sdd/HANDOFF.md` (overwrite the previous one; it's a snapshot,
not a log).

## What it must contain

1. **Goal** — what we're building, in one or two sentences (plain language).
2. **Mode** — autopilot/copilot, full/lite.
3. **Where we are** — the current phase and the **gate board** state (copy the
   status column from `00-overview.md`). What's ✅, what's 🟨, what's ⛔ and why.
4. **What's done** — the artifacts that exist and are trustworthy
   (`docs/sdd/*`, code, tests), with one line each.
5. **What's next** — the immediate next action(s), concretely: which ticket, which
   phase, which gate to clear. Order them.
6. **Key decisions & assumptions** — the ADRs and any assumptions made (especially
   autopilot defaults chosen on the user's behalf), so the next agent doesn't
   silently reverse them. Point to `04-architecture.md` and the ID registry.
7. **Open questions / blockers** — anything needing a human, and anything
   uncertain. Be explicit about what you're unsure of.
8. **How to run/verify** — the exact commands (test, coverage gate, start), so the
   next agent can confirm the baseline before changing anything.
9. **Pointers** — links to the overview, traceability matrix, and the specific
   docs relevant to the next step.

## Rules

- **Self-contained.** No "as we discussed" — the next reader has no history.
- **Honest.** Carry over the real state, including 🟡/⛔ rows and failing or
  missing tests. A handoff that oversells the state sabotages the next agent.
- **Point, don't duplicate.** Reference the SSOT docs (traceability, overview)
  rather than restating them; keep the handoff short enough to be read in full.
- **Write for a cheaper model.** Short sentences, explicit steps, no cleverness —
  optimize for a small model or a junior picking it up cold.

## Exit
`docs/sdd/HANDOFF.md` exists and passes the test above: someone with only the repo
could take the named next action correctly. Tell the user it's ready and where it is.
