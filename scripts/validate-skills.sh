#!/usr/bin/env bash
set -euo pipefail

# SDD Pipeline Skill Validation Script
# Checks that all SKILL.md files are well-formed and consistent.

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$SCRIPT_DIR/skills"
ERRORS=0
WARNINGS=0

log_error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; WARNINGS=$((WARNINGS + 1)); }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }

echo "SDD Pipeline Skill Validation"
echo "===================="
echo ""

# --- Check 1: All expected skill files exist ---
echo "## Checking skill file existence..."

EXPECTED_SKILLS=(
  "orchestrator/SKILL.md"
  "think/elicitation/SKILL.md"
  "think/context-loader/SKILL.md"
  "think/scope-guard/SKILL.md"
  "think/complexity-analyzer/SKILL.md"
  "think/sdlc-detector/SKILL.md"
  "think/arch-analyzer/SKILL.md"
  "think/grill/SKILL.md"
  "build/constraints/SKILL.md"
  "build/anti-patterns/SKILL.md"
  "build/change-plan/SKILL.md"
  "build/execution-guard/SKILL.md"
  "build/model-router/SKILL.md"
  "build/doc-generator/SKILL.md"
  "build/ticket-decomposition/SKILL.md"
  "prove/verification/SKILL.md"
  "prove/adversarial/SKILL.md"
  "prove/security-check/SKILL.md"
  "prove/performance-check/SKILL.md"
  "prove/report/SKILL.md"
  "prove/judgment/SKILL.md"
  "meta/decision-log/SKILL.md"
  "meta/comprehension/SKILL.md"
  "meta/insight/SKILL.md"
  "meta/health-check/SKILL.md"
  "meta/memory/SKILL.md"
  "meta/stats/SKILL.md"
  "meta/glossary/SKILL.md"
  "modes/prototype/SKILL.md"
  "modes/vibe/SKILL.md"
  "modes/standard/SKILL.md"
  "modes/strict/SKILL.md"
  "modes/emergency/SKILL.md"
  "constraints/universal/SKILL.md"
  "constraints/web/SKILL.md"
  "constraints/cli/SKILL.md"
  "constraints/mobile/SKILL.md"
  "constraints/library/SKILL.md"
  "constraints/api/SKILL.md"
  "agents/orchestration/SKILL.md"
  "agents/model-strategy/SKILL.md"
  "agents/subagent-patterns/SKILL.md"
  "commands/discover/SKILL.md"
  "commands/spec/SKILL.md"
  "commands/implement/SKILL.md"
  "commands/check/SKILL.md"
)

for skill in "${EXPECTED_SKILLS[@]}"; do
  if [ -f "$SKILLS_DIR/$skill" ]; then
    log_ok "$skill"
  else
    log_error "Missing: $skill"
  fi
done

echo ""

# --- Check 2: All SKILL.md files have a title (# heading) ---
echo "## Checking skill titles..."

while IFS= read -r file; do
  relative="${file#$SKILLS_DIR/}"
  first_line=$(head -1 "$file")
  if [[ "$first_line" == "---" ]]; then
    # Has frontmatter — find the title after the closing ---
    title=$(awk '/^---$/{c++; next} c>=2 && /^# /{print; exit}' "$file")
    if [[ -z "$title" ]]; then
      log_error "$relative: Has frontmatter but no '# Title' heading after it"
    fi
  elif [[ "$first_line" != "# "* ]]; then
    log_error "$relative: Missing title (first line should be '# Title' or YAML frontmatter)"
  fi
done < <(find "$SKILLS_DIR" -name "SKILL.md" | sort)

echo ""

# --- Check 2b: Command skills have valid frontmatter ---
echo "## Checking command skill frontmatter..."

for cmd in discover spec implement check; do
  file="$SKILLS_DIR/commands/$cmd/SKILL.md"
  if [ -f "$file" ]; then
    if ! head -1 "$file" | grep -q "^---$"; then
      log_error "commands/$cmd: missing YAML frontmatter"
    elif ! grep -q "^name: $cmd$" "$file"; then
      log_error "commands/$cmd: frontmatter 'name' does not match '$cmd'"
    elif ! grep -q "^description:" "$file"; then
      log_error "commands/$cmd: frontmatter missing 'description'"
    else
      log_ok "commands/$cmd: valid frontmatter"
    fi
  fi
done

echo ""

# --- Check 2c: plugin.json skills array references valid paths ---
echo "## Checking plugin.json skills array..."

PLUGIN_JSON="$SCRIPT_DIR/.claude-plugin/plugin.json"
if [ -f "$PLUGIN_JSON" ]; then
  if grep -q '"skills"' "$PLUGIN_JSON"; then
    while IFS= read -r ref; do
      [ -z "$ref" ] && continue
      ref_path="$SCRIPT_DIR/${ref#./}"
      if [ ! -f "$ref_path/SKILL.md" ]; then
        log_error "plugin.json references '$ref' but $ref_path/SKILL.md does not exist"
      else
        log_ok "plugin.json: $ref resolves"
      fi
    done < <(grep -oE '"\./skills/[a-z/-]+"' "$PLUGIN_JSON" | tr -d '"' || true)
  else
    log_warn "plugin.json has no 'skills' array — no skills are registered as invocable"
  fi
