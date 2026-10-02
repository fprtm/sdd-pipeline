---
description: Work order audit dan rekonsiliasi antara skill, runtime, validator, CI, dan dokumentasi publik SDD Pipeline.
status: active
lifecycle: transient
updated: 2026-10-02
---

# Skill, Runtime, and Documentation Alignment — Audit and Remediation Plan

**Status: OPEN**
**Mode:** standard
**SDLC:** incremental
**Domain:** library
**Authority:** audit read-only dan penulisan hasil audit diizinkan; perubahan behavior, compatibility contract, atau dokumentasi produk memerlukan work order lanjutan yang disetujui.

## 1. Outcome yang dituju

Repo memiliki satu model perilaku yang dapat ditelusuri dari instruksi skill ke enforcement mekanis, test, CI, dan dokumentasi publik. Setelah pekerjaan selesai, maintainer harus dapat menjawab untuk setiap klaim utama:

1. Di mana sumber kebenarannya?
2. Apakah klaim itu policy untuk agen, validasi mekanis, atau enforcement runtime?
3. Test apa yang membuktikannya?
4. Dokumentasi mana yang menjelaskannya kepada pengguna atau maintainer?
5. Apa yang terjadi pada instalasi dan artefak versi lama bila perilaku berubah?

Plan ini tidak menganggap dokumentasi salah hanya karena berbeda dari satu file. Perbedaan diklasifikasikan setelah seluruh jalur perilaku dibaca dan bukti executable diperiksa.

## 2. Fakta awal dan ketidakpastian

### Fakta yang sudah diverifikasi

- Repo berisi 65 file `SKILL.md` dengan total sekitar 6.595 baris.
- Plugin mendaftarkan satu orchestrator dan delapan command sebagai public entry points.
- Installer melakukan copy skill, alias orchestrator, path rewriting, optional hooks/CI/templates, serta instalasi runtime Quality Contract dengan staged release switch.
- Checker behavior suite dan Quality Contract suite lulus pada baseline lokal 2026-10-02.
- Quality Contract memiliki source runtime, test, dan coverage gate tersendiri; ia bukan sekadar instruksi Markdown.
- `docs/sdd/` repo lulus file-hygiene dan traceability check pada baseline lokal.
- Dokumentasi arsitektur memuat beberapa klaim yang tidak cocok dengan filesystem atau orchestrator saat ini, termasuk jumlah skill, cakupan executable code, dan sebagian mode table.

### Hal yang belum boleh dianggap selesai

- Belum terbukti bahwa orchestrator benar pada setiap konflik; command, mode, constraint, dan meta skill dapat memiliki konteks tambahan yang mengubah interpretasi.
- Belum ada audit semantik lengkap terhadap seluruh 65 skill.
- Belum diketahui apakah setiap warning `validate-skills.sh` adalah defect nyata atau validator yang tertinggal dari desain SSOT terbaru.
- Belum diputuskan apakah perubahan yang ditemukan harus mempertahankan compatibility dengan instalasi dan artefak lama.
- Klaim eksternal di README tentang produk lain dan riset belum termasuk scope bukti lokal ini.

## 3. Scope

### In scope

- Seluruh `skills/**/SKILL.md` dan companion files yang langsung dirujuk.
- Public contract di `AGENTS.md`, plugin manifest, README, INSTALL, ARCHITECTURE, RELEASE-POLICY, dan Quality Contract pilot documentation.
- Installer, four classic mechanical checkers, Quality Contract runtime, hooks, dan workflow CI.
- Test harness serta validator yang mengklaim menjaga struktur atau behavior di atas.
- Compatibility dan artifact lifecycle yang terdampak bila sumber kebenaran dipindahkan atau perilaku diubah.

### Out of scope

- Menambahkan fitur produk baru yang tidak diperlukan untuk memperbaiki mismatch.
- Mendesain ulang keseluruhan metodologi SDD karena preferensi editorial.
- Membuktikan bahwa penggunaan SDD Pipeline meningkatkan defect atau vulnerability rate pada proyek nyata; repo belum memiliki benchmark tersebut.
- Mengubah isi desain visual di `docs/design-system-styles/` kecuali audit menemukan referensi produk yang faktual salah.
- Deploy, publish release, atau perubahan marketplace.

## 4. Model klasifikasi

Setiap temuan harus diberi dua label: jenis bukti dan severity.

### Jenis bukti

| Label | Arti | Bukti minimum |
|---|---|---|
| `FACT` | Keadaan langsung pada source, filesystem, manifest, atau output command | path + line/function atau command + output |
| `POLICY` | Instruksi normatif kepada agen | canonical skill + rule text |
| `MECHANICAL` | Diperiksa checker atau validator deterministik | checker + positive/negative test |
| `RUNTIME` | Dikendalikan executable path saat operasi berlangsung | call path + behavior test |
| `HOST-DEPENDENT` | Bergantung capability dan kepatuhan host/agent | capability boundary + degraded behavior |
| `INFERENCE` | Kesimpulan dari beberapa fakta | fakta pendukung + alternative explanation |

### Severity

| Severity | Kriteria |
|---|---|
| `P0` | Dapat memperluas authority, melewati hard stop, membocorkan secret, menargetkan production, atau salah mengklaim independent/trusted execution |
| `P1` | Mengubah approval gate, fixed sequence, acceptance criteria, compatibility, atau hasil pass/fail |
| `P2` | Membuat instalasi, operasi, atau pemahaman arsitektur material keliru tanpa langsung mengubah authority |
| `P3` | Count, istilah, link, wording, atau contoh stale yang tidak mengubah behavior |

Tidak ada perubahan behavior hanya berdasarkan `INFERENCE`. P0/P1 memerlukan reproduksi atau trace lengkap; P2/P3 memerlukan minimal satu fakta langsung.

## 5. Work breakdown dan dependency gates

### W1 — Freeze baseline

**Goal:** menghasilkan baseline yang dapat direproduksi sebelum audit atau edit.

