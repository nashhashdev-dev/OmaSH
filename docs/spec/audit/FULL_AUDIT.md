# Batch 3 full specification audit

Date: 2026-10-13. Scope: all eight current specification sources, both supplied decision batches, all seven fenced examples in SPEC/DSH_INTEGRATION, inline API/data examples, the complete declared ID sets, all 52 MUST groups including header-scoped clauses, and an implementation walkthrough from M1 through M7. No M0 or implementation work has started.

## Reflection

The supplied types.ts replaced the previous type source in full. Only explanatory comments were subsequently corrected to already approved decisions; exported shapes were preserved. All 24 decisions actually present in batch 3 were reflected and appended to DECISIONS. D-052, D-054, and D-056 are absent from the supplied archive and were not invented. The supplied checks were installed and extended, and AGENT_BRIEF 7.3 now requires tsc -p docs/spec/checks.

## Executed validation

Compiler: official TypeScript 5.9.3, installed outside the repository. All commands ran from the repository root. The compiler executable is referred to as `tsc` below; these are specification checks, not the future pinned M0 toolchain.

| Check | Result | Evidence |
|---|---|---|
| tsc --strict --noEmit --target es2022 docs/spec/types.ts | PASS | Exit 0. |
| tsc -p docs/spec/checks/tsconfig.baseline.json | PASS | Exact supplied positive/negative suite plus installed types; exit 0. |
| tsc -p docs/spec/checks | FAIL | Five diagnostics, representing A-002, A-003, and A-021 below; exit 2. |
| YAML frontmatter and mise TOML parsing | PASS | verify-examples.py parses the exact fenced inputs. |
| ID definition/reference inventory | COMPLETE | 41 invariants, 65 decisions, 10 OQs, 23 errors, 28 Reins/plugin events, 10 project packages, 24 expanded CLI subcommands. Only D-052/054/056 are undefined; external names and historical records are classified separately. |
| MUST trace | COMPLETE WITH GAPS | must-trace.md and must-coverage.json cover all 52 groups and expanded normative headers. A decision or deliverable alone is not counted as acceptance. |
| Cross-file agreement / implementation walkthrough | COMPLETE WITH ISSUES | Every numbered SPEC mechanism was compared against types, invariants, integration, decisions, and milestone acceptance. Findings appear together below. |

The five compiler diagnostics are TS2345 at digest-examples.tsx:11/13/15, TS2741 at dsh-examples.tsx:38, and TS2322 at host-reconcile-example.tsx:49. These are positive contract probes and intentionally have no ts-expect-error. The four supplied negative tests retain their expected errors. No failing check was weakened.

DSH registration signatures are local stubs of the documented seam. They do not establish compatibility with an installed DSH. Text templates, shell commands, and architecture text are classified and validated according to their format; they are not falsely presented as executable TypeScript. Exact TSX, typed template inputs, pseudocode data flow, inline registrations, config literals, and digest formulas are mapped in example-coverage.json. Real upstream/runtime verification remains gated M0 work.

## Findings requiring a decision or clarification

Audit IDs are not new D-* decisions or I-* invariants. Recommended changes have not been applied. Locations below are stable section/type names; exact occurrences are retained in the inventories.

