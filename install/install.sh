#!/usr/bin/env bash
# SDD Pipeline — multi-agent installer.
# Copies the skill pack into the location your agent reads from.
#
# Usage:
#   ./install/install.sh <target> [--dest <dir>]
#
# Targets:
#   claude       ~/.claude/skills           (Claude Code, user scope)
#   claude-proj  ./.claude/skills           (Claude Code, current project)
#   cursor       ./.cursor/rules            (Cursor)
#   codex        ./AGENTS.md (append pack pointer)      (Codex / generic)
#   opencode     ./.opencode/skills         (OpenCode)
#   generic      --dest <dir> required; copies skills/ there
#
# For agents that read a single rules file, use --bundle to also emit one
# concatenated markdown file (all skills in order) you can point the agent at.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$ROOT/skills"
TARGET="${1:-}"
DEST=""
BUNDLE=0

shift || true
while [ $# -gt 0 ]; do
  case "$1" in
    --dest) DEST="$2"; shift 2 ;;
    --bundle) BUNDLE=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$TARGET" ]; then
  echo "usage: $0 <claude|claude-proj|cursor|codex|opencode|generic> [--dest DIR] [--bundle]" >&2
  exit 2
fi

copy_skills() {
  local out="$1"
  mkdir -p "$out"
  cp -R "$SKILLS_DIR/." "$out/"
  echo "Installed skills → $out"
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

case "$TARGET" in
  claude)       copy_skills "${DEST:-$HOME/.claude/skills}" ;;
  claude-proj)  copy_skills "${DEST:-./.claude/skills}" ;;
  cursor)       copy_skills "${DEST:-./.cursor/rules/sdd-pipeline}" ;;
  opencode)     copy_skills "${DEST:-./.opencode/skills}" ;;
  codex)
      # Codex reads AGENTS.md; append a pointer and (optionally) a bundle.
      touch ./AGENTS.md
      if ! grep -q "SDD Pipeline" ./AGENTS.md 2>/dev/null; then
        printf '\n# SDD Pipeline\nSee sdd-pipeline/AGENTS.md and skills/. Invoke spec-driven-development first.\n' >> ./AGENTS.md
      fi
      echo "Pointed ./AGENTS.md at the pack."
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