**Actions:**

- Catat commit, dirty state, Node version, OS class, dan command environment yang relevan.
- Jalankan `scripts/test-checkers.sh`, `scripts/test-quality-contract.sh`, dan `scripts/validate-skills.sh` secara terpisah.
- Jalankan file-hygiene dan traceability terhadap `docs/sdd`.
- Inventarisasi public entry points, seluruh `SKILL.md`, executable `.mjs`, shell scripts, hooks, dan workflows.
- Simpan hanya ringkasan hasil dan command; raw output tidak dimasukkan ke artefak aktif.

**Exit gate:** baseline mencatat pass/fail/warning secara terpisah dan dapat dijalankan ulang tanpa bergantung pada chat.

**Blocks:** W2–W8.

### W2 — Build the canonical behavior inventory

**Goal:** membaca seluruh skill dan menghasilkan satu inventory tanpa memilih pemenang konflik lebih dulu.

**Per-skill fields:**

- purpose dan trigger,
- prerequisites dan stop conditions,
- inputs dan outputs,
- files read/written,
- authority gained atau explicitly denied,
- dependencies/callers,
- mode-specific behavior,
- mechanical/runtime enforcement,
- tests,
- public documentation references,
- ambiguity atau conflict candidates.

**Required traversal order:**

1. `orchestrator/` dan `commands/`
2. `think/`
3. `build/`
4. `prove/`
5. `meta/`
6. `modes/`
7. `constraints/`
8. `agents/`

Setiap companion resource hanya dibaca bila skill terkait merujuknya atau diperlukan untuk memahami jalur eksekusi. Inventory harus membedakan skill yang auto-discovered dari reference module yang hanya path-loaded.

**Exit gate:** 65/65 skill memiliki baris inventory; tidak ada status “reviewed” tanpa pointer ke sumber dan ringkasan perilaku.

**Blocked by:** W1.

**Blocks:** W4, W5, W6.

### W3 — Trace executable behavior

**Goal:** menentukan bagian mana yang benar-benar bekerja melalui code, bukan hanya dijanjikan Markdown.

**Trace targets:**

- install/update/uninstall dan selective installation,
- path rewrite dan orchestrator alias discovery,
- hook dan consumer CI installation,
- file hygiene, traceability, parallel safety, dan retirement checks,
- Quality Contract parse → evaluate → projection/preflight → trusted event/evidence → gateway/acceptance/retirement,
- repository CI dan test harness coverage.

Untuk setiap target, catat entry point, validation boundary, side effects, fail-open/fail-closed behavior, dependency eksternal, dan test coverage. Security-sensitive claims harus mempunyai negative test atau ditandai belum terbukti.

**Exit gate:** setiap executable component mempunyai minimal satu success path dan satu meaningful failure path yang ditelusuri ke test atau dicatat sebagai gap.

**Blocked by:** W1.

**Blocks:** W4, W7.

### W4 — Build the conflict and claim matrix

**Goal:** membandingkan skill-to-skill, skill-to-code, dan code-to-docs tanpa menyamakan pengulangan dengan bukti independen.

**Required comparisons:**

- orchestrator unified matrix vs mode skills vs command-specific behavior,
- hard stops vs constraints vs CI/hook implementation,
- fixed sequence vs direct-command routing,
- artifact lifecycle rules vs checker behavior,
- traceability policy vs checker behavior,
- agent independence claims vs host capability and actor validation,
- installer compatibility claims vs installation tests,
- Quality Contract pilot claims vs runtime/test/CI,
- README/ARCHITECTURE/INSTALL/RELEASE-POLICY vs current source.

Setiap conflict row harus menyertakan:

```text
claim_id · claim · sources · observed behavior · conflict type
severity · confidence · strongest alternative explanation
recommended owner · proposed resolution · compatibility impact
```

**Exit gate:** semua conflict candidates dari W2/W3 berstatus `confirmed`, `not-a-conflict`, atau `needs-user-decision`; tidak ada yang diam-diam diselesaikan oleh auditor.

**Blocked by:** W2 dan W3.

**Blocks:** W5–W8.

### W5 — Decision gate: canonical ownership

**Goal:** menetapkan siapa memiliki setiap rule sebelum melakukan edit.

**Default recommendation, subject to W4 evidence:**

- Orchestrator memiliki fixed sequence, unified mode matrix, task sizing, approval model, dan global hard stops.
- Command skills memiliki prerequisites, state-specific routing, dan terminal outcome command tersebut.
- Mode skills hanya memiliki process mechanics khusus mode; tidak menyalin seluruh behavior matrix.
- Constraint skills memiliki domain rules dan override semantics.
- Executable modules memiliki machine-enforced schema dan result semantics.
- Public docs menjelaskan dan menunjuk SSOT; docs tidak menjadi behavioral SSOT.

**Human decisions required:**

- konflik P0/P1 yang mempunyai lebih dari satu interpretasi defensible,
- compatibility break,
- perubahan public command surface,
- perubahan default mode atau hard stop,
- promosi Quality Contract dari opt-in/pilot.

**Exit gate:** ownership matrix disetujui; unresolved P0/P1 memblokir remediation terkait.

**Blocked by:** W4.

**Blocks:** W6–W8.

### W6 — Remediate skill logic and validators

**Goal:** memperbaiki canonical behavior lebih dulu, baru turunannya.

**Order:**

1. P0 authority/safety conflicts.
2. P1 approval, routing, compatibility, dan pass/fail conflicts.
3. Validator yang mengecek struktur lama atau menghasilkan warning non-actionable.
4. P2/P3 duplication dan stale references.

**Rules:**

- Satu commit/change unit per behavioral concern.
- Setiap behavior change wajib memiliki regression test atau alasan eksplisit mengapa hanya dapat diuji secara structural/judgment.
- Jangan memperbaiki konflik dengan menyalin rule ke lebih banyak file.
- Existing consumer artifacts tetap legacy-compatible kecuali migration plan disetujui.
- Tidak mengedit acceptance criteria yang sudah approved tanpa revision record.

