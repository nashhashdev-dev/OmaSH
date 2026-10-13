# INVARIANTS — 不変条件（規範）

各不変条件は **ID・言明・根拠・試験義務** を持つ。実装はすべての ID に対応するテストを `packages/*/test/invariants/<ID>.test.ts` に置かなければならない（MUST）。テスト名は ID で始める。
不変条件を弱める変更は禁止。強める変更は DECISIONS.md に記録したうえで可。

試験種別：**P** = property test（fast-check, 既定 200 runs）、**G** = golden（スナップショット）、**E** = e2e（実プロセス・実 git）、**C** = DSH contract test。

## 参照・名前空間（REF）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-REF-1 | `resolve(ref, ns, lock)` は (ref, ns.id, lock digest) が同じなら同じ `locator` と `version` を返す。 | 再現性。 | P |
| I-REF-2 | Run 開始時に全 Mount の `base` を確定する。Run 中に Mount の束縛（resolver・config・base）は変わらない。内容の変化は `ws/snapshot` / `ws/touched` イベントとしてのみ表現する。 | 「どの版で何をしたか」を一意にする。 | P, E |
| I-REF-3 | semver/tag ピンは Lock を経由してのみ解決される。Lock に無い未固定参照の解決は `REF_UNPINNED` で失敗する。 | 暗黙の最新版取得を禁止。 | P |
| I-REF-4 | `parseRef(formatRef(r))` は `r` と構造的に等しい。`formatRef(parseRef(s))` は正規化済みの `s` と等しい。 | 参照を ID として使える。 | P |
| I-REF-5 | Namespace は不変値。fork は新しい `id` と `parent` を持つ新 Namespace を作る。 | Plan 9 的名前空間。親子の差分が追える。 | P |

## 精緻化（ELAB）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-ELAB-1 | **Purity:** `ETree.digest` is a function of (package digest, lock digest, namespace id, log[0..logSeq]). Development mode MUST elaborate twice and reject differing digests with `ELAB_IMPURE`; this detects nondeterminism only. Static purity lint is also required: `reins render` MUST lint harness components using `@reins/eslint-plugin` and fail with `ELAB_IMPURE` on violations (SPEC §6.3, D-023). | React render purity; reproducibility, caching, and time travel. | P, lint |
| I-ELAB-2 | **ホスト非依存**：精緻化はホストを知らない。Hooks にホスト情報を返すものは存在しない。ホスト差は `hosts` プロパティと各ホストの plan だけで表す。 | 同じ木を複数ホストへ render する、という中心命題。 | P（API 面の型テスト） |
| I-ELAB-3 | `knowledge` `rule` `skill` `tool` `context` `task` `raw` は `id` 必須、`session` は `key` 必須。欠落は `ID_MISSING`。パッケージ内重複は `ID_DUPLICATE`。 | 差分・アンカー・提案・sourcemap の安定参照。 | P |
| I-ELAB-4 | ETree には component・fragment・`ref` 形式の Content が残らない。 | ETree が IR として自己完結する。 | P |
| I-ELAB-5 | 子 scope の `effective.caps` は親の `effective.caps` に対し `attenuate` を適用した結果であり、親を超えない。 | I-CAP-1 の木への射影。 | P |

## レンダリング（RENDER）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-RENDER-1 | `host.plan(tree, ctx)` は純粋・同期。同じ (tree.digest, ctx, host id) なら同じ `RenderPlan.digest`。 | 再現性。memo 化の正当性。 | P |
| I-RENDER-2 | **全量会計**：ETree の全 ENode（root を除く）が `Accounting.entries` にちょうど 1 回現れる。`filtered` には理由が必須。 | 「なぜ X がプロンプトに無いか」に必ず答えられる。黙って消える情報を作らない。 | P |
| I-RENDER-3 | **Complete source maps:** mappings cover each output's entire UTF-16 code-unit range without gaps or overlap. Positions are JavaScript string indices with an exclusive end; each range points to an ENode gid or `'host'` (D-020). | Trace output to its definition (`reins why`). | P |
| I-RENDER-4 | **Volatility ordering:** plans for two trees differing only in `turn` nodes have completely identical `static` and `session` output strings. Dynamic hosts order outputs by increasing volatility (D-020). | Stable prompt-cache prefixes and minimal changes. | P |
| I-RENDER-5 | **強制の誠実性**：`enforcement: 'enforced'` の rule は、ホストの guard 機構で実現されるか、`onUnsupported: 'downgrade'` で `degraded` と会計されるかのいずれか。それ以外は `ENFORCEMENT_UNAVAILABLE` で plan 失敗。散文で書いただけで強制済みと扱わない。 | 安全性の誤認を防ぐ。 | P |
| I-RENDER-6 | `context` ノードは静的ホストでは既定で `dropped`。`trust: 'relay'` のノードは常に囲み（フェンス）付きで出力され、出所が明記される。 | 静的ファイルに揮発情報を焼き込まない。注入対策。 | P, G |

