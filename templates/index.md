# SDD Pipeline Project Index

Lightweight relationship graph for AI navigation — **read this first**, match the task to a row by its one-line description, open only that file. Updated automatically after each task; a doc without an index row is invisible (`check-file-hygiene.mjs` flags it).

**Row format (every entry, every section):** `- [file](path) — one-line description · status`
The description is the hook a future session matches against — write it for that reader, not as a title repeat.

## Active Work

_No active plan._

## Canonical Documents

_No features spec'd yet. One row per `specs/{NNN}-{slug}/` folder — link the folder, not each fsd/sds/erd file inside it; the folder's own contents (or its `tickets/00-index.md` for large scope) is where the per-file breakdown lives._

## Decisions

_No decisions logged yet. One row per `decisions/` file (ADR-NNN — what was decided)._

Completed changes, tickets, handoffs, and deliberation ledgers are removed from
active navigation after guarded retirement. Do not add a Recent Activity log;
Git is the default history.

## Memory

_See [memory/INDEX.md](memory/INDEX.md) — the knowledge-graph map lives there, not here._

## Glossary

_No domain terms pinned down yet. See [glossary.md](glossary.md) once created._

## Architecture

_Not yet analyzed. Will be populated after first architecture-impacting task._

---

_This file is auto-maintained by SDD Pipeline. It is a bounded map of active
work and canonical truth, not a history ledger._
