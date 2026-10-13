# INVARIANTS — 不変条件（規範）

各不変条件は **ID・言明・根拠・試験義務** を持つ。実装はすべての ID に対応するテストを `packages/*/test/invariants/<ID>.test.ts` に置かなければならない（MUST）。テスト名は ID で始める。
不変条件を弱める変更は禁止。強める変更は DECISIONS.md に記録したうえで可。

試験種別：**P** = property test（fast-check, 既定 200 runs）、**G** = golden（スナップショット）、**E** = e2e（実プロセス・実 git）、**C** = DSH contract test。

## 参照・名前空間（REF）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-REF-1 | Identical ref/ns.id/lock yields identical locator and sha256 version. Workspace version is fixed Mount.base; immutable harness/pinned context version is content digest. Mutable observations are separate snapshot/touch events (D-073). | Reproducibility after workspace writes. | P |
| I-REF-2 | Mount bases are fixed at Run start, and resolver/config/base bindings remain unchanged during the Run. Workspace changes are represented by ws/snapshot or ws/touched. The harness binding alone may change through logged harness/switched (D-026/065), which becomes elaboration input. | Identify the exact versions used by a Run. | P, E |
| I-REF-3 | semver/tag ピンは Lock を経由してのみ解決される。Lock に無い未固定参照の解決は `REF_UNPINNED` で失敗する。 | 暗黙の最新版取得を禁止。 | P |
| I-REF-4 | `parseRef(formatRef(r))` は `r` と構造的に等しい。`formatRef(parseRef(s))` は正規化済みの `s` と等しい。 | 参照を ID として使える。 | P |
| I-REF-5 | Namespace は不変値。fork は新しい `id` と `parent` を持つ新 Namespace を作る。 | Plan 9 的名前空間。親子の差分が追える。 | P |

## 精緻化（ELAB）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-ELAB-1 | **Purity:** `ETree.digest` is a function of package digest, lock digest, namespace id, the projection log prefix, and logged content events with their CAS bodies or unavailable placeholders (D-024). External content is reconstructed by the driver from logged input. Development mode MUST elaborate twice and reject differing digests with `ELAB_IMPURE`; this detects nondeterminism only. `reins render` MUST also apply static purity lint and reject violations with `ELAB_IMPURE` (SPEC §6.3, D-023). | React render purity; reproducibility, caching, and time travel. | P, lint |
| I-ELAB-2 | **ホスト非依存**：精緻化はホストを知らない。Hooks にホスト情報を返すものは存在しない。ホスト差は `hosts` プロパティと各ホストの plan だけで表す。 | 同じ木を複数ホストへ render する、という中心命題。 | P（API 面の型テスト） |
| I-ELAB-3 | `knowledge` `rule` `skill` `tool` `context` `task` `raw` は `id` 必須、`session` は `key` 必須。欠落は `ID_MISSING`。Duplicate explicit IDs within (package, session-portal domain) fail ID_DUPLICATE; complete structural child-index paths distinguish anonymous nodes (D-075). Unknown kinds and leaf children fail INVALID_ELEMENT (D-081). | 差分・アンカー・提案・sourcemap の安定参照。 | P |
| I-ELAB-4 | ETree には component・fragment・`ref` 形式の Content が残らない。 | ETree が IR として自己完結する。 | P |
| I-ELAB-5 | 子 scope の `effective.caps` は親の `effective.caps` に対し `attenuate` を適用した結果であり、親を超えない。 | I-CAP-1 の木への射影。 | P |

