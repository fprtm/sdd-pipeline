# Strict Mode

Maximum control. For production systems, fintech, healthcare, compliance-sensitive, and security-critical code.

## Behavior

| Phase | Setting |
|-------|---------|
| Elicitation | 5+ thorough questions. Confirm understanding before proceeding. |
| Context | Deep scan. Verify conventions with user. |
| Scope guard | Strict limits. Must justify and get approval for any deviation. |
| Complexity | Detailed breakdown. Must address each sub-task before proceeding. |
| Constraints | All rules visible. Pause and wait for approval on each violation. |
| Anti-patterns | Report each detection with explanation. Fix after acknowledgment. |
| Written record | `changes/{date}-{slug}.md` (small/medium) or the ticket breakdown (large). **MUST be explicitly approved before BUILD**. |
| Change plan | Declare, approve EACH file, re-approve on ANY deviation. |
| Doc generator | Generate full applicable suite (FSD, SDS, PRD, ERD, DoD, test plan). Require review of FSD/SDS before BUILD. |
| SDLC detector | Full adaptation + formal compliance checks. Scrum: require story reference. Waterfall: require traceability. |
| Arch analyzer | Full analysis. Require architecture approval for new projects. Flag all inconsistencies. |
| Stats | Track everything with maximum detail. Show full stats in report. |
| Execution guard | Loop detection after 2 tries. Progress at every significant decision. |
| Verification | All 4 layers + manual review checkpoint. |
| Adversarial | Comprehensive suite: 5-10+ tests. |
| Security | Full checklist + recommend manual security review for production. |
| Performance | Detect, flag, require resolution before proceeding. |
| Report | Detailed report with blind spots and all decisions. |
| Decision log | Log EVERYTHING. Full audit trail. |
| Comprehension | Detailed walkthrough with data flow. |
| Insight | Continuous per-decision analysis. |
| Memory | Save with detailed context. |

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

Plan MUST be explicitly approved before BUILD proceeds:

```
Change file written to docs/sdd/changes/2026-08-23-payment-refund.md.

Please review the plan and confirm:
- Scope is correct
- Architecture approach is acceptable
- Document suite is appropriate

Approve? (yes/no/modify)
```

No proceeding without explicit approval. "yes", "approved", "go", "lgtm" = approved.

## When to Use

- Production deployments
- Financial systems (payments, transactions)
- Healthcare / compliance systems
- Security-critical code (auth, encryption, access control)
- Any code where a bug = significant real-world impact
