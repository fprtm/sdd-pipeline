# Architecture Analyzer

Detect existing project architecture, flag inconsistencies, and propose architecture for new projects.

## When This Runs

- **New project**: Propose architecture based on domain + scale + requirements
- **Existing project**: Detect current patterns, flag inconsistencies, advise on changes
- **Architecture-impacting task**: Flag when a task might violate or change established architecture

## Architecture Pattern Detection

### Detection Signals

| Pattern | File/Structure Signals |
|---------|----------------------|
| **MVC** | `controllers/`, `models/`, `views/` directories. Route→controller→model flow. |
| **MVP** | `presenters/` directory. View interfaces. Presenter↔View contracts. |
| **MVVM** | `viewmodels/`, observable/reactive bindings, two-way data binding patterns. |
| **Layered** | `domain/`, `application/`, `infrastructure/`, `presentation/` directories. Clear layer imports (upper→lower only). |
| **Hexagonal** | `ports/`, `adapters/`, `domain/` directories. Dependency inversion. Interfaces at boundaries. |
| **Clean Architecture** | `entities/`, `use-cases/`, `interfaces/`, `frameworks/` directories. Dependency rule (inner→outer never). |
| **Microservices** | Multiple `package.json`/`go.mod`/`pom.xml`. Docker compose with multiple services. Service-to-service communication. |
| **Modular Monolith** | Single deployment unit. `modules/` directory with clear boundaries. Internal APIs between modules. |
| **Monolith** | Single entry point. Shared database. No module boundaries. Everything in `src/`. |
| **Serverless** | `serverless.yml`, `sam.yaml`, `functions/` directory. Lambda/Cloud Function handlers. |
| **Event-Driven** | Event bus/queue configs. `events/`, `handlers/`, `subscribers/` directories. Pub/sub patterns. |
| **CQRS** | Separate `commands/` and `queries/` directories. Different read/write models. |
| **Saga** | `sagas/` directory. Compensation/rollback logic. Long-running transaction orchestration. |
| **DDD** | `aggregates/`, `value-objects/`, `domain-events/`, `repositories/` directories. Ubiquitous language in code. |
| **Micro-frontends** | Multiple frontend packages. Module federation config. Independent deploy pipelines per frontend. |
| **BFF (Backend for Frontend)** | `bff/` directory. API gateway per client type. Client-specific response shaping. |
| **Sidecar** | Container definitions with helper containers. Proxy/logging sidecars in k8s manifests. |

### Detection Process

1. Scan directory structure (top 3 levels)
2. Read entry points (`index`, `main`, `app`, `server`)
3. Check dependency flow (import graph direction)
4. Read config files (docker-compose, k8s, serverless, etc.)
5. Match against pattern signals
6. Confidence score: HIGH (3+ signals match), MEDIUM (2 signals), LOW (1 signal or ambiguous)

## Scoping the Scan — Git-History-Weighted

Don't scan everything uniformly. If the user hasn't named a specific direction ("analyze the payments module"), weight attention toward recently-changed areas first:

```bash
git log --oneline --since="30 days ago" --name-only | sort | uniq -c | sort -rn
```

Refactor and inconsistency value is proportional to future-change likelihood — code nobody touches doesn't need architectural attention right now, even if it's imperfect. This keeps analysis fast and relevant instead of producing a wall of findings about stable, low-churn code nobody asked about.

## Core Judgment Heuristics

Use these when deciding whether a module/abstraction is earning its place, independent of which named pattern is in play.

### The Deletion Test

Imagine deleting the module or abstraction entirely, inlining its contents at every call site.

- **Complexity vanishes** → it was a pass-through wrapper. It wasn't earning its keep. Flag as candidate for removal or simplification.
- **Complexity reappears at N call sites** → it was doing real work (deduplication, encapsulation, a genuine seam). It's justified.

Apply this to any module suspected of being a thin wrapper, a "just in case" service layer, or an interface with exactly one implementation that never varies.

### 1 Adapter = Hypothetical, 2 Adapters = Real

Don't recommend introducing a port/adapter abstraction (interface + implementation split) unless there are **two real, currently-needed implementations**. One implementation behind an interface "for future flexibility" is speculative generality — flag it as premature abstraction (cross-reference `skills/build/anti-patterns/`).

```
if (implementations_needed == 1) → concrete class, no interface
if (implementations_needed >= 2) → interface/port justified
```

