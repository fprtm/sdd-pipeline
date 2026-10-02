---
description: Executable product work plan untuk mengembangkan SDD Pipeline menjadi full-team, evidence-driven, AI-friendly SDLC framework.
status: active
lifecycle: transient
updated: 2026-10-02
---

# SDD Pipeline vNext — AI-Friendly Full-Team SDLC Executable Work Plan

**Status: OPEN**
**Plan type:** product evolution and staged implementation roadmap
**Mode:** standard
**SDLC:** incremental
**Domain:** library / agent workflow framework
**Authority:** dokumen ini mengizinkan discovery, audit, benchmark design, dan specification work. Perubahan behavior, public commands, compatibility contract, enforcement default, deployment, atau release tetap memerlukan approval pada gate yang disebutkan.

## 1. Executive decision

SDD Pipeline vNext tidak akan dibangun dengan menambah persona atau prompt sebanyak mungkin. Arah produk yang dipilih adalah:

> Membuat kualitas delivery dapat diukur, sulit dipalsukan, dapat ditelusuri ke bukti, dan dapat dikalibrasi terhadap hasil manusia senior—sepanjang lifecycle product, engineering, QA, security, release, dan operation.

Core delivery yang sudah ada tetap dipertahankan:

```text
ASK → SPEC → PLAN → BUILD → CHECK
```

Core tersebut dibungkus oleh lifecycle tim lengkap:

```text
INTAKE
  → DISCOVER
  → VALIDATE
  → [SPEC → PLAN → BUILD → VERIFY]
  → RELEASE
  → OBSERVE
  → LEARN
  ↺ kembali ke DISCOVER
```

`ASK` saat ini menjadi bagian dari `DISCOVER`; `CHECK` menjadi `VERIFY` dalam bahasa lifecycle tim, tanpa menghapus nama command `/check`. Penambahan public command baru bukan keputusan plan ini dan memerlukan approval terpisah.

## 2. Problem statement

SDD Pipeline sudah memiliki workflow discipline, traceability, review boundaries, mechanical checkers, serta Quality Contract runtime. Namun proses yang kaya belum membuktikan bahwa hasilnya setara dengan manusia senior.

Masalah yang harus diselesaikan:

1. Kualitas belum memiliki definisi operasional lintas peran.
2. Task size, risk, assurance, dan ceremony belum menjadi axis independen yang dapat dievaluasi secara konsisten.
3. Role seperti Product Owner, developer, QA, security, dan SRE belum mempunyai accountability contract yang machine-checkable.
4. Lifecycle berhenti terlalu dekat dengan verification; release, observation, product outcome, dan learning belum menjadi loop formal.
5. Bukti dengan kekuatan berbeda masih mudah diperlakukan seolah setara.
6. Belum ada benchmark yang dapat membuktikan apakah perubahan pipeline memperbaiki atau justru menurunkan outcome.
7. Menambah aturan dapat menciptakan bureaucracy tanpa bukti bahwa gate tersebut mencegah defect atau keputusan buruk.

## 3. Product outcome dan non-claims

### Outcome

Framework mampu menjalankan pekerjaan software sebagai controlled state transition dengan:

- tujuan produk dan success measure yang eksplisit,
- decision authority yang sempit dan terlihat,
- risk-based assurance,
- independently verifiable evidence,
- delivery yang dapat dihentikan ketika problem/solution tidak valid,
- release readiness dan operational feedback,
- regression evaluation lintas model/provider,
- artifact dan workflow yang portable.

### Non-claims

Plan ini tidak mengizinkan klaim bahwa:

- AI telah menjadi senior developer, Product Owner, QA, security engineer, atau SRE;
- jumlah dokumen yang lebih banyak berarti kualitas lebih tinggi;
- coverage percentage membuktikan correctness;
- multi-agent otomatis berarti independent review;
- hasil benchmark satu repo berlaku untuk semua domain;
- process compliance membuktikan product value;
- SDD Pipeline dapat menjamin host/LLM selalu mematuhi Markdown policy;
- release ke production boleh dilakukan tanpa authority dari owner yang sah.

## 4. Definition of “senior-equivalent quality”

“Setara senior” diperlakukan sebagai hypothesis yang harus diuji, bukan slogan produk.

### Quality dimensions

| Dimension | Observable outcome |
|---|---|
| Product judgment | Memilih problem yang layak, menyatakan assumption, menolak feature yang tidak bernilai, menetapkan measurable outcome |
| Requirements | Mengurangi misunderstanding, missing edge cases, dan silent assumptions |
| Engineering | Correctness, simplicity, reversibility, maintainability, compatibility, dan operability |
| QA | Menemukan defect relevan, menilai test oracle, menguji negative paths, dan menyatakan residual risk |
| Security | Menjaga authority boundary, executable controls, dependency/provenance hygiene, dan exception lifecycle |
| Delivery | Review effort, rework, lead time, change failure, dan recovery |
| Operations | SLO health, rollback success, incident learning, dan production outcome |
| Comprehension | Reviewer dapat menjelaskan behavior, weakest point, dan alasan keputusan tanpa bergantung pada chat implementer |

