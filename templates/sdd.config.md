# SDD Pipeline Project Configuration

Copy this file to `docs/sdd/config.md` in your project to customize SDD Pipeline behavior.

## Default Mode

```
mode: standard
```

Options: `prototype`, `vibe`, `standard`, `strict`

## SDLC Methodology

Override auto-detection:

```
sdlc: scrum
```

Options: `scrum`, `kanban`, `waterfall`, `solo`, `none`

If not set, SDD Pipeline auto-detects from project signals (.github/, .jira/, .linear/, docs/ structure).

## Domain

Override auto-detection:

```
domain: web
```

Options: `web`, `cli`, `mobile`, `library`, `api`, `mixed`

## Architecture

Override or declare architecture:

```
architecture: layered
```

Options: `monolith`, `modular-monolith`, `microservices`, `serverless`, `mvc`, `mvvm`, `layered`, `hexagonal`, `clean`, `event-driven`, `cqrs`, `ddd`

If not set, SDD Pipeline auto-detects from project structure.

## Constraint Overrides

Add rules to override or extend SDD Pipeline defaults:

```
overrides:
  - constraint: "no-premature-abstraction"
    action: disable
    context: "src/plugins/"
    reason: "Plugin system requires factory pattern"

  - constraint: "dependency-limit"
    value: 8
    reason: "This project has complex requirements"
```

## SDD Grill

Control auto-suggest behavior for discovery/architecture interviews:

```
grill:
  auto-suggest: true
```

If `false`, SDD Grill only runs when explicitly invoked ("grill this"), never auto-suggested before a casual architecture decision locks in.

## Custom Constraints

Add project-specific constraints:

```
custom-constraints:
  - rule: "All API responses must include request_id header"
    rationale: "Required for distributed tracing"
    check: mechanical

  - rule: "Database migrations must be reversible"
    rationale: "Zero-downtime deploy requirement"
    check: judgment
```

## External Skills

Declare preferred external skills for auto-install recommendations:

```
skills:
  - name: taste
    for: "UI aesthetics"
  - name: mattpocock-skills:tdd
    for: "Test-driven development"
  - name: security-guidance
    for: "Pre-commit security scanning"
```

## Disabled Features

Disable specific SDD Pipeline features:

```
disable:
  - insight
  - performance-check
  - stats
  - doc-generator
```

## Team Settings

When this file is committed to the repo, all team members share the same configuration.

```
team:
  shared-decisions: true
  shared-memory: true
```
