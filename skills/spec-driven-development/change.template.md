<!--
  TEMPLATE for a lite/brownfield change — copy to:
    docs/sdd/changes/YYYY-MM-DD-<topic-slug>.md
  Rules:
    - Date-prefix the filename (folder stays chronological); kebab slug; ONE topic
      per file. Don't spawn a near-duplicate ("-v2-ux") — update this file, or use
      a clearly distinct slug.
    - This file is SELF-CONTAINED: it carries its own mini gate board + IDs +
      decisions. Do NOT put them in 00-overview.md — that file only gets ONE index
      row pointing here (avoids the shared-file conflict + unbounded growth).
    - Fill the `description` in frontmatter with one relevance line: a future
      session reads the index, matches on that line, and only then opens this file.
    - Docs/spec prose may be in the user's language; identifiers, JSDoc, and commit
      messages are English.
-->
---
title: <Topic — short human title>
description: <ONE line — what this change is, so the index alone tells a future reader whether to open this file>
status: discovery | speccing | building | verifying | shipped
size: lite | quick
branch: <type/short-slug>
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
---

# <Topic — short human title>

> **Ringkasan (bahasa awam):** _2–4 kalimat: apa yang berubah dan kenapa, untuk
> non-teknis. (User-facing summary in the user's language is fine.)_

## Locked decisions
_One line each; link the decision file if a full one was written._
1. …

## Requirements (REQ-<AREA>-n)
- **REQ-<AREA>-1** — <user + why + acceptance criterion>

## Functional spec (FSD-<AREA>-n)
- **FSD-<AREA>-1** (⇐ REQ-<AREA>-1) — <exact fields/types, per-endpoint shape,
  error/alternate flows — concrete enough a cheap model won't hallucinate>

## Mini gate board (only the phases that actually run)
| Phase | State | Note |
|-------|-------|------|
| Discover | ✅/🟨/⬜ | |
| Spec (REQ/FSD) | | |
| Arch/Design | respect-existing / n/a | schema/UX only if data/UI touched |
| Security | | skip only if genuinely no new flow/permission |
| Backlog | | TICKET-<AREA>-n |
| Test plan | | TEST-<AREA>-n |
| Implement | | |
| Verify | | coverage + review |

## Backlog (TICKET-<AREA>-n)
- **TICKET-<AREA>-1** (⇐ FSD-<AREA>-1) [T1/T2/T3] — <smallest change that
  satisfies it; name the exact files/functions to touch>

## Test plan (TEST-<AREA>-n)
- **TEST-<AREA>-1** (⇐ TICKET-<AREA>-1) — Given/When/Then. **Local DB only.**

## Traceability (inline)
| REQ | FSD | TICKET | TEST | State |
|-----|-----|--------|------|-------|
| REQ-<AREA>-1 | FSD-<AREA>-1 | TICKET-<AREA>-1 | TEST-<AREA>-1 | 🟥/🟩 |

## Docs touched
_Definition of Done includes docs. Check first: exists → update; missing → create._
- User: `docs/user/<feature>.md` — <created/updated/n-a>
- Developer: `docs/dev/…` + inline JSDoc (English) — <created/updated/n-a>
