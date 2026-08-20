# SDLC Detector

Detect the project's development methodology and adapt SDD Pipeline behavior accordingly.

## Detection Strategy

**Priority: project config > auto-detect > ask once > default**

### 1. Check Project Config

```
# In docs/sdd/config.md
sdlc: scrum | kanban | waterfall | solo | none
```

If declared, use it. Skip detection.

### 2. Auto-Detect from Signals

Scan project for methodology indicators:

| Signal | Indicates |
|--------|-----------|
| `.jira/`, `jira.yml`, `atlassian-ide-plugin.xml` | Scrum/Agile |
| `.linear/`, Linear webhook configs | Scrum/Agile |
| `.github/ISSUE_TEMPLATE/` with sprint/story-point labels | Scrum |
| `.azure-boards/` config | Scrum/Agile |
| `ROADMAP.md` with iteration markers | Scrum/Agile |
| `.github/project.yml` with column states (To Do/In Progress/Done) | Kanban |
| WIP limits in board or CI configs | Kanban |
| `.trello/`, `trello.json` | Kanban |
| `.shortcut/` (ex-Clubhouse) | Kanban |
| `docs/requirements.md` + `docs/design.md` + `docs/test-plan.md` | Waterfall |
| Numbered phase dirs (`01-requirements/`, `02-design/`) | Waterfall |
| `CHANGE_REQUEST.md`, `sign-off.md` | Waterfall |
| `V&V/` (verification & validation) directory | Waterfall |
| No issue templates, no project boards, no CI | Solo |
| Single `TODO.md` or scattered TODO comments only | Solo |
| No `CONTRIBUTING.md`, no PR templates | Solo |

**Multiple signals**: Weight by count. If ambiguous, ask the user once and save to memory.

### 3. Ask Once, Save

If no signals found, ask — per `skills/think/elicitation/`'s "How to Ask" rule: native question tool first, plain text only as fallback:

```
"I couldn't detect your development methodology. Which do you use?"
- Scrum (sprints, backlog, stand-ups)
- Kanban (continuous flow, WIP limits)
- Waterfall (sequential phases, formal docs)
- Solo / None (no formal process)
```

Save answer as a note in `docs/sdd/memory/` (update INDEX.md). Don't ask again.

## Behavior Adaptation

### Scrum

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | Sprint-boundary aware. Flag if task scope exceeds reasonable sprint work. Reference backlog items when available. |
| **Elicitation** | Reference sprint goals. Ask "is this in the current sprint?" for ambiguous tasks. |
| **Change Plan** | Include sprint context. Flag if change affects other sprint items. |
| **Report** | Sprint-review friendly format. Summarize in terms of story completion. |
| **Decision Log** | Tag decisions with sprint number when detectable. |

### Kanban

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | WIP-limit aware. One task at a time. Flag if task is actually multiple items. |
| **Elicitation** | Focus on single deliverable. "What's the one thing this should do?" |
| **Change Plan** | Single-piece flow. Minimize parallel changes. |
| **Report** | Compact. Ready-to-move format (done criteria clear). |
| **Execution Guard** | Shorter loop thresholds. Fast feedback loops. |

### Waterfall

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | Formal change request awareness. Flag scope changes that need sign-off. |
| **Elicitation** | Reference requirements documents. More formal questioning. |
| **Change Plan** | Formal format. Include traceability to requirements. |
| **Doc Generator** | Always generate SDS for architecture changes. Reference existing design docs. |
| **Report** | Formal test report format. Map to test plan items. |
| **Decision Log** | Include approval status. Flag decisions that need stakeholder sign-off. |

### Solo / None

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | Minimal ceremony. Focus on preventing scope creep without process overhead. |
| **Elicitation** | Casual, direct. Fewer questions. |
| **Change Plan** | Brief. No formality requirements. |
| **Report** | Concise. Skip ceremony. |
| **Decision Log** | Lightweight entries. |

## Mode Interaction

| Mode | SDLC Impact |
|------|-------------|
| **prototype** | SDLC detection runs but adaptations are minimal — speed first |
| **vibe** | SDLC adapts silently. No ceremony shown to user. |
| **standard** | Full SDLC adaptation. Context shown in plan. |
| **strict** | Full SDLC adaptation + formal compliance checks. Waterfall: require traceability. Scrum: require story reference. |
| **emergency** | SDLC skipped. Fix first, process later. |

## Output

Pass detected SDLC to all downstream skills as context:

```
SDLC: scrum
Sprint: current (if detectable)
Adaptation: sprint-boundary scope, formal change plan, story-tagged decisions
```

## Override

User can always override per-task:

```
"ignore SDLC for this task"
"treat this as waterfall even though we're scrum"
```

Override applies to current task only. Not saved to memory.