**Exit gate:** canonical skill set dan validator konsisten; baseline tests tetap lulus; setiap intentional behavior change mempunyai evidence baru.

**Blocked by:** W5.

**Blocks:** W7, W8.

### W7 — Strengthen CI and distribution assurance

**Goal:** membuat regression pada executable behavior dan public surface terlihat di PR.

**Candidate changes, only after W3/W4 confirmation:**

- Jalankan Quality Contract test + coverage gate di CI utama atau workflow required yang ekuivalen.
- Selaraskan Node versions berdasarkan feature minimum yang benar-benar diperlukan.
- Tambahkan consistency test untuk plugin public entries, command count/names, installer version, dan resolvable installed references.
- Validasi docs-derived facts dari source/manifest bila stabil; hindari brittle prose snapshots.
- Pastikan consumer workflow tidak silently pass saat checker yang diklaim wajib ternyata tidak terpasang.
- Pertahankan report-only behavior bila memang bagian compatibility contract; jangan meningkatkan warning menjadi blocking tanpa keputusan policy.

**Exit gate:** CI-equivalent run lokal lulus; satu negative fixture membuktikan setiap gate baru benar-benar dapat gagal.

**Blocked by:** W3, W5, dan bagian W6 yang mengubah validator/runtime.

**Blocks:** W8.

### W8 — Rewrite public and maintainer documentation from verified behavior

**Goal:** menjelaskan produk tanpa mencampur policy, enforcement, dan aspirasi.

**Document responsibilities:**

| Document | Responsibility |
|---|---|
| `README.md` | product contract, quick start, supported surface, batas kepercayaan |
| `docs/INSTALL.md` | install/update/uninstall, hooks/CI/templates, verification dan troubleshooting |
| `docs/ARCHITECTURE.md` | component boundaries, dependency/data flow, SSOT ownership, executable vs policy layers |
| `docs/QUALITY-CONTRACT-PILOT.md` atau penggantinya | status rollout, runtime boundary, threat assumptions, operator invocation, non-goals |
| `docs/RELEASE-POLICY.md` | versioning, deprecation, migration, compatibility windows |
| `CONTRIBUTING.md` | required tests, change protocol, docs synchronization, release checklist |

**Required wording discipline:**

- `enforced` hanya untuk behavior yang memiliki runtime/checker boundary.
- `validated` hanya bila checker/test benar-benar dijalankan.
- `required by pipeline policy` untuk instruksi agen tanpa mechanical enforcement.
- `best effort` atau `host-dependent` untuk actor independence, model judgment, dan capability yang tidak dapat dibuat repo sendiri.
- Dynamic counts tidak ditulis manual bila dapat diturunkan dari manifest/filesystem; bila tetap ditulis, consistency test harus menjaganya.
- External comparison diberi tanggal verifikasi dan tidak dijadikan bukti efektivitas produk ini.

**Exit gate:** setiap material product claim mempunyai pointer ke FACT/POLICY/MECHANICAL/RUNTIME/HOST-DEPENDENT row; local links dan examples lulus checker; tidak ada rule normatif baru yang hanya muncul di docs.

**Blocked by:** W4, W5, W6, dan W7.

### W9 — Independent verification and closure

**Goal:** membuktikan alignment tanpa menggunakan klaim implementer sebagai satu-satunya evidence.

**Verification:**

- Re-run seluruh baseline commands.
- Jalankan installer smoke tests untuk supported targets pada disposable repositories.
- Jalankan positive/negative tests untuk gate baru.
- Recount source-derived inventory dan compare terhadap public surface.
- Audit ulang sample klaim dari setiap severity/type terhadap source.
- Verifier mencantumkan weakest point, residual uncertainty, dan human-review items.
- Retire laporan transient hanya setelah outcome kanonis committed, tidak ada live references, dan Git recovery terbukti.

**Exit gate:** seluruh Definition of Done terpenuhi atau outcome ditandai degraded/blocked dengan gap yang spesifik; tidak ada klaim “fully aligned” bila independent context tidak tersedia.

**Blocked by:** W6–W8.

## 6. Proposed implementation slices setelah audit

Ini adalah calon work units, bukan authorization untuk mengubah source. W4/W5 boleh menggabungkan, memecah, atau membatalkannya.

1. **Canonical behavior ownership** — selesaikan konflik orchestrator/command/mode/constraint; no blockers setelah W5.
2. **Validator alignment** — ubah `validate-skills.sh` dan structural checks agar memeriksa desain SSOT yang disetujui; blocked by #1.
3. **Quality Contract CI coverage** — integrasikan suite dan threshold secara required/report-only sesuai policy; dapat berjalan paralel dengan #2 setelah W5.
4. **Installer/distribution contract** — kuatkan tests untuk path rewriting, aliases, selective install, update, dan consumer CI; dapat berjalan paralel dengan #2/#3.
5. **Architecture and enforcement docs** — perbarui arsitektur hanya setelah #1–#4 stabil.
6. **README/install/contributing/release cleanup** — selaraskan onboarding dan maintenance contract; blocked by #3–#5.
7. **Independent final audit** — seluruh tests, install smoke, docs/source sampling, dan lifecycle closure; blocked by #1–#6.

## 7. Change-control rules

- Audit phase tidak mengedit product behavior.
- Perubahan P0/P1 berhenti pada decision gate bila canonical intent tidak terbukti.
- Scope baru di luar mismatch yang dikonfirmasi dicatat terpisah; tidak diselundupkan sebagai cleanup.
- File user yang dirty sebelum work unit dimulai tidak ditimpa.
- Perubahan dilakukan incremental sehingga setiap work unit meninggalkan tests hijau atau failure yang tercatat jelas.
- Tidak ada deploy, publish, release tag, atau marketplace mutation tanpa explicit authorization.
- Tidak ada destructive artifact retirement tanpa preview checker dan recoverability proof.

