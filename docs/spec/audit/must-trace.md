# MUST trace

All 52 source groups containing MUST/MUST NOT were reviewed. Header-scoped obligations are expanded below. A deliverable or decision record alone is not counted as an acceptance criterion. Historical supplied batches are retained as input records; their current semantics are traced through DECISIONS and the normative files.

COVERED means an invariant or explicit acceptance criterion exists, not that an implementation test has run. PARTIAL identifies uncovered clauses. PROCESS/META identify non-runtime instructions and vocabulary; PROCESS remains a review-coverage gap for the requested audit.

| Group | Location | Status | Coverage | Review |
|---|---|---|---|---|
| MUST-001 | AGENT_BRIEF.md:37 | COVERED | Expanded prohibitions; M1 test isolation; I-SEC-1 | D-091 adds all previously missing runtime and engineering criteria. |
| MUST-002 | SPEC.md:4 | META | Normative vocabulary | This defines requirement words rather than runtime behavior. |
| MUST-003 | SPEC.md:82 | COVERED | Common decision acceptance; AGENT 2; D-092 | Record protected issues or authorized agent decisions under the new gate. |
| MUST-004 | SPEC.md:164 | COVERED | M2 added hypothesis golden | D-091 explicitly tests the marker. |
| MUST-005 | SPEC.md:176 | COVERED | I-SEC-1; M2 static secret checks; M5 env checks | Scan dummy-secret non-disclosure and reference-only/drop behavior. |
| MUST-006 | SPEC.md:188 | COVERED | M5 acceptance 1; I-LOG-2 | Compiled task format must match SPEC 5.8. |
| MUST-007 | SPEC.md:238 | COVERED | M1 JSX/h property acceptance | D-091 compares resulting ETree. |
| MUST-008 | SPEC.md:244 | COVERED | Common API checks; M1 runtime key acceptance | JSX namespace and third-argument session-key restoration are covered. |
| MUST-009 | SPEC.md:270 | COVERED | I-ELAB-1/3/4/5; M1 additional acceptance | Includes cycle limit, outside-render calls, kinds, children, root and GID obligations. |
| MUST-010 | SPEC.md:287 | COVERED | M3 added suspension acceptance; I-LOG-2 | Parallel fetch, timeout, CAS reconstruction, and waiting are explicit. |
| MUST-011 | SPEC.md:289 | COVERED | M3 suspension/dependency acceptance; I-RENDER-2 | Unavailable deps cause degraded accounting without marker searches. |
| MUST-012 | SPEC.md:293 | COVERED | I-ELAB-2; M1 API surface | No host-aware hook. |
| MUST-013 | SPEC.md:297 | COVERED | I-ELAB-1/I-PKG-1; M1 top-level lint acceptance | Complete reachable graph is linted before evaluation; nondeterminism is separate. |
| MUST-014 | SPEC.md:306 | COVERED | M1 development JSON acceptance | Runtime serialization validates unconstrained projection state. |
| MUST-015 | SPEC.md:331 | COVERED | I-HOST-1/2/5/6/7; M2 adoption/deletion acceptance | Static-only reconciliation includes ownership, drift, atomic writes and serialization. |
| MUST-016 | SPEC.md:333 | COVERED | I-HOST-7; M2 | Injected lock deadline and concurrency are explicit. |
| MUST-017 | SPEC.md:335 | COVERED | M2 acceptance 8 | Duplicate targets reject and co-host settings avoid duplicates. |
| MUST-018 | SPEC.md:352 | COVERED | I-HOST-6; M2 | Fault-injected temporary-write/rename atomicity. |
| MUST-019 | SPEC.md:363 | COVERED | I-RENDER-4; M3 cacheBreak acceptance | Live static changes and turn-only stability both have criteria. |
| MUST-020 | SPEC.md:409 | COVERED | M0 S-2/S-3; I-SEC-1; M2 static secret checks | Expansion is spiked; disclosure/drop behavior is tested. |
| MUST-021 | SPEC.md:453 | COVERED | M4 added anchor-isolation acceptance | Includes cleanup, real-workspace non-mutation and injected size bound. |
| MUST-022 | SPEC.md:461 | COVERED | I-PROP-1/2; M4 dirty/Git-message criteria; M7 5 | Dirty rejection, exact commit message and candidate-only writes are covered. |
| MUST-023 | SPEC.md:470 | COVERED | I-CAP-1/2; M1; M5 2 | Permission union, containment and attenuation obligations. |
| MUST-024 | SPEC.md:472 | COVERED | I-CAP-1; M5 2 | Strict mount rejects narrowing. |
| MUST-025 | SPEC.md:498 | COVERED | I-LOG-1; M1 | Seq-zero and chain validation. |
| MUST-026 | SPEC.md:515 | COVERED | I-SESS-6; I-LOG-3; M5 recovery acceptance | opId/op-result distinguishes payload logging from outcome; no recovery resend. |
| MUST-027 | SPEC.md:543 | COVERED | M5 extra-field/profile rejection acceptance | LLM runtime is only a declared key; full specs/caps remain profile-owned. |
| MUST-028 | SPEC.md:545 | COVERED | I-CAP-1/3/4; I-SESS-1/5/6; M5 | Credential grants, runtime selection and effect outcomes now have explicit contracts. |
| MUST-029 | SPEC.md:592 | COVERED | M5 fake-mise argv acceptance | Session and anchor execution must go through mise. |
| MUST-030 | SPEC.md:603 | COVERED | I-EVO-1; M7 2/5 | Sealed final data is guarded. |
| MUST-031 | DSH_INTEGRATION.md:20 | COVERED | M1 DSH-boundary lint fixture acceptance | Forbidden core/static imports are tested. |
| MUST-032 | DSH_INTEGRATION.md:21 | COVERED | M1 DSH-boundary lint fixture acceptance | Adapter-only imports are covered. |
| MUST-033 | DSH_INTEGRATION.md:30 | COVERED | M3 contracts; M5; M3 no-spawn-tool acceptance | Registrations, disposal/restriction/guards and tool presentation have criteria. |
| MUST-034 | DSH_INTEGRATION.md:53 | COVERED | M3 suspension/deps acceptance; I-LOG-2 | Documented driver preparation is tested. |
| MUST-035 | DSH_INTEGRATION.md:57 | COVERED | M0 S-5; M3 contracts | Assembly replacement is a real-runtime gate. |
| MUST-036 | DSH_INTEGRATION.md:110 | COVERED | M0 pins/lock; common lint/test | Configuration syntax is verified; live pins remain M0 work. |
| MUST-037 | DSH_INTEGRATION.md:143 | COVERED | M3 acceptance 6; M5 provider criteria | All ten stated contracts, conditional continuable included. |
| MUST-038 | DSH_INTEGRATION.md:159 | PROCESS | M0 evidence and common decision acceptance | Extension-first policy is reviewed and recorded; not a runtime invariant. |
| MUST-039 | INVARIANTS.md:3 | COVERED | Common I-* test acceptance | Every introduced invariant has its test obligation. |
| MUST-040 | INVARIANTS.md:22 | COVERED | I-ELAB-1; M1 | Duplicate purity layers. |
| MUST-041 | INVARIANTS.md:65 | COVERED | I-LOG-1; M1 | Duplicate seq-zero requirement. |
| MUST-042 | INVARIANTS.md:96 | COVERED | I-PKG-1; M1 | Digest coverage and whole-module lint. |
| MUST-043 | MILESTONES.md:53 | COVERED | I-ELAB-1; M1 | Duplicate lint requirement. |
| MUST-044 | DECISIONS.md:4 | COVERED | Common decision acceptance | Required process record. |
| MUST-045 | DECISIONS.md:37 | COVERED | I-ELAB-1; M1 | Historical D-023 current semantics are completed by D-084. |
| MUST-046 | DECISIONS.md:45 | COVERED | M3 suspension/deps acceptance; I-LOG-2 | Historical D-024 has explicit acceptance now. |
| MUST-047 | DECISIONS.md:74 | COVERED | M1 projection serialization acceptance | D-044 repeats the requirement. |
| MUST-048 | types.ts:294 | COVERED | I-ELAB-2; M1 | No host-dependent component. |
| MUST-049 | types.ts:498 | COVERED | M1 outside-render ComponentCall acceptance | D-091 explicitly tests it. |
| MUST-050 | types.ts:520 | COVERED | M1 runtime key-restoration acceptance | D-091 explicitly tests it. |
| MUST-051 | types.ts:581 | COVERED | M1 EVENT_KIND_INVALID acceptance | D-083 supplies writer naming rules. |
| MUST-052 | types.ts:1118 | COVERED | Common public-API type acceptance | Exact KernelApi names and signatures. |

## Header-scoped obligations

All eleven AGENT prohibitions, six elaboration steps, static reconciliation phases, capability operations, six mount steps, DSH mapping rows, mise tools/tasks, and ten contract seams remain included in their parent group. D-091 supplies M1 test isolation/import-boundary/authoring criteria, M2 atomicity/locking/secrets/adoption/deletion criteria, M3 suspension/cache/tool criteria, M4 anchor/Git criteria, and M5 recovery/mise/profile/credential/check criteria. The parent coverage rows name their invariant or milestone evidence.

Coverage means an approved test obligation exists, not that an implementation test has already run. General specification auditing ends under D-092. Future protected-contract problems stop work; other issues become recorded agent decisions.

All earlier GAP/PARTIAL findings are resolved at the specification level by batch 4. META/PROCESS lines are vocabulary or review instructions rather than runtime behavior.