| ID | Location | Problem | Recommended resolution |
|---|---|---|---|
| A-001 | DECISIONS-batch-3; requested D-042 through D-068 | Only 24 decisions are supplied. D-052, D-054, and D-056 are absent, so the instruction to reflect every ID in that range cannot be fulfilled literally. | Confirm the three numbers are intentionally unused, or supply their missing text. Keep the 24 supplied decisions intact. |
| A-002 | D-062; SPEC 7.1/7.2; types CommitReceipt/RuntimeHost; checks/dsh-examples.tsx | Dynamic commit must create no CommitRecord, but RuntimeHost.commit must return CommitReceipt with a mandatory record. A conforming no-record receipt fails TS2741. The 7.2 algorithm also presumes static records. | Discriminate static/dynamic receipts, or make record nullable with an explicit dynamic branch. Limit the file reconciliation algorithm to static hosts. |
| A-003 | SPEC 7.2; I-HOST-2; types Observed and drift/detected; checks/host-reconcile-example.tsx | Deleting an owned generated file produces observed digest null and is drift under the prescribed comparison. drift/detected.observed requires Digest, so the mandated event cannot represent the deletion (TS2322). | Allow null for the observed digest and define deleted-target drift presentation, recovery, and force behavior. |
| A-004 | SPEC 4.2/4.3; I-REF-1/2; types Digest/Resolved/RuntimeResolver | git-worktree version is described as git:<HEAD> plus a diff digest, while Resolved.version/snapshot return sha256 Digest. Additionally, version at resolution time can change after writes while ref/ns.id/lock remain identical, contradicting I-REF-1 unless resolution is pinned. | Define a SHA-256 snapshot identity containing commit and diff metadata. Specify whether resolve.version is the fixed base/pinned identity and keep current mutable observations in explicit snapshot events. |
| A-005 | SPEC 7.5/7.6/12.3; D-033/064; I-RENDER-1 and I-RUN-1; types HostId/PlanContext/RunSpec | dedupeWith and Codex instructions change output, but neither ctx nor kind@semver host identity includes these settings. RunSpec cannot reconstruct them, and the stated memo key can collide across settings. | Include normalized host settings or their digest in immutable plan inputs, memo keys, and replayable RunSpec/lock data. |
| A-006 | SPEC 6.1 hello; SPEC 7.3/7.5; I-RENDER-5; M2 acceptance 2; M3 demo | Hello contains an enforced rule with no downgrade. agents-md has no guard, so its plan must fail ENFORCEMENT_UNAVAILABLE, while the milestones require hello to render successfully to all three hosts. | Approve an explicit downgrade on this demonstration rule, or scope the enforced realization by host and supply a separate advisory declaration. Preserve honest accounting. |
| A-007 | SPEC 6.2 step 4; types GlobalNodeId; I-ELAB-3; D-029/041 | Anonymous IDs use only the component via path and local sibling index. Two intrinsic branches in one component can assign the same GID, even between a scope and its first anonymous child. Reusing one fixed-ID session profile for two children also collides under package-wide uniqueness during parent expansion. | Include the complete structural instance path for anonymous GIDs. Define separate definition and instance identities, or explicit portal-root uniqueness domains, for repeated components/session profiles. |
| A-008 | D-024; SPEC 6.2; I-ELAB-4; types ENode/ETree/PlanContext/Hooks | Unavailable content must mark every affected node degraded with its ref. Elaboration removes Content refs, useContent returns an ordinary transformable string, ETree.external stores only a digest, and the host gets no per-node dependency/status trace. It cannot reliably infer which node used unavailable input. | Record immutable per-node content dependency/status metadata during hook evaluation and content resolution, or carry an equivalent logged input trace into planning. Avoid detecting degradation by searching marker text. |
| A-009 | D-021/038; SPEC 10/11.2/11.4; I-LOG-3; types session events | session/sent is recorded before the effect. A crash between this event and actual send looks like a completed intent if sent is treated as outcome. No success outcome or operation correlation ID distinguishes it from a delivered send, especially for repeated sends to one key. | Keep pre-send payload logging, add correlated delivery/operation outcome events, and treat absence of a post-effect outcome as unknown without automatic resend. Define interrupt/stop outcome correlation too. |
| A-010 | D-051; AGENT_BRIEF 6; M1 acceptance; types ETree and Hooks.useNamespace | ETree stores only a namespace digest, not Mount configs/base, and its own digest still changes after masking namespace. The claim that file content never depends on Namespace is also false for a permitted component that renders useNamespace().id. The proposed normalization is not yet a complete golden contract. | Define normalization input/envelope and masking or recomputation of derived digests. Use a deterministic Namespace fixture for exact file goldens, and explicitly test namespace-sensitive components. |
| A-011 | I-EVO-2; SPEC 12.3/13; M7 acceptance 3; types RunSpec/Namespace/Lockfile | Replacing a harness/candidate can also change its Mount root/base, namespace digest, dependency lock, and trial child parent/path metadata. Requiring all RunSpec fields except harness digest to be equal rejects those valid candidate trials. SPEC also removes seed from its comparison key while I-EVO-2 requires equal seeds. | Define a semantic trial-comparison key: hold workspace snapshot, model, seed, toolchain and rights fixed; explicitly normalize or permit only harness-derived fields. Distinguish the general Run key from evaluation pairing. |
| A-012 | types TaskState.touched/written; SPEC 6.5/7.6/15; M3 acceptance 2 | touches reads the cumulative union of ws/touched, but on-touch is described as relevant only to the touched turn and acceptance requires auth content only in the next request. Later unrelated requests retain the match; turn/start resets only eventsThisTurn. | Keep cumulative history separately and define recent-touch/request-window state with an explicit expiry boundary matching the three-turn acceptance sequence. |
| A-013 | SPEC 5.1/7.3; types ENode.effective.onUnsupported | Every ENode requires a resolved onUnsupported, but the default table covers selected unsupported situations only. There is no total default for ordinary instruction/knowledge/advisory rule/raw or a bare scope, nor a precise rule for inheriting authored versus computed defaults. | Define a total kind/property-based fallback plus inheritance precedence. Keep elaboration independent of host capabilities. |
| A-014 | D-041; SPEC 11.2/11.3; types PackageManifest.sessionProfiles and SessionEl.runtime | Profiles contain an allowed runtimes list; session_spawn selects only a profile, while mount requires one concrete RuntimeSpec. Multiple or empty allowed runtimes, the default choice, model/tool/args, and unavailable runtime behavior are unspecified. | Add an explicit profile RuntimeSpec/default with an allowed-kind check, or prescribe deterministic selection/configuration and error behavior. The LLM must not select arbitrary runtime/caps. |
| A-015 | I-SESS-5; SPEC 5.6/9/11.3; types Grant/McpServerSpec/WorkspaceBinding | Credential handoff requires a Grant, but secrets use ${secret:NAME}, while Grants address RefPatterns. No logical secret resource, right, binding, or source-to-child env rule connects the two. An implementer cannot identify the exact authorized credential. | Define credential resources and read grants using an explicit logical scheme/binding and env-name mapping. Default to no handoff, with dummy-value tests for both authorized and unauthorized cases. |
| A-016 | SPEC 5.8/11.4; types Check and SessionResult | A human Check must produce passed/evidence, but no authenticated human decision event/API or pending/decline behavior is specified. Acceptance commands also lack a timeout/default even though command anchors require one, so result() may wait indefinitely. | Define human check decisions as logged human input, with pending/declined semantics. Define acceptance command deadlines, timeout outcomes, and share/fork execution rules together. Never infer human approval from child relay text. |
| A-017 | D-045/046; types IntrinsicProps/Element/KernelApi.h; SPEC 6.2 | IntrinsicProps and h rest arguments accept children for leaf instruction/knowledge/rule/etc., but these Element variants have no children member. Elaboration does not define whether to retain, reject, or discard them. | Either forbid leaf children in types and runtime validation, or define a children-bearing leaf shape and traversal semantics. Do not silently drop accepted authoring nodes. |
| A-018 | audit/must-trace.md; INVARIANTS; MILESTONES | Several MUSTs have only prose/decisions/deliverables, rather than an invariant or explicit acceptance criterion. Others have partial coverage; the complete trace distinguishes them. | Add explicit criteria/tests for each GAP/PARTIAL clause: non-disclosure, hypothesis marker, JSX/h behavior and runtime keys, suspension/degradation, atomic writes/locking, live cache changes, anchor isolation, Git proposal behavior, no-resend recovery, adapter import boundaries, plugin event naming, mise invocation, and engineering prohibitions. Do not count a deliverable as a passing acceptance test. |
| A-019 | D-023; SPEC 6.3; I-ELAB-1 and I-PKG-1; LoadedPackage | Lint is scoped to components, but LoadedPackage modules have already been evaluated. A module-level env/time/random/I/O read captured into a component can escape a literal component-body check, and evaluating the same loaded closure twice will not reveal it. | Require purity lint over the entire reachable harness module graph, including initialization, before module evaluation. Define allowed dependency boundaries and deterministic module-initializer regression cases. |
| A-020 | SPEC 7.2/14; I-HOST-1/4; M2 acceptance 1 | Import must immediately re-render existing non-owned targets, but the reconcile algorithm rejects any existing target without a prior CommitRecord. The import-to-owned transition is not specified. | Define explicit human-authorized adoption after a lossless validated import, recording observed ownership without overwriting first, then render. Test unrelated non-owned files still reject and unsupported/lossy cases report accurately. |
| A-021 | SPEC 4.2/6.2/12.1; types KernelApi.digestJson/Json; checks/digest-examples.tsx | Literal typed digest formulas reject Mount[], ENode, and PackageManifest because these interfaces do not carry Json's index signature (three TS2345 diagnostics). A serialization boundary is missing from the examples/API contract. | Define and demonstrate a validated interface-to-Json encoding step while preserving digestJson(Json), or approve a checked generic/unknown boundary with runtime serializability validation. Avoid unchecked casts. |
| A-022 | SPEC 4.2 fs resolver table; SPEC 7.4; OQ-05 | The fs snapshot table says to exclude files outside CommitRecord targets, while OQ-05 excludes generated targets themselves (plus .git, node_modules, and gitignored paths). These are opposite sets; following the table can omit ordinary workspace source and include generated outputs. The cited 7.4 also does not define the whole exclusion set. | Define one snapshot exclusion policy that excludes generated CommitRecord targets, not all other workspace files, and align the table/reference/OQ default. Test source changes affect the snapshot while generated-output changes do not. |

