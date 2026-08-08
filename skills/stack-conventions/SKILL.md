---
name: stack-conventions
description: >-
  After the stack is chosen, fetch its OFFICIAL best practices and conventions and
  turn them into concrete, version-pinned rules the project must follow (e.g.
  TypeScript strict mode, Laravel/Eloquent conventions, React rules-of-hooks,
  Go idioms). Use right after arch-decision, or when the user says "follow
  <framework> best practices / set up tsconfig strict / apply the style guide".
  Produces docs/sdd/04-stack-guide.md, which implement and code-review enforce.
---

# stack-conventions — apply the stack's own best practices

A stack-neutral pipeline still has to write *idiomatic* code for whatever stack
was chosen. This skill closes that gap: once `arch-decision` picks the language,
framework, and tools, it reads their **official** guidance and converts it into a
short list of enforceable rules for this project. `implement` writes to those
rules; `code-review` checks against them.

Output: `docs/sdd/04-stack-guide.md` (companion to the architecture doc) +
scaffolded config files (tsconfig, linter, formatter, etc.) where it makes sense.

## Step 1 — identify the stack and versions
Read the ADRs (`04-architecture.md`) for language, framework, datastore, test
tooling, and their **versions**. Version matters: conventions and defaults change
between major versions.

## Step 2 — consult PRIMARY sources (do not rely on memory)
Frameworks change; your training data may be stale. Pull current, version-correct
guidance from official sources:

- If a **documentation tool is available** (e.g. Context7, or an MCP docs server),
  use it to fetch the framework's current docs for the exact version.
- Otherwise fetch the **official docs / style guide** directly (framework website,
  official "best practices"/"conventions" pages, the language's style guide).
- If a `research` skill is installed, delegate the reading and have it cite sources.
- Prefer primary sources over blog posts. Record the source URL + version for each
  rule so it's auditable and updatable.

## Step 3 — write concrete, checkable rules (`04-stack-guide.md`)
Group them; each rule is specific enough to verify in review, and cites its source:

- **Language & typing** — strictness, forbidden constructs, idioms.
- **Project layout** — the framework's expected structure/conventions.
- **Framework conventions** — the "right way" per the docs (routing, models,
  validation, DI, config).
- **Lint / format** — the tools and the ruleset.
- **Testing** — the framework's recommended test tool and style.
- **Security defaults** — framework-specific protections (map to `threat-model`
  SEC controls: e.g. mass-assignment guarding, CSRF middleware, ORM parameterization).
- **Dependency & config management** — lockfiles, env/config, version policy.

## Step 4 — scaffold config as code
Where a rule can be enforced by a config file, create it (so it's not just prose):
`tsconfig.json`, ESLint/Biome, `.editorconfig`, `ruff.toml`, `phpstan.neon`, etc.
`infra` then wires these into CI so violations fail the build.

## Concrete examples (illustrative — always confirm against current docs)

**TypeScript**
- `tsconfig`: `"strict": true`, and enable `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`. No `any` (use `unknown` +
  narrowing); no non-null `!` without justification.
- Types as SSOT: infer from a single schema (validator) rather than hand-writing
  parallel types (ties to `code-standards`).
- Lint with typescript-eslint (type-aware rules); format with Prettier/Biome.

**Laravel / PHP**
- Follow the official directory structure and naming; **Eloquent** conventions
  (singular models, plural tables) unless a documented reason not to.
- **Validation via Form Request** classes, not inline in controllers.
- **Guard mass assignment** (`$fillable`/`$guarded`) — a security control (SEC).
- Config/secrets via `.env` + `config()`, never hardcoded; migrations for schema.
- PSR-12 style, format with **Pint**, static analysis with **Larastan/PHPStan**,
  test with **Pest/PHPUnit**; use the framework's CSRF middleware for web routes.

**Other stacks** — apply the same method: React (rules of hooks, no derived state
in effects, keys), Python (type hints + `ruff`/`mypy`, PEP 8), Go (gofmt, error
wrapping, small interfaces), etc. The method is constant; the rules come from that
stack's docs.

## Keep it in sync
If the stack changes (a new/superseded ADR) or a version is bumped, re-run this
skill and update `04-stack-guide.md`. It is the SSOT for "how we write code in
*this* stack".

## Exit gate
`04-stack-guide.md` exists with version-pinned, source-cited, enforceable rules;
the key config files are scaffolded; `implement` and `code-review` reference it as
the authority for stack-specific standards (alongside the stack-neutral
`code-standards`). Then proceed to the security gate / backlog.
