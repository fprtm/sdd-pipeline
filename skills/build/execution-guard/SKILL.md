# Execution Guard

Loop detection, stuck escalation, and progress signals during task execution.

## Loop Detection

Track every approach you attempt for the current task.

**Detection rule**: if you try the same approach (same fix, same strategy) and get the same error 2+ times, you are in a loop.

**On detection**:
```
I've tried [approach] [N] times with the same result:
- Attempt 1: [what happened]
- Attempt 2: [what happened]

The approach isn't working. Options:
A) Try different approach: [describe alternative]
B) Skip this part and flag it for you to investigate
C) You investigate and tell me what to do
```

**Loop thresholds by mode**:

| Mode | Max retries before escalation |
|------|------------------------------|
| prototype | 5 |
| vibe | 3 |
| standard | 3 |
| strict | 2 |
| emergency | 2 |

## Stuck Escalation

If you are making no progress on a sub-task:

1. After 2 failed approaches: surface status.
2. Clearly state: what you tried, why it failed, what options remain.
3. Let the user decide.

Do NOT silently spin. Transparency beats stubbornness.

## Progress Signals

Periodic status updates during execution so the user knows what's happening.

| Mode | Signal Frequency |
|------|-----------------|
| prototype | None |
| vibe | None |
| standard | At key milestones: "Database schema created. Moving to API routes." |
| strict | At every significant decision: "About to create users table with columns: id, email, password_hash, role, created_at. Proceed?" |
| emergency | None |

## Reviewable Chunks — Never Generate More Than Can Be Reviewed

The 10x generation-vs-review gap is not solved by reviewing faster — it's solved by **generating in reviewable units**. A 500-line diff is not reviewable in one pass; five 100-line chunks, each with context, are.

### Chunk Protocol

For medium+ tasks in standard/strict mode, implementation is broken into chunks. Each chunk is:

1. **One behavior or function** — a self-contained piece that implements one spec item (one FSD flow, one API endpoint, one component). Not an arbitrary line count, but a *semantic* unit.
2. **Announced before generation**: `Implementing FSD-003.2 "add to cart" — src/cart/service.ts + src/cart/validation.ts (~60 lines)`
3. **Shown after generation** with its review context:
   - What it implements (spec mapping)
   - Trust tier (🔴/🟡/🟢 from `prove/judgment` §5)
   - Which approved tests it should pass
   - What it assumes from prior chunks
4. **Micro-approval checkpoint** (mode-dependent — see table below)

### Mode Behavior for Chunks

| Mode | Chunking behavior |
|------|-------------------|
| **prototype** | No chunking — generate everything, show the review guide at the end |
| **vibe** | Chunks generated and announced, no pause between them. Full review guide at end. |
| **standard** | Chunks announced and shown. Pause after 🔴 chunks for acknowledgment. 🟡/🟢 chunks proceed with announcement only. |
| **strict** | Every chunk paused for explicit approval before the next begins. |
| **emergency** | No chunking — fix first |

### Chunk Size Guidance

There is no hard line count — semantic coherence matters more than length. But:
- A chunk over ~150 lines (roughly one screenful of diff) should be split further unless it's genuinely one function.
- A chunk under ~20 lines doesn't need a pause — it's trivially reviewable.
- **🔴 chunks are ALWAYS paused** in standard+ modes regardless of size. The trust tier, not the line count, determines whether the developer needs to see it before the next chunk.

### What a Chunk Announcement Looks Like

```
CHUNK 2/5 — Cart validation (FSD-003 edge cases)
  Files: src/cart/validation.ts (CREATE, ~45 lines)
  Trust: 🟡 VERIFY INTENT
  Tests: TEST-031, TEST-032 (approved, currently failing — will pass after this chunk)
  Depends on: Chunk 1 (cart service)
  [code follows]
```

## Review Debt Tracking

Track what the developer has and hasn't reviewed:

- **Acknowledged**: the developer responded to the chunk (approved, commented, or moved on after seeing it). This is a signal they engaged with the code.
- **Unacknowledged**: the chunk was shown but the developer hasn't responded to it specifically. In vibe/prototype mode, everything auto-acknowledges. In standard mode, 🟢 chunks auto-acknowledge; 🔴/🟡 are tracked.
- **Debt**: unacknowledged 🔴 chunks from the current or prior task. Reported in the review guide's "Unreviewed from prior task" line.

**The throttle activates on debt**: if there are 2+ unacknowledged 🔴 chunks and a new 🔴 chunk is about to be generated, pause and state the debt. The developer can override, but the debt is made visible.

This is not about slowing the developer down — it's about making the cost of skipping review visible instead of invisible. Code that ships unreviewed ships anyway if the developer chooses it; what changes is whether they *know* they chose it.

## Session Awareness

Detect rapid iteration (3+ prompts within 2 minutes):

- Switch to lightweight mode: skip elicitation, reuse last context, minimal verification.
- Resume normal depth when iteration pace slows.

This prevents SDD Pipeline from being annoying during "change this... no wait, try this... actually do that" sessions.
