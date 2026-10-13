# MUST trace

All 52 source groups containing MUST/MUST NOT were reviewed. Header-scoped obligations are expanded below. A deliverable or decision record alone is not counted as an acceptance criterion. Historical supplied batches are retained as input records; their current semantics are traced through DECISIONS and the normative files.

COVERED means an invariant or explicit acceptance criterion exists, not that an implementation test has run. PARTIAL identifies uncovered clauses. PROCESS/META identify non-runtime instructions and vocabulary; PROCESS remains a review-coverage gap for the requested audit.

| Group | Location | Status | Coverage | Review |
|---|---|---|---|---|
| MUST-001 | AGENT_BRIEF.md:35 | PARTIAL | See expanded prohibitions below | All eleven prohibitions were reviewed individually. |
| MUST-002 | SPEC.md:4 | META | Normative vocabulary | This line defines the meaning of RFC requirement words; it is not runtime behavior. |
| MUST-003 | SPEC.md:82 | COVERED | Common acceptance: decision records; AGENT 2 | Law-inexpressible features must be recorded, with no invented seventh law. |
| MUST-004 | SPEC.md:158 | GAP | M2 deliverables / SPEC 7.4 only | No acceptance criterion explicitly tests the hypothesis marker. |
| MUST-005 | SPEC.md:170 | GAP | M0 S-2/S-3 expansion checks are partial | No explicit invariant/acceptance checks that dummy secret values never reach generated files, Reins logs, or fixtures. |
| MUST-006 | SPEC.md:182 | COVERED | M5 acceptance 1; I-LOG-2 | The sent task must use the fixed SPEC 5.8 format; add isolated compiler goldens for earlier feedback. |
| MUST-007 | SPEC.md:232 | GAP | M1 authoring deliverables and type checks are partial | Behavioral equality of JSX and h is not an explicit acceptance criterion. |
| MUST-008 | SPEC.md:236 | PARTIAL | Common API type checks; M1 type tests | Namespace shape is covered. Restoring the runtime third-argument key requires a runtime assertion, not a type-only check. |
| MUST-009 | SPEC.md:262 | PARTIAL | I-ELAB-1/3/4/5; M1 | The six algorithm steps are expanded below; cycle-depth and exact root/GID formula coverage remains implicit. |
| MUST-010 | SPEC.md:277 | PARTIAL | I-ELAB-1; I-LOG-2; M3 5; M2 deliverables | No explicit acceptance exercises parallel retrieval, deadline, CAS reconstruction, and waiting across suspension. |
| MUST-011 | SPEC.md:279 | PARTIAL | I-RENDER-2; I-ELAB-1 | Accounting and stable input are covered; timeout/failure placeholders and per-node degraded reasons lack explicit acceptance. |
| MUST-012 | SPEC.md:283 | COVERED | I-ELAB-2; M1 API surface tests | No hook exposes host information. |
| MUST-013 | SPEC.md:287 | COVERED | I-ELAB-1; I-PKG-1; M1 lint acceptance | Static lint and double elaboration have separate tests. |
| MUST-014 | SPEC.md:296 | COVERED | M1 acceptance: development JSON-serialization checks | Unconstrained generic projection state is checked at runtime. |
| MUST-015 | SPEC.md:318 | PARTIAL | I-HOST-1/2/5; M2 4/5/7 | Ownership, drift, and record location are covered; atomic writes, deletion, and concurrency need explicit criteria. |
| MUST-016 | SPEC.md:320 | GAP | M2 deliverables only | No explicit acceptance for mutual exclusion across observation/write/record or the 30-second LOCKED deadline. |
| MUST-017 | SPEC.md:322 | COVERED | M2 acceptance 8 | Duplicate targets fail; Codex co-host mode omits shared targets. |
| MUST-018 | SPEC.md:338 | GAP | M2 deliverables only | No explicit acceptance asserts temporary-file-plus-rename writes, including interrupted writes. |
| MUST-019 | SPEC.md:349 | PARTIAL | I-RENDER-4; M3 acceptance 3 | Turn-only stability is covered; changed static/session content and cacheBreak toggling are not explicitly tested. |
| MUST-020 | SPEC.md:395 | PARTIAL | M0 S-2/S-3; I-RENDER-2 | Expansion support is covered; non-disclosure and secret-unsupported drop behavior need explicit tests. |
| MUST-021 | SPEC.md:437 | GAP | M4 deliverables only | No explicit acceptance verifies command-anchor isolation, cleanup, recorded dirty diff, or >1 GiB behavior. |
| MUST-022 | SPEC.md:445 | PARTIAL | I-PROP-1/2; M4 2/3; M7 5 | Candidate-only writes are covered; dirty-package rejection and exact Git commit behavior have no explicit acceptance. |
| MUST-023 | SPEC.md:454 | COVERED | I-CAP-1/2; M1; M5 2 | Capability operations are specified under this header. |
| MUST-024 | SPEC.md:456 | COVERED | I-CAP-1; M5 acceptance 2 | Strict mount narrowing rejects; ordinary attenuation stays monotone. |
| MUST-025 | SPEC.md:482 | COVERED | I-LOG-1; M1 | Corrupt initial kind and hash chain must fail. |
| MUST-026 | SPEC.md:496 | PARTIAL | I-LOG-3; M5 6 | Recovery is required, but no explicit acceptance distinguishes a crash after pre-send logging from successful delivery and tests no automatic resend. |
| MUST-027 | SPEC.md:524 | PARTIAL | I-CAP-1; M5 1/2; D-041 | Profile selection is exercised; rejection of LLM-supplied arbitrary harness/runtime/caps is not explicit. |
| MUST-028 | SPEC.md:526 | PARTIAL | I-CAP-1/3/4; I-SESS-1/5; I-LOG-2; M5 | Six mount steps are expanded below; runtime selection and credential addressing remain undefined. |
| MUST-029 | SPEC.md:565 | GAP | M0 pinned tools and M5 manual runtime records are partial | No explicit acceptance verifies that every session start and command anchor runs through mise exec. |
| MUST-030 | SPEC.md:576 | COVERED | I-EVO-1; M7 acceptance 2/5 | Sealed data is absent from evolver namespaces and direct reads are rejected. |
| MUST-031 | DSH_INTEGRATION.md:20 | GAP | AGENT 3.4 and DSH dependency rules | No invariant or explicit acceptance requires the forbidden-import boundary lint to fail for core/static hosts. |
| MUST-032 | DSH_INTEGRATION.md:21 | GAP | AGENT 3.4 and DSH dependency rules | Adapter-only DSH imports are specified but lack an explicit milestone acceptance check. |
| MUST-033 | DSH_INTEGRATION.md:30 | COVERED | M3 acceptance 6; DSH contract suite; M5 | Mapping clauses are expanded below. |
| MUST-034 | DSH_INTEGRATION.md:53 | PARTIAL | I-LOG-2; M3 5 | See MUST-010/011 for suspension, deadline, and degraded-node acceptance gaps. |
| MUST-035 | DSH_INTEGRATION.md:57 | COVERED | M0 S-5 acceptance; M3 contracts | Assembly structure/replacement is an explicit spike gate. |
| MUST-036 | DSH_INTEGRATION.md:108 | COVERED | M0 acceptance: fixed tool versions and mise.lock; common lint/test | The tool/task TOML is syntax-validated; actual pins remain M0 work. |
| MUST-037 | DSH_INTEGRATION.md:141 | COVERED | M3 acceptance 6; M5 provider selection | The ten listed contract seams must pass; continuable contract is conditional on provider adoption. |
| MUST-038 | DSH_INTEGRATION.md:157 | PROCESS | Decision-record acceptance; DSH patch policy | Trying extension points first is a review procedure; no behavior invariant or specific acceptance criterion enforces it. |
| MUST-039 | INVARIANTS.md:3 | COVERED | Common acceptance: introduced I-* tests exist/pass | Every invariant has its ID-prefixed test obligation. |
| MUST-040 | INVARIANTS.md:22 | COVERED | I-ELAB-1; M1 lint and double-elaboration acceptance | Duplicate statement of the two purity layers. |
| MUST-041 | INVARIANTS.md:63 | COVERED | I-LOG-1; M1 | Duplicate seq-zero obligation. |
| MUST-042 | INVARIANTS.md:87 | COVERED | I-PKG-1; M1 | Only digest-covered inputs affect rendering. |
| MUST-043 | MILESTONES.md:53 | COVERED | I-ELAB-1; M1 | Duplicate lint obligation. |
| MUST-044 | DECISIONS.md:4 | COVERED | Common acceptance: new decisions recorded | Process requirement has milestone acceptance. |
| MUST-045 | DECISIONS.md:37 | COVERED | I-ELAB-1; M1 | Historical D-023 repeats current lint semantics. |
| MUST-046 | DECISIONS.md:45 | PARTIAL | I-ELAB-1; I-LOG-2; M3 5 | D-024 repeats MUST-010/011; acceptance gaps remain. |
| MUST-047 | DECISIONS.md:74 | COVERED | M1 development JSON-state acceptance | Duplicate D-044 obligation. |
| MUST-048 | types.ts:290 | COVERED | I-ELAB-2; M1 | No host-dependent components. |
| MUST-049 | types.ts:485 | PARTIAL | I-ELAB-1; M1 hook-context tests | Hooks outside render fail; no explicit criterion checks ComponentCall.render invocation outside the hook context. |
| MUST-050 | types.ts:504 | PARTIAL | M1 JSX type tests | Runtime key restoration needs a behavioral test; see MUST-008. |
| MUST-051 | types.ts:559 | GAP | types.ts LogEventMap comment only | No invariant/acceptance checks plugin/name event-key validation. |
| MUST-052 | types.ts:1045 | COVERED | Common public-API type acceptance | KernelApi export names and signatures are checked. |

