---
name: stakeholder-brief
description: >-
  Translate the current work into plain language for non-technical people — a
  brief, a demo script, and a sign-off request — and capture their decisions back
  into the specs. Use when a non-developer (founder, PM, client, ops) needs to
  understand, approve, or demo the work, or when the user says "explain this for
  non-tech / write an update / get sign-off / prep a demo".
---

# stakeholder-brief — make the work legible to non-IT people

A big promise of this pipeline is that non-developers can steer and approve real
software work. This skill is how: it turns the technical trail into something a
founder, client, or ops lead can read in two minutes, act on, and sign off — and
it feeds their answers back into the specs so nothing gets lost in translation.

Works in both directions: **out** (explain/ask) and **in** (capture decisions).

## The brief (write to `docs/sdd/STAKEHOLDER-BRIEF.md`)

Keep it short and jargon-free. Use the plain-language summaries already at the top
of each SDD doc — don't make anyone read a DFD.

1. **What we're building & why** — one short paragraph, in outcomes, not tech.
2. **Where it stands** — a simple traffic-light of the gate board (done /
   in progress / blocked), in words a non-engineer gets. Translate 🟢/🟡/⛔.
3. **What we need from you** — the specific decisions or approvals outstanding,
   each phrased as a plain question with options and a recommendation. (Reuse
   `to-questionnaire` if installed for anything needing async input.)
4. **What's out of scope / deferred** — so expectations are set (e.g. the "Won't"
   requirements).
5. **Risks & trade-offs** — in consequences, not mechanisms ("sharing links could
   be guessed → we made them unguessable and revocable").
6. **Cost/effort shape** — if useful, the backlog's tier split as "how much work"
   (small/medium/large counts), not story points.

## The demo script (optional, on request)

When there's something to show, produce a step-by-step walkthrough a non-technical
person can follow or narrate: the scenario, what to click/do, what they should
see, tied to the user journeys (sequence diagrams). No setup jargon.

## Capture decisions back (the important half)

A brief that only informs is half a loop. When the stakeholder answers:

- Record each decision where it belongs — a REQ priority change in the PRD, a
  scope cut as a "Won't", an architecture preference as an ADR note, an accepted
  risk in the threat model (with them as the named owner).
- Update the **gate board** and **traceability** so the decision is now the SSOT,
  not buried in a chat.
- If a decision reverses something already built, flag it and loop back to the
  owning phase — don't quietly diverge.

## Tone

Warm, concrete, honest. Never hide a blocker or oversell progress to look good —
non-technical trust is easy to lose and central to this whole approach. Explain
uncertainty plainly rather than papering over it.

## Exit
The stakeholder can understand the state and answer what's asked; their responses
are written back into the specs (not just the brief); the gate board reflects any
approvals given.
