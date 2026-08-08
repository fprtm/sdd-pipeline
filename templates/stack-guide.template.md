# Stack Guide — <project>

> **Plain-language summary:** the specific rules for writing code in the stack we
> chose, taken from the official docs. This is how we stay idiomatic and safe in
> <language/framework>.

- **Stack (from ADRs):** language <x vY>, framework <x vY>, datastore <x>, tests <x>
- **Sources:** <official docs URLs + versions consulted>  ·  **Last synced:** <YYYY-MM-DD>
- **Enforced by:** `implement` (writes to it) · `code-review` (checks it) · `infra` (CI)

## Language & typing
- <rule> — _(source)_

## Project layout
- <rule> — _(source)_

## Framework conventions
- <rule: routing / models / validation / DI / config> — _(source)_

## Lint & format
- Tool: <x>, ruleset <x>  ·  config: `<file>`

## Testing
- Tool: <x>, style <x>  ·  _(ties to 07-test-plan.md)_

## Security defaults (map to SEC-xxx)
- <framework protection, e.g. CSRF middleware, mass-assignment guard, ORM params> → SEC-xxx

## Dependency & config
- Lockfile: <x>  ·  secrets/config: <x>  ·  version policy: <x>

## Scaffolded config files
- [ ] `<tsconfig.json / phpstan.neon / ruff.toml / eslint / .editorconfig>`

<!-- Every rule cites a primary source + version. Re-run stack-conventions when a
     version bumps or an ADR changes the stack. This file is the SSOT for
     stack-specific standards. -->
