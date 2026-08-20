#!/usr/bin/env bash
set -euo pipefail

VERSION="3.0.1"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$SCRIPT_DIR/skills"

usage() {
  cat <<EOF
SDD Pipeline Installer v$VERSION

Usage: ./install.sh --agent <target> [options]

Targets:
  claude       Install for Claude Code (user scope: ~/.claude/skills/)
  claude-proj  Install for Claude Code (project scope: .claude/skills/)
  codex        Install for Codex CLI (.agents/skills/ + AGENTS.md)
  opencode     Install for OpenCode (.opencode/skills/)
  cursor       Install for Cursor (.cursor/skills/sdd/ — Agent Skills, since Jan 2026)
  generic      Install to custom directory (requires --dest)

Options:
  --dest <dir>       Destination directory (required for generic, optional for others)
  --only <phase>     Install only specific phase(s). Comma-separated.
                     Phases: think, build, prove, meta, modes, constraints, agents, commands
                     Shortcuts: security (constraints+prove), quality (build+prove)
  --with-hooks       Install pre-commit hooks to current git repo
  --with-ci          Copy GitHub Actions workflow to .github/workflows/
  --with-templates   Copy project templates to docs/sdd/
  --update           Update existing installation (preserves project config)
  --uninstall        Remove SDD Pipeline from the specified agent target
  --version          Show version and exit
  --help             Show this help

Examples:
  ./install.sh --agent claude                      # Full install for Claude Code
  ./install.sh --agent codex --only security       # Security skills only for Codex
  ./install.sh --agent claude --with-hooks --with-ci  # Full install + enforcement
  ./install.sh --agent claude --update             # Update to latest version
  ./install.sh --agent claude --uninstall          # Remove SDD Pipeline
  ./install.sh --agent generic --dest ./my-project/.ai/skills
EOF
  exit 0
}

# --- Skill Copying ---