A-002/A-003/A-021 have compiler evidence. Other rows come from cross-file comparison and implementation walkthrough; they are not claims that an implementation already failed. Some can be resolved by clarifying existing intent rather than changing exported types, but none was silently settled by this audit. At least A-002 and A-003 require type changes or incompatible semantics, so M0 is withheld under the user's gate.

## Unreferenced definitions and non-blocking dispositions

The lexical inventory reports references outside definition rows, including expanded ranges and slash shorthand. It does not prove runtime dead code: there is no implementation yet.

| Category | IDs with no explicit current reference outside their definition | Disposition |
|---|---|---|
| Invariants | None | All 41 are referenced by obligations or milestone criteria. |
| Decisions | D-004, D-006, D-007, D-010, D-011, D-012, D-014, D-015, D-016, D-017, D-019, D-053 | Their mechanisms are present in body text; D-019 is superseded by D-043 for accounting, and D-053 repeats the D-023 layout. No semantic removal is recommended. |
| OQs | OQ-02 through OQ-10 | Each definition has a default and resolution stage; they do not require implementation to stop. |
| Errors | DRIFT, UNSUPPORTED_NODE | Declared with explanatory trigger comments only; no explicit body reference. Keep definitions and add negative runtime tests when those paths are implemented. |
| Events | proposal/created, run/end, session/observed, session/result | Declared lifecycle/result events; body names are omitted. Add lifecycle expectations/tests without deleting them. |
| Packages | @reins/eval | Declared in the layout for M7; the M7 body should name it for traceability. |
| CLI | None | All 24 expanded commands have body references. |