This applies to: repository patterns with one database, payment "gateway abstractions" with one provider, notification "channels" with one delivery method. Wait for the second real implementation before abstracting — retrofitting an interface later is cheap; carrying unused abstraction is not free (it's an extra layer every reader has to understand).

## Existing Project Analysis

### Output Format

```
## Architecture Analysis

**Detected**: Layered Architecture (HIGH confidence)
**Signals**: domain/, application/, infrastructure/ directories. Import direction follows layer rules.

### Consistency Check
- ✅ Layer boundaries respected in 94% of imports
- ⚠️ infrastructure/email.ts imports directly from presentation/UserController — bypasses application layer
- ⚠️ No clear boundary between domain and application in `services/`

### Recommendations
1. Move email notification logic to application layer (create EmailNotificationUseCase)
2. Consider splitting `services/` into domain services and application services
```

### What to Flag

| Issue | Severity |
|-------|----------|
| Layer violation (import direction wrong) | WARNING |
| Mixed patterns (half MVC, half hexagonal) | WARNING |
| No discernible architecture (everything in src/) | INFO |
| Architecture inconsistency in new code vs old | WARNING |
| Circular dependencies between modules | CRITICAL |
| Domain logic in infrastructure layer | WARNING |
| Framework coupling in domain/business layer | WARNING |

### ADR-Conflict Handling

Before flagging an inconsistency as a problem, check `docs/sdd/decisions/` — the "inconsistency" might be a deliberate, already-logged trade-off (e.g., an ADR explaining why one module intentionally breaks the layering rule). If a logged decision covers it, don't re-flag it as an issue.

If a genuine architectural problem contradicts an existing ADR, still surface it — but as a callout that names the conflicting decision, not a silent override:

```
⚠️ This finding conflicts with Decision #012 (layered architecture boundaries).
Friction observed: [specific problem]. Worth reopening that decision? (yes/no)
```

Never silently override a logged decision, and never silently suppress a real finding just because an old ADR exists — surface the tension and let the user decide.

## New Project Proposal

When creating a new project, propose architecture based on:

### Decision Matrix

| Factor | Monolith | Modular Monolith | Microservices | Serverless |
|--------|----------|-------------------|---------------|------------|
| Team size ≤3 | ✅ | ✅ | ❌ | ✅ |
| Team size 4-10 | ✅ | ✅ | ⚠️ | ✅ |
| Team size >10 | ⚠️ | ✅ | ✅ | ⚠️ |
| MVP/prototype | ✅ | ⚠️ | ❌ | ✅ |
| Scale uncertain | ✅ | ✅ | ❌ | ✅ |
| High scale known | ⚠️ | ✅ | ✅ | ✅ |
| Multiple domains | ❌ | ✅ | ✅ | ⚠️ |
| Complex business logic | ⚠️ | ✅ (DDD) | ✅ (DDD) | ❌ |

| Factor | MVC | Layered | Hexagonal | Clean |
|--------|-----|---------|-----------|-------|
| CRUD-heavy | ✅ | ✅ | ⚠️ | ❌ |
| Complex domain | ❌ | ⚠️ | ✅ | ✅ |
| Many integrations | ❌ | ⚠️ | ✅ | ✅ |
| Rapid prototyping | ✅ | ✅ | ❌ | ❌ |
| Testability critical | ⚠️ | ✅ | ✅ | ✅ |
| Team familiarity matters | ✅ | ✅ | ⚠️ | ⚠️ |

### Proposal Format

```
## Architecture Proposal

**Recommended**: Modular Monolith + Layered Architecture
**Domain**: Web application (e-commerce)
**Scale**: Medium (team of 5, ~50k users expected)

### Why This Architecture
1. Modular monolith gives clear boundaries without microservices complexity
2. Layered architecture is well-understood by most teams
3. Can evolve to microservices later by extracting modules
4. Single deployment = simpler ops for medium team

### Alternatives Considered
- **Microservices**: Too complex for team size and current scale
- **Clean Architecture**: Overhead not justified for CRUD-heavy domain
- **Monolith (no modules)**: Will become unmaintainable as features grow

### Proposed Structure
```
src/
├── modules/
│   ├── auth/         (domain, application, infrastructure)
│   ├── products/     (domain, application, infrastructure)
│   ├── orders/       (domain, application, infrastructure)
│   └── shared/       (cross-cutting concerns)
├── infrastructure/   (database, external services)
└── api/              (HTTP layer, routes)
```

### Key Decisions
1. Module boundaries = business domains (not technical layers)
2. Modules communicate through defined interfaces, not direct imports
3. Shared module for cross-cutting: auth middleware, logging, error handling
```

### Two Things the Proposal Must Always Pin Down

1. **The actual directory tree** — like the Proposed Structure above, but real: the concrete top-level paths this project will use, kept current as the code grows. **A ticket should never have to guess a path** — `Files likely touched:` lists and cheap-model execution both depend on the tree being written down, not inferred.
2. **The FE↔BE contract, per endpoint** (when there's a frontend and a backend): route + method, request shape, response shape, error shapes + status codes — decided contract-first at design time, not discovered during integration. Capture each as a short typed snippet (the doc-generator durability exception); tickets on either side then point at the contract instead of inventing shapes independently.

## Design It Twice — For High-Stakes Ambiguous Decisions

For most decisions, the heuristics above (deletion test, adapter-count rule) are enough. But for a genuinely high-stakes, hard-to-reverse architecture call with multi-agent dispatch available, a single reasoning pass has a blind-spot problem — see `skills/think/arch-analyzer/design-it-twice.md` for the full technique: spawning 3-4 agents under different explicit constraints to generate real diverging candidates, then comparing on depth/locality/seam-placement. Not the default flow — read the companion file's "When to Use This" trigger before reaching for it.

## Visual Report — For Multi-Candidate Findings

When analysis produces **multiple candidate findings** (several inconsistencies to fix, or several architecture options to weigh for a new project), a wall of markdown text is hard to compare. Generate a self-contained HTML report instead of a text dump.

### When to Use

- Existing project has 3+ inconsistency findings worth comparing
- New project architecture proposal has 2+ genuinely viable options
- User asks to "see" or "show" the architecture analysis (visual intent signal)

Skip this for single-finding or single-recommendation cases — plain markdown in the plan/chat is faster to read for one item.

### Format

Single self-contained HTML file: Mermaid for diagrams (via CDN or inlined), plain CSS, no build step. Written to the **OS temp directory** (never into the repo) and opened via `xdg-open`/`open`/`start`.

Each finding/option is a card:

```
┌─────────────────────────────────────┐
│ [Badge: Strong / Worth exploring /   │
│         Speculative]                 │
│                                       │
│ Files/Modules: [scope]               │
│ Problem: [1 sentence]                │
│ Solution: [1 sentence]                │
│                                       │
│ [Before/After Mermaid diagram —      │
│  the centerpiece, not an afterthought]│
│                                       │
│ Wins:                                │
│ - [≤6 words, glossary terms only]    │
│ - [≤6 words, glossary terms only]    │
│                                       │
│ [⚠️ ADR conflict callout if any]     │
└─────────────────────────────────────┘
```

End with one "Top Recommendation" card, clearly distinguished from the others.

### Confidence Badges

| Badge | Meaning |
|-------|---------|
| **Strong** | High-confidence signals, clear win, low risk |
| **Worth exploring** | Plausible improvement, needs a grill session to confirm fit |
| **Speculative** | Possible but thin evidence — surfaced for completeness, not urged |

### Writing Rules

- **Controlled vocabulary only** — use glossary terms (`docs/sdd/glossary.md`) and SDD Pipeline's own vocabulary (module, interface, seam, adapter). Never substitute loose synonyms like "component," "service," "boundary" inconsistently across cards.
- **Diagram over paragraph** — if a finding needs a paragraph to explain, redraw the diagram instead. Wins bullets are ≤6 words each; no prose blocks.
- **One sentence for Problem, one for Solution** — resist the urge to over-explain in the card. Depth goes in the diagram and the follow-up grill session, not the report.

### After the Report

The user picks a candidate from the report → hand off to **SDD Grill** (`skills/think/grill/`) to work through the specifics (constraints, seam shape, migration order) via the frontier/round interview. The report is the menu; grilling is where the decision actually gets made.

## Mode Behavior

| Mode | Architecture Analyzer |
|------|----------------------|
| **prototype** | Skip analysis. Build fast, refactor later. |
| **vibe** | Run silently. Flag only CRITICAL issues (circular deps). Include in footer. |
| **standard** | Full analysis for new projects. Consistency check for existing. Show recommendations. |
| **strict** | Full analysis + require architecture approval for new projects. Flag all inconsistencies. Traceability to architecture decisions. |
| **emergency** | Skip. Fix the bug, don't refactor architecture. |

## Integration with Other Skills

- **Scope Guard**: Architecture-aware blast radius. Changes crossing module boundaries get larger estimates.
- **Constraints**: Architecture-specific constraints activated (e.g., hexagonal → enforce port/adapter pattern).
- **Change Plan**: Include architecture impact. Flag when change crosses architectural boundaries.
- **Doc Generator**: Trigger SDD generation for architecture-impacting changes.
- **Decision Log**: Log architecture decisions as ADRs (Architecture Decision Records).
- **Agent Orchestration**: Design-it-twice dispatch mechanics (spawning, context scoping) follow `skills/agents/orchestration/`'s cost-benefit gate — check there before spawning.

## Anti-Pattern: Architecture Astronaut

Guard against over-architecting:

- Solo developer + CRUD app → recommend MVC/simple layered, NOT hexagonal + CQRS + event sourcing
- MVP → recommend monolith, NOT microservices
- If user asks for simpler: comply immediately. SDD Pipeline advises, user decides.
