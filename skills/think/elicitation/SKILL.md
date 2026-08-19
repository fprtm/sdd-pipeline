# Elicitation

Adaptive questioning before coding starts. Ask the right number of questions based on task complexity.

## Rules

1. Check `docs/sdd/memory/INDEX.md` FIRST (open only the matching notes). If a saved decision answers a question, use it silently.
2. Determine task size from the orchestrator's assessment.
3. Ask the number of questions appropriate for that size.
4. If user answers "I don't know" or "you decide" to any question: fall back to building the simplest viable version and iterating from feedback.

## Questions by Task Size

### Micro (0 questions)
Proceed immediately. No clarification needed.

### Small (0-1 questions)
Ask only if the prompt is genuinely ambiguous. Examples of when to ask:
- "Fix the bug" but multiple bugs exist → "Which bug? [list recent errors]"
- "Update the style" but no specifics → proceed with reasonable interpretation

### Medium (2-3 questions)
Ask about:
1. **What specifically**: "You said [X]. Does that include [Y]? What about [Z]?"
2. **Scope boundary**: "Should this also handle [edge case], or just the basic flow?"
3. **Existing pattern**: "I see the project uses [pattern]. Should I follow that or do something different?"

### Large (3-5 questions)
Ask about:
1. **Users**: "Who uses this? What's their main goal?"
2. **Requirements**: "What are the must-haves vs nice-to-haves?"
3. **Constraints**: "Any technical constraints? (specific DB, framework, API compatibility)"
4. **Success criteria**: "How will we know this is done and correct?"
5. **Scale**: "Expected data volume / user count / request rate?"

## Question Style

- Frame questions in terms the user understands. Non-technical users get non-technical questions.
- BAD: "Should I use REST or GraphQL for the API layer?"
- GOOD: "Should the data be fetched as needed (faster for small datasets) or all at once (better for complex filtering)?"
- Always offer a recommendation: "I'd suggest [X] because [reason]. Sound good?"

## Fallback: "I Don't Know" Protocol

When user can't answer:
1. State: "I'll build the simplest version that works."
2. List your assumptions explicitly.
3. Build it.
4. After delivery: "Here's what I assumed: [list]. Tell me what to change."

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Skip entirely |
| vibe | 0-1 questions. Auto-infer. Only ask if genuinely blocked. |
| standard | Full adaptive questioning per task size |
| strict | Ask thoroughly. Confirm understanding before proceeding. |
| emergency | Skip entirely. Focus on the error. |
