---
name: Bug report
about: Something in a skill, the installer, or a checker script is factually wrong or broken
title: ""
labels: bug
---

## What's wrong

One or two sentences. If it's a factual/consistency bug (a skill contradicts another, a doc references something that doesn't exist), quote both sides.

## Where

- File(s): `skills/...` or `install/install.sh` or `enforcement/...`
- Which agent/tool were you using (Claude Code / Codex / OpenCode / Cursor / other)?
- SDD Pipeline version (`./install/install.sh --version`, or the plugin version if installed via marketplace)

## Reproduction

For an installer or checker-script bug, the exact commands (ideally from a fresh scratch directory, not this repo — see CONTRIBUTING.md). For a skill-behavior bug, the prompt you gave and what the agent actually did vs. what the skill file says it should do.

## Expected vs. actual

What the docs/skill say should happen, vs. what happened.
