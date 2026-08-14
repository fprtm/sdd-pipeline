#!/usr/bin/env bash
# SDD Pipeline — multi-agent installer.
# Copies the skill pack into the location your agent reads from.
#
# Usage:
#   ./install/install.sh <target> [--dest <dir>]
#
# Targets (verified against each tool's own docs — see CHANGELOG for sources):
#   claude       ~/.claude/skills           (Claude Code, user scope; real SKILL.md scan)
#   claude-proj  ./.claude/skills           (Claude Code, current project; real SKILL.md scan)
#   codex        ./.agents/skills + AGENTS.md pointer     (Codex CLI; real SKILL.md scan)
#   opencode     ./.opencode/skills         (OpenCode, project scope; real SKILL.md scan)
#   cursor       ./AGENTS.md (append pack pointer)        (Cursor has no per-skill discovery —
#                                                           Cursor ignores plain .md under
#                                                           .cursor/rules, it only reads .mdc there;
#                                                           AGENTS.md is Cursor's own documented
#                                                           plain-markdown fallback)
#   generic      --dest <dir> required; copies skills/ there
#
# .agents/skills is scanned by BOTH Codex and OpenCode — for one install that
# covers both tools globally, use: ./install.sh generic --dest ~/.agents/skills
#
# For agents that read a single rules file, use --bundle to also emit one
# concatenated markdown file (all skills in order) you can point the agent at.
#
# By default, a project-scoped install (claude-proj/opencode/codex/generic
# --dest inside a repo) auto-excludes its destination via .gitignore — an
# installed copy is tooling, not your app's code, and committing it means
# every pack update becomes a diff in your project's own history. Pass
# --vendor if you deliberately want it committed (e.g. a team pinning an
# exact methodology version, like a lockfile) — see the README's Install
# section for the trade-off.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$ROOT/skills"
TARGET="${1:-}"
DEST=""
BUNDLE=0
VENDOR=0

shift || true
while [ $# -gt 0 ]; do
  case "$1" in
    --dest) DEST="$2"; shift 2 ;;
    --bundle) BUNDLE=1; shift ;;
    --vendor) VENDOR=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$TARGET" ]; then
  echo "usage: $0 <claude|claude-proj|cursor|codex|opencode|generic> [--dest DIR] [--bundle] [--vendor]" >&2
  exit 2
fi

maybe_gitignore() {
  # Exclude an installed, project-scoped copy from git by default (see the
  # header note above). No-ops outside a git repo, or with --vendor.
  local out="$1"
  [ "$VENDOR" -eq 1 ] && return 0
  [ -d "$out" ] || return 0

  local repo_root
  repo_root="$(git -C "$out" rev-parse --show-toplevel 2>/dev/null)" || return 0

  local abs_out abs_root relpath
  abs_out="$(cd "$out" && pwd)"
  abs_root="$(cd "$repo_root" && pwd)"
  relpath="${abs_out#"$abs_root"/}"
  [ "$relpath" != "$abs_out" ] || return 0 # not actually under repo_root — leave it alone

  local gitignore="$repo_root/.gitignore"
  local pattern="/$relpath/"
  if ! grep -qxF "$pattern" "$gitignore" 2>/dev/null; then
    {
      [ -s "$gitignore" ] && echo
      echo "# sdd-pipeline: installed skills — tooling, not app code (install/install.sh --vendor to commit instead)"
      echo "$pattern"
    } >> "$gitignore"
    echo "Excluded $pattern via $gitignore (not committing installed skills by default)."
  fi

  local tracked_count
  tracked_count="$(git -C "$repo_root" ls-files -- "$relpath" | wc -l | tr -d ' ')"
  if [ "$tracked_count" -gt 0 ]; then
    echo "NOTE: $tracked_count file(s) under $relpath are already tracked in git."
    echo "      .gitignore doesn't untrack existing files. To stop committing them:"
    echo "        git rm -r --cached $relpath && git commit -m 'chore: stop vendoring sdd-pipeline skills'"
  fi
}

copy_skills() {
  # Every file a skill needs (its template, its bundled script) lives inside
  # that skill's own folder — the documented Claude Code convention (SKILL.md
  # + optional reference.md/scripts/ co-located). So a plain copy of skills/
  # carries everything correctly for any install method, including ones that
  # only ever see the skills/ subtree (e.g. an agent config pointed straight
  # at the clone's skills/ folder, bypassing this script entirely).
  local out="$1"
  mkdir -p "$out"
  cp -R "$SKILLS_DIR/." "$out/"
  echo "Installed skills → $out"
  maybe_gitignore "$out"
}

emit_bundle() {
  local out="$1"
  {
    echo "# SDD Pipeline — bundled skills"
    echo
    echo "Invoke \`spec-driven-development\` first; it orchestrates the rest."
    echo
    for f in "$SKILLS_DIR"/*/SKILL.md; do
      echo "---"
      echo
      cat "$f"
      echo
    done
  } > "$out"
  echo "Wrote bundle → $out"
}

point_agents_md() {
  touch ./AGENTS.md
  if ! grep -q "SDD Pipeline" ./AGENTS.md 2>/dev/null; then
    printf '\n# SDD Pipeline\nSee sdd-pipeline/AGENTS.md and skills/. Invoke spec-driven-development first.\n' >> ./AGENTS.md
  fi
  echo "Pointed ./AGENTS.md at the pack."
}

case "$TARGET" in
  claude)       copy_skills "${DEST:-$HOME/.claude/skills}" ;;
  claude-proj)  copy_skills "${DEST:-./.claude/skills}" ;;
  opencode)     copy_skills "${DEST:-./.opencode/skills}" ;;
  codex)
      # Codex auto-discovers SKILL.md under .agents/skills (walking up to repo
      # root); also point AGENTS.md as a harmless, human-readable fallback note.
      copy_skills "${DEST:-./.agents/skills}"
      point_agents_md
      ;;
  cursor)
      # Cursor has no per-skill SKILL.md discovery — plain .md under
      # .cursor/rules is explicitly ignored (Cursor only reads .mdc there).
      # AGENTS.md is Cursor's own documented plain-markdown fallback.
      point_agents_md
      ;;
  generic)
      [ -n "$DEST" ] || { echo "generic requires --dest DIR" >&2; exit 2; }
      copy_skills "$DEST"
      ;;
  *) echo "unknown target: $TARGET" >&2; exit 2 ;;
esac

if [ "$BUNDLE" -eq 1 ]; then
  emit_bundle "./sdd-pipeline.bundle.md"
fi

echo "Done."
