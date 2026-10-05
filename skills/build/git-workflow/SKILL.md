# Git Workflow — Commits and PRs That Trace Back to the Spec

Standard git safety rules always apply first (never force-push, never skip hooks, confirm before anything destructive or shared). This skill is about **shape**: how commits and PRs stay traceable to the ticket/FSD/decision that caused them. Applies whenever there's something to commit, and at ship time for the PR/changelog.

**Confirm before every commit, explicitly, in this skill — not inherited from the harness.** Some environments auto-confirm commits by default; this framework never assumes that. Show what's about to be committed (files + the drafted message) and wait for a go-ahead, unless the user already pre-authorized a batch of work in this session ("commit as you go", "kerjain semua ticket-nya"). This applies identically across every harness sdd-pipeline runs in — the rule lives here, not in harness defaults.

## Commit Granularity

**One commit per ticket** (or per clearly separable step within a large ticket) — not one giant commit at session end. Each commit revertable on its own without breaking the tree. Parallel agents working a wave of tickets: each ticket still gets its own commit.

## Commit Message

```
<type>(<scope>): <what changed, imperative mood>

<why — the decision or bug this closes, in a sentence or two. Skip if the
subject line already makes it obvious.>

Refs: TICKET-018, FSD-003 [, SEC-008 if a security control was touched]
[Closes #42 — only if the ticket was mirrored to a GitHub Issue]
```

- **Always English** — subject, body, scope, branch slugs — even when specs and conversation are in another language. Commit history is a code-level artifact (like identifiers and JSDoc); English keeps it portable and reviewable.
- `<type>`: `feat` / `fix` / `refactor` / `test` / `docs` / `chore` — whatever most of the diff is.
- **Why, not what** — the diff already shows what changed; the message earns its place by saying why.
- Cite the ticket/FSD ID so `git log` doubles as a traceability trail without the matrix open. Include the SEC ID when a commit closes a security control. Bug fixes cite the regression test (`TEST-xxx`) that now guards them.
- Small/micro tasks with no ticket: skip `Refs:`, keep type/scope/why.

## Branch Naming

`<type>/<ticket-id>-<short-slug>` — e.g. `feat/ticket-018-share-link`. No ticket (a micro fix): short slug alone, `fix/contact-form-typo`. Always English.

## Pull Request

Generate the description from what **actually happened**, not a template guess:

- **Summary** — 1–3 bullets, plain language first (borrow the FSD's plain-language summary if one exists).
- **What changed** — the ticket(s)/FSD(s) covered; which traceability rows now flip toward green (cite them, don't just assert "done").
- **Test plan** — what was actually run: the coverage-check gate result, the specific TEST-xxx proving the acceptance criteria — not a generic checklist.
- **Security** — any SEC-xxx touched and how it was verified.
- **Never claim coverage or a passing gate that wasn't actually run this session.**

## Composes, Doesn't Compete

If a dedicated git/branch-finishing skill is installed (e.g. mattpocock's `finishing-a-development-branch`), prefer it for branch mechanics (cleanup, merge strategy) — but keep this skill's message/PR conventions so the trail stays traceable either way.

## Exit

Every commit in the session's work is traceable to a ticket/FSD/decision by its message; the PR description (if opened) is generated from real gate results, not asserted.
