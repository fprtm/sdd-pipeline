---
name: handoff
description: Produce or consume a provider-neutral SDD state handoff. Uses a replace-only repository reference when the next agent has repo access, or a portable minimum-state snapshot otherwise.
disable-model-invocation: true
---

# /sdd-pipeline:handoff

Resume work across agents, sessions, or providers without treating chat history
as state.

## Routing

1. Load `skills/meta/handoff/SKILL.md`.
2. If the user supplied a handoff package, or `docs/sdd/HANDOFF.md` exists and
   names unfinished work, run **VALIDATE → CONSUME → RESUME**.
3. Otherwise run **PRODUCE**.
4. With repository access, prefer a reference handoff at
   `docs/sdd/HANDOFF.md`. Replace that file; never append a timeline.
5. Without repository access, emit a portable minimum-state package in the
   response. Save it only when the user explicitly asks.

The command never grants authority. It may carry forward or narrow authority
already supplied by the user and environment.
