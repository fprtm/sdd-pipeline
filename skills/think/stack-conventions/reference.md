# stack-conventions — reference (illustrative examples)

Calibration only — always confirm against current official docs for the actual
stack/version in play, per Step 2 in the core skill.

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
wrapping, small interfaces), etc. The method is constant; the rules come from
that stack's docs.
