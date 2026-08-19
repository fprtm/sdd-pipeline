# Verification Report

Generate a concise, actionable verification report. NOT a verbose document — a focused summary that helps the human make informed decisions.

## Report Format

```markdown
## SDD Pipeline Verification Report

**Verdict: [PASS / FAIL / PASS WITH WARNINGS]** — Confidence: [HIGH / MEDIUM / LOW]

### Checks run
- Types: [PASS/FAIL/SKIPPED]
- Tests: [PASS/FAIL/SKIPPED] — [N/M passed]
- Lint: [PASS/FAIL/SKIPPED] — [N issues]
- Spec conformance: [PASS/FAIL/SKIPPED] — [N/M requirements covered]
- Security: [PASS/FAIL/SKIPPED] — [N findings]
- Performance: [PASS/FAIL/SKIPPED] — [N concerns]
- Adversarial: [PASS/FAIL/SKIPPED] — [N/M passed]

### You should verify (top 2-3)
1. [Specific thing to check] — [how to check it]
2. [Specific thing to check] — [how to check it]

### Not tested (blind spots)
- [What wasn't tested] — [why: not configured / out of scope / env limitation]

### Key decisions
- [Decision]: [rationale, 1 sentence]
```

## Rules

1. **"You should verify"** = things ONLY a human can judge. Examples: "Does the UX feel right?", "Is the error message helpful?", "Does this match the business requirement for X?"
2. **"Not tested"** = explicit blind spots. This prevents false confidence. If verification was incomplete, say so.
3. **Max 20 lines** for standard mode. Brevity is a feature.
4. **Confidence levels**:
   - HIGH: all layers passed, good coverage, no blind spots in critical areas
   - MEDIUM: some layers passed or skipped, gaps in coverage
   - LOW: minimal verification, many unknowns

## Mode-Specific Output

| Mode | Format |
|------|--------|
| prototype | 1 line: "Works." or "Broken: [error]" |
| vibe | 1-line verdict + 1 "you should verify" item |
| standard | Full report (~15-20 lines) |
| strict | Detailed report with all sections + blind spots + all decisions |
| emergency | 1 line: "Fix applied. [test result]." |

## Anti-Pattern: False Confidence

NEVER generate a report that implies completeness when verification was partial. If you only ran 2 of 4 layers, say "Confidence: LOW" even if those 2 layers passed. Honesty about gaps is more valuable than a green checkmark.
