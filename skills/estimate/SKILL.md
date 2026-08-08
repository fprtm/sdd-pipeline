---
name: estimate
description: >-
  Turn the tiered backlog into an effort/cost estimate a non-technical person can
  read — how much work, roughly how long, and what it costs if cheaper models /
  juniors do the easy tickets. Use after backlog-leveling, or when the user asks
  "how long / how much / effort / estimate / can a cheap model do most of this?".
  Produces docs/sdd/ESTIMATE.md. Ranges with assumptions, never false precision.
---

# estimate — backlog → effort & cost, honestly

The backlog is already tiered (T1/T2/T3), so an estimate is a transparent
derivation from it — not a guess pulled from the air. The goal is a number a
founder or PM can act on, with the assumptions shown so it can be trusted and
redone when things change.

Output: `docs/sdd/ESTIMATE.md`. The backlog (`06-backlog.md`) is the SSOT; this
derives from it — if the backlog changes, re-run.

## Method

1. **Count by tier** from the backlog: how many T1 / T2 / T3 tickets.
2. **Apply a per-tier size** (a default band — state it, let the user override):
   - **T1 (trivial):** ~0.5–1 unit each
   - **T2 (standard):** ~1–3 units each
   - **T3 (complex/risky):** ~3–8 units each
   A "unit" ≈ a focused half-day of a competent developer. Keep it a **range**.
3. **Add non-ticket overhead** — review, integration, infra/CI setup, testing,
   fixing what review finds. A common, honest add is ~25–40% on top of raw ticket
   effort. State the % you used.
4. **Calendar vs. effort:** effort is total work; calendar time is shorter when
   the backlog's parallel **waves** let tickets run at once (and when subagents /
   more people are available). Show both, and note the parallelism assumed.

## Cost view (executor tiers)

Map tiers to who/what runs them (from `backlog-leveling`):
- **T1 → cheap/small model or junior** (low cost),
- **T2 → mid model or mid dev**,
- **T3 → strong model or senior** (high cost, don't skimp — these are risky).

Report a simple cost shape: "most of the volume is T1/T2 that a cheaper executor
can do; the T3s need a senior/strong model — that's where the cost concentrates."
If the user gives rates (per hour, or per-model token cost), compute a rough
figure; otherwise keep it relative (low/medium/high).

## Output (`docs/sdd/ESTIMATE.md`)

- **Plain-language headline:** e.g. "~3–5 developer-weeks of effort; ~2–3 weeks
  calendar with 2 people; most work is routine, ~4 tickets need a senior."
- **Breakdown table:** tier → count → size band → subtotal (low–high).
- **Overhead** applied (with %). **Effort range** and **calendar range**.
- **Cost shape** by executor tier.
- **Assumptions** (sizing bands, overhead %, parallelism, team) — listed plainly.
- **Confidence & what would change it** (unknowns, T3 risk, unresolved decisions).

## Rules

- **Ranges, not single numbers.** A single number is a false promise.
- **Show the math** so anyone can challenge an assumption, not the total.
- **Estimates are not commitments.** Say so. Re-estimate when the backlog, scope,
  or team changes.
- Record any estimating assumption the user confirms in the `decision-log`.

## Exit
`docs/sdd/ESTIMATE.md` exists: derived from the backlog, ranges with shown
assumptions, effort + calendar + cost shape, readable by a non-technical reader.