fi

# --- Check 3: Mode files have behavior tables ---
echo "## Checking mode files have behavior tables..."

for mode in prototype vibe standard strict emergency; do
  file="$SKILLS_DIR/modes/$mode/SKILL.md"
  if [ -f "$file" ]; then
    if grep -q "| Phase " "$file" || grep -q "| phase " "$file" || grep -q "| Setting" "$file"; then
      log_ok "modes/$mode: has behavior table"
    else
      log_warn "modes/$mode: missing behavior table"
    fi

    # Check v0.2.0 additions
    if grep -q "Written record\|Plan file\|Plan handling\|plan file" "$file"; then
      log_ok "modes/$mode: has written-record handling"
    else
      log_warn "modes/$mode: missing written-record handling"
    fi

    if grep -q "Stats\|stats\|footer" "$file"; then
      log_ok "modes/$mode: has stats/footer config"
    else
      log_warn "modes/$mode: missing stats config (v0.2.0)"
    fi
  fi
done

echo ""

# --- Check 4: Mode behavior table consistency ---
echo "## Checking mode table phase coverage..."

REQUIRED_PHASES="Elicitation|Context|Scope|Complexity|Constraints|Anti-pattern|Change plan|Execution|Verification|Adversarial|Security|Performance|Report|Decision|Comprehension|Insight|Memory"

for mode in prototype vibe standard strict emergency; do
  file="$SKILLS_DIR/modes/$mode/SKILL.md"
  if [ -f "$file" ]; then
    missing=""
    for phase in Elicitation Verification Security; do
      if ! grep -qi "$phase" "$file"; then
        missing="$missing $phase"
      fi
    done
    if [ -n "$missing" ]; then
      log_warn "modes/$mode: missing critical phases:$missing"
    fi
  fi
done

echo ""

# --- Check 5: Cross-references ---
echo "## Checking cross-references..."

while IFS= read -r file; do
  relative="${file#$SKILLS_DIR/}"
  # Check for references to skill paths
  refs=$(grep -oE 'skills/[a-z-]+/[a-z-]+/' "$file" 2>/dev/null || true)
  while IFS= read -r ref; do
    [ -z "$ref" ] && continue
    ref_path="$SCRIPT_DIR/$ref"
    if [ ! -d "$ref_path" ]; then
      log_warn "$relative: references non-existent path '$ref'"
    fi
  done <<< "$refs"
done < <(find "$SKILLS_DIR" -name "SKILL.md")

echo ""

# --- Check 6: File sizes ---
echo "## Checking skill file sizes..."

while IFS= read -r file; do
  relative="${file#$SKILLS_DIR/}"
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 300 ]; then
    log_warn "$relative: $lines lines (consider splitting if >300)"
  elif [ "$lines" -lt 5 ]; then
    log_error "$relative: only $lines lines (likely incomplete)"
  fi
done < <(find "$SKILLS_DIR" -name "SKILL.md")

echo ""

# --- Check 7: Other required files ---
echo "## Checking other required files..."

for file in README.md AGENTS.md LICENSE .gitignore; do
  if [ -f "$SCRIPT_DIR/$file" ]; then
    log_ok "$file exists"
  else
    log_error "$file missing"
  fi
done

for file in install/install.sh enforcement/hooks/pre-commit enforcement/ci/sdd-check.yml; do
  if [ -f "$SCRIPT_DIR/$file" ]; then
    log_ok "$file exists"
    if [[ "$file" == *.sh ]] || [[ "$file" == */pre-commit ]]; then
      if [ -x "$SCRIPT_DIR/$file" ]; then
        log_ok "$file is executable"
      else
        log_warn "$file is not executable"
      fi
    fi
  else
    log_error "$file missing"
  fi
done

echo ""

# --- Check 8: Templates ---
echo "## Checking templates..."

for file in templates/sdd.config.md templates/memory.md templates/index.md templates/glossary.md; do
  if [ -f "$SCRIPT_DIR/$file" ]; then
    log_ok "$file exists"
  else
    log_error "$file missing"
  fi
done

echo ""

# --- Summary ---
echo "===================="
TOTAL_SKILLS=$(find "$SKILLS_DIR" -name "SKILL.md" | wc -l)
echo "Total skills found: $TOTAL_SKILLS"

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}FAILED: $ERRORS error(s), $WARNINGS warning(s)${NC}"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "${YELLOW}PASSED with $WARNINGS warning(s)${NC}"
else
  echo -e "${GREEN}ALL CHECKS PASSED${NC}"
fi
