# AI Output Judgment

Force explicit human judgment on AI-generated output. Verification (types/tests/lint) proves the code *runs* — judgment proves a human *understands and accepts* it. These are different gates, and skipping the second one is how comprehension debt accumulates.

## Why This Exists — The Evidence

Cited findings on AI-generated code (same sources as `README.md`'s problem statement — kept in sync, don't restate the numbers without the citation):

| Finding | Source | Implication for judgment |
|---|---|---|
| AI-generated code carries ~1.7x more defects per pull request than human-written code | [GitClear, 2025](https://www.gitclear.com/ai_assistant_code_quality_2025_research) | Security-sensitive AI output needs *harder* scrutiny than human code, not equal |
| AI-generated code contains ~2.74x more vulnerabilities than human-written code, XSS the worst category | [Veracode, 2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/) | Some vulnerability classes need a dedicated, named check |
| ~45% of AI-generated code samples contained at least one exploitable vulnerability | [Veracode, 2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/) | "It passed tests" is not "it's safe" |
| Developers using AI assistants wrote measurably less secure code while reporting *higher* confidence in its security | [Perry et al., Stanford, 2023](https://arxiv.org/pdf/2211.03622) | Confidence after AI assistance is a bias signal, not an evidence signal |

Two further observations this gate is built around, without a single cited figure behind them: AI output is syntactically clean and well-formatted — the exact surface signal reviewers historically used as merge confidence, so it must be explicitly discounted as evidence of correctness (the **plausibility trap**) — and AI generates code far faster than a human reviews it, so generation has to be throttled to review capacity or review becomes theater. Comprehension debt — the gap between code in the repo and code the team actually understands — compounds with every merged change nobody can explain, working or not.

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
- **Does every specific value here trace back to something the user actually settled, or did I fill in a plausible default?** Status codes, cascade rules, thresholds, error messages, field names — a value that "sounds right for this kind of feature" but wasn't actually confirmed during deliberation is exactly the kind of drift the plausibility trap produces, because it reads as correct without being correct. If unsure whether a specific value was settled or assumed, say so — don't round it up to "settled" because it's plausible.

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

**Review debt tracking**: when the review guide is produced (§5), it also checks whether the *prior* task's review guide had any 🔴 items the user hasn't acknowledged. Stacking unreviewed 🔴 code is the specific failure mode this throttle exists to prevent — light-scan 🟢 code stacking is fine; unacknowledged auth changes stacking is not. State the debt in the review guide's "Unreviewed from prior task" line.

### 5. Review Guide — The Developer's Verification Map

The comprehension aid explains *what was built*. The review guide tells the developer *what to verify and where to focus*. Without it, the developer either reads everything at equal depth (impossible at 10x generation speed) or skims and hopes (theater, not review).

**Produce a review guide for every task that generated code**, appended to the verification report alongside the judgment block. Skip only for micro tasks and emergency fixes (those get the review guide in the post-fix follow-up).

#### Trust Tiers — Not All Code Needs Equal Review Depth

Tag every changed file (or function, for large files) with a tier:

| Tier | Tag | Criteria | Developer action |
|------|-----|----------|------------------|
| 🔴 | **DEEP REVIEW** | Auth/session/token, payment/financial, data mutation at trust boundary, crypto, SQL construction, deserialization, anything touching a High/Critical SEC control | Read every line. Verify logic, not just shape. |
| 🟡 | **VERIFY INTENT** | Business logic, validation rules, error handling, state transitions, API contract implementation | Verify the logic matches the spec. Tests should cover it — check that they do. |
| 🟢 | **LIGHT SCAN** | Boilerplate, config, type definitions, re-exports, pure UI layout with no logic, scaffolding, test fixtures | Scan for anything surprising. If nothing stands out, move on. Tests covering it raise confidence further. |

Tier assignment follows the same zones as Security Prior Escalation (§3) — code that would get flagged for security review is always 🔴. The tiers exist so the developer spends 80% of their review time on the 20% of code that actually carries risk.

#### Review Guide Format

```
### Review Guide

**Review order** (most critical first):
1. 🔴 `src/checkout/service.ts:42-78` — order creation + payment charge
   Implements: FSD-003 "checkout flow" · Ticket: TICKET-018
   VERIFY: order total computed server-side (ADR-005), idempotency key present
   RISK: double-charge if retry logic is wrong

2. 🔴 `src/auth/middleware.ts:15-30` — session validation change
   Implements: SEC-002 "session integrity"
   VERIFY: token expiry check matches auth spec, no bypass path

3. 🟡 `src/cart/validation.ts:12-40` — cart validation rules
   Implements: FSD-003 edge case "empty cart", "max quantity"
   VERIFY: error responses match FE↔BE contract
   COVERED BY: TEST-031, TEST-032 (positive + negative)

4. 🟢 `src/checkout/types.ts` — TypeScript interfaces
   Matches: FE↔BE contract from arch deliberation
   Covered by type-checking — light scan only

5. 🟢 `src/checkout/index.ts` — re-exports
   No logic — skip unless something looks wrong

**Spec coverage**: 4/4 FSD flows mapped · 2/2 SEC controls mapped
**Test coverage for 🟡 items**: 3/3 have positive + negative cases
**Unreviewed from prior task**: none
```

#### Rules for the Review Guide

1. **Every 🔴 item names the specific thing to verify** — not "review this file" but "verify that X does Y because Z." A review guide that just lists files with trust tiers is a legend, not a guide.
2. **Every 🟡 item names its test coverage** — if tests exist for it, say which ones. The developer can review the test instead of the implementation.
3. **Map every item to a spec item** (FSD, SEC, ticket, ADR). A code change with no spec mapping is either scope creep or a missing spec — both worth flagging.
4. **State the review order explicitly** — most critical first, not file order. The developer who runs out of review time should have covered the highest-risk code.
5. **Include "unreviewed from prior task"** — if the prior task's code hasn't been reviewed yet, say so. Stacking unreviewed code is how comprehension debt compounds invisibly.

## Output Addition to Report

Append to the verification report (`skills/prove/report/`):

```
### Review Guide
[Trust-tiered file list with spec mapping, verification targets, and review order — see §5 format]

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
