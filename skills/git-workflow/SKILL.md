---
name: git-workflow
description: >-
  Commit, branch, and PR conventions tied to the backlog and traceability — one
  commit per ticket (or logical step), messages that reference TICKET-xxx/FSD-xxx
  and explain why, and a PR description generated from what actually shipped. Use
  during phase 8 (implement) whenever there's something to commit, and at phase 11
  (ship) for the PR/changelog. Also triggers on "commit this / make a PR / write a
  commit message / what should the branch be called".
---

# git-workflow — commits and PRs that trace back to the spec

Your standard git safety rules always apply first (never force-push, never skip
hooks, confirm before anything destructive or shared). This skill is about
**shape**, not safety: how commits and PRs in this pipeline stay traceable to
the ticket/FSD/decision that caused them.

## Commit granularity

**One commit per ticket** (or per clearly separable step within a large T3
ticket) — not one giant commit at the end of a session. Each commit should be
revertable on its own without breaking the tree. If `implement` is working
through a wave of parallel-safe tickets, each still gets its own commit.

## Commit message

```
<type>(<scope>): <what changed, imperative mood>

<why — the decision or bug this closes, in a sentence or two. Skip if the
subject line already makes it obvious.>

Refs: TICKET-018, FSD-012 [, SEC-008 if a security control was touched]
```

- **Always write the commit message in English** — subject, body, and scope —
  even when the specs and conversation are in another language. Commit history is
  a code-level artifact (like identifiers and JSDoc); English keeps it portable
  and reviewable. Same for branch slugs.
- `<type>`: `feat`, `fix`, `refactor`, `test`, `docs`, `chore` — pick the one
  that matches what most of the diff is.
- **Why, not what** — the diff already shows what changed; the message earns
  its place by saying why (same rule as code comments in `code-standards`).
- Reference the ticket/FSD id so `git log` doubles as a traceability trail
  without needing the matrix open. Include the SEC id if the commit closes a
  security control — makes `coverage-check` easier to audit later.
- Bug fixes: reference what regression test (`TEST-xxx`) now guards it.

## Branch naming

`<type>/<ticket-id>-<short-slug>` — e.g. `feat/ticket-018-share-link`,
`fix/ticket-031-idle-snooze`. If there's no ticket (a `quick`-mode fix), use the
short-slug alone: `fix/contact-form-typo`.

## Pull request

Generate the PR description from what actually happened, not a template guess:

- **Summary** — 1–3 bullets, plain language first (borrow the CHANGE doc's or
  the FSD's plain-language summary if one exists).
- **What changed** — the ticket(s)/FSD(s) covered, and which traceability rows
  now flip toward green (cite them; don't just assert "done").
- **Test plan** — what was actually run (`coverage-check` gate result, the
  specific `TEST-xxx` that prove the acceptance criteria), not a generic
  checklist.
- **Security** — note any `SEC-xxx` touched and how it was verified.
- Never claim coverage or a passing gate that wasn't actually run this session.

## Self-sufficient, but prefers a specialized skill if present

If a dedicated git/branch-finishing skill is installed (e.g. mattpocock's
`finishing-a-development-branch`), prefer it for the mechanics of wrapping up a
branch (cleanup, merge strategy) — but keep using *this* skill's message/PR
conventions so the trail stays traceable to the spec either way.

## Exit

Every commit in the session's work is traceable to a ticket/FSD/decision by
its message; the PR description (if one is opened) is generated from the real
gate results, not asserted.