### Comparison rule

Klaim kualitas hanya boleh dibuat per benchmark segment:

```text
repository class × work type × risk × assurance × executor/model × domain
```

Candidate dibandingkan terhadap baseline agent workflow dan, bila tersedia, reference work manusia senior. Success threshold, sample size, missing-data rule, dan severity harus dibekukan sebelum unseen evaluation. Tidak ada aggregate score yang boleh menutupi segment tipis atau gagal.

### Minimum anti-gaming metrics

- defect escape rate,
- requirement misunderstanding,
- critical/high security findings,
- regression count,
- test mutation survival atau oracle weakness,
- unnecessary complexity,
- review time dan review corrections,
- rollback/recovery success,
- escaped assumption count,
- product decision quality,
- rework dan change failure,
- outcome achieved vs output completed.

## 5. Governing principles

1. **Roles are accountability, not personas.** Role menetapkan ownership, authority, evidence, dan escalation; gaya bicara tidak relevan.
2. **Repository state beats conversation memory.** Goal, decision, work state, dan evidence harus dapat dipulihkan tanpa transcript.
3. **Facts are researched; decisions are authorized.** AI mencari fakta, manusia/owner memutuskan trade-off material.
4. **Deterministic tools first.** Schema, digest, test, state transition, dan policy evaluation memakai code bila memungkinkan.
5. **Risk sets assurance.** Task kecil dapat berisiko kritis; task besar dapat berisiko rendah.
6. **No self-acceptance for high-risk work.** Implementer tidak menjadi satu-satunya reviewer, verifier, atau risk acceptor.
7. **Evidence has strength.** Claim, static inspection, executed test, independent verification, dan production outcome tidak disamakan.
8. **Every gate must earn its cost.** Gate menyebut risk prevented, owner, evidence, skip rule, biaya, dan review date.
9. **Compatibility is a contract.** Legacy input tidak diam-diam kehilangan authority atau berubah semantics.
10. **Small batches, bounded context.** Setiap AI worker menerima work packet minimum yang cukup, bukan seluruh history.

## 6. Four independent control axes

Workflow selection memakai empat axis terpisah:

### Complexity

```text
micro → small → medium → large
```

Menentukan decomposition, context size, dan coordination cost.

### Risk

```text
low → moderate → high → critical
```

Menentukan kemungkinan dan impact kegagalan: user harm, money, privacy, authorization, availability, irreversible data change, compliance.

### Assurance

| Profile | Typical work | Minimum evidence |
|---|---|---|
| A0 | typo, formatting, disposable internal script | smoke/static check |
| A1 | feature biasa, reversible, non-sensitive | unit/integration evidence + review |
| A2 | customer data, auth-adjacent, migration, public behavior | threat/risk review + negative tests + independent verifier + rollback |
| A3 | payment, authorization, regulated, safety-critical, irreversible data | executable controls + provenance + realistic environment + distinct human approval + operational recovery proof |

### Ceremony

```text
prototype → vibe → standard → strict → emergency
```

Menentukan kedalaman deliberation, visibility, checkpoint cadence, dan documentation ceremony. Ceremony tidak boleh menurunkan hard stop atau minimum assurance yang ditetapkan risk.

### Decision precedence

```text
hard stop > assurance profile > risk controls > task complexity > ceremony preference
```

## 7. Role accountability contracts

Setiap role contract memakai schema konseptual berikut:

```yaml
role_id:
owns: []
may_approve: []
may_block: []
must_not_self_approve: []
required_inputs: []
required_outputs: []
required_evidence: []
escalates_when: []
fallback_when_unavailable:
```

Role dapat dipegang manusia, AI worker, atau gabungan, tetapi authority profile tetap sama. Pada tim kecil, satu manusia dapat memakai beberapa topi; conflict-of-interest tetap dicatat.

### Product Owner / Product Manager

Owns:

- problem dan target user,
- measurable product outcome,
- opportunity cost dan prioritization,
- scope acceptance,
- kill/continue decision.

Must produce:

- problem evidence,
- JTBD,
- assumption ledger,
- success/failure threshold,
- explicit non-goals,
- economic/value rationale.

Must not self-approve:

- technical safety claim,
- QA evidence,
- production readiness.

### UX / Product Research

Owns user evidence, interaction assumptions, usability validation, accessibility intent, dan user-harm findings. Tidak menjadi authority untuk backend correctness atau release safety.

### Architect / Tech Lead