## 8. Verification matrix

| Concern | Required evidence |
|---|---|
| Skill completeness | inventory 65/65 dengan source pointers |
| Public command surface | manifest + discovery validation + install smoke |
| Mode behavior | canonical matrix + conflict tests/validator |
| Hard stops | negative tests atau explicit host-dependent classification |
| Artifact lifecycle | hygiene/retirement positive dan negative fixtures |
| Traceability | checker suite + self-check pada repo |
| Quality Contract | parser/evaluator/gateway tests + line/branch thresholds + CI invocation |
| Installer safety | staged failure, concurrent reader, update, selective install, uninstall tests |
| Documentation accuracy | claim matrix sampling + link/tree checks + no duplicate SSOT |
| Compatibility | legacy fixture atau migration evidence untuk setiap changed contract |

## 9. Risks dan mitigasi

| Risk | Mitigasi |
|---|---|
| Audit berubah menjadi redesign metodologi | Require confirmed mismatch dan scope owner untuk setiap remediation |
| Orchestrator dipilih sebagai SSOT terlalu cepat | Inventory semua command/mode/constraint sebelum W5 |
| Docs kembali drift | Generate/check stable facts dari source; jangan duplicate normative tables |
| Validator menjadi brittle terhadap prose | Validate schema/manifest/markers, bukan snapshot seluruh paragraf |
| CI makin berat atau tidak portable | Ukur runtime, pin minimum Node capability, pisahkan required vs report-only secara eksplisit |
| Compatibility consumer rusak | Legacy fixtures, migration preview, dan release-policy review sebelum merge |
| Self-review dianggap independent | Record degraded independence dan exact human-review items bila fresh verifier tidak tersedia |
| Active docs bertambah tanpa batas | Satu laporan audit transient; canonical outcomes masuk ke owner docs, lalu laporan diretire melalui Git history |

## 10. Definition of Done

- [ ] Baseline dapat direproduksi dan mencatat environment serta hasil command.
- [ ] Seluruh 65 skill diaudit secara semantik, bukan hanya ditemukan oleh validator.
- [ ] Seluruh executable path utama memiliki success/failure trace.
- [ ] Setiap conflict candidate ditriage dengan evidence type, severity, confidence, dan alternative explanation.
- [ ] Canonical ownership disetujui untuk semua P0/P1.
- [ ] Tidak ada confirmed P0/P1 conflict yang dibiarkan tanpa explicit blocked/deferred record.
- [ ] Validator tidak menghasilkan warning stale yang diketahui tanpa rationale.
- [ ] Quality Contract behavior suite dijalankan oleh CI sesuai rollout policy yang disetujui.
- [ ] Public entry points, installer behavior, dan internal path references diuji.
- [ ] README/INSTALL/ARCHITECTURE/RELEASE-POLICY/CONTRIBUTING sesuai behavior terverifikasi.
- [ ] Policy, mechanical validation, runtime enforcement, dan host-dependent behavior dibedakan secara eksplisit.
- [ ] Seluruh baseline dan new regression tests lulus; failure atau skip tidak dilaporkan sebagai pass.
- [ ] Independent verification dilakukan, atau keterbatasannya dinyatakan sebagai degraded independence.
- [ ] Laporan transient diretire hanya setelah canonical outcomes committed dan recoverable.

## 11. Stop conditions

Pekerjaan berhenti dan meminta keputusan pengguna bila:

- dua canonical sources memberikan aturan P0/P1 yang sama-sama defensible,
- remediation akan mematahkan compatibility yang dijanjikan,
- perubahan membutuhkan public command baru atau menghapus command lama,
- Quality Contract akan dipromosikan dari pilot/opt-in,
- enforcement baru mengubah report-only menjadi blocking,
- required test tidak dapat dijalankan pada environment yang tersedia,
- evidence menunjukkan scope awal salah atau incomplete secara material.

## 12. Completion report contract

Laporan akhir harus menyatakan secara terpisah:

- confirmed facts,
- behavior changes,
- docs-only corrections,
- tests/commands yang benar-benar dijalankan,
- skipped atau blocked evidence,
- compatibility impact,
- residual risks,
- weakest point,
- exact human-review request.

Status `RESOLVED` hanya boleh diberikan setelah W9. Setelah itu, canonical outcomes dikompakkan ke owner documents/code, live references dibersihkan, recoverability diverifikasi, dan laporan ini diretire sesuai artifact policy.

## 13. Execution record — WP-00 alignment audit

### W1 — Reproducible baseline

Baseline diambil pada 2026-10-02 sebelum perubahan source:

| Field | Observed value |
|---|---|
| Commit | `dd50d4e767c31bbdbcb2e6dc1bb497ca27734d9e` (`main`) |
| Dirty state | `docs/sdd/reports/` untracked; tidak ada tracked source modification |
| Runtime | Node `v24.19.0`; Linux `7.0.0-34-generic x86_64` |
| Skill inventory | 65 `SKILL.md`; 6,595 lines |
| Public entries | one orchestrator + eight commands from `.claude-plugin/plugin.json` |
| `scripts/validate-skills.sh` | exit 0; 65 skills; 23 warnings |
| `scripts/test-checkers.sh` | exit 0; 132/132 tests pass |
| `scripts/test-quality-contract.sh` | exit 0; 3/3 harness tests pass; aggregate lines 94.99%, branches 80.98%, functions 93.98% |
| File hygiene | exit 0; `docs/sdd` tree valid |
| Traceability | exit 0; 19 docs, 61 definitions, 58 matrix refs, no broken/duplicate/freelance item |

Commands are independently rerunnable from repository root:

```bash
./scripts/validate-skills.sh
./scripts/test-checkers.sh
./scripts/test-quality-contract.sh
node skills/meta/health-check/check-file-hygiene.mjs docs/sdd
node skills/meta/traceability/check-traceability.mjs docs/sdd
```

