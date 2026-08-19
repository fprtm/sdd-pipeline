# Analytics Design — Measure Whether It Actually Worked

A feature that ships with no way to tell if it succeeded is a guess you can't correct. This skill turns the PRD's success criteria into concrete, instrumented metrics — the product-measurement seat the pipeline otherwise lacks. Use after a PRD exists (it needs the success criteria), or on "what metrics / KPIs / analytics / events / how do we measure success".

Output: `docs/sdd/analytics.md` (project-level). Derives from the PRD's success criteria — don't invent metrics the product doesn't care about (vanity metrics).

## 1. Metrics Tree (Tie to REQ Outcomes, Don't Freelance)

- **North-star** — the one metric that best proxies real value delivered ("completed bookings/week", not "signups").
- **Input metrics** — the few levers that move the north-star (activation, conversion per funnel step, retention).
- **Guardrails** — what must NOT get worse while chasing the north-star (error rate, refund rate, latency, churn). Every REQ-NF has a guardrail here.

Each metric names its REQ/FSD source and a target or direction.

## 2. Event Taxonomy (the SSOT for Tracking)

Name events consistently — `object_action` (`booking_completed`, `ticket_scanned`), lowercase, past-tense. For each: when it fires, and its typed, documented-once properties — same SSOT discipline as schemas and types. A messy ad-hoc event stream is un-analyzable; the taxonomy is what makes it queryable later.

## 3. Funnels & Cohorts

For the key journeys (reuse the FSD's flow diagrams), define funnel steps as events so drop-off is visible. Note the cohorts worth splitting by (new vs returning, operator vs consumer, channel).

## 4. Instrumentation Plan

Which events get emitted where — a real work item that lands in the backlog as tickets and ties into `skills/build/infra/`'s observability, not a bolt-on. Prefer emitting from the domain/application layer at the moment of truth, not scattered in UI handlers.

## 5. Privacy (Not Optional)

No PII or sensitive data in event properties without a lawful basis/consent — a `threat-model` SEC concern, not just analytics hygiene. Mask/hash identifiers where the analysis doesn't need the raw value.

## Exit Gate

North-star + inputs + guardrails defined, each tied to a REQ; consistent event taxonomy with typed properties; funnels mapped to events; an instrumentation plan in the backlog reusing infra observability; privacy addressed.
