# Complexity Analyzer

Detect hidden complexity beyond the surface prompt. Prevent under-estimating tasks.

## How It Works

Analyze what the task ACTUALLY involves, not just what the prompt says. Simple-sounding requests often hide significant complexity.

## Common Hidden Complexity Patterns

| Prompt says | Actually involves |
|-------------|-------------------|
| "add search" | Full-text indexing, query parsing, ranking, pagination, highlighting, debouncing |
| "add date picker" | Timezone handling, locale formatting, validation, accessibility, state management |
| "add auth" | OAuth flows, session management, password hashing, RBAC, token refresh, password reset |
| "add file upload" | Storage backend, size limits, type validation, virus scanning, CDN, thumbnails, progress |
| "add notifications" | Multiple channels (email/push/SMS), user preferences, queuing, templates, unsubscribe |
| "add payments" | PCI compliance, webhooks, refunds, invoicing, tax calculation, currency handling |
| "add real-time" | WebSocket management, reconnection, state sync, conflict resolution, scaling |
| "add multi-language" | i18n framework, string extraction, RTL support, date/number formatting, language detection |
| "add export to PDF" | Layout engine, font embedding, image handling, pagination, styling |
| "add drag and drop" | Touch support, accessibility, reorder persistence, animation, nested containers |

## Process

1. Parse the task prompt for known complexity triggers (table above).
2. List ALL sub-tasks the prompt implies but does not state.
3. If hidden complexity found: escalate task size (e.g., medium → large).
4. Report: "This task involves more than it sounds. Specifically: [list]. Adjusting depth accordingly."

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Detect but don't block. Note complexity, proceed fast. |
| vibe | Detect silently. Auto-escalate task size. No user interaction. |
| standard | Report hidden complexity. Let user decide scope. |
| strict | Detailed breakdown. Must address each sub-task before proceeding. |
| emergency | Skip. Focus on the immediate problem. |
