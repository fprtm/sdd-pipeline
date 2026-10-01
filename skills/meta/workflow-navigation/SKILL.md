# Workflow Navigation

Close every direct command with a context-derived transition, not a generic
"what next?" menu. The delivery spine is fixed:

```text
ASK → SPEC → PLAN → BUILD → CHECK
```

`learn`, `docs`, `handoff`, and `update` are utility commands. They may be
useful beside the spine, but they are never mandatory steps and must not be
offered merely because they exist.

## Closing Contract

At every terminal outcome — completed, paused, blocked, degraded, no-op, or
spec-only — report the applicable fields in this order:

```markdown
## Next

**Outcome:** <completed | paused | blocked | degraded | no-op | spec-only> — <what is true now>.
**Not run / skipped:** <only material adjacent stage, domain, or gate> — <why>.
**Recommended next:** <one action> — <observed readiness or missing prerequisite>.
**Alternatives:**
1. <contextual user-controlled action with why>
2. <optional second contextual user-controlled action with why>
```

Omit `Not run / skipped` when no plausible stage, domain, or gate was omitted.
For a clean `no-op` or `spec-only` terminal state, `Recommended next` may be
omitted; offer stop or a relevant human-controlled alternative instead. In all
other cases, provide one recommendation and at most two alternatives — usually
revise, discuss, or stop. Never manufacture a skip to fill the format.

The recommendation is an offer, never an automatic invocation. A user can
revise, discuss, pause, or stop at any completed boundary. Do not repeat an
offer the user explicitly declined unless new evidence changes why it applies.

## Decision and Skip Rules

1. **Ask before assuming.** A material product, scope, risk, UX, data, or
   technical decision remains unresolved until the user confirms it, an
   existing canonical decision settles it, or the surface demonstrably does
   not exist. Repository facts and low-risk bookkeeping may be derived; any
   assumption is labeled and cannot satisfy a user decision.
2. **Explain relevant skips.** Name a skipped delivery stage, domain, or gate
   only when a reader could reasonably expect it. State whether it was not
   applicable, explicitly declined, blocked, or deferred by mode/policy.
   "Skipped" never means "silently inferred."
3. **Do not route past an unmet prerequisite.** Missing decisions route back
   to discovery/revision; missing design routes to spec; missing approved work
   order blocks implementation; failed verification routes to correction, not
   completion.
4. **Keep the menu small.** Offer one primary action plus at most two
   alternatives. Every offered command needs a concrete reason from the
   observed state. Plain-language alternatives such as revise, discuss, or
   stop are valid and usually preferable to an irrelevant command.
5. **Name uncertainty honestly.** A missing required capability is `BLOCKED`
   and cannot resume the dependent step. A missing optional capability or
   unavailable independent context is `DEGRADED`: it may resume the exact named
   next action under the declared limitation when all required prerequisites
   hold, but never claim full assurance, acceptance, or independent validation.

## Valid Routes

| Current command and state | Primary recommendation when ready | Other valid routes | Never imply |
|---|---|---|---|
| `discover`, all relevant seats + council settled and user wants detailed design | `/sdd-pipeline:spec` | revise/continue discovery; inspect code with `/learn` if context is missing; stop | `/implement`; that an unanswered seat was settled |
| `discover`, a material seat unresolved | continue `/discover` | discuss/revise; stop | `/spec` or `/implement` as ready |
| `spec`, artifacts valid but no execution signal | stop as `spec-only` | approve execution; revise spec; handoff for an explicit transfer | `/implement` as ready |
| `spec`, artifacts valid and user gives an execution signal | `/sdd-pipeline:implement` | revise/approve spec; handoff for an explicit transfer; spec-only stop | automatic BUILD |
| `spec`, assumption, contradiction, missing approval, or invalid artifact | revise `/spec` | discuss the fork; stop | `/implement` |
| `implement`, changed work unit ready for evidence | `/sdd-pipeline:check` | revise the change/spec when a material deviation surfaced; handoff for an explicit transfer | that code is accepted or independently verified |
| `implement`, preflight/work order blocked | revise the ticket or `/spec` | discuss missing decision; stop | coding around the missing value |
| `check`, verify pass | stop for human review/release decision | handoff for explicit transfer; discuss a blind spot | release/deploy authority |
| `check`, verify fail | `/sdd-pipeline:implement` with the finding | revise `/spec` if a decision is wrong; `/learn` if the cause is unclear | that audit/verify fixed anything |
| `check`, verification blocked | resolve the named evidence or harness capability | stop; handoff when another environment has the capability | `/implement` without a code finding |
| `check`, verification degraded/partial | remediate the named evidence gap or request human review | acknowledge and record the stated limitation; stop | full verification or acceptance |
| `check`, audit finding | `/learn` or discuss the finding | `/discover` or `/spec` after user chooses a change; stop | a completed implementation |
| `check`, clean audit | stop | discuss coverage limits; handoff for an explicit transfer | a fix or release authority |
| `docs`, plan awaiting approval | approve or revise the documentation plan | stop | continuing a batch without approval |
| `docs`, approved batch complete | continue approved batch or stop | `/learn` for focused understanding; `/discover` then `/spec` for new work | `/implement` from descriptive docs alone |
| `learn` | stop unless an observed risk or stated user intent justifies an action | `/docs` for requested durable onboarding docs; `/check` for a concrete risk; `/discover`/`/spec` only with matching intent | implementation merely because code was read |
| `handoff`, produce | move the package to the target environment | stop | an arbitrary command beyond the named resume goal |
| `handoff`, consume valid | offer `Resume <next_action>` | revise if state drifted; stop | a different action without re-planning or auto-resume |
| `handoff`, blocked | resolve the named required capability, authority, pointer, or evidence | stop | resume the dependent action |
| `handoff`, degraded | offer the exact `Resume <next_action>` under the stated limitation | resolve the optional capability; stop | full validation, assurance, or acceptance |
| `update` | only the confirmation/reload/manual migration action applicable to the result | view changelog; stop | unrelated workflow commands or silent update |

## Command-Specific Requirements

- `/discover` must enumerate every relevant unresolved seat before it can say
  the product shape is settled. A seat may be skipped only because its surface
  does not exist, and the reason is stated.
- `/spec` must state omitted domains/artifacts and why. Spec-only is a clean
  terminal outcome, not a prompt to build.
- `/implement` must carry any `degraded independence`, deviation, or preflight
  failure into the closing state.
- `/check` must say whether it selected VERIFY or AUDIT and why.
- `/check` must distinguish failing evidence from blocked evidence, degraded
  evidence, and a clean audit; only an actual failing code finding routes to
  implementation.
- `/docs` must state generated, updated, reused, and skipped modules/doc types.
- `/docs` pauses after proposing a plan until the user approves or revises it.
- `/handoff` carries only the named goal and next action; it never broadens
  authority or treats chat history as state. Consuming validates and offers the
  named action; it does not resume it without the user's selection.
- `/update` remains confirmation-first. An already-current or preview-only run
  may close after its status with only non-mutating alternatives.

## Validation Target

Every public command references this module in its own `## Workflow
Navigation` section. This shared module owns the generic contract; each command
owns its state-specific route and prerequisite language.