Owns architecture fitness, component boundaries, compatibility, reversibility, migration strategy, performance budget, and maintainability. Tidak boleh mengganti product outcome atau menerima security exception sendiri.

### Developer / Implementer

Owns implementation correctness, local tests, deviation disclosure, code comprehension, dan bounded change. Tidak boleh mengubah approved acceptance criteria secara diam-diam atau menjadi satu-satunya verifier.

### QA / Independent Verifier

Owns product-risk analysis, oracle quality, condition matrix, negative/adversarial tests, exploratory charters, regression assessment, dan residual-risk statement. QA dapat memblokir acceptance ketika evidence tidak cukup.

### Security Reviewer

Owns threat/abuse cases, security control verification, exception review, dependency/provenance risk, dan escalation pada A2/A3. Tidak menggantikan business risk owner.

### Platform / SRE

Owns SLI/SLO feasibility, observability, release safety, capacity, backup/restore, incident readiness, dan operational verification.

### Release Authority

Owns exact candidate authorization, target environment, rollout window, rollback authority, dan final production decision. AI dapat menyiapkan evidence tetapi tidak memperoleh production authority dari dokumen repository saja.

### Outcome Owner

Biasanya Product Owner bersama SRE. Owns keputusan keep, iterate, rollback, or retire berdasarkan product dan technical outcomes.

## 8. End-to-end AI-friendly team lifecycle

### Stage 1 — INTAKE

**Accountable:** Product Owner atau service owner.

**Inputs:** request, incident, customer evidence, compliance need, tech debt, experiment idea.

**AI work:** normalisasi request, duplicate search, history lookup, initial classification, missing-fact research.

**Canonical output:** intake record dengan source, problem statement, affected users/system, urgency, evidence pointers, requested solution, dan risk hints.

**Exit gate — Intake Valid:**

- problem dapat dinyatakan terpisah dari requested solution,
- owner dan affected surface diketahui,
- emergency dipisahkan dari normal delivery,
- source/evidence tidak difabrikasi.

### Stage 2 — DISCOVER

**Accountable:** Product Owner; UX/domain expert consulted.

**AI work:** research internal/external facts, surface assumptions, recommend options, challenge premise, maintain decision frontier.

**Required decisions:** Why, Constraints, What, Data, Technical direction.

**Additional outputs:** current workaround, frequency/severity, opportunity cost, assumption ledger, kill criteria, rejected alternatives.

**Exit gate — Problem Fit:**

- target user/job jelas,
- evidence strength dinyatakan,
- desired outcome dapat diukur,
- cost of doing nothing diketahui,
- whole-picture council menemukan tidak ada unresolved material objection.

Failure route: `STOP`, collect more evidence, atau revise problem. Tidak semua intake menjadi build.

### Stage 3 — VALIDATE

**Accountable:** Product + UX + Tech Lead.

**AI work:** prototype, feasibility spike, experiment design, competitor/prior-art research, evidence synthesis.

**Canonical output:** hypothesis, target behavior, experiment, success threshold, failure threshold, sample/evidence, decision.

**Exit gate — Solution Fit:**

- solusi menjawab problem yang disetujui,
- uncertainty terbesar diuji lebih dulu,
- benefit diperkirakan melebihi cost/risk,
- result adalah `proceed`, `revise`, atau `stop`.

### Stage 4 — SPEC

**Accountable:** shared; setiap domain memiliki owner.

**AI work:** domain deliberation, consistency analysis, alternative design, risk discovery, faithful document generation.

**Possible outputs:** FSD, SDS, ERD, UX, threat model, NFR/SLO, migration and rollback design, test strategy.

**Exit gate — Design Ready:**

- expensive-to-reverse decisions eksplisit,
- happy, error, abuse, and recovery flows tersedia,
- data lifecycle dan compatibility jelas,
- security controls mempunyai verification method,
- QA menyatakan requirement testable,
- SRE menyatakan operational assumptions visible,
- fidelity check lulus.

### Stage 5 — PLAN

**Accountable:** Engineering Lead bersama delivery team.

**AI work:** vertical decomposition, dependency/frontier calculation, risk/assurance assignment, file-overlap analysis, review-cost estimate.

**Canonical output:** approved work order dengan goal, supports, dependencies, risk, assurance, files, acceptance criteria, evidence requirements, rollback, dan human review.

**Exit gate — Ready to Build:**

- setiap slice independently reviewable/demoable,
- acceptance criteria literal dan locked,
- no unresolved design value,
- evidence level sesuai assurance,
- work packet cukup tanpa transcript.

### Stage 6 — BUILD

**Accountable:** Implementer.

**AI work:** tests/code generation, mechanical refactor, tool execution, constraint check, evidence capture.

**Execution pattern:**

