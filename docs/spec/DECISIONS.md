# DECISIONS — 決定記録

形式：`D-NNN`（決定済み）と `OQ-NN`（未決。**既定値付き**。実装は既定値で進め、解決したら D に昇格する）。
実装エージェントが新たに判断した事項は、この表に追記する（MUST）。追記項目：ID、日付、決定、理由、代替案、影響範囲。

## 決定済み

| ID | 決定 | 理由 | 却下した代替案 |
|---|---|---|---|
| D-001 | 名称は仮に **Reins**（手綱）。npm scope `@reins/*`、CLI `reins`、環境変数 `REINS_HOME`。 | harness（馬具）の制御部品。改名は機械的置換で済む。 | — |
| D-002 | 言語 TypeScript（strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`）、Node 22、ESM のみ、pnpm workspace、vitest、fast-check、tsdown または tsc ビルド。 | DSH / Cordis と同一エコシステム。 | Rust/Go（DSH plugin 化が困難） |
| D-003 | オーサリングは TS コンポーネント。JSX は任意の糖衣で `h()` と完全等価。YAML/JSON だけで木を書く DSL は作らない。 | 合成・条件・再利用に汎用言語を使う（React と同じ判断）。内容はデータファイル（D-005）。 | 独自 YAML DSL（表現力が足りず結局テンプレート言語化する） |
| D-004 | 正規 JSON は RFC 8785（JCS）、digest は sha256、表記 `sha256:<hex>`。 | 言語非依存で再現可能。 | 独自正規化 |
| D-005 | 内容（何を言うか）は `content/**/*.md`（frontmatter 付き）、合成（どこに・いつ）はコンポーネント。 | 提案の大半を content-patch に閉じられる。人間も編集しやすい。 | 全部コード／全部データ |
| D-006 | 生成物にインラインマーカーを埋めない。所有と sourcemap は `$REINS_HOME/state` の CommitRecord に置く。生成ファイルには 1 行ヘッダのみ。 | エージェントが読むトークンを増やさない。ワークスペースを汚さない。 | `<!-- reins:begin id -->` マーカー |
| D-007 | セッションは宣言的（キー付きノード）。エージェントの起動要求はログイベント → Projection → ノード、の単方向経路だけ。 | 法則 3・4。監査と再生が一つの仕組みで済む。 | ツールが直接プロセスを起動 |
| D-008 | 権限は Reins の `permits()` と guard で判定し、Cordis scope を権限境界にしない。 | scope はライフサイクル単位で、境界ではない。 | scope 依存 |
| D-009 | 構造化セッションは DSH `ctx.subagents` の既存プロバイダ（`claude-code` `codex` `acp` `spawn-in-process`）を第一候補とする。 | 既に DSH にある。自前実装を減らす。 | 全部自前 |
| D-010 | PTY セッションは tmux（専用ソケット）。 | 人間が attach でき、エージェントも普通のコマンドで操作できる。既存エコシステムの事実上の標準。 | 自前 PTY 多重化 |
| D-011 | core は**ライブラリ**であり常駐ランタイムを持たない。ドライバは CLI と DSH plugin の 2 つ。 | 新しい実行基盤を作らない（DSH を使う）。 | 独立デーモン |
| D-012 | 静的ホスト向けの精緻化は静的射影（空ログ）で行う。条件付き内容は `scope when`（データ Predicate）で表す。 | 静的ファイルの内容を実行状態から独立させる。 | 実行中に静的ファイルを書き換え続ける |
| D-013 | コンポーネントはホストで分岐しない（ホスト情報を返すフックを提供しない）。差は `hosts` プロパティとホストの plan で吸収。 | 「同じ木を複数ホストへ」の担保。 | `useHost()` |
| D-014 | 外部内容の取得は Suspense 型（elaborate は同期・純粋、欠落 ref を返して再試行）。 | 純粋性と非同期 I/O の両立。 | 非同期 elaborate（純粋性検査が難しくなる） |
| D-015 | 生成対象ファイルが非所有で存在する場合は上書きも併合もせず `TARGET_OCCUPIED`。共存は import で木に取り込んでから。 | 所有の曖昧さを作らない。 | 部分マージ |
| D-016 | 評価の split は propose / select / final の 3 つ。final は promoter のみ閲覧。 | 繰り返し選択による間接的過適合を防ぐ。 | 2 分割 |
| D-017 | ログ本文の正本は、DSH 内のモデル要求については DSH セッションログ。Reins は参照（ExternalLogRef）だけを持つ。 | 二重保存と不整合の回避。 | 全部コピー |

## 未決（既定値で進める）

| ID | 問い | 既定値 | 解決手段 |
|---|---|---|---|
| OQ-01 | Claude Code の path 限定規則は nested `CLAUDE.md` と `.claude/rules/*.md`（paths frontmatter）のどちらが適切か | nested `CLAUDE.md` | スパイク S-2 |
| OQ-02 | Codex の skills ディレクトリと、enforced rule を実現できる設定があるか | `.agents/skills`、guard なし（downgrade/error） | スパイク S-3 |
| OQ-03 | DSH の `claude-code` / `codex` サブエージェントプロバイダが D-009 の条件 1〜4 を満たすか | 満たさない前提でフォールバック実装も用意 | スパイク S-6 |
| OQ-04 | DSH で既存の AGENTS.md 読み込みプラグインと Reins の section が二重になるのをどう避けるか | Reins profile では既存の AGENTS.md section provider を patch.yml で無効化し、`reins import` で取り込んだ raw として出す | スパイク S-5 |
| OQ-05 | `fs` resolver の Merkle digest に含めないファイル | `.git/`、Reins 生成物（CommitRecord の targets）、`node_modules/`、`.gitignore` 対象 | M1 実装時に確定 |
| OQ-06 | ワークスペースの `ws/snapshot` をいつ取るか（コスト） | mount 時と Run 終了時と `reins check` 時のみ。ターン毎は取らない | M3 で計測 |
| OQ-07 | import-boundary アンカーの非 TS 言語対応 | custom evaluator に委ねる | M4 |
| OQ-08 | ハーネスパッケージのレジストリ | git URL テンプレートのみ | M6 |
| OQ-09 | tmux の状態推定パターンの保守方法 | ランタイム別の判定器プラグイン + 採取した画面 fixture のテスト | スパイク S-4 |
| OQ-10 | 名称 | Reins | 利用者が決める |