## レンダリング（RENDER）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-RENDER-1 | `host.plan(tree, ctx)` は純粋・同期。Identical tree.digest, TaskState, workspace authority, and normalized HostConfig yield the same RenderPlan.digest; host settings are recorded for memo/replay (D-072). | 再現性。memo 化の正当性。 | P |
| I-RENDER-2 | **Complete accounting:** within each plan, every ENode except synthetic root and scope containers occurs exactly once. Scope effects appear in descendant filtered reasons. Parent plans delegate accountable session descendants with reason session:<key>; child plans account them fully. Exactly once is per plan, not globally. Filtered entries require reasons (D-028/043). | Explain every rendered, absent, or delegated element. | P |
| I-RENDER-3 | **Complete source maps:** mappings cover each output's entire UTF-16 code-unit range without gaps or overlap. Positions are JavaScript string indices with an exclusive end; each range points to an ENode gid or `'host'` (D-020). | Trace output to its definition (`reins why`). | P |
| I-RENDER-4 | **Volatility ordering:** plans for two trees differing only in `turn` nodes have completely identical `static` and `session` output strings. Dynamic hosts order outputs by increasing volatility (D-020). | Stable prompt-cache prefixes and minimal changes. | P |
| I-RENDER-5 | **強制の誠実性**：`enforcement: 'enforced'` の rule は、ホストの guard 機構で実現されるか、`onUnsupported: 'downgrade'` で `degraded` と会計されるかのいずれか。それ以外は `ENFORCEMENT_UNAVAILABLE` で plan 失敗。散文で書いただけで強制済みと扱わない。 | 安全性の誤認を防ぐ。 | P |
| I-RENDER-6 | `context` ノードは静的ホストでは既定で `dropped`。`trust: 'relay'` のノードは常に囲み（フェンス）付きで出力され、出所が明記される。 | 静的ファイルに揮発情報を焼き込まない。注入対策。 | P, G |

## ホストのコミット（HOST）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-HOST-1 | A host writes only absent targets or targets in its CommitRecord. Ownership is acquired only by commit or human-authorized adoption after a matching lossless import; unrelated, lossy, or mismatching non-owned targets fail TARGET_OCCUPIED (D-086). | Preserve human files. | E |
| I-HOST-2 | A changed or deleted owned target is not overwritten/restored; record drift/detected (observed:null for deletion) and skippedDrift. Deleted drift creates no automatic Proposal. Only human explicit --force may overwrite changed targets; restoring deleted targets additionally requires --target. An absent target also absent from plan leaves CommitRecord (D-071). | Preserve drift and explicit human intent. | E |
| I-HOST-3 | `generated` モードでは全出力 target が git の除外（`git rev-parse --git-path info/exclude` の管理ブロック）に入る。追跡済みの生成物を見つけたら finding を出す。 | ハーネスとワークスペースの版を混ぜない。 | E |
| I-HOST-4 | **Import round trip:** with dedupeWith:null, immediately rendering a lossless import into the same host preserves Markdown bytes after header removal and final-newline normalization; JSON/TOML preserve parsed values structurally. CLAUDE.md imports use hosts claude-code; AGENTS.md imports use agents-md/codex. Deduplicated output does not require round-trip equality. Unsupported fields fail unless explicit --lossy reports and removes them; IDs use imported.<path-slug> with numbered collision suffixes (D-035/063). | Preserve imported assets and make requested loss explicit. | G, E |
| I-HOST-5 | CommitRecord はワークスペース内に置かない（`$REINS_HOME/state/…`）。 | ワークスペースを汚さない。 | E |
| I-HOST-6 | File writes are atomic. Failure injected between temporary-file write and rename leaves the target entirely old or entirely new (D-091). | Prevent partial outputs. | E |
| I-HOST-7 | Concurrent renders of one workspace serialize across observe/check/write/record. Injected clock timeout beyond 30 seconds fails LOCKED (D-091). | Avoid ownership races. | E |

## 権限（CAP）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-CAP-1 | **単調減衰**：`attenuate(p, r)` の結果の任意 (right, ref) は p でも許可される。budget の各項目は p の残量以下。 | 委譲で権限が増えない。 | P |
| I-CAP-2 | **分離**：kind `agent` の Principal は `harness:write` を保持できない。付与しようとすると `CAP_DENIED`。 | 作業中エージェントが自分の足元を書き換えない。 | P |
| I-CAP-3 | **強制状態の記録**：マウントされた各セッションの各 Grant について `Enforcement` が `session/mounted` に記録される。`advisory` しか取れない権限は記録上も `advisory`。 | 「守られていると思い込む」ことを防ぐ。 | E |
| I-CAP-4 | 予算消費は親子連鎖を遡って課金され（`budget/charged`）、いずれかの祖先で超過したら新規操作は `BUDGET_EXCEEDED`。 | 子の増殖とコスト暴走の抑止。 | P |
| I-CAP-5 | Cordis の scope を権限境界として使わない。権限判定は常に `permits()` と guard を通る。 | Cordis scope はセキュリティ境界ではない。 | C |

