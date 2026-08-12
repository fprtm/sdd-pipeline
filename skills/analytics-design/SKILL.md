---
name: analytics-design
description: >-
  Turn the product's success criteria into things you can actually measure — a
  north-star + guardrail metrics tied to REQ outcomes, a consistent analytics
  event taxonomy, a light instrumentation plan, and the key funnels to watch.
  Use after the PRD (it needs the success criteria), or when the user says
  "what metrics / KPIs / analytics / events / how do we measure success / track
  usage". Produces docs/sdd/analytics.md. The data-analyst seat.
---

# analytics-design — measure whether it actually worked

A feature that ships with no way to tell if it succeeded is a guess you can't
correct. This skill closes that: it turns the PRD's "what does success look
like" into concrete, instrumented metrics — so the team learns instead of
assuming.

Output: `docs/sdd/analytics.md`. Derives from the PRD's success criteria — don't
invent metrics the product doesn't actually care about (that's vanity metrics).

## 1. Metrics tree (tie to REQ outcomes, don't freelance)
- **North-star** — the one metric that best proxies real value delivered
  (e.g. "completed bookings/week", not "signups").
- **Input metrics** — the few levers that move the north-star (activation,
  conversion at each funnel step, retention).
- **Guardrails** — what must NOT get worse while chasing the north-star (error
  rate, refund rate, latency, churn). Every REQ-NF has a guardrail here.
Each metric names its REQ/FSD source and a target or direction.

## 2. Event taxonomy (the SSOT for tracking)
Name events consistently — `object_action` (`booking_completed`,
`ticket_scanned`), lowercase, past-tense. For each: when it fires, and its
properties (typed, documented once so they don't drift — same SSOT discipline as
schemas and types). A messy, ad-hoc event stream is un-analyzable; the taxonomy
is what makes it queryable later.

## 3. Funnels & cohorts
For the key journeys (reuse the sequence diagrams / user flows), define the
funnel steps as events so drop-off is visible. Note the cohorts worth splitting
by (new vs returning, operator vs consumer, channel).

## 4. Instrumentation plan
Which events get emitted where in the code — this is a real work item, so it
lands in the backlog and ties to `infra`'s observability (metrics/logs) rather
than being a separate bolt-on. Prefer emitting from the domain/application layer
at the moment of truth, not scattered in UI handlers.

## 5. Privacy (not optional)
No PII or sensitive data in event properties without a lawful basis/consent —
this is a `threat-model` SEC concern, not just analytics hygiene. Mask/hash
identifiers where the analysis doesn't need the raw value.

## Exit gate
North-star + inputs + guardrails defined and each tied to a REQ; a consistent
event taxonomy with typed properties; funnels mapped to events; an
instrumentation plan that lands in the backlog and reuses `infra` observability;
privacy addressed. The dashboard/report itself is built during delivery.