The 23 validator warnings split into 20 stale mode-local-table warnings and
three advisory file-size warnings. The five mode skills intentionally defer to
the orchestrator's unified matrix, so the first group is validator drift, not
evidence that mode behavior is absent.

### W2 — Canonical behavior inventory (65/65)

The inventory below records the semantic owner and externally relevant effect
for every skill. A row means the file was inspected for trigger, prerequisites,
outputs, authority/stop conditions, dependencies, and enforcement boundary;
it does not imply that prose policy is mechanically enforced.

#### Orchestrator and public commands (9/9)

| Source | Semantic responsibility | Output / enforcement boundary |
|---|---|---|
| `skills/orchestrator/SKILL.md` | fixed ASK→SPEC→PLAN→BUILD→CHECK spine; mode/size/domain/SDLC dispatch; approval and evidence gates | policy SSOT; calls mechanical checkers but is host-dependent prose |
| `skills/commands/check/SKILL.md` | route fresh changes to VERIFY and unchanged repositories to AUDIT | report plus actual command evidence; no release authority |
| `skills/commands/discover/SKILL.md` | settle WHICH through five seats and council | glossary/decision/idea artifacts; cannot authorize BUILD |
| `skills/commands/docs/SKILL.md` | describe existing brownfield code | `docs/system/`; never creates spec-first authority |
| `skills/commands/handoff/SKILL.md` | route produce/consume handoff operations | delegates to meta handoff; resume still needs explicit selection |
| `skills/commands/implement/SKILL.md` | execute an approved work order under BUILD guards | source/tests plus deviation summary; acceptance remains downstream |
| `skills/commands/learn/SKILL.md` | read-only code comprehension | inline explanation; memory only when requested |
| `skills/commands/spec/SKILL.md` | deliberate HOW and write feature artifacts/tickets | spec bundle, ledger, hygiene check; no automatic BUILD |
| `skills/commands/update/SKILL.md` | preview and apply framework updates | confirmation required before filesystem mutation |

#### THINK (11/11)

| Source | Semantic responsibility | Output / enforcement boundary |
|---|---|---|
| `skills/think/analytics-design/SKILL.md` | derive measurable product metrics from requirements | `docs/sdd/analytics.md`; policy |
| `skills/think/arch-analyzer/SKILL.md` | detect/propose architecture and deliberate module/contracts/performance | inline/SDS inputs; policy and optional decision artifacts |
| `skills/think/complexity-analyzer/SKILL.md` | expose hidden implementation scope | inline sizing input; policy |
| `skills/think/context-loader/SKILL.md` | load project rules, artifacts, memory, and code context in priority order | read-only context; policy |
| `skills/think/database-design/SKILL.md` | deliberate entities, relationships, cascades, indexes, and migrations | feature `erd.md`; policy |
| `skills/think/elicitation/SKILL.md` | ask adaptive unresolved questions without re-asking settled facts | inline answers/memory; user remains decision authority |
| `skills/think/grill/SKILL.md` | frontier/round deliberation and council challenge | deliberation ledger, decisions, glossary; cannot delegate user decisions |
| `skills/think/scope-guard/SKILL.md` | declare blast radius and detect scope drift | inline scope declaration; host-dependent |
| `skills/think/sdlc-detector/SKILL.md` | detect model/framework and adapt downstream process | config/memory context; currently conflicts on emergency behavior |
| `skills/think/stack-conventions/SKILL.md` | pin idiomatic stack rules from authoritative references | `docs/sdd/stack-guide.md`; policy |
| `skills/think/threat-model/SKILL.md` | STRIDE analysis and SEC controls tied to tests | feature `threats.md` and traceability; controls require executable PROVE evidence |
| `skills/think/ux-design/SKILL.md` | deliberate direction, interactions, states, responsive behavior, and tokens | `design.md`, feature `ux.md`, flow files; hygiene mechanically validates shape only |

#### BUILD (10/10)

| Source | Semantic responsibility | Output / enforcement boundary |
|---|---|---|
| `skills/build/anti-patterns/SKILL.md` | review generated code against known failure patterns | host-dependent review |
| `skills/build/change-plan/SKILL.md` | predeclare CREATE/MODIFY/DELETE scope and deviations | active change/ticket record; policy |
| `skills/build/constraints/SKILL.md` | load universal, domain, and project constraint precedence | engine policy; duplicated rule text currently drifts from universal SSOT |
| `skills/build/doc-generator/SKILL.md` | choose canonical artifacts, stable IDs, reuse, and lifecycle | spec/change/report artifacts; hygiene and traceability cover structural subset |
| `skills/build/execution-guard/SKILL.md` | stop loops, surface stuck state, and limit review chunk size | host-dependent |
| `skills/build/git-workflow/SKILL.md` | safe commit/branch/PR shape and traceability | Git operations remain user/environment controlled |
| `skills/build/infra/SKILL.md` | CI, IaC, configuration, observability, release safety | may create infra files; deploy/spend require external approval |
| `skills/build/model-router/SKILL.md` | advisory executor tier and execution-mode routing | no provider authority by itself |
| `skills/build/test-plan/SKILL.md` | map acceptance criteria to positive/negative, role/state, security, performance, and e2e tests | feature `tests.md` and traceability; execution evidence comes from PROVE |
| `skills/build/ticket-decomposition/SKILL.md` | vertical slices, blocking edges, actor fields, and feature index | ticket files; safety/hygiene/traceability have mechanical checks |

#### PROVE (8/8)

