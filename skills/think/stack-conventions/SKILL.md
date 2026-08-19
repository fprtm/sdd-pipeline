# Stack Conventions — Apply the Stack's Own Best Practices

A stack-neutral pipeline still has to write *idiomatic* code for whatever stack was chosen. Once the architecture picks the language, framework, and tools, this skill reads their **official** guidance and converts it into a short list of enforceable, version-pinned rules for this project. BUILD writes to those rules; PROVE checks against them. Use right after the architecture decision, or on "follow <framework> best practices / set up tsconfig strict / apply the style guide".

Output: `docs/sdd/stack-guide.md` (project-level SSOT for "how we write code in *this* stack") + scaffolded config files where it makes sense.

## Step 1 — Identify the Stack and Versions

Read the ADRs for language, framework, datastore, test tooling, and their **versions**. Version matters: conventions and defaults change between major versions. Brownfield: read the lockfile/manifest — the versions in use, not the ones you remember.

## Step 2 — Consult PRIMARY Sources (Do Not Rely on Memory)

Frameworks change; training data goes stale. Pull current, version-correct guidance:

- If a **documentation tool is available** (context7, an MCP docs server), use it for the exact version — this is the composition engine's recommended pairing.
- Otherwise fetch the **official docs / style guide** directly.
- If a research skill is installed, delegate the reading and have it cite sources.
- Primary sources over blog posts. **Record the source URL + version per rule** so it's auditable and updatable.

## Step 3 — Write Concrete, Checkable Rules

Group them; each rule specific enough to verify in review, citing its source:

- **Language & typing** — strictness, forbidden constructs, idioms.
- **Project layout** — the framework's expected structure.
- **Framework conventions** — the "right way" per the docs (routing, models, validation, DI, config).
- **Lint / format** — the tools and ruleset.
- **Testing** — the framework's recommended tool and style.
- **Security defaults** — framework-specific protections, mapped to `threat-model` SEC controls (mass-assignment guarding, CSRF middleware, ORM parameterization).
- **Dependency & config management** — lockfiles, env/config, version policy.

## Step 4 — Scaffold Config as Code

Where a rule can be enforced by a config file, create it so it's not just prose: `tsconfig.json`, ESLint/Biome, `.editorconfig`, `ruff.toml`, `phpstan.neon`, etc. `skills/build/infra/` wires these into CI so violations fail the build.

## Keep It in Sync

Stack change (new/superseded ADR) or version bump → re-run and update the guide. Constraint sets (`skills/constraints/`) stay stack-neutral; this guide is the stack-specific layer on top.

## Exit Gate

`docs/sdd/stack-guide.md` exists with version-pinned, source-cited, enforceable rules; key config files scaffolded; BUILD and PROVE reference it as the authority for stack-specific standards alongside the stack-neutral constraints.
