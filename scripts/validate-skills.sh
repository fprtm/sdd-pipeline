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

# Does a literal occur within the named level-two Markdown section? This keeps
# a command from satisfying a navigation check with unrelated prose elsewhere.
section_has_literal() {
  local file="$1" section="$2" literal="$3"
  awk -v section="$section" -v literal="$literal" '
    $0 == "## " section { in_section=1; next }
    in_section && /^## / { exit }
    in_section && index($0, literal) { found=1; exit }
    END { exit(found ? 0 : 1) }
  ' "$file"
}

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
  "think/analytics-design/SKILL.md"
  "think/database-design/SKILL.md"
  "think/stack-conventions/SKILL.md"
  "think/threat-model/SKILL.md"
  "think/ux-design/SKILL.md"
  "build/constraints/SKILL.md"
  "build/anti-patterns/SKILL.md"
  "build/change-plan/SKILL.md"
  "build/execution-guard/SKILL.md"
  "build/git-workflow/SKILL.md"
  "build/infra/SKILL.md"
  "build/model-router/SKILL.md"
  "build/test-plan/SKILL.md"
  "build/doc-generator/SKILL.md"
  "build/ticket-decomposition/SKILL.md"
  "prove/verification/SKILL.md"
  "prove/adversarial/SKILL.md"
  "prove/browser-qa/SKILL.md"
  "prove/coverage-check/SKILL.md"
  "prove/diagnose/SKILL.md"
  "prove/pentest/SKILL.md"
  "prove/performance-check/SKILL.md"
  "prove/report/SKILL.md"
  "prove/judgment/SKILL.md"
  "meta/decision-log/SKILL.md"
  "meta/comprehension/SKILL.md"
  "meta/insight/SKILL.md"
  "meta/health-check/SKILL.md"
  "meta/artifact-lifecycle/SKILL.md"
  "meta/handoff/SKILL.md"
  "meta/workflow-navigation/SKILL.md"
  "meta/memory/SKILL.md"
  "meta/stats/SKILL.md"
  "meta/glossary/SKILL.md"
  "meta/traceability/SKILL.md"
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
  "agents/parallel-work/SKILL.md"
  "agents/subagent-patterns/SKILL.md"
  "commands/discover/SKILL.md"
  "commands/spec/SKILL.md"
  "commands/implement/SKILL.md"
  "commands/check/SKILL.md"
  "commands/docs/SKILL.md"
  "commands/learn/SKILL.md"
  "commands/handoff/SKILL.md"
  "commands/update/SKILL.md"
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

EXPECTED_COMMANDS=(discover spec implement check docs learn handoff update)

for cmd in "${EXPECTED_COMMANDS[@]}"; do
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

registered_commands=()
while IFS= read -r ref; do
  registered_commands+=("${ref##*/}")
done < <(grep -oE '"\./skills/commands/[a-z-]+"' "$SCRIPT_DIR/.claude-plugin/plugin.json" | tr -d '"')

if [ "${#registered_commands[@]}" -ne "${#EXPECTED_COMMANDS[@]}" ]; then
  log_error "plugin.json must register exactly 8 public commands; found ${#registered_commands[@]}"
else
  for cmd in "${EXPECTED_COMMANDS[@]}"; do
    count=$(printf '%s\n' "${registered_commands[@]}" | grep -cx "$cmd" || true)
    if [ "$count" -ne 1 ]; then
      log_error "plugin.json must register command '$cmd' exactly once (found $count)"
    fi
  done
  for cmd in "${registered_commands[@]}"; do
    if [[ ! " ${EXPECTED_COMMANDS[*]} " =~ " $cmd " ]]; then
      log_error "plugin.json registers unexpected public command '$cmd'"
    fi
  done
fi

echo ""

# --- Check 2d: Public commands use the shared workflow-navigation contract ---
echo "## Checking command workflow navigation..."

for cmd in "${EXPECTED_COMMANDS[@]}"; do
  file="$SKILLS_DIR/commands/$cmd/SKILL.md"
  if ! grep -q '^## Workflow Navigation$' "$file"; then
    log_error "commands/$cmd: missing Workflow Navigation section"
  elif ! section_has_literal "$file" "Workflow Navigation" "skills/meta/workflow-navigation/"; then
    log_error "commands/$cmd: navigation section does not load shared workflow-navigation contract"
  else
    log_ok "commands/$cmd: workflow navigation contract present"
  fi
done

echo ""

# --- Check 2e: Shared navigation keeps its non-negotiable routing rules ---
echo "## Checking workflow-navigation guardrails..."

NAVIGATION_FILE="$SKILLS_DIR/meta/workflow-navigation/SKILL.md"
for phrase in \
  "## Closing Contract" \
  "**Outcome:**" \
  "**Recommended next:**" \
  "**Alternatives:**" \
  "spec-only" \
  "Ask before assuming" \
  "Do not route past an unmet prerequisite" \
  "at most two" \
  "all relevant seats" \
  "no-op" \
  "Never imply"; do
  if grep -Fq "$phrase" "$NAVIGATION_FILE"; then
    log_ok "workflow-navigation: retains '$phrase'"
  else
    log_error "workflow-navigation: missing routing guardrail '$phrase'"
  fi
done

echo ""

# --- Check 2f: Shared routes retain prerequisite and terminal-state invariants ---
echo "## Checking workflow-navigation route invariants..."

