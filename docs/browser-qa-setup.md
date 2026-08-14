# Browser QA — setting up a browser capability

The [`browser-qa`](../skills/browser-qa/SKILL.md) skill drives a **real browser**
to verify Must-priority user journeys against your locally-running app. It's
**capability-agnostic** — it uses whatever browser tool your agent can reach. This
doc shows how to give each common agent that capability. Pick the row that matches
your setup; you don't need all of them.

> **Prefer accessibility-ref interaction over coordinates** in every option below:
> the agent snapshots the page's accessibility tree and acts on elements by role +
> name (`button "Login"`), which is stable across layout changes. Coordinate
> clicking is a fallback for canvas/charts/drag-drop only.

## Option 1 — Claude Code's built-in browser

Claude Code ships browser tools; no MCP server needed. Just ask it to run the app
locally and QA the journey. `browser-qa` uses these directly when present.

## Option 2 — Playwright MCP (OpenCode, Codex, and other MCP clients)

[Playwright MCP](https://playwright.dev/mcp) is a portable MCP server exposing
`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, and —
with the `testing` capability — explicit assertions
(`browser_verify_text_visible`, `browser_verify_element_visible`). Requires
**Node.js ≥ 20**.

### OpenCode

**Easiest — let the pack add it for you** (idempotent; won't clobber existing
config):

```bash
node skills/browser-qa/setup-browser-mcp.mjs
```

Then **restart OpenCode** (a freshly-added MCP server isn't usable in the running
session). Requires Node ≥ 20.

**Or add it by hand** to `~/.config/opencode/opencode.json` — the MCP server is a
**direct child of `mcp`**, keyed by name (verified against
[opencode.ai/docs/mcp-servers](https://opencode.ai/docs/mcp-servers); it is *not*
nested under a `servers` key):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest", "--caps=testing"],
      "enabled": true
    }
  }
}
```

Merge this into your existing `mcp` block rather than overwriting the file. Then
restart OpenCode.

`--caps=testing` adds the explicit assertion tools so the agent *verifies* rather
than only clicks. Add `vision` (`--caps=testing,vision`) **only** if you need
coordinate/screenshot interaction for canvas/charts — more tools mean more model
context, so start with `testing` alone.

### Codex / other MCP clients

Any MCP-capable client can run the same server; register a local MCP server with
command `npx -y @playwright/mcp@latest --caps=testing` per that client's MCP
config. See Playwright's [other-clients guide](https://playwright.dev/mcp/clients/other-clients).

## Option 3 — In-repo runner (Playwright or Cypress), no MCP

Install Playwright or Cypress as a project dev-dependency and let the agent write
+ run committed e2e specs via the project's own test command. This is the
**durable** flavor `browser-qa` recommends committing anyway (flavor (b) in the
skill): the specs live in the repo and `infra` runs them in CI on every change, so
the journey stays guarded after the agent leaves. The interactive MCP/host-browser
options above are for fast feedback while developing.

## Whichever you choose

- Run the app **locally** against a **local/disposable** DB before pointing a
  browser at it — `browser-qa` will stop if it detects production or a non-local
  target (the same hard-stop as `test-plan`'s "Test environment safety").
- Keep browser e2e **thin** — only Must-priority journeys; everything else stays
  in unit/integration tests.
- Neutralize real side effects (email, payments, webhooks) with sandboxes/test
  doubles so a QA run can't reach real users.
