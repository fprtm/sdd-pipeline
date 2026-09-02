---
name: update
description: Update SDD Pipeline itself to the latest released version. Shows the CHANGELOG diff between the installed version and the latest before applying anything — never a silent pull.
disable-model-invocation: true
---

# /sdd-pipeline:update

Manual entry point only — this never runs on its own, unlike a project's own dependency updates. sdd-pipeline is the framework governing the whole workflow; changing it mid-session without the user seeing what changed first is exactly the kind of invisible-work trust break this framework exists to prevent elsewhere.

## Process

1. **Find the installed version.** Read the local `AGENTS.md` header (or `.claude-plugin/plugin.json` / the harness's own plugin manifest, whichever this install uses) for the current version string.
2. **Find the latest version.** Check the plugin marketplace/registry this install came from (`git ls-remote --tags`, or the harness's own update-check mechanism) for the newest released tag.
3. **Already current?** Say so in one line and stop. Nothing to show, nothing to confirm.
4. **Show the CHANGELOG diff, not just the version numbers.** Read `CHANGELOG.md` between the installed version and the latest, and present the actual entries — Added/Changed/Migration sections — not just "5.8.0 → 6.0.0". A version bump number tells the user nothing about whether this update is safe to pull mid-feature; the changelog does.
5. **Flag breaking changes explicitly.** If any version in the diff range has a "Migration" section (manual steps required, per the pattern established in v5.8.0), call this out at the top, not buried in the diff — "This update includes a breaking change requiring manual migration steps, see below" before the full diff.
6. **Confirm before applying — always, no exception for patch versions.** Ask, per `skills/think/elicitation/`'s "How to Ask" rule: native question tool first, plain text fallback. A "just show me what's new, don't apply it yet" response is valid and ends the run here.
7. **Apply, if confirmed.** Pull/update via whatever mechanism this install uses (plugin cache sync, `git pull` on a local clone, harness-specific update command). Report what actually changed on disk afterward — don't just repeat the changelog, confirm the update landed (new version string readable from the same file checked in step 1).

## What This Does Not Do

- Does not auto-check for updates on a schedule or at session start — that's a separate, not-yet-built concern, and would itself need the same confirm-before-apply treatment if it existed.
- Does not touch project-level `docs/sdd/` content — this updates the framework's own skill files, never a project's generated docs.
- Does not apply a migration automatically even if one is documented — migrations for existing projects stay manual, per the framework's own standing rule (no migration tooling, established at v5.8.0).
