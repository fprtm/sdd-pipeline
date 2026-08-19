# AI Output Judgment

Force explicit human judgment on AI-generated output. Verification (types/tests/lint) proves the code *runs* — judgment proves a human *understands and accepts* it. These are different gates, and skipping the second one is how comprehension debt accumulates.

## Why This Exists — The Evidence

Research on AI-generated code (2025-2026) establishes concrete priors:

| Finding | Implication for judgment |
|---------|--------------------------|
| AI code carries ~1.7x more defects than human code; XSS 2.74x, password mishandling 1.88x more likely | Security-sensitive AI output needs *harder* scrutiny than human code, not equal |
| ~45% of AI-generated code contains at least one vulnerability | "It passed tests" is not "it's safe" |
| Developers using AI assistants write less secure code while feeling *more* confident ("false sense of security") | Confidence after AI assistance is a bias signal, not an evidence signal |
| AI output is syntactically clean and well-formatted — the exact surface signals reviewers historically used as merge confidence | **Plausibility trap**: neatness must be explicitly discounted as evidence of correctness |
| AI generates 140-200 lines/min vs. human review capacity of a fraction of that | Generation speed must be throttled to review capacity, or review becomes theater |
| Comprehension debt: the gap between code in the repo and code the team actually understands | Every merged change a human can't explain is debt, regardless of whether it works |

## The Judgment Gate

After PROVE verification passes, before the task is considered done, run this gate:

### 1. Explain-Back Check

The comprehension aid (`skills/meta/comprehension/`) is not optional reading — it's the judgment instrument. The gate question:

> **Could the user explain to a colleague what this change does, why it's shaped this way, and where it would break?**

- **standard mode**: present the comprehension aid and the 1-3 judgment questions below. Proceed after presenting — user can interrupt.
- **strict mode**: ask the user to confirm understanding explicitly before closing the task. An unread diff is an unaccepted diff.
- **vibe mode**: comprehension aid written to file; judgment questions included in the footer as "check:" items.

### 2. Plausibility Discount

Explicitly self-audit against the plausibility trap before presenting results:

- Does this *look* done because it's complete, or because it's neat?
- Which parts did I generate from pattern-memory rather than from this project's actual context? (Those are the hallucination-risk zones — name them.)
- What would a hostile reviewer poke at first?

Name the weakest part of the output in the report. Every report must contain a "weakest point" line — an output with no named weak point means the self-audit didn't happen.

### 3. Security Prior Escalation

Because AI output statistically under-performs on security, any AI-generated change touching these zones gets flagged for human eyes **even when all automated checks pass**:

- Auth/session/token handling
- Input crossing a trust boundary (user input, external API responses, file uploads)
- Anything cryptographic
- Deserialization, HTML rendering, SQL construction

Flag format: "This change touches [zone]. Automated checks passed, but this is a category where AI-generated code statistically fails most — recommend human review of [specific lines/behavior]."

### 4. Review-Capacity Throttle

Do not generate faster than the user can judge:

- If the previous task's output hasn't been acknowledged/reviewed and the next task would produce another large diff, pause and say so: "You haven't reviewed the last change — stacking another large diff on top makes both effectively unreviewable. Continue anyway?"
- Multi-agent dispatch multiplies output volume — the agent cap in `skills/agents/orchestration/` exists partly for this reason. More agents than review capacity = comprehension debt factory.
- User can always override (see orchestrator's override policy) — the throttle informs, never blocks.

## Output Addition to Report

Append to the verification report (`skills/prove/report/`):

```
### Judgment
- Weakest point: [the one part of this change most worth a human's skepticism]
- Hallucination-risk zones: [APIs/patterns generated from memory, not verified against this project]
- Security escalation: [none | zones touched + what to manually check]
- Comprehension check: [the 1-3 questions a reviewer should be able to answer]
```

## Mode Behavior

| Mode | Judgment Gate |
|------|---------------|
| prototype | Skip — but note in final output: "prototype code, unjudged" |
| vibe | Silent self-audit; weakest point + check items surface in footer |
| standard | Full gate. Comprehension aid + judgment block in report. |
| strict | Full gate + explicit user confirmation of understanding before task closes. |
| emergency | Post-fix only: name the weakest point of the fix so it gets reviewed when calm. |

## Rules

1. Judgment is about the *human's* understanding, not the AI's confidence. High model confidence is not a substitute.
2. Never present neatness as evidence. "Clean, well-structured code" is a formatting fact, not a correctness claim.
3. The weakest-point line is mandatory in every judged report. "No weaknesses" is not an acceptable answer — every change has a most-fragile part.
4. This gate produces information, not refusals. If the user wants to merge unjudged, log it (decision log if it passes rule-of-three) and proceed.
