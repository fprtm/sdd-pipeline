# Orchestrator delivery policy

Read this reference only after an execution signal reaches SPEC, PLAN, BUILD,
or CHECK. It owns written records, approvals, pipeline depth, evidence gates,
reviewability, actor separation, and completion bookkeeping.

## Specification and approval

Deliberate material HOW decisions before documenting them. Discovery settles
which problem and scope; specification settles relationships, patterns,
interactions, data, and security behavior. Never code against implied values.

Use SDD Grill when the user explicitly requests it or when a consequential
scope/architecture decision is about to lock in through an execution signal.
Fact-finding may be delegated; decisions stay with the user. Pure discussion
without execution intent exits at the root boundary rather than entering Grill.

Use exactly one approved work order:

| Size | Written record |
|---|---|
| small / medium | `docs/sdd/changes/{date}-{slug}.md` with DoD |
| large / full | approved tickets under `docs/sdd/specs/{NNN}-{slug}/tickets/` |
| micro | no record; announce and record the skip reason |
| emergency | fix first; write the retrospective afterward |

Approval behavior comes from the selected mode: prototype and vibe
auto-approve the visible/recorded order; standard waits for approval or `go`;
strict requires explicit approval; emergency defers it. Before the first edit,
emit exactly one transparency line naming the record or the valid skip reason.

## Pipeline execution

THINK may gather elicitation, context, scope, complexity, SDLC, architecture,
and threat information. BUILD applies the approved record, tests-first where
applicable, constraints, anti-pattern correction, bounded change tracking, and
execution-loop detection. PROVE performs verification, adversarial/security
checks, coverage, performance assessment, report, and judgment.

Close the review gap with:

1. tests derived from the specification before implementation for medium+;
2. semantic implementation chunks mapped to spec items and trust tiers;
3. a review guide: deep review for trust boundaries, intent verification for
   business logic, and light scan for boilerplate.

For large work, decompose into vertical slices and execute only unblocked
tickets. For external skill composition, load `../composition.md` only when a
real capability gap exists; SDD yields on aesthetics and workflow preference,
but retains safety and engineering correctness.

## Evidence gates

| Gate | micro | small | medium | large / full |
|---|---|---|---|---|
| DoD | — | always | always | always |
| Test plan | — | tests named in DoD | plan file | plan file |
| Threat model | — | security-zone only | zone-triggered | mandatory |
| Coverage | — | at least 80% changed lines plus green suite | at least 80% overall plus honesty checks | same |
| UI E2E harness | — | ask before adding | required | required |
| Traceability | — | — | lite inline `Refs:` | full matrix and ship gate |

Strict promotes gates one size level down. Prototype and vibe reduce narration,
not measurement. Emergency performs applicable coverage in the post-fix
follow-up. Never report a gate as passed unless its command actually ran.
Large/full work cannot ship with unresolved Must/Should traceability rows.

## Authority and independent review

Inspect harness capabilities before assigning actors. With fresh contexts,
implementer, reviewer, and verifier use distinct actor IDs; sensitive work
also uses a distinct security reviewer. Reviewers report defects and re-check
after fixes rather than fixing work they approve. Without fresh contexts,
record `degraded independence` and list exact human-review items.

The judgment gate requires a fresh context containing only spec, diff, and
test results when such a context is available. Mechanical and shadow results
never substitute for trusted gateway, acceptance, release, or human authority.

## Completion bookkeeping

After applicable checks:

- update traceability and run its checker;
- generate the verification report and trust-tiered judgment;
- produce the comprehension aid;
- log only rule-of-three decisions;
- update glossary, stats, memory, insight, and index only when their own
  preconditions apply;
- load `skills/meta/workflow-navigation/SKILL.md` for the terminal route.

Stats footer: prototype/emergency none; vibe one line; standard two lines;
strict full stats. Utility commands (`learn`, `docs`, `handoff`, `update`) are
optional overlays and never replace a missing delivery stage.