```text
review test intent
→ implement semantic chunk
→ execute local evidence
→ disclose deviation
→ checkpoint based on mode/risk
```

**Chunk gate:** build/test relevant hijau, scope bounded, diff reviewable, no silent contract/schema change.

### Stage 7 — VERIFY

**Accountable:** independent QA/verifier; security/SRE consulted by profile.

**AI work:** spec conformance, adversarial generation, static/runtime checks, evidence normalization, defect reporting.

**Verification order:**

1. exact spec/AC conformance,
2. unit/integration/contract evidence,
3. negative, state, role, ownership, and timing cases,
4. security controls,
5. performance/concurrency,
6. UI/accessibility/device where applicable,
7. migration/rollback/recovery,
8. independent judgment and comprehension.

**Exit gate — Release Candidate:**

- Must requirements have current evidence,
- oracle quality assessed,
- residual risk explicit,
- skipped/blocked evidence distinguished from fail/pass,
- high-risk human review complete,
- exact candidate digest identified.

Defect route returns to BUILD with written reproduction, expected/actual, severity, and re-verification owner.

### Stage 8 — RELEASE

**Accountable:** Release Authority; SRE/Platform consulted.

**AI work:** readiness compilation, artifact/digest comparison, rollout/rollback preparation, canary query preparation.

**Outputs:** immutable candidate, deployment/migration/rollback plans, release notes, monitoring queries, owner/on-call.

**Exit gate — Release Authorized:** exact candidate and environment approved; backup/recovery ready; authority not inferred from repository content.

SDD Pipeline may prepare and validate; production action remains a hard stop without external human authorization.

### Stage 9 — OBSERVE

**Accountable:** SRE/Platform + Product Owner.

**Technical signals:** correctness, availability, latency distribution, error rate, saturation, security signals, rollback/recovery, change failure.

**Product signals:** task success, adoption, retention, conversion, complaint/support volume, intended behavior change, user harm.

**Exit gate — Outcome Reviewed:** technical health dan product outcome dinilai terpisah; decision adalah keep, iterate, rollback, or retire.

### Stage 10 — LEARN

**Accountable:** domain owner dan team leadership.

**Learning loop:**

```text
finding/incident/outcome miss
→ root cause and contributing conditions
→ why existing gates missed it
→ missing or noisy control
→ regression fixture / benchmark update
→ pipeline or domain-pack change
→ re-evaluation
```

Durable decisions, verified conventions, and regression fixtures disimpan. Raw logs, progress diaries, dan transcript tidak menjadi permanent memory.

## 9. Workflow state and transition contract

Target state model:

```text
proposed
→ clarified
→ validated
→ specified
→ approved
→ implementing
→ verifying
→ accepted
→ release-authorized
→ released
→ observed
→ learned-or-retired
```

Alternative terminal/side states:

```text
rejected · blocked · degraded · superseded · rolled-back
```

Setiap transition event minimal membawa:

```yaml
event_version:
event_id:
work_id:
from_state:
to_state:
actor_id:
actor_role:
authority_basis:
subject_digests:
required_evidence:
observed_evidence:
decision:
issued_at:
expires_at:
```

Quality Contract v1 menjadi kandidat fondasi. Keputusan apakah schema tersebut diperluas, dibuat companion contract, atau dinaikkan versi harus melewati compatibility design review. Tidak boleh ada dua authority engines yang mengklaim state yang sama.

## 10. Evidence maturity ladder

| Level | Evidence | Permitted claims |
|---|---|---|
| E0 | agent/human assertion | hypothesis, unverified status only |
| E1 | static inspection or document consistency | structure/pattern claim |
| E2 | executed deterministic command | command-scoped behavior |
| E3 | negative/adversarial/fault test | resistance to named failure class |
| E4 | independent verifier on frozen inputs | independently reviewed candidate |
| E5 | realistic disposable/staging environment | environment-relevant behavior |
| E6 | production/field outcome | observed operational/product outcome |

Acceptance criterion mendeklarasikan minimum evidence level. Higher evidence tidak mengizinkan claim di luar subject, environment, timeframe, atau measurement method-nya.

## 11. Quality profiles

### Product profile

- problem evidence,
- hypothesis dan falsification,
- assumption ledger,
- opportunity cost,
- success/failure/kill thresholds,
- outcome review.

### Engineering profile

- architecture fitness,
- dependency and API compatibility,
- migration/reversibility,
- maintainability,
- performance budget,
- operability.

### QA profile

- product-risk analysis,
- positive/negative cases,
- role/state/ownership/timing condition matrix,
- oracle review,
- mutation/property/model/contract/differential testing when justified,
- exploratory charter,
- flaky-test assessment,
- residual-risk statement.

### Security profile

