# Constraints Engine

Load and apply the canonical constraint sets that prevent common AI coding failures. Most rules allow an explicit, logged user override; rules marked `OVERRIDE: None` are hard stops and cannot be overridden.

## How Constraints Work

1. Load **universal constraints** (below).
2. Load **domain-specific constraints** from `skills/constraints/[domain]/SKILL.md`.
3. Load from `docs/sdd/config.md` if it exists — two distinct blocks, don't conflate them:
   - `overrides:` — disables or adjusts an EXISTING rule (e.g. raises the dependency-limit constraint's default value, or disables no-premature-abstraction inside `src/plugins/`). Applied as a modification to the rule it names.
   - `custom-constraints:` — ADDS entirely new project-specific rules on top of universal+domain, each with its own `rule`, `rationale`, and `check: mechanical | judgment` (same tag `skills/build/model-router/` already routes on — a custom constraint isn't exempt from that routing just because it's project-defined). Treat each one exactly like a universal/domain rule for the rest of this skill: checked before implementation, flagged/self-corrected the same way, loggable as an override if the user pushes back on it.
4. **Project CLAUDE.md/AGENTS.md rules ALWAYS override SDD Pipeline defaults.**
5. Check constraints BEFORE implementation.
6. If violated during implementation: self-correct (vibe) or flag (standard/strict).

## Constraint Definitions — One Owner

This engine owns loading order, precedence, violation handling, and override
bookkeeping. It does not duplicate the rule definitions:

- universal rules: `skills/constraints/universal/SKILL.md`
- domain rules: `skills/constraints/{web|api|cli|mobile|library}/SKILL.md`
- project additions and adjustments: `docs/sdd/config.md`

Read the applicable definition files in full before implementation. Their
`RULE`, `RATIONALE`, `OVERRIDE`, and `CHECK` fields are the canonical values.
If a summary elsewhere differs, the definition file wins unless a higher
priority project rule narrows it. In particular, `OVERRIDE: None` is a hard
stop; neither mode nor user insistence converts it into a guideline.

## Constraint Violation Behavior

**Mode behavior**: see unified mode matrix in `skills/orchestrator/SKILL.md`.

## User Override Protocol

When user overrides a constraint:
1. Check the canonical rule's `OVERRIDE` field. If it is `None`, refuse the requested violation and stop this path.
2. For an overridable rule, accept the override after stating the concrete risk.
3. Log it in the decision log with the user's reason.
4. Save to project memory if it's a recurring preference.
5. Do NOT re-flag the same override in the same context.
