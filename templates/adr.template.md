# Architecture — <system name>

> **Plain-language summary:** _what shape the system is and what it's built with,
> in a few sentences a non-architect can follow._

- **Architecture style:** modular-monolith-layered | clean/hexagonal | services
- **Dependency rule:** _what may import what (e.g. domain ← application ← infra;
  domain imports nothing)_
- **Repo/deploy topology:** fullstack-unified | fe+be-separate | be-only |
  fe-only | monorepo
- **FE↔BE contract/seam:** _(OpenAPI / GraphQL schema / shared types package / n/a)_
- **Module boundaries:** _(list, mapped to FSD groupings)_
- **Test seams:** _(where interfaces make isolation testing possible)_

---

## ADR-001 — <decision title>
- **Status:** proposed | accepted | superseded by ADR-xxx
- **Context:** _(forces: scale, team, deploy, data, constraints — cite REQ-NF-xx)_
- **Decision:**
- **Consequences:** _(good and bad; what this makes easy vs. hard later)_
- **Alternatives considered:** _(and why rejected)_
- **Constrains:** FSD-0xx, FSD-0yy

## ADR-002 — <decision title>
- ...

## ADR-FE-001 — <frontend decision, if any UI>
- **Context:** rendering/SEO/interactivity needs …
- **Decision:** SPA | SSR | SSG | hybrid; framework; state approach
- **Constrains:** FSD-0xx

---

> **Neutral-default note:** if the user deferred a decision, the chosen option is
> the most robust/scalable/maintainable one for the forces above; the reasoning
> is written in the ADR's Context + Consequences. Update [traceability.md](traceability.md).