- NIST SSDF-aligned secure development practices,
- OWASP ASVS/SAMM mapping where applicable,
- threat and abuse modeling,
- secrets/dependency/provenance/SBOM controls,
- executable High/Critical controls,
- security exception owner and expiry,
- artifact signing/attestation where environment supports it.

### Production profile

- SLI/SLO and error-budget assumptions,
- observability and alert ownership,
- rollout/canary strategy,
- schema/data compatibility,
- backup/restore,
- incident runbook,
- capacity assumptions,
- post-release verification.

## 12. Benchmark and eval program

### Corpus categories

- hidden-root-cause bug,
- ambiguous requirements,
- risky refactor,
- schema/data migration,
- authentication/authorization/payment,
- concurrency/race condition,
- production incident,
- feature that should be rejected,
- green tests with incorrect oracle,
- external API/version drift,
- accessibility/usability failure,
- operational recovery.

### Per-case package

```yaml
case_id:
segment:
repository_snapshot:
user_request:
hidden_facts:
allowed_tools:
authority_limits:
expected_decisions:
acceptable_solution_properties:
unacceptable_shortcuts:
security_traps:
hidden_tests:
maintainability_rubric:
product_value_rubric:
review_rubric:
```

Reference solution tidak diperlakukan sebagai satu-satunya valid implementation. Grader menilai properties dan outcomes.

### Evaluation controls

- calibration dan unseen sets terpisah,
- assignment dan rubric dibekukan,
- model/prompt/pipeline version dicatat,
- human graders dibutakan terhadap candidate bila praktis,
- inter-rater disagreement dicatat,
- no aggregate hides failed critical segment,
- benchmark contamination dan memorization risk dicatat,
- secrets, proprietary code, PII, dan license dibersihkan sebelum corpus inclusion.

## 13. Anti-bureaucracy gate contract

Setiap gate baru harus mempunyai:

```yaml
gate_id:
risk_prevented:
trigger:
owner:
required_evidence:
decision_outputs:
skip_when:
skip_authority:
estimated_cost:
observed_findings:
false_positive_rate:
review_or_expiry_date:
```

Gate ditinjau bila tidak pernah menemukan defect/mengubah keputusan, mempunyai false-positive tinggi, menduplikasi gate lain, atau biayanya melebihi risk reduction. Removal diperlakukan sebagai improvement bila evidence mendukung.

## 14. Domain and organization packs

### Initial domain candidates

- SaaS CRUD,
- fintech/payment,
- healthcare/privacy-sensitive,
- data pipeline,
- mobile,
- developer tooling/library,
- infrastructure/platform,
- AI/ML systems.

### Organization pack

```yaml
approved_stacks:
approved_dependencies:
architecture_boundaries:
coding_conventions:
data_classification:
privacy_and_retention:
security_baseline:
deployment_platform:
slo_templates:
incident_severity:
ownership_map:
release_authorities:
required_assurance_overrides:
```

Packs mempersempit pilihan dan menambah evidence requirements; tidak boleh melemahkan non-negotiable global controls.

## 15. Target component map

Nama berikut adalah candidate ownership boundaries, bukan approved filenames. W2 audit alignment harus memastikan tidak menduplikasi modul yang sudah ada.

| Capability | Candidate owner |
|---|---|
| Intake normalization | THINK/product-intake module |
| Problem/solution validation | command discover + product-validation reference module |
| Risk and assurance selection | orchestrator + dedicated evaluator |
| Role accountability | META authority/role contract |
| Workflow transitions | Quality Contract extension or single companion state engine |
| Evidence levels | Quality Contract/evidence runner |
| QA profiles | build test-plan + prove skills |
| Release readiness | build infra + new release-readiness reference module |
| Observe and learn | meta outcome/incident learning modules |
| Benchmark runner | dedicated zero-dependency or isolated tooling surface |
| Domain/org packs | constraints/profile directories |
| Gate effectiveness | stats/outcome module backed by external evidence, not self-count only |

Public command count remains unchanged until user research and usage evidence show a command is needed.

## 16. Executable work packages

### WP-00 — Complete alignment audit

**Goal:** establish trustworthy current behavior before vNext modification.

**Source plan:** `docs/sdd/reports/2026-10-02-skill-runtime-docs-alignment-plan.md`.

**Deliverables:** 65/65 inventory, executable trace, conflict/claim matrix, canonical ownership decisions.

**Acceptance:** all P0/P1 conflicts resolved or explicitly blocked; baseline reproducible.

**Tier:** T3. **Blocks:** all packages that change behavior.

### WP-01 — Freeze quality hypothesis and eval protocol

**Goal:** define what improved quality means before adding controls.

**Deliverables:** benchmark segments, metrics dictionary, severity, calibration/unseen protocol, grader rules, privacy/license policy.