## ホストのコミット（HOST）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-HOST-1 | **所有**：ホストは自分の CommitRecord に記録された target、または存在しない target にのみ書く。存在する非所有 target は `TARGET_OCCUPIED`（`reins import` を提案）。 | 人間のファイルを壊さない。 | E |
| I-HOST-2 | **ドリフト不上書き**：observed digest が last CommitRecord の digest と異なる target は上書きしない。`drift/detected` を記録し `skippedDrift` に入れる。上書きは `human` principal の明示 `--force` のみ。 | hydration mismatch を検出して保存する。 | E |
| I-HOST-3 | `generated` モードでは全出力 target が git の除外（`git rev-parse --git-path info/exclude` の管理ブロック）に入る。追跡済みの生成物を見つけたら finding を出す。 | ハーネスとワークスペースの版を混ぜない。 | E |
| I-HOST-4 | **取り込み往復**：`reins import` で取り込んだ直後に同じホストへ render すると、各ファイルは元と一致する（正規化：末尾改行を 1 個に統一、生成ヘッダ行を除く）。 | 既存資産の無損失移行。 | G, E |
| I-HOST-5 | CommitRecord はワークスペース内に置かない（`$REINS_HOME/state/…`）。 | ワークスペースを汚さない。 | E |

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
| I-LOG-1 | 追記のみ。`seq` は 0 から連続、`prev` は直前の `digest`、`digest` は正規形の sha256。検証失敗は `LOG_CORRUPT`。 | 監査・再生。 | P |
| I-LOG-2 | **モデル可視 ⇒ 記録済み**：モデルまたは子ランタイムに渡る全バイトは、ログ（または `ExternalLogRef` が指す DSH セッションログ）から再構成できる。PTY への送信は送信前に `session/sent` を記録する。 | DSH の不変条件を Reins 全体へ拡張。 | E, C |
| I-LOG-3 | **二相効果**：ファイルのコミット・セッションの mount/send/interrupt/stop は、意図イベント（`render/intent` / `session/intent`）→ 結果イベントの順で記録される。結果の無い意図は再起動時に検出され、調停される。 | クラッシュ回復と監査。 | E |
| I-LOG-4 | Projection の `reduce` は純粋。`project(p, log, n)` は log[0..n] の関数。 | I-ELAB-1 の前提。 | P |

## セッション（SESS）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-SESS-1 | セッションの親子関係は木（非循環）。深さは `maxDepth` を超えない（`DEPTH_EXCEEDED`）。兄弟内で `key` は一意。 | 増殖の制御。 | P |
| I-SESS-2 | **子出力は信頼しない**：子由来の内容は `trust: 'relay'` の `context` としてのみ親の木に入る。`instruction`・`rule`・`knowledge` に自動昇格しない。 | 子 → 親へのプロンプトインジェクション対策。 | P |
| I-SESS-3 | `session` ノードが木から消えたときの動作は `onRemove`（既定 `detach`）に従う。暗黙の kill は無い。 | 再描画の揺れで作業中の子を殺さない。 | E |
| I-SESS-4 | マウントされた全セッションは最終的に `session/unmounted` か終端 `session/status` を持つ。親の再起動時、結果の無いセッションは `reattach` を試み、失敗したら `unknown` として記録する。 | 孤児を作らない。 | E |
| I-SESS-5 | 子の名前空間は親の名前空間から `WorkspaceBinding` で明示されたものだけを含む（既定で何も継承しない）。資格情報は Grant が無い限り子の環境変数に渡さない。 | 明示的な受け渡しのみ。 | E |

## 提案・進化・実行（PROP / EVO / RUN）

| ID | 言明 | 根拠 | 試験 |
|---|---|---|---|
| I-PROP-1 | ハーネス source への非 human の書き込みは、Proposal の適用としてのみ起きる。適用は原子的で、新しいパッケージ digest を生み、`proposal/decided` を記録する。 | 変更の追跡可能性。 | E |
| I-PROP-2 | `code-patch` を含む Proposal は、パッケージのテストと全 I-* テストが通らない限り適用できない。 | コード空間の変更の安全性。 | E |
| I-EVO-1 | `final` split のタスクとその結果は、`evolver` principal から読めない。`promoter` だけが読む。違反は `SPLIT_LEAK`。 | 選択への過適合の防止。 | P |
| I-EVO-2 | Candidate は親 harness digest と Proposal を持ち、比較される Trial 群は harness digest 以外の RunSpec 項目が一致する。 | 差の原因をハーネスに限定。 | P |
| I-RUN-1 | `RunSpec` から Namespace・Lock・パッケージ・ホスト版が一意に復元でき、`run/start` に完全な RunSpec が記録される。 | 「Harness v18 × Workspace v482 × モデル × 依存」の固定。 | E |
| I-PKG-1 | The package digest covers every module reachable from entry and every file matched by the `content` globs. A file outside this coverage MUST NOT affect rendering; violations fail with `ELAB_IMPURE`. Static purity lint checks forbidden direct I/O, and double elaboration detects nondeterminism only (D-023). | The digest identifies all inputs that affect rendering. | P |