## Expanded header obligations

| Parent | Clauses | Coverage / remaining gap |
|---|---|---|
| MUST-001 | 1: exactly eleven kinds | Common API types / M1; runtime unknown-kind validation is not separately named. |
| MUST-001 | 2: no host information | I-ELAB-2; M1. |
| MUST-001 | 3: no direct time/random/env/file/network reads | I-ELAB-1; M1 purity lint. Module initialization scope needs A-019. |
| MUST-001 | 4: DSH imports only in adapter | GAP: see MUST-031/032. |
| MUST-001 | 5: no workspace records/log/state | I-HOST-5 covers CommitRecord; explicit acceptance does not cover every other log/state path. |
| MUST-001 | 6: ownership/drift protection | I-HOST-1/2; M2 4/5/7. |
| MUST-001 | 7: child content only in relay | I-SESS-2; M5 4. |
| MUST-001 | 8: agents cannot hold harness:write | I-CAP-2; M1 and M3 4. |
| MUST-001 | 9: no plaintext secrets in files/logs/fixtures | GAP: MUST-005/020; I-SESS-5 only covers environment handoff. |
| MUST-001 | 10: no skipped M0 / untested acceptance claims | Milestone completion rule and recorded M0 six-spike evidence. |
| MUST-001 | 11: no unit-test network or writes outside fixtures | GAP: engineering rule only, no acceptance enforcement. |
| MUST-009 | 1: establish package/hooks/external/projection cache; 2: ordered expansion/flattening/components/fragment/content suspension | I-ELAB-1/2/4; M1. No explicit cycle-depth boundary test; external-driver acceptance gaps in MUST-010/011. |
| MUST-009 | 3: scope attenuation; 4: IDs/ref/property validation | I-ELAB-3/5; I-CAP-1; M1. GID collisions require A-007. |
| MUST-009 | 5: synthetic root, exclusions, external digest, logSeq exclusion; 6: dev double pass | I-RENDER-2; I-ELAB-1; M1. Exact root/GID and logSeq exclusion are not separate acceptance assertions. |
| MUST-015 | plan/intent/observe/ownership/drift/write/delete/record/outcome | I-RENDER-1; I-HOST-1/2/5; I-LOG-3; M2. Atomic writes/concurrency/deletion/recovery details need explicit criteria and A-002/A-003/A-020. |
| MUST-023 | permits union; attenuation/pattern containment/budget min; prohibition on agent harness:write | I-CAP-1/2; M1; M5 2. |
| MUST-028 | 1: strict caps/depth/children/budget; 2: explicit child namespace; 3: child host/state/commit; 4: compiled task; 5: transport/runtime/mise; 6: enforcement log | I-CAP-1/3/4; I-SESS-1/5; I-LOG-2; M5 1/2/3/7/9. Runtime selection, credential grants and mise invocation need A-014/A-015 and MUST-029. |
| MUST-033 | static/session/turn prompt registration; scoped effects; allowlist restriction; guard/denials; harness-write rejection; session tools | M3 2/3/4/5/6 and the section-order, context-snapshot, restrict, guard, pre-execute, scope contracts; M5 session criteria. Tool absence without spawn lacks explicit acceptance. |
| MUST-036 | tools Node/pnpm/tmux/DSH/Claude/Codex; tasks build/test/invariants/contracts/candidate/lint; committed mise.lock | M0 pins/lock and common lint/test criteria. Build/candidate task existence is specified configuration; TOML parser PASS is audit evidence, not a runtime spike. |
| MUST-037 | section-order, context-snapshot, restrict, guard, pre-execute, request-observe, request-budget, event-stream, conditional continuable, scope-not-security | M3 6 covers the listed contracts; M5/provider-adoption condition covers continuable. |

## Audit result

Coverage gaps and partial obligations are consolidated in A-018 of FULL_AUDIT.md. No acceptance criteria were invented or weakened to make this trace pass. OQ defaults and free internal implementation choices are distinct from unresolved public behavior.
