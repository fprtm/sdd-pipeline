---
name: self-update
description: >-
  Check the sdd-pipeline remote for a newer release and update the installed
  pack, so the user never has to update by hand. Use when the user says "update
  the pipeline / update sdd-pipeline / update the skills", "check for updates",
  "am I on the latest?", "pull the latest skills", or asks to self-update. Only
  updates an INSTALLED copy — never overwrites a working clone of the source.
---

# self-update — keep the installed pack current

Checks whether the installed `sdd-pipeline` is behind its remote and, if so,
updates it via whatever install method is in use — so the user doesn't track
releases manually. Installing/updating changes the user's config, so this is a
**confirm-before-you-change** skill (see the safety gate below).

## Safety gate — never clobber a working copy (read first)

This skill updates an **installed** copy of the pack. It must **not** overwrite a
clone someone is *developing* (like the source repo itself). Before touching
anything:

- If the current directory *is* a full clone of the pack (has `skills/` +
  `.claude-plugin/` + git history), run `git status` and
  `git rev-list --count @{u}..HEAD` (if a tracking branch exists). **Dirty tree,
  local commits ahead, or unpushed work → STOP.** Say so; this is a dev checkout,
  not an install to overwrite.
- Updating rewrites installed skill files / plugin config. That's the "modify
  config" category — **state exactly what you'll change and get a yes first.**
  Never auto-run an update the user didn't ask for.

## Step 1 — find the install method + current version

Look for where the pack lives and how it got there (check in this order):

- **Claude Code plugin** — installed under the user's Claude plugins (via
  `/plugin marketplace add fprtm/sdd-pipeline` + `/plugin install`). Version =
  the installed plugin's `plugin.json` `version`.
- **A clone + `install/install.sh`** — files were *copied* into
  `~/.claude/skills`, `.claude/skills`, `~/.config/opencode/skills`,
  `.agents/skills`, etc. There's a source clone somewhere; the copies are static.
- **A clone read live** — OpenCode "Option B" (`skills` array points at the
  clone) or Cursor (`AGENTS.md` points at the clone). No copy; the clone is read
  fresh.

## Step 2 — check the remote

Run the bundled checker. It reads the local version from **`VERSION`** (a
plain-text file bundled inside this skill's own folder — present in every
install method, including a skills-only copy, since `.claude-plugin/plugin.json`
usually isn't); it falls back to `.claude-plugin/plugin.json` when that's present
too (a full clone), which also supplies the remote repo URL — otherwise it uses
the pack's known default repo. Then it compares against the highest remote
release tag:

```bash
node skills/self-update/check-update.mjs
```

It prints `local`, `latest`, and a `RESULT:` line (`UP TO DATE` /
`UPDATE AVAILABLE — vX → vY`). No tool for it? Fall back to
`git ls-remote --tags https://github.com/fprtm/sdd-pipeline.git` and compare the
highest `vX.Y.Z` tag to the installed version by hand.

If **up to date**, say so and stop — nothing to do.

## Step 3 — update (only after confirming), per method

Mirror the method you found in Step 1. Show the commands, confirm, then run the
ones you safely can:

| Method | Update |
|--------|--------|
| **Claude Code plugin** | You (the agent) can't run slash commands — give the user these to run: `/plugin marketplace update` then `/plugin update sdd-pipeline@sdd-pipeline`. (Works because this repo bumps `plugin.json` `version` every release; Claude Code pins to that field.) |
| **Clone + `install.sh` copy** | `git pull` in the clone, then **re-run the same** `install/install.sh <target>` that was used (e.g. `claude`, `claude-proj`, `opencode`, `codex`, `generic --dest …`). The copy is static, so a pull alone isn't enough — the re-run is required. |
| **Clone read live** (OpenCode Option B / Cursor) | `git pull` in the clone is enough — it's read fresh; no re-copy. OpenCode: restart it (skills load at startup). |

If you don't know which `install.sh` target was used, ask — don't guess and
scatter copies into the wrong place.

## Step 4 — verify + report

- Re-read the installed `version` (or re-run the checker) and confirm it now
  matches the remote.
- Summarize **what changed** in the range the user just crossed — read the
  relevant top entries of `CHANGELOG.md` and give a 2–4 line plain-language recap
  (new skills, behavior changes), not the whole file.

## Honest limits

- This is instructions the agent runs, not a background daemon — it updates
  **when invoked**, not automatically on a timer.
- The agent cannot execute Claude Code slash commands; for that install method it
  hands the exact commands to the user.
- `git` and network access are required to reach the remote; if either is
  missing, report that plainly rather than pretending it's up to date.