**Acceptance:** baseline and candidate can be compared without changing rubric after results are seen.

**Tier:** T3. **Blocked by:** WP-00 factual inventory. **Blocks:** WP-10, WP-11.

### WP-02 — Separate complexity, risk, assurance, and ceremony

**Goal:** deterministic selection of minimum assurance independent of task size and user tone.

**Deliverables:** schemas, evaluator, conflict precedence, fixtures for micro-critical and large-low-risk cases.

**Acceptance:** negative fixtures prove prototype/emergency cannot suppress hard stops or required assurance.

**Tier:** T3. **Blocked by:** WP-00. **Blocks:** WP-03–WP-09.

### WP-03 — Role accountability and authority contracts

**Goal:** replace persona-style role play with verifiable ownership and separation of duties.

**Deliverables:** role schema, default team roles, small-team multi-hat policy, conflict-of-interest/degraded rules, transition authority mapping.

**Acceptance:** forbidden self-approval and missing authority fail closed for A2/A3; unavailable roles produce explicit degraded/blocked result.

**Tier:** T3. **Blocked by:** WP-02. **Blocks:** WP-04–WP-09.

### WP-04 — Lifecycle state and transition engine

**Goal:** represent end-to-end work state and evidence as versioned machine-readable events.

**Deliverables:** state schema, transition table, event validation, exact-subject binding, replay/expiry behavior, legacy/report-only compatibility.

**Acceptance:** invalid transition, stale evidence, unauthorized actor, replay, and subject mismatch have executable negative tests.

**Tier:** T3/security-sensitive. **Blocked by:** WP-00, WP-02, WP-03. **Blocks:** WP-05–WP-09.

### WP-05 — Product loop: intake, discover, validate

**Goal:** allow pipeline to stop bad/unsupported ideas before specification.

**Deliverables:** intake contract, problem-evidence model, assumption ledger, hypothesis/experiment template, problem-fit and solution-fit gates.

**Acceptance:** benchmark includes at least one feature that must be rejected and one that must be revised; pipeline does not force both into BUILD.

**Tier:** T2/T3. **Blocked by:** WP-03, WP-04. **Parallel with:** WP-06 after blockers.

### WP-06 — Delivery loop: spec, plan, build, verify

**Goal:** integrate assurance, evidence level, and role authority into current core without duplicating its artifacts.

**Deliverables:** updated spec/ticket schemas, assurance-derived test requirements, evidence-level mapping, independent verifier packet, defect/rework transitions.

**Acceptance:** existing low-risk workflows remain usable; A2/A3 fixtures cannot accept weak/self-reported evidence.

**Tier:** T3. **Blocked by:** WP-02–WP-04. **Parallel with:** WP-05.

### WP-07 — QA and behavioral quality profiles

**Goal:** test behavior and oracle strength, not only line/branch coverage.

**Deliverables:** risk matrix, condition matrix, oracle review, configurable mutation/property/state/contract/differential/fault/concurrency checks, residual-risk format.

**Acceptance:** seeded faulty implementations demonstrate that selected checks can fail; unsupported tools are `SKIPPED/BLOCKED`, never pass.

**Tier:** T3. **Blocked by:** WP-02, WP-03, WP-06.

### WP-08 — Security and production-readiness profiles

**Goal:** connect design-time controls to executable verification and operational readiness.

**Deliverables:** SSDF/ASVS/SAMM mapping, security exception lifecycle, provenance/SBOM hooks, SLO/observability/rollback/backup/capacity templates, A2/A3 policies.

**Acceptance:** High/Critical control without executable evidence cannot become green; production authority remains external and explicit.

**Tier:** T3/security-sensitive. **Blocked by:** WP-02–WP-04, WP-06. **Parallel with:** WP-07 where files do not overlap.

### WP-09 — Release, observe, and learn loop

**Goal:** close the lifecycle beyond code acceptance.

**Deliverables:** release-candidate binding, release-readiness result, observation plan, product/technical outcome review, incident-to-regression pipeline, rollback/retire transitions.

**Acceptance:** exact candidate authorization cannot be reused for a different digest/environment; incident fixture creates a regression case without storing raw sensitive logs.

**Tier:** T3. **Blocked by:** WP-03, WP-04, WP-08.

### WP-10 — Benchmark runner and quality dashboard contract

**Goal:** execute frozen evals and report segment-level results without manufactured confidence.

**Deliverables:** corpus loader, isolated runner interface, grader adapters, result schema, segment report, comparison logic, confidence/missing-data handling.

**Acceptance:** baseline and candidate rerun reproducibly; failing critical segment blocks promotion regardless of aggregate.

**Tier:** T3. **Blocked by:** WP-01, WP-04, WP-06–WP-09.

### WP-11 — Domain and organization pack system

**Goal:** make senior judgment context-aware without forking the core workflow.

