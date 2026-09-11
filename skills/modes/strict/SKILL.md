# Strict Mode

Maximum control. For production systems, fintech, healthcare, compliance-sensitive, and security-critical code.

**Phase behavior**: see the unified mode matrix in `skills/orchestrator/SKILL.md`. This file adds process rules unique to strict mode.

## Checkpoint Pattern

In strict mode, the agent pauses at every significant decision point:

```
I'm about to [action]. Here's my reasoning:
- [rationale]
- Alternatives considered: [list]
- Risk: [what could go wrong]

Proceed?
```

The user must acknowledge before the agent continues. This creates a complete audit trail.

## Plan Handling

Plan MUST be explicitly approved before BUILD proceeds. No proceeding without explicit approval. "yes", "approved", "go", "lgtm" = approved.

## When to Use

- Production deployments
- Financial systems (payments, transactions)
- Healthcare / compliance systems
- Security-critical code (auth, encryption, access control)
- Any code where a bug = significant real-world impact