| Source | Semantic responsibility | Output / enforcement boundary |
|---|---|---|
| `skills/prove/adversarial/SKILL.md` | generate boundary/injection/state/permission/scale attack cases | tests/findings; independence host-dependent |
| `skills/prove/browser-qa/SKILL.md` | exercise Must journeys in a local/disposable browser target | runtime evidence and durable e2e specs; production is a hard stop |
| `skills/prove/coverage-check/SKILL.md` | measure line/branch coverage plus anti-gaming honesty checks | command evidence; threshold policy conflicts with prototype/emergency rows |
| `skills/prove/diagnose/SKILL.md` | root-cause, orphan, and passive security diagnosis | read-only findings; active exploitation belongs to pentest |
| `skills/prove/judgment/SKILL.md` | weakest-point, fidelity, review-profile, and comprehension gate | human-review guide; independence is host-dependent |
| `skills/prove/pentest/SKILL.md` | opt-in active exploit verification against authorized local targets | evidence/findings; never auto-runs |
| `skills/prove/performance-check/SKILL.md` | static performance scan plus executable target checks | command evidence or explicit SKIPPED/BLOCKED |
| `skills/prove/report/SKILL.md` | bounded evidence-backed verification summary | inline/report text; cannot upgrade missing evidence |
| `skills/prove/verification/SKILL.md` | types, tests/coverage, lint, and specific-value spec conformance | actual commands and traceability checker; degraded when no independent context |

#### META (10/10)

| Source | Semantic responsibility | Output / enforcement boundary |
|---|---|---|
| `skills/meta/artifact-lifecycle/SKILL.md` | classify active/canonical/transient state and guard retirement | `check-retirement.mjs` is read-only mechanical evidence |
| `skills/meta/comprehension/SKILL.md` | explain what was built and where to start reading | inline, host-dependent |
| `skills/meta/decision-log/SKILL.md` | rule-of-three ADR creation and supersession | decision files/index; policy |
| `skills/meta/glossary/SKILL.md` | canonical domain vocabulary | `docs/sdd/glossary.md`; policy |
| `skills/meta/handoff/SKILL.md` | provider-neutral bounded transfer with integrity/capability/authority checks | `HANDOFF.md` or portable package; shape partly mechanically checked |
| `skills/meta/health-check/SKILL.md` | read-only code/artifact health audit | hygiene and traceability checkers plus judgment findings |
| `skills/meta/insight/SKILL.md` | periodic developer learning summary | `docs/sdd/insights.md`; self-measured |
| `skills/meta/memory/SKILL.md` | bounded linked durable project facts and prior answers | memory graph; orphan shape mechanically checked |
| `skills/meta/stats/SKILL.md` | per-task/monthly process metrics and footer | stats files; self-reported, not independently audited |
| `skills/meta/traceability/SKILL.md` | REQ→spec/control/ticket/test/evidence spine and ship gate | `check-traceability.mjs` mechanically validates structural relations |
| `skills/meta/workflow-navigation/SKILL.md` | shared terminal-state and safe-next-route contract | structurally checked by validator; no automatic dispatch |

#### Modes (5/5)

| Source | Semantic responsibility | Output / enforcement boundary |
|---|---|---|
| `skills/modes/emergency/SKILL.md` | fix-first process and retrospective follow-up | process-only; matrix is orchestrator-owned |
| `skills/modes/prototype/SKILL.md` | speed-first process with minimum sinks | process-only; matrix is orchestrator-owned |
| `skills/modes/standard/SKILL.md` | default visible approval/checkpoint behavior | process-only; matrix is orchestrator-owned |
| `skills/modes/strict/SKILL.md` | explicit approval at significant decisions | process-only; matrix is orchestrator-owned |
| `skills/modes/vibe/SKILL.md` | invisible ceremony with visible assumptions | process-only; matrix is orchestrator-owned |

#### Constraints (6/6)

| Source | Semantic responsibility | Output / enforcement boundary |
|---|---|---|
| `skills/constraints/api/SKILL.md` | API validation, authz, pagination, rate, CORS, logging rules | tagged mechanical/judgment policy; no generic executor in repo |
| `skills/constraints/cli/SKILL.md` | CLI exit/help/stderr/color/signal/config/idempotency rules | tagged policy |
| `skills/constraints/library/SKILL.md` | public API, compatibility, dependency, ESM, docs, side-effect rules | tagged policy |
| `skills/constraints/mobile/SKILL.md` | permission/offline/touch/battery/data/platform/storage rules | tagged policy |
| `skills/constraints/universal/SKILL.md` | global rules and overrideability, including no-secret hard stop | canonical rule definitions; only subsets are mechanically checked |
| `skills/constraints/web/SKILL.md` | web security, responsive/a11y, state, bundle, env, error, selector rules | tagged policy plus browser evidence where available |

#### Agents (3/3)

| Source | Semantic responsibility | Output / enforcement boundary |
|---|---|---|
| `skills/agents/orchestration/SKILL.md` | cost/readiness gates, actor separation, dispatch boundaries, shared-file protocol | host-dependent; cannot create human authority |
| `skills/agents/parallel-work/SKILL.md` | worktree isolation, ticket claiming, overlap checks, merge order | `check-parallel-safety.mjs` mechanically analyzes declared paths only |
| `skills/agents/subagent-patterns/SKILL.md` | separation/red-team/specialist patterns for fresh contexts | independence only when actor/context evidence exists |

### W3 — Executable behavior trace