for invariant in \
  '| `discover`, all relevant seats + council settled' \
  '| `discover`, a material seat unresolved' \
  '| `spec`, artifacts valid but no execution signal' \
  '| `spec`, artifacts valid and user gives an execution signal' \
  '| `check`, verify fail' \
  '| `check`, verification blocked' \
  '| `check`, verification degraded/partial' \
  '| `check`, clean audit' \
  '| `handoff`, blocked' \
  '| `handoff`, degraded' \
  '| `update`'; do
  if grep -Fq "$invariant" "$NAVIGATION_FILE"; then
    log_ok "workflow-navigation: retains route '$invariant'"
  else
    log_error "workflow-navigation: missing route invariant '$invariant'"
  fi
done

echo ""

# --- Check 2g: Each command retains its state-specific safe route ---
echo "## Checking command-specific navigation routes..."

for cmd in "${EXPECTED_COMMANDS[@]}"; do
  file="$SKILLS_DIR/commands/$cmd/SKILL.md"
  case "$cmd" in
    discover) marker="unanswered" ;;
    spec) marker="execution signal" ;;
    implement) marker="offer, not an automatic dispatch" ;;
    check) marker="A clean AUDIT may stop" ;;
    docs) marker="approve or revise that plan" ;;
    learn) marker="Never recommend implementation" ;;
    handoff) marker="only after the user selects it" ;;
    update) marker="Never auto-apply" ;;
  esac
  if grep -Fq "$marker" "$file"; then
    log_ok "commands/$cmd: retains safe route"
  else
    log_error "commands/$cmd: missing state-specific navigation guardrail '$marker'"
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

# --- Check 3: Orchestrator entrypoint is context-bounded and routes progressively ---
echo "## Checking orchestrator context footprint..."

ORCHESTRATOR="$SKILLS_DIR/orchestrator/SKILL.md"
BEHAVIOR_POLICY="$SKILLS_DIR/orchestrator/references/behavior.md"
DELIVERY_POLICY="$SKILLS_DIR/orchestrator/references/delivery.md"
PROJECT_STATE_POLICY="$SKILLS_DIR/orchestrator/references/project-state.md"

orchestrator_lines=$(wc -l < "$ORCHESTRATOR")
orchestrator_bytes=$(wc -c < "$ORCHESTRATOR")
if [ "$orchestrator_lines" -le 150 ] && [ "$orchestrator_bytes" -le 12000 ]; then
  log_ok "orchestrator: context-bounded entrypoint (${orchestrator_lines} lines, ${orchestrator_bytes} bytes)"
else
  log_error "orchestrator: entrypoint exceeds 150 lines or 12000 bytes (${orchestrator_lines} lines, ${orchestrator_bytes} bytes)"
fi

for route in \
  'references/behavior.md' \
  'references/delivery.md' \
  'references/project-state.md'; do
  if grep -Fq "$route" "$ORCHESTRATOR" && [ -f "$SKILLS_DIR/orchestrator/$route" ]; then
    log_ok "orchestrator: progressive route '$route' resolves"
  else
    log_error "orchestrator: progressive route '$route' is missing or unresolved"
  fi
done

if grep -Fq 'Non-software work or discussion without execution intent' "$ORCHESTRATOR"; then
  log_ok "orchestrator: non-coding fast boundary is explicit"
else
  log_error "orchestrator: missing non-coding fast boundary"
fi

agents_lines=$(wc -l < "$SCRIPT_DIR/AGENTS.md")
agents_bytes=$(wc -c < "$SCRIPT_DIR/AGENTS.md")
if [ "$agents_lines" -le 80 ] && [ "$agents_bytes" -le 8000 ]; then
  log_ok "AGENTS.md: context-bounded project router (${agents_lines} lines, ${agents_bytes} bytes)"
else
  log_error "AGENTS.md: exceeds 80 lines or 8000 bytes (${agents_lines} lines, ${agents_bytes} bytes)"
fi

echo ""

# --- Check 3b: Unified mode matrix is canonical and complete ---
echo "## Checking unified mode matrix..."

matrix_headers=$(grep -Fc '| Phase | prototype | vibe | standard | strict | emergency |' "$BEHAVIOR_POLICY" || true)
if [ "$matrix_headers" -eq 4 ]; then
  log_ok "orchestrator behavior: unified matrix has THINK, BUILD, PROVE, and META tables"
else
  log_error "orchestrator behavior: unified matrix must have exactly 4 phase tables (found $matrix_headers)"
fi

REQUIRED_MATRIX_ROWS=(
  "Elicitation" "Context" "Scope guard" "Complexity" "SDLC detector" "Arch analyzer" "Threat model"
  "Constraints" "Anti-patterns" "Written record" "Change plan" "Doc generator" "Execution guard"
  "Verification" "Adversarial" "Security" "Performance"
  "Report" "Decision log" "Comprehension" "Insight" "Memory" "Stats"
)

for phase in "${REQUIRED_MATRIX_ROWS[@]}"; do
  if grep -Fqi "| $phase |" "$BEHAVIOR_POLICY"; then
    log_ok "orchestrator matrix: $phase"
  else
    log_error "orchestrator matrix: missing phase row '$phase'"
  fi
done

echo ""

# --- Check 4: Mode files delegate behavior instead of duplicating the matrix ---
echo "## Checking mode delegation..."

for mode in prototype vibe standard strict emergency; do
  file="$SKILLS_DIR/modes/$mode/SKILL.md"
  if grep -Fq '**Phase behavior**: see the unified mode matrix in `skills/orchestrator/references/behavior.md`.' "$file"; then
    log_ok "modes/$mode: delegates phase behavior to orchestrator"
  else
    log_error "modes/$mode: missing canonical unified-matrix delegation marker"
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

for file in templates/sdd.config.md templates/sdd.legacy.config.md templates/memory.md templates/index.md templates/glossary.md; do
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
