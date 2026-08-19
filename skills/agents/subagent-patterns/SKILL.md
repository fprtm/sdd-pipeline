# Subagent Patterns

For single-agent environments (OpenCode, Cursor, basic setups): patterns to simulate multi-agent benefits through sequential sub-agent spawning.

## Pattern 1: Separation of Concerns

The implementation agent should NOT verify its own work. Separate roles produce better quality.

```
Sub-agent 1 (Analyst):
  "Analyze project context for [task]. Return: stack, conventions, constraints, complexity assessment."
  → context result

Sub-agent 2 (Implementer):
  "Implement [task] given this context: [result from 1]. Follow these constraints: [SDD Pipeline constraints]."
  → code output

Sub-agent 3 (Reviewer):
  "Review this implementation: [code from 2]. Check against spec: [from 1]. Run tests. Report issues."
  → review result
```

**Value**: The implementer can't mark its own homework. Separate review catches issues the implementer is blind to.

## Pattern 2: Red Team

Adversarial testing by a separate agent with an "attacker mindset."

```
Agent 1 (Builder): Implement the feature.
Agent 2 (Attacker): "Try to break this code. Find edge cases, security holes, failure modes."
Agent 1 (Fixer): Fix issues found by Agent 2.
```

**Value**: The builder has construction bias. The attacker has destruction bias. Together they produce more robust code.

## Pattern 3: Specialist Delegation

Delegate specific quality dimensions to focused sub-agents.

```
Main agent: Implement the feature.
Sub-agent A: "Review ONLY for security issues: [code]"
Sub-agent B: "Review ONLY for performance issues: [code]"
Sub-agent C: "Verify ONLY spec conformance: [code] against [spec]"
```

**Value**: Focused attention catches more than a general "review this code" prompt.

## OpenCode Specifics

OpenCode supports spawning sub-agents. Each sub-agent gets:
- A scoped, focused prompt (one concern per sub-agent)
- Relevant context only (not the entire codebase)
- Clear output format expectation

Pass results between sub-agents through the orchestrating agent.

## Tradeoffs

| Aspect | Multi-Agent | Sequential Sub-Agents |
|--------|-------------|----------------------|
| Speed | Parallel = fast | Sequential = slower |
| Quality | Better (separation) | Same quality gain |
| Token cost | Higher (context duplication) | Higher (context passing) |
| Complexity | Framework handles it | You manage the flow |

**Bottom line**: Sequential sub-agents are SLOWER than parallel multi-agent but deliver the SAME quality improvement. The value is in separation of concerns, not speed. For micro/small tasks, skip sub-agents — single agent is fine.
