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
  # Copies skills/ PLUS templates/ and tools/ as siblings at the same
  # destination — several skills reference templates/*.template.md and
  # tools/check-traceability.mjs by a path relative to the pack root, and a
  # skills-only copy leaves those references dangling. Harmless for tools that
  # scan for SKILL.md files (a stray templates/ or tools/ folder with no
  # SKILL.md is just skipped by the scanner).
  local out="$1"
  mkdir -p "$out"
  cp -R "$SKILLS_DIR/." "$out/"
  [ -d "$ROOT/templates" ] && cp -R "$ROOT/templates" "$out/templates"
  [ -d "$ROOT/tools" ] && cp -R "$ROOT/tools" "$out/tools"
  echo "Installed skills (+ templates/, tools/) → $out"
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
