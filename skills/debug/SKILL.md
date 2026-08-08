---
name: debug
description: >-
  Find the root cause of a bug or failure systematically — reproduce, isolate,
  hypothesize, prove, fix, and lock it with a regression test. Use when a test
  fails, something throws/misbehaves/is slow, or the user says "debug / diagnose /
  why is this broken / it's not working". Self-sufficient; defers to an installed
  debugging skill (mattpocock diagnosing-bugs, superpowers systematic-debugging).
---

# debug — evidence over guessing

Bugs are solved by evidence, not by changing things until they seem to work. The
goal is the **root cause**, not a symptom that quiets down. Resist the urge to
shotgun edits.

> **Defer if a better tool exists.** If a dedicated debugging skill is installed
> (mattpocock `diagnosing-bugs`, superpowers `systematic-debugging`), use it and
> treat this as the checklist. Otherwise, run the loop below.

## The loop

1. **Reproduce reliably.** Find the smallest, deterministic way to trigger it. A
   bug you can't reproduce, you can't confirm you've fixed. Capture exact
   input/state/steps and the exact error/behavior. **Read the actual error and
   stack trace** — most of the answer is usually there.
2. **Observe, don't assume.** Gather evidence: logs, the failing test output,
   values at the boundary. State what you *know* vs. what you *suspect*.
3. **Form one hypothesis** — a specific, falsifiable claim about the cause
   ("the token hash is compared before trimming, so … "). One at a time.
4. **Test the hypothesis cheaply** — a targeted log, a unit test, a `git bisect`,
   or narrowing by binary search (disable half, see which half holds the bug).
   Let the result confirm or kill the hypothesis; if killed, form the next.
5. **Confirm the root cause** — you can explain the full chain from cause to
   symptom, and you can turn the bug on and off by touching that cause. Don't stop
   at the first change that makes the symptom disappear — verify it's the cause,
   not a coincidence.
6. **Fix at the root**, minimally and per `code-standards` + the stack guide. Fix
   the cause, not just the visible symptom; check for the same bug elsewhere.
7. **Lock it with a regression test.** Every fixed bug gets a failing-then-passing
   test (a new `TEST-xxx`, class: regression) so it can never silently return.
8. **Verify & record.** Re-run the suite; confirm the symptom is gone and nothing
   else broke. Update `traceability` (the new test), and if the bug revealed a
   spec gap or wrong assumption, log it in `decision-log` and fix the owning doc.

## Performance issues

Same loop, but **measure first** — profile/time to find the actual hot path;
never optimize by guess. Confirm the fix against the metric (e.g. the REQ-NF
latency target), then keep a check so it doesn't regress.

## Anti-patterns to avoid
- Changing several things at once (you won't know what worked).
- "Fixing" by adding a try/catch that swallows the symptom.
- Trusting a fix with no reproduction and no test.
- Blaming the framework/library before ruling out your own code with evidence.

## Exit
Root cause explained and fixed at the source; a regression test proves it and is
green; the suite still passes; traceability updated. If it exposed a spec/assumption
error, that's recorded and the owning doc corrected.