**Deliverables:** pack schema, merge/precedence rules, validation, one developer-tooling reference pack, one higher-risk reference pack.

**Acceptance:** organization pack can tighten controls but cannot weaken global hard stops; invalid/conflicting pack fails with actionable result.

**Tier:** T2/T3. **Blocked by:** WP-02, WP-03, WP-04. Can begin before WP-10.

### WP-12 — Compatibility, installer, and provider portability

**Goal:** distribute vNext safely across supported hosts without assuming identical capabilities.

**Deliverables:** capability negotiation, install/update/migration paths, legacy fixtures, provider-neutral handoff/evidence tests, downgrade/rollback guidance.

**Acceptance:** missing optional capability is degraded; missing required capability blocks; legacy consumers remain report-only until explicit migration.

**Tier:** T3. **Blocked by:** stable schemas from WP-02–WP-04 and relevant module work.

### WP-13 — Documentation and adoption

**Goal:** make behavior understandable by product, engineering, QA, security, and operations audiences.

**Deliverables:** lifecycle guide, role guide, assurance guide, benchmark methodology, migration guide, worked examples, architecture/README updates.

**Acceptance:** every material claim maps to policy/mechanical/runtime/host-dependent evidence; no duplicate normative SSOT.

**Tier:** T2. **Blocked by:** WP-05–WP-12 behavior stabilization.

### WP-14 — Pilot and promotion decision

**Goal:** decide whether vNext controls improve outcomes enough to become default.

**Rollout:** local fixtures → shadow mode → report-only projects → opt-in enforcement → unseen evaluation → human promotion decision.

**Acceptance:** all declared benchmark segments meet frozen criteria; no blocking P0/P1, review/productivity regression, or unexplained missing data.

**Tier:** T3. **Blocked by:** WP-01–WP-13.

## 17. Dependency frontier

```text
WP-00
├─ WP-01 ───────────────────────────────┐
└─ WP-02 → WP-03 → WP-04               │
                    ├─ WP-05            │
                    ├─ WP-06 → WP-07    │
                    │        └→ WP-08 → WP-09
                    └─ WP-11            │
                                         ├→ WP-10
stable schemas/modules ──────────────────┴→ WP-12
WP-05..12 → WP-13 → WP-14
```

First executable frontier setelah WP-00 dan approval:

- WP-01 quality/eval protocol,
- WP-02 control-axis model.

Keduanya dapat berjalan paralel bila tidak menyentuh file yang sama. Semua dispatch tetap mengikuti parallel-safety check dan explicit user confirmation.

## 18. Staged rollout and compatibility

### R0 — Research only

Audit, benchmark design, and schemas. Tidak mengubah current behavior.

### R1 — Shadow

Lifecycle/risk evaluators menghitung hasil tetapi tidak memblokir. Compare dengan keputusan pipeline lama.

### R2 — Report only

Results masuk evidence report; mismatch terlihat tetapi current compatibility tetap berlaku.

### R3 — Opt-in enforcement

Project memilih artifact-policy/quality-contract version baru secara eksplisit. Migration preview wajib.

### R4 — Default candidate

Hanya setelah unseen evaluation, pilot outcome, compatibility tests, dan human approval.

### R5 — Default with legacy reader

New work memakai contract baru; legacy artifacts tetap terbaca sesuai release policy sampai sunset yang diumumkan.

Tidak ada silent migration atau silent promotion antar tahap.

## 19. Verification strategy

### Structural

- schema validation,
- public entry discovery,
- path/reference checks,
- artifact lifecycle/hygiene,
- traceability.

### Behavioral

- positive and negative transitions,
- role/authority violations,
- evidence freshness and subject binding,
- risk/assurance selection,
- feature reject/revise scenarios,
- defect rework and re-verification,
- rollback and incident learning.

### Security

- replay,
- tampering,
- path escape,
- forged/stale authority,
- self-approval,
- secret/PII leakage,
- untrusted pack/fixture input,
- production target ambiguity.

### Evaluation

- calibration vs unseen,
- baseline vs candidate,
- human grader agreement,
- segment completeness,
- review effort and quality,
- anti-gaming checks.

### Portability

- supported installation targets,
- capability negotiation,
- generic Markdown host degradation,
- offline/local operation where promised,
- provider-neutral handoff.

## 20. Data, privacy, and retention

- Benchmark corpus tidak boleh menyimpan secrets, private customer data, atau source tanpa license/authority.
- Evidence output harus bounded dan secret-redacted.
- Production observations masuk sebagai aggregate/pointer bila raw data sensitif.
- Conversation transcript bukan canonical evidence.
- Actor identifiers membuktikan separation record, bukan real-world identity, kecuali external attestation menyediakan itu.
- Retention mengikuti project policy; transient execution state kembali ke Git history atau trusted evidence store setelah outcome canonical.