## ログ（LOG）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-LOG-1 | Append only. Seq is contiguous from zero, prev is the preceding digest, and digest is canonical sha256. Seq zero MUST be run/start; any invalid chain or initial kind fails with LOG_CORRUPT (D-066). | Audit and replay. | P |
| I-LOG-2 | **モデル可視 ⇒ 記録済み**：モデルまたは子ランタイムに渡る全バイトは、ログ（または `ExternalLogRef` が指す DSH セッションログ）から再構成できる。PTY への送信は送信前に `session/sent` を記録する。 | DSH の不変条件を Reins 全体へ拡張。 | E, C |
| I-LOG-3 | File commits record intent then committed/failed. Every session mount/send/interrupt/stop/detach has a ULID opId and ends only with the correlated session/op-result. Pre-send session/sent logs payload, never outcome. Missing results recover as unknown with human notification and no automatic retry (D-074). | Correlated crash recovery. | E |
| I-LOG-4 | Projection の `reduce` は純粋。`project(p, log, n)` は log[0..n] の関数。 | I-ELAB-1 の前提。 | P |

## セッション（SESS）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-SESS-1 | セッションの親子関係は木（非循環）。深さは `maxDepth` を超えない（`DEPTH_EXCEEDED`）。兄弟内で `key` は一意。 | 増殖の制御。 | P |
| I-SESS-2 | **Untrusted child content:** child-origin content enters parent model context only through Reins context trust:relay or DSH relay messages with source kind subagent-report/subagent-settled. It never becomes instruction, rule, or knowledge. For DSH-provider children, SessionDigest renders state only (D-049). | Prevent child-to-parent prompt injection and duplicate relays. | P |
| I-SESS-3 | `session` ノードが木から消えたときの動作は `onRemove`（既定 `detach`）に従う。暗黙の kill は無い。 | 再描画の揺れで作業中の子を殺さない。 | E |
| I-SESS-4 | マウントされた全セッションは最終的に `session/unmounted` か終端 `session/status` を持つ。親の再起動時、結果の無いセッションは `reattach` を試み、失敗したら `unknown` として記録する。 | 孤児を作らない。 | E |
| I-SESS-5 | Child namespaces contain only explicitly bound resources. Declared env credential refs require effective read grants, otherwise CAP_DENIED; values resolve only at launch and never serialize. Default inherited env is PATH/HOME/LANG/LC_*/TERM/TMPDIR/MISE_* (D-079). | Explicit credential handoff. | E |
| I-SESS-6 | Recovery never resends a send whose op-result is absent (D-091). | Avoid duplicate delivery. | E |

## Secret non-disclosure (SEC)

| ID | Statement | Reason | Test |
|---|---|---|---|
| I-SEC-1 | A randomized dummy REINS_TEST_SECRET value appears nowhere in generated files, REINS_HOME logs/CAS/state, or test output; scan every file (D-091). | Keep credential values outside persisted artifacts. | E |

## 提案・進化・実行（PROP / EVO / RUN）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-PROP-1 | ハーネス source への非 human の書き込みは、Proposal の適用としてのみ起きる。適用は原子的で、新しいパッケージ digest を生み、`proposal/decided` を記録する。 | 変更の追跡可能性。 | E |
| I-PROP-2 | `code-patch` を含む Proposal は、パッケージのテストと全 I-* テストが通らない限り適用できない。 | コード空間の変更の安全性。 | E |
| I-EVO-1 | Final tasks/results reside in REINS_HOME/sealed/<taskset> and are absent from evolver Run namespaces. Read guards deny evolver access with SPLIT_LEAK; only the promoter reads final data (D-068). | Prevent selection overfitting through final data access. | P |
| I-EVO-2 | Candidates identify parent digest and Proposal. Compare only equal TrialKeys covering task ID, workspace bases, model, seed, toolchain, principal caps, and HostConfigs. Harness-derived config/base/digest/lock entries, namespace id, and RunSpec.parent may differ (D-089). | Control evaluation inputs without rejecting candidate metadata. | P |
| I-RUN-1 | `RunSpec` から Namespace・Lock・パッケージ・ホスト版が一意に復元でき、`run/start` に完全な RunSpec が記録される。 | 「Harness v18 × Workspace v482 × モデル × 依存」の固定。 | E |
| I-PKG-1 | The package digest covers every module reachable from entry and every file matched by the `content` globs. A file outside this coverage MUST NOT affect rendering; violations fail with `ELAB_IMPURE`. Static purity lint checks every reachable harness module and its initialization before evaluation; pureDependencies are explicit trusted exceptions. Double elaboration detects nondeterminism only (D-023/084). | The digest identifies all inputs that affect rendering. | P |