| Target | Entry and side effect | Success evidence | Meaningful failure evidence | Fail posture |
|---|---|---|---|---|
| Install/update/uninstall | `install/install.sh`; copies skills/tools/workflows, rewrites paths, atomically switches Quality Contract symlink, or removes owned install files | install tests exercise full/selective/template/CI paths | invalid phase, staged fault injection, concurrent-reader and legacy-template fixtures | mutation aborts non-zero; previous QC release stays readable |
| Structural validator | `scripts/validate-skills.sh`; read-only | exit 0 on current tree | missing-file/marker branches exist, but no isolated negative fixture currently exercises the full script | errors block; warnings return 0 |
| File hygiene | `check-file-hygiene.mjs`; read-only | current repo plus positive fixtures | invalid root, names, duplicate IDs/folders, orphan docs, lifecycle/actor/handoff fixtures | current policy violations non-zero; declared legacy issues report separately |
| Traceability | `check-traceability.mjs`; read-only | current repo plus linked-ID fixtures | orphan, broken, duplicate, freelance, dead-link fixtures | policy-v1 defects non-zero; pre-policy drift is legacy report |
| Parallel safety | `check-parallel-safety.mjs`; read-only | zero-overlap cluster and board fixtures | missing path, overlap, claim, dependency fixtures | unavailable/invalid work order non-zero; near-safe remains human decision |
| Retirement | `check-retirement.mjs`; read-only preview | committed recoverable transient fixture | live reference, untracked/dirty target, traversal, archive-policy fixtures | fail closed; never deletes |
| Quality Contract facade | `quality-contract.mjs`; reads one canonical document | valid parser/evaluator fixture | duplicate/unknown/oversized/type-invalid block fixtures | parse failures non-zero; valid but ineligible remains data result |
| Projection/preflight | `projection.mjs`, `evaluator.mjs`, `trusted-events.mjs` | exact subject/event/attestation fixtures | stale contract, scope/AC drift, forged/expired/revoked/mismatched authority | fail/unknown cannot set execution predicate |
| Trusted gateway | `gateway.mjs`; may call an injected cancellable dispatch adapter | exact allowlisted operation with one-time lease | replay, operation mismatch, policy/authorization/review mismatch, timeout/cancel fixtures | denies dispatch and consumes nonce once |
| Evidence/acceptance | `evidence-runner.mjs`, `rules/evidence.mjs`, `rules/acceptance.mjs` | sealed bounded redacted evidence and verified acceptance | raw output/secrets, matcher, subject, negative assertion, attestation mismatch fixtures | unsealed/self-asserted evidence cannot become green |
| Quality Contract v1 artifact-efficiency pilot gates | `rules/pilot-gates.mjs`; data-only, authority-scoped away from vNext | externally attested frozen plan and complete cohorts | thin/missing/regressed/P1/P2/mixed-responsibility/tampered inputs | blocks the legacy pilot claim only; explicitly `may_promote_vnext: false`; never migrates or deletes |
| Repository CI | `.github/workflows/ci.yml` and `quality-contract.yml` | validator, syntax, checker suite, QC report-only adapter | suite failure or malformed/multiple canonical blocks | repo checks block; legacy no-block QC exits report-only |
| Consumer CI | `enforcement/ci/sdd-check.yml` | secrets and installed evidence tools when present | secret fixtures are blocking | missing hygiene/traceability tools currently print a message and pass; policy decision required |
| Pre-commit | `enforcement/hooks/pre-commit` | staged scan | secret/key files block; scope/tests/records mostly warn | mixed: hard-secret failures block, advisory gates warn |

### W4 — Conflict and claim matrix

| ID | Claim and observed conflict | Type / severity / confidence | Canonical owner and proposed resolution | Compatibility impact |
|---|---|---|---|---|
| ALN-001 | `build/constraints` says every rule is overridable, then rule 7 and orchestrator define non-overridable hard stops | POLICY, P0, high | orchestrator owns hard stops; constraints engine must explicitly exempt `OVERRIDE: none` | wording correction, no intended behavior break |
| ALN-002 | unified matrix/verification say prototype and emergency use smoke-only while orchestrator, README, test-plan, and coverage-check require coverage in every mode above micro | POLICY, P1, high | orchestrator evidence-gate section owns; prototype runs applicable coverage, emergency defers it to mandatory post-fix acceptance | may surface previously hidden coverage gaps; emergency immediate mitigation remains fast |
| ALN-003 | SDLC detector says mandatory/never skipped but its emergency row says skipped | POLICY, P1, high | orchestrator owns global detection; emergency performs cheap config/context detection and defers adaptations | additional emergency metadata only |
| ALN-004 | universal constraint requires 3+ implementations for abstractions while architecture analyzer allows a port at 2 real adapters | POLICY, P1, high | constraints owns generic abstraction; architecture owns boundary adapters; state the scoped exception explicitly | clarifies current intent; no public API change |
| ALN-005 | constraints engine duplicates universal rule definitions and already weakens the test rule from positive+negative+coverage to “at least 1 test” | POLICY, P1, high | universal file owns definitions; engine keeps precedence/override mechanics only | stronger consistency; existing explicit opt-out remains logged |
| ALN-006 | orchestrator rapid-iteration rule says skip elicitation, conflicting with the same file and discover command's no-seat-skip rule | POLICY, P1, high | discovery coverage wins; rapid iteration may reuse settled answers and shorten rounds, never close an unresolved seat | removes an unsafe shortcut |
| ALN-007 | doc-generator says prototype/emergency skip docs entirely, conflicting with DoD floor and emergency retrospective | POLICY, P1, high | orchestrator matrix/evidence gates own; prototype keeps DoD, emergency writes retrospective after mitigation | corrects generated-artifact expectations |
| ALN-008 | validator requires mode-local behavior tables after v6.8 centralized them in orchestrator | MECHANICAL, P2, high | validator should validate the unified matrix and mode delegation markers | removes 20 false warnings |
| ALN-009 | prototype/emergency mode files recommend a non-public `health-check` command | POLICY/docs, P2, high | command surface manifest owns; replace with `/sdd-pipeline:check` and name VERIFY/AUDIT intent | user-facing correction only |
| ALN-010 | parallel-work examples target retired `docs/sdd/tickets` rather than per-feature tickets | POLICY/docs, P2, high | ticket-decomposition owns location; examples use `docs/sdd/specs/{NNN}-{slug}/tickets` | fixes command usability |
| ALN-011 | INSTALL and ARCHITECTURE say 64 skills; filesystem and validator show 65 | FACT/docs, P3, high | derive or test count from filesystem | docs-only |
| ALN-012 | README/ARCHITECTURE/CONTRIBUTING describe only 3/4 executable checkers and sometimes “only executable code”, omitting Quality Contract runtime and installer tests | FACT/docs, P2, high | architecture distinguishes classic checkers, QC runtime, installer/harness, and host policy | docs-only trust-boundary clarification |
| ALN-013 | ARCHITECTURE republishes a stale mode matrix and says full tables live in mode files, which now deliberately defer to orchestrator | POLICY/docs, P2, high | orchestrator is normative SSOT; architecture links and summarizes without duplicating cells | docs-only; prevents future drift |
| ALN-014 | CONTRIBUTING says three checker tests and all three commands run in CI, while suite covers four checkers+installer and QC has a separate workflow | FACT/docs, P2, high | CI/workflow files are factual source | docs-only |
| ALN-015 | consumer CI silently passes if claimed hygiene/traceability tools are missing | MECHANICAL, P1, high | needs rollout policy decision: preserve compatibility report-only or fail a corrupt `--with-ci` install | potentially breaking; deferred to explicit decision |