## 21. Stop conditions and human decisions

Pekerjaan berhenti pada relevant package bila:

- operational definition kualitas belum disetujui,
- risk/assurance mapping mempunyai dua pilihan defensible dengan user impact berbeda,
- state engine akan menduplikasi atau mematahkan Quality Contract authority,
- public command surface harus berubah,
- enforcement akan mengubah existing report-only behavior menjadi blocking,
- benchmark data tidak mempunyai license/privacy authority,
- provider capability tidak dapat memenuhi required assurance,
- production/release action memerlukan external authority,
- unseen evaluation menunjukkan quality atau review-cost regression.

## 22. Program Definition of Done

- [x] WP-00 alignment audit complete; canonical ownership known.
- [x] Senior-equivalent quality defined as measurable, segment-scoped hypothesis.
- [x] Complexity, risk, assurance, and ceremony are independent and tested.
- [x] Role accountability and authority contracts are versioned and enforced at required profiles.
- [x] End-to-end lifecycle transitions are machine-readable, replay-safe, and subject-bound.
- [x] Product loop can reject or revise weak ideas before BUILD.
- [x] Core delivery preserves backward-compatible low-risk workflow.
- [x] QA evaluates oracle and behavior, not coverage alone.
- [x] Security and production profiles connect design controls to evidence.
- [x] Release, observe, and learn complete the feedback loop.
- [x] Benchmark runner compares baseline/candidate on frozen calibration and unseen segments.
- [x] At least two validated domain/organization packs prove extensibility.
- [x] Installer, migration, and provider-degradation paths are tested.
- [x] Documentation distinguishes policy, validation, runtime enforcement, and host dependence.
- [x] Gate-effectiveness review prevents permanent bureaucracy without evidence.
- [x] Independent verification is recorded; otherwise exact degraded items remain visible.
- [ ] Promotion to default is a human decision based on evidence, never an automatic version bump.

## 23. Immediate execution order

1. Complete WP-00 using the existing alignment plan.
2. Run a decision workshop for the five unresolved foundations:
   - primary adopter: solo, full team, or regulated organization,
   - autonomy ceiling for AI,
   - initial benchmark domains,
   - Quality Contract evolution strategy,
   - acceptable review/latency cost.
3. Freeze WP-01 eval protocol before implementation changes.
4. Specify and implement WP-02 control axes in shadow mode.
5. Specify WP-03/WP-04 contracts; validate compatibility before code.
6. Build product, delivery, and operation loops incrementally.
7. Integrate QA/security/production profiles.
8. Run opt-in pilots and unseen evaluation.
9. Decide promotion, revision, or rejection based on segment evidence.

## 24. References and evidence basis

- Existing alignment work order: `docs/sdd/reports/2026-10-02-skill-runtime-docs-alignment-plan.md`
- Current routing behavior: `skills/orchestrator/SKILL.md`; conditional policy owners: `skills/orchestrator/references/behavior.md`, `delivery.md`, and `project-state.md`
- Current product discovery: `skills/commands/discover/SKILL.md`
- Current specification flow: `skills/commands/spec/SKILL.md`
- Current ticket decomposition: `skills/build/ticket-decomposition/SKILL.md`
- Current Quality Contract pilot/runtime under `docs/QUALITY-CONTRACT-PILOT.md` and `skills/meta/quality-contract/`
- NIST Secure Software Development Framework: <https://csrc.nist.gov/pubs/sp/800/218/final>
- OWASP ASVS: <https://devguide.owasp.org/en/08-culture-process/04-asvs/>
- Official Scrum Guide: <https://scrumguides.org/scrum-guide.html>
- ISTQB CTFL syllabus: <https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf>
- Google SRE Service Level Objectives: <https://sre.google/sre-book/service-level-objectives/>
- DORA software delivery performance metrics: <https://dora.dev/guides/dora-metrics/>
- OpenAI Evals: <https://platform.openai.com/docs/api-reference/evals>

## 25. Closure contract

Dokumen ini tetap `OPEN` selama program belum mempunyai canonical spec bundle dan approved work order. Setelah discovery decisions settle, bagian relevant dipindahkan secara faithful ke feature specs/tickets; dokumen ini tidak menjadi authority kedua.

Ketika canonical outcomes sudah committed:

1. hapus live references yang tidak diperlukan,
2. pastikan Git recovery,
3. ubah status hanya setelah seluruh active work dialihkan,
4. retire dokumen ini mengikuti artifact lifecycle policy.

Implementation tidak dimulai hanya karena dokumen ini ada. Approval berikutnya berlaku pada settled spec dan ticket breakdown, bukan pada seluruh kemungkinan perubahan yang tercantum di roadmap ini.