copy_all_skills() {
  local dest="$1"
  mkdir -p "$dest"
  cp -r "$SKILLS_DIR"/* "$dest/"
  echo "All skills copied to $dest"
}

copy_phase() {
  local dest="$1"
  local phase="$2"

  case "$phase" in
    think|build|prove|meta|modes|constraints|agents|commands)
      if [ -d "$SKILLS_DIR/$phase" ]; then
        mkdir -p "$dest/$phase"
        cp -r "$SKILLS_DIR/$phase"/* "$dest/$phase/"
        echo "  ✓ $phase"
      fi
      ;;
    orchestrator)
      # cp the whole directory, not just SKILL.md — the orchestrator's own
      # content references skills/orchestrator/composition.md as a
      # companion file; copying SKILL.md alone silently breaks that
      # reference on every --only install (was: cp of SKILL.md only).
      mkdir -p "$dest/orchestrator"
      cp -r "$SKILLS_DIR/orchestrator"/* "$dest/orchestrator/"
      echo "  ✓ orchestrator"
      ;;
    security)
      copy_phase "$dest" "constraints"
      copy_phase "$dest" "prove"
      ;;
    quality)
      copy_phase "$dest" "build"
      copy_phase "$dest" "prove"
      ;;
    *)
      echo "Unknown phase: $phase"
      exit 1
      ;;
  esac
}

# Expands a comma-separated --only phase list (including the "security"/
# "quality" shortcuts) into the flat, deduped set of real phase directory
# names, one per line. No associative arrays (bash 3.2/BSD-safe — see the
# portability note on rewrite_skill_paths). Validates every name BEFORE any
# copy_phase call runs, so an unknown phase fails fast with nothing copied
# yet, instead of leaving a partial orchestrator-only install behind.
resolve_phases() {
  local phases="$1"
  local out="" p x
  local raw
  IFS=',' read -ra raw <<< "$phases"
  for p in "${raw[@]}"; do
    p="${p// /}"
    case "$p" in
      security) for x in constraints prove; do case " $out " in *" $x "*) ;; *) out="$out $x" ;; esac; done ;;
      quality)  for x in build prove; do case " $out " in *" $x "*) ;; *) out="$out $x" ;; esac; done ;;
      think|build|prove|meta|modes|constraints|agents|commands)
        case " $out " in *" $p "*) ;; *) out="$out $p" ;; esac ;;
      *) echo "Unknown phase: $p" >&2; return 1 ;;
    esac
  done
  printf '%s\n' $out
}

copy_selective() {
  local dest="$1"
  local phases="$2"
  local resolved
  if ! resolved=$(resolve_phases "$phases"); then
    exit 1
  fi
  mkdir -p "$dest"
  copy_phase "$dest" "orchestrator"
  while IFS= read -r phase; do
    [ -n "$phase" ] && copy_phase "$dest" "$phase"
  done <<< "$resolved"
}

# Every skill file cross-references its siblings with a literal path like
# `skills/think/grill/SKILL.md`, written assuming skills/ sits at the
# project root — true only when running straight out of this repo. Once
# copied to a nested destination (.agents/skills/sdd/, .cursor/skills/sdd/,
# ~/.claude/commands/sdd/, ...), that literal text no longer resolves to a
# real file. This rewrites every "skills/" prefix found in a single file to
# the given replacement, so the reference points at wherever this install
# actually put things.
rewrite_skill_paths_in_file() {
  local file="$1"
  local prefix="$2"
  local escaped
  escaped=$(printf '%s' "$prefix" | sed -e 's/[&|\]/\\&/g')
  # -i.bak works identically on GNU and BSD/macOS sed; -i alone does not
  # (BSD requires a suffix argument). Drop the backup right after.
  sed -i.bak "s|skills/|${escaped}|g" "$file" && rm -f "$file.bak"
}

# Same rewrite, applied to every .md/.mjs file under the given directories —
# correcting internal cross-references in place to match where they landed.
#
# $1 is always the overall install root (used to compute the prefix); the
# remaining args are the specific directories to walk. Defaults to $1 itself
# when no extra dirs are given (a full copy_all_skills install — the whole
# tree was just freshly copied, so rewriting all of it is correct).
#
# On a --only update, callers MUST pass just the freshly-copied subdirs
# (orchestrator/ + the resolved phases), never the whole install root. The
# rewrite is NOT idempotent — the prefix itself contains the literal
# substring "skills/" (e.g. ".agents/skills/sdd/"), so re-running it over
# files a PRIOR run already rewrote corrupts them into a double-prefixed
# path (".agents/.agents/skills/sdd/sdd/..."). Directories untouched by this
# invocation must be left alone, not just left with stale-but-valid content.
#
# Uses process substitution (< <(...)), not a `find | while` pipe: the loop
# body needs `failed` to survive past the loop, which a pipe's subshell
# would silently discard. Each file's rewrite runs inside an `if !`, which
# `set -e` treats as a tested condition rather than a failing command — so
# one bad file logs a warning and the loop continues instead of aborting
# the whole install mid-copy with no explanation.
rewrite_skill_paths() {
  local dest="$1"; shift
  local prefix="${dest%/}/"
  local dirs=("$@")
  [ ${#dirs[@]} -eq 0 ] && dirs=("$dest")
  local failed=0
  local d
  for d in "${dirs[@]}"; do
    [ -d "$d" ] || continue
    while IFS= read -r -d '' f; do
      if ! rewrite_skill_paths_in_file "$f" "$prefix"; then
        echo "  ! warning: failed to rewrite path references in $f — left as-is" >&2
        failed=$((failed + 1))
      fi
    done < <(find "$d" -type f \( -name '*.md' -o -name '*.mjs' \) -print0)
  done
  if [ "$failed" -gt 0 ]; then
    echo "  ! $failed file(s) could not be rewritten — see warnings above" >&2
  else
    echo "  ✓ internal skills/... references rewritten to point at $dest/"
  fi
}

# Computes the exact set of directories a --only copy touched (orchestrator +
# resolved phases) so rewrite_skill_paths can be scoped to just those — see
# its docstring for why scoping matters. Prints one path per line.
only_scope_dirs() {
  local dest="$1"
  local only="$2"
  echo "$dest/orchestrator"
  local resolved
  resolved=$(resolve_phases "$only") || exit 1
  local phase
  while IFS= read -r phase; do
    [ -n "$phase" ] && echo "$dest/$phase"
  done <<< "$resolved"
}

copy_agents_md() {
  local dest="$1"
  local skills_prefix="${2:-}"   # what "skills/" becomes in the copied AGENTS.md, relative to $dest
  cp "$SCRIPT_DIR/AGENTS.md" "$dest/AGENTS.md"
  if [[ -n "$skills_prefix" ]]; then
    if ! rewrite_skill_paths_in_file "$dest/AGENTS.md" "$skills_prefix"; then
      echo "  ! warning: failed to rewrite path references in $dest/AGENTS.md — left as-is" >&2
    fi
  fi
  echo "AGENTS.md copied to $dest"
}

# skills/orchestrator/SKILL.md's folder is named "orchestrator" but its own
# frontmatter says `name: sdd`. Claude Code doesn't care (it registers by
# path via plugin.json), but OpenCode/Codex/Cursor's native Agent Skills
# scanners all require the immediate parent folder name to match the
# frontmatter `name:` field — so as installed, the orchestrator fails their
# discovery validation on all three. This adds one extra copy at the
# container root (whose folder name already matches "sdd") so it validates,
# without renaming the canonical skills/orchestrator/ path everything else
# (this repo's own cross-references, .claude-plugin/plugin.json) depends on.
# Copies from the already-copied-and-rewritten $dest/orchestrator/SKILL.md
# (not from source) so the alias carries the same corrected references.
install_orchestrator_alias() {
  local dest="$1"
  cp "$dest/orchestrator/SKILL.md" "$dest/SKILL.md"
  echo "  ✓ orchestrator aliased to $dest/SKILL.md (folder name matches its own 'name: sdd' frontmatter)"
}

install_hooks() {
  if [ ! -d ".git" ]; then
    echo "Warning: Not a git repository. Skipping hooks installation."
    return
  fi
  mkdir -p .git/hooks
  # Always a plain copy, never a symlink: this used to symlink to
  # "$(pwd)/enforcement/hooks/pre-commit" — but $(pwd) here is the TARGET
  # project (the docs say to run this installer from inside it), which has
  # no enforcement/ directory of its own except when the target project IS
  # this sdd-pipeline clone. Everywhere else `ln -sf` silently "succeeded"
  # into a dangling symlink pointing at a nonexistent path, so the `|| cp`
  # fallback never ran, then `chmod` failed on the dangling link and the
  # whole installer aborted under set -e. A symlink to the source clone was
  # also fragile even when it happened to resolve — move/delete that clone
  # later and the hook silently stops running. A self-contained copy has
  # neither failure mode.
  cp "$SCRIPT_DIR/enforcement/hooks/pre-commit" .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit
  echo "Pre-commit hook installed"
}

install_ci() {
  mkdir -p .github/workflows
  cp "$SCRIPT_DIR/enforcement/ci/sdd-check.yml" .github/workflows/sdd-check.yml
  echo "GitHub Actions workflow copied to .github/workflows/sdd-check.yml"
  install_tools
}

install_templates() {
  mkdir -p docs/sdd/{decisions,plans/archive,tickets,reports,design,test-plans,dod,stats,erd,changes,ux-screens,memory}
  cp "$SCRIPT_DIR/templates/sdd.config.md" docs/sdd/config.md 2>/dev/null || true
  # decisions/ holds one file per decision (see skills/meta/decision-log/) —
  # there's no single "decisions doc" to template. This is a plain git-tracking
  # placeholder for the empty directory, nothing more.
  touch docs/sdd/decisions/.gitkeep
  cp "$SCRIPT_DIR/templates/memory.md" docs/sdd/memory/INDEX.md 2>/dev/null || true
  cp "$SCRIPT_DIR/templates/index.md" docs/sdd/index.md 2>/dev/null || true
  cp "$SCRIPT_DIR/templates/glossary.md" docs/sdd/glossary.md 2>/dev/null || true
  install_tools
  echo "Templates copied to docs/sdd/"
}

# Copy the mechanical checkers into the project so CI and local runs can use
# them without reaching back into the skill install location.
TOOLS_INSTALLED=false
install_tools() {
  mkdir -p tools
  cp "$SCRIPT_DIR/skills/meta/traceability/check-traceability.mjs" tools/ 2>/dev/null || true
  cp "$SCRIPT_DIR/skills/meta/health-check/check-file-hygiene.mjs" tools/ 2>/dev/null || true
  cp "$SCRIPT_DIR/skills/agents/parallel-work/check-parallel-safety.mjs" tools/ 2>/dev/null || true
  # install_ci and install_templates both call this — only announce once
  # when both flags are given together, instead of printing it twice.
  if [ "$TOOLS_INSTALLED" = false ]; then
    echo "Mechanical checkers copied to tools/ (traceability, file-hygiene, parallel-safety)"
    TOOLS_INSTALLED=true
  fi
}

uninstall_agent() {
  local dest="$1"
  if [ -d "$dest" ]; then
    rm -rf "$dest"
    echo "SDD Pipeline removed from $dest"
  else
    echo "SDD Pipeline not found at $dest — nothing to remove"
  fi
}

# --- Parse Arguments ---

AGENT=""
DEST=""
ONLY=""
WITH_HOOKS=false
WITH_CI=false
WITH_TEMPLATES=false
DO_UPDATE=false
DO_UNINSTALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --agent) AGENT="$2"; shift 2 ;;
    --dest)  DEST="$2"; shift 2 ;;
    --only)  ONLY="$2"; shift 2 ;;
    --with-hooks) WITH_HOOKS=true; shift ;;
    --with-ci) WITH_CI=true; shift ;;
    --with-templates) WITH_TEMPLATES=true; shift ;;
    --update) DO_UPDATE=true; shift ;;
    --uninstall) DO_UNINSTALL=true; shift ;;
    --version) echo "SDD Pipeline v$VERSION"; exit 0 ;;
    --help)  usage ;;
    *)       echo "Unknown option: $1"; usage ;;
  esac
done

if [[ -z "$AGENT" ]]; then
  echo "Error: --agent is required"
  usage
fi

# --- Resolve Destination ---

resolve_dest() {
  case "$AGENT" in
    claude)      echo "${DEST:-$HOME/.claude/skills/sdd}" ;;
    claude-proj) echo "${DEST:-.claude/skills/sdd}" ;;
    codex)       echo "${DEST:-.agents/skills/sdd}" ;;
    opencode)    echo "${DEST:-.opencode/skills/sdd}" ;;
    cursor)      echo "${DEST:-.cursor/skills/sdd}" ;;
    generic)
      if [[ -z "$DEST" ]]; then
        echo "Error: --dest required for generic install" >&2
        exit 1
      fi
      echo "$DEST"
      ;;
    *)
      echo "Error: Unknown agent '$AGENT'" >&2
      exit 1
      ;;
  esac
}

TARGET_DEST=$(resolve_dest)

# --- Uninstall ---

if [ "$DO_UNINSTALL" = true ]; then
  echo "Uninstalling SDD Pipeline v$VERSION from $AGENT..."
  uninstall_agent "$TARGET_DEST"

  # Clean up hooks
  if [ -f ".git/hooks/pre-commit" ]; then
    if grep -q "SDD Pipeline Pre-Commit" .git/hooks/pre-commit 2>/dev/null; then
      rm .git/hooks/pre-commit
      echo "Pre-commit hook removed"
    fi
  fi

  # Clean up CI — same ownership check as the pre-commit hook above: only
  # remove it if it's actually ours, never assume a file at this path in
  # someone else's project is safe to delete unconditionally.
  if [ -f ".github/workflows/sdd-check.yml" ]; then
    if grep -q "SDD Pipeline" .github/workflows/sdd-check.yml 2>/dev/null; then
      rm .github/workflows/sdd-check.yml
      echo "GitHub Actions workflow removed"
    else
      echo "Note: .github/workflows/sdd-check.yml exists but doesn't look like SDD Pipeline's — left in place"
    fi
  fi

  # Clean up AGENTS.md if we created it
  if [ -f "AGENTS.md" ] && grep -q "SDD Pipeline" AGENTS.md 2>/dev/null; then
    echo "Note: AGENTS.md left in place — remove manually if no longer needed"
  fi

  echo ""
  echo "SDD Pipeline uninstalled. Project docs (docs/sdd/) preserved — remove manually if desired."
  exit 0
fi

# --- Update ---

if [ "$DO_UPDATE" = true ]; then
  echo "Updating SDD Pipeline to v$VERSION for $AGENT..."

  if [ ! -d "$TARGET_DEST" ]; then
    echo "SDD Pipeline not found at $TARGET_DEST — running fresh install instead"
    DO_UPDATE=false
  else
    # Preserve project config before overwrite
    echo "Updating skills at $TARGET_DEST..."
    if [[ -n "$ONLY" ]]; then
      copy_selective "$TARGET_DEST" "$ONLY"
      # Scoped on purpose: only the dirs just re-copied, never the whole
      # tree — see rewrite_skill_paths' docstring for why a --only update
      # would otherwise corrupt everything copied by an earlier, different
      # install into a double-prefixed path.
      readarray_dirs=()
      while IFS= read -r d; do readarray_dirs+=("$d"); done < <(only_scope_dirs "$TARGET_DEST" "$ONLY")
      rewrite_skill_paths "$TARGET_DEST" "${readarray_dirs[@]}"
    else
      copy_all_skills "$TARGET_DEST"
      rewrite_skill_paths "$TARGET_DEST"
    fi

    case "$AGENT" in
      claude|claude-proj|codex|opencode|cursor) install_orchestrator_alias "$TARGET_DEST" ;;
    esac

    # Update hooks if installed
    if [ -f ".git/hooks/pre-commit" ] && grep -q "SDD Pipeline" .git/hooks/pre-commit 2>/dev/null; then
      install_hooks
      echo "Pre-commit hook updated"
    fi

    # Update CI if installed
    if [ -f ".github/workflows/sdd-check.yml" ]; then
      install_ci
      echo "CI workflow updated"
    fi

    echo ""
    echo "SDD Pipeline updated to v$VERSION."
    echo "Project config (docs/sdd/config.md) preserved."
    exit 0
  fi
fi

# --- Fresh Install ---

echo "Installing SDD Pipeline v$VERSION for $AGENT..."

if [[ -n "$ONLY" ]]; then
  echo "Selective install: $ONLY"
  copy_selective "$TARGET_DEST" "$ONLY"
  only_scope_dirs_arr=()
  while IFS= read -r d; do only_scope_dirs_arr+=("$d"); done < <(only_scope_dirs "$TARGET_DEST" "$ONLY")
  rewrite_skill_paths "$TARGET_DEST" "${only_scope_dirs_arr[@]}"
else
  copy_all_skills "$TARGET_DEST"
  rewrite_skill_paths "$TARGET_DEST"
fi

# Agent-specific setup
case "$AGENT" in
  claude)
    install_orchestrator_alias "$TARGET_DEST"
    echo ""
    echo "SDD Pipeline installed for Claude Code (user scope, all projects)."
    echo "Skills discoverable natively at $TARGET_DEST/ — the orchestrator"
    echo "auto-triggers on coding tasks; type / in chat to pick one manually."
    ;;
  claude-proj)
    install_orchestrator_alias "$TARGET_DEST"
    echo ""
    echo "SDD Pipeline installed for Claude Code (project scope)."
    echo "Skills discoverable natively at $TARGET_DEST/ — the orchestrator"
    echo "auto-triggers on coding tasks; type / in chat to pick one manually."
    ;;
  codex)
    install_orchestrator_alias "$TARGET_DEST"
    copy_agents_md "." "$TARGET_DEST/"
    echo ""
    echo "SDD Pipeline installed for Codex CLI."
    echo "AGENTS.md updated. Skills in $TARGET_DEST/"
    echo "Manually pick a skill anytime with /skills, or \$name to mention one directly."
    ;;
  opencode)
    install_orchestrator_alias "$TARGET_DEST"
    copy_agents_md "." "$TARGET_DEST/"
    echo ""
    echo "SDD Pipeline installed for OpenCode."
    echo "Skills in $TARGET_DEST/"
    echo "Use subagent patterns from $TARGET_DEST/agents/subagent-patterns/ for multi-agent simulation."
    ;;
  cursor)
    install_orchestrator_alias "$TARGET_DEST"
    copy_agents_md "." "$TARGET_DEST/"
    echo ""
    echo "SDD Pipeline installed for Cursor."
    echo "Skills in $TARGET_DEST/ — discoverable via Cursor's native Agent Skills (Jan 2026+)."
    echo "Manually pick one with / in Agent chat, or check Customize > Skills > Agent Decides."
    echo "Note: if this project ALSO has a codex install (.agents/skills/sdd/), Cursor picks"
    echo "that up too, since it scans .agents/skills/ as a compatibility path — no extra step."
    ;;
  generic)
    copy_agents_md "$(dirname "$TARGET_DEST")" "$(basename "$TARGET_DEST")/"
    echo ""
    echo "SDD Pipeline installed to $TARGET_DEST"
    ;;
esac

# Optional extras
[ "$WITH_HOOKS" = true ] && install_hooks
[ "$WITH_CI" = true ] && install_ci
[ "$WITH_TEMPLATES" = true ] && install_templates

echo ""
if [ "$WITH_TEMPLATES" != true ]; then
  echo "Optional: set up project-level config:"
  echo "  ./install.sh --agent $AGENT --with-templates"
  echo ""
  echo "Optional: add enforcement:"
  echo "  ./install.sh --agent $AGENT --with-hooks --with-ci"
fi
echo ""
echo "SDD Pipeline v$VERSION installed successfully."