Strongest alternative explanation checked: mode-local files may intentionally be
minimal and public docs may use “checker” narrowly. That explains ALN-008 and
part of ALN-012, but it does not make false counts, stale command paths,
contradictory coverage/SDLC rules, or duplicated rule semantics correct.

### W5 — Canonical ownership decision

The following ownership is accepted as the current reconciliation because it
matches `AGENTS.md`, the orchestrator's explicit SSOT statements, executable
boundaries, and all eight command navigation contracts:

| Concern | Canonical owner |
|---|---|
| fixed sequence, unified mode behavior, sizing, approval, global hard stops | `skills/orchestrator/SKILL.md` |
| command prerequisite, branch routing, and terminal state | each `skills/commands/*/SKILL.md` plus shared workflow navigation |
| mode-specific process mechanics only | `skills/modes/*/SKILL.md` |
| constraint precedence and override mechanics | `skills/build/constraints/SKILL.md` |
| actual universal/domain rule definitions | `skills/constraints/*/SKILL.md` |
| feature artifact paths, IDs, lifecycle classes | doc-generator/ticket-decomposition/artifact-lifecycle |
| machine result schema and executable decision semantics | corresponding `.mjs` runtime/checker |
| product explanation | public docs, which must point to owners and cannot create policy |

No confirmed P0 has two defensible safety outcomes: `OVERRIDE: none` remains
non-negotiable. ALN-002 through ALN-007 are resolved by explicit existing SSOT
within the orchestrator and specialized owner; they do not require a new public
contract. ALN-015 remains the only P1 requiring an explicit compatibility
decision before remediation because changing missing-tool behavior from pass to
failure can break legacy consumer CI.

### W6 — Remediation result

| Finding | Disposition | Evidence |
|---|---|---|
| ALN-001..007 | resolved in canonical policy owners | executable invariant test in `install/install.test.mjs`; full suite green |
| ALN-008 | validator now checks the unified matrix and mode delegation | canonical and negative validator fixtures; stale warnings reduced from 20 to zero |
| ALN-009..014 | stale commands, paths, counts, mode duplication, and runtime/CI claims corrected | public-doc drift test plus structural, link, hygiene, and traceability checks |
| ALN-015 | explicitly blocked pending compatibility authority | changing an installed consumer workflow from report-only to fail-closed is a material enforcement-default decision |

No public command was added. Immediate emergency mitigation remains fast, but
coverage and retrospective evidence are deferred obligations before ordinary
acceptance. The generic abstraction threshold remains three implementations;
the two-adapter exception is restricted to real boundary adapters.

### W7 — CI and distribution assurance result

- The repository validator now has an isolated failing fixture for a missing
  mode-to-matrix delegation marker.
- The behavior suite exercises all four classic checkers, the Quality Contract
  runtime, public commands, installer staging, update rollback, and distributed
  CI workflow behavior.
- The current run passed 136/136 behavior tests and 3/3 Quality Contract harness
  tests. Aggregate Quality Contract coverage is 94.99% lines, 80.98% branches,
  and 93.98% functions.
- ALN-015 was not silently changed: the existing consumer-CI compatibility
  posture stays intact until the user selects its migration/enforcement policy.

### W8 — Public and maintainer documentation result

README, INSTALL, ARCHITECTURE, CONTRIBUTING, and repository CI descriptions now
distinguish prose policy, the four classic mechanical checkers, the executable
Quality Contract runtime, installer/validator tests, and host-dependent
enforcement. ARCHITECTURE points to the orchestrator-owned mode matrix instead
of publishing a second normative copy. Counts and examples are regression
tested against the filesystem and public command surface.

### W9 — Verification and closure disposition

**Result: DEGRADED, with one explicit policy block.** The active harness did not
provide independent reviewer/verifier contexts, so implementer, reviewer, and
verifier independence cannot be claimed. Human review remains requested for:

- emergency speed versus mandatory post-fix evidence,
- the narrow two-real-adapter exception,
- removal of duplicated constraint text without loss of valid override behavior,
- semantic strength of validator markers,
- ALN-015 consumer-CI missing-tool compatibility.

Reproducible final evidence from repository root:

```bash
./scripts/validate-skills.sh
./scripts/test-checkers.sh
./scripts/test-quality-contract.sh
find skills install scripts -name '*.mjs' -type f -exec node --check {} \;
node skills/meta/health-check/check-file-hygiene.mjs docs/sdd
node skills/meta/traceability/check-traceability.mjs docs/sdd
git diff --check
```

All commands pass. Validator output is 65 skills with three advisory file-size
warnings; behavior is 136/136; Quality Contract is 3/3 at the coverage figures
above; hygiene and traceability pass with 21 documents, 61 definitions, and 58
matrix references. WP-00 therefore satisfies its package acceptance criterion:
all P0 findings are resolved, all P1 findings are resolved except ALN-015, and
ALN-015 is explicitly blocked on a named compatibility decision. The report
remains `OPEN` rather than `RESOLVED` until that decision and independent/human
review disposition are recorded.