External events, illustrative harness packages, external runtime packages, and content paths are classified separately in id-inventory.json. Historical supplied decisions are preserved: later approved decisions supersede prior accounting/runtime representations rather than rewriting original input records.

## Trivial corrections applied

| Fix | Location | Existing authority / unchanged meaning |
|---|---|---|
| Empty root path is optional in the Ref comment | types RefString | D-018. |
| UTF-16 source ranges replace contradictory byte wording | types SourceMap | D-020. |
| Session strict attenuation and purity error comment | types SessionEl.caps / ELAB_IMPURE | D-022/023. |
| Degraded accounting includes unavailable content | types AccountStatus | D-024. |
| Manifest entry comment accepts JSON props; runtime-only types may hold functions | types PackageManifest / header | D-045 and the existing function-bearing types. |
| Nearest explicitly specifying scope replaces the older parent-volatility shorthand | SPEC 5.1 | D-060. |
| Inline plan(ac) is described and typed as a local memo view | DSH_INTEGRATION 3 / checks | Internal helper context; no RenderPlan method was added and no upstream API was claimed. |
| TOML task headers and run assignments use separate lines | DSH_INTEGRATION 7 | Parser defect repaired without changing commands. |
| tmux is required for S-4 and pinned in M0 | DSH_INTEGRATION 7 comment | Existing S-4/M0 requirements. |
| Add already required replay command to the CLI index | SPEC 14 | Existing M6 command. |
| Escape CLI alternative pipes in Markdown tables | SPEC 14 | Table formatting only. |
| Count actual decisions/invariants and list checks/batch files | README | 65 supplied decisions, 41 invariants; missing numbers are explicit. |
| Hello example path matches the declared layout; fragment is exempt from BaseProps | SPEC 5 / 6.1 comment | Existing AGENT layout and types. |
| Upstream-edit instruction names the SPEC target-table exception | DSH_INTEGRATION preface | Existing higher-priority AGENT_BRIEF 2. |

No new decision IDs, weaker invariants, changed exported type shapes, or implementation milestones were introduced.

## Reproduce the audit

1. `python docs/spec/audit/inventory.py`
2. `python docs/spec/audit/write-trace.py`
3. `python docs/spec/audit/verify-examples.py` (Python 3.11+ with PyYAML)
4. Run the three TypeScript commands above with TypeScript 5.9.3.

The trace annotations are reviewed evidence, not an automatic proof of semantic coverage. After a normative change, regenerate inventories and review those annotations and findings again.
