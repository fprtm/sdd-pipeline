# Worked example — Wishlist + Shareable Link

This is a **complete, real run** of the SDD Pipeline on one feature, kept in the
repo so you can see exactly what each phase produces before you run it on your
own work. Nothing here is filler — it's the output a senior team (PM, tech lead,
security, QA) would leave behind, spec-complete and ready to build.

The feature: logged-in shoppers save products to a wishlist, manage it, and
optionally share a **read-only link**. The share link is deliberately included
because it forces the security gate to do real work (IDOR, token guessing,
PII leakage, cache-after-revoke).

## Read it in order

| File | Phase | What to notice |
|------|-------|----------------|
| [00-overview.md](docs/sdd/00-overview.md) | 0 | the tech-lead **gate board** + **ID registry** (prevents ID collisions when work is fanned out to parallel agents) |
| [00-context.md](docs/sdd/00-context.md) | 2 | ubiquitous language — "wishlist ≠ cart", token vs. userId |
| [01-prd.md](docs/sdd/01-prd.md) | 1 | REQ-xxx with users, why, MoSCoW, Given/When/Then; a **Won't** item kept for scope discipline |
| [02-diagrams.md](docs/sdd/02-diagrams.md) | 2 | context, **DFD with trust boundaries** (feeds the threat model), sequences, ERD, state |
| [03-fsd.md](docs/sdd/03-fsd.md) | 3 | every behavior incl. **error/alternate flows**; every FSD traces to a REQ |
| [04-architecture.md](docs/sdd/04-architecture.md) | 4 | ADRs for style, stack, **FE + monorepo topology**; the **neutral-default** rule in action (user deferred → most robust choice, justified) |
| [05-threat-model.md](docs/sdd/05-threat-model.md) | 5 | STRIDE over the DFD; 2 Critical + 6 High controls, each mapped to a test |
| [06-backlog.md](docs/sdd/06-backlog.md) | 6 | 20 **tiered** tickets (T1/T2/T3), parallel **waves**, each self-contained |
| [07-test-plan.md](docs/sdd/07-test-plan.md) | 7 | happy / regression / edge / e2e / non-functional; **≥80% coverage gate** |
| [traceability.md](docs/sdd/traceability.md) | all | the matrix — and it's **honest**: every row is 🟡 "not built" because implementation hasn't happened, so the ship gate is correctly **closed** |

## Two things this example is meant to teach

1. **The pipeline catches its own drift.** While writing the FSD, the PRD's scope
   line still mentioned "reorder items" — a capability with no REQ and no
   acceptance criteria. Rather than smuggle it forward, it was cut and recorded
   (see the note in [01-prd.md](docs/sdd/01-prd.md) §3). That's the gate working.

2. **The matrix does not flatter the work.** Specs being done is not shipping
   being done. Until code exists and the planned tests pass at ≥80% coverage with
   every error flow and High/Critical control exercised, the rows stay 🟡 and the
   ship gate stays shut. See the bottom of
   [traceability.md](docs/sdd/traceability.md) for exactly what flips it green.

## Run it yourself

Point your agent at the pack and say:

> use `spec-driven-development` to build "\<your feature\>"

It asks two things: **interaction mode** — *autopilot* (agent runs the whole team
autonomously, collecting needs exhaustively up front and stopping only for
blockers or irreversible actions) or *copilot* (same rigor, but pauses at each
gate for you to review) — and **size**: *full* (new product/subsystem) or *lite*
(feature/bugfix, lighter gates that still apply). You can state them up front,
e.g. *"…autopilot, full"*.
