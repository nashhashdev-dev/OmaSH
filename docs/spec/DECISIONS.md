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

## User decisions (2026-10-13)

| ID | Date | Decision | Reason | Alternatives | Impact |
|---|---|---|---|---|---|
| D-018 | 2026-10-13 | For `harness` refs, authority is the package name and follows `(@[a-z0-9][a-z0-9._-]*/)?[a-z0-9][a-z0-9._-]*`. In `harness://@me/swe@^2#no-raw-sql`, authority is `@me/swe` and path is empty. Other schemes retain their authority grammar; `self` remains reserved. | Support npm scoped package names and make the example conform to the grammar. | Keep the old authority grammar and rewrite package names. | SPEC §4.1; types.ts Ref comments; I-REF-3/4; M1 ref parsing and formatting. |
| D-019 | 2026-10-13 | Accounting includes exactly one entry for every ENode except root. Root is a synthetic container and has no entry. | Align the type comments with I-RENDER-2. | Include root in accounting. | types.ts Accounting/root comments; SPEC §7.3; I-RENDER-2. |
| D-020 | 2026-10-13 | Source-map positions use UTF-16 code units, matching JavaScript string indices, with an exclusive end. Stable static/session outputs mean complete string equality. | Use one position unit consistently with types.ts. | Use byte offsets. | types.ts SourceMap comment; I-RENDER-3/4; output provenance descriptions. |
| D-021 | 2026-10-13 | Send order is: record `session/intent`, record `session/sent`, perform the send. On send failure, record `session/status` with status `failed`. | Preserve recorded payloads before exposing them to a child runtime. | Record `session/sent` after sending. | SPEC §11.2/11.4; I-LOG-2/3; session hosts and crash recovery. |
| D-022 | 2026-10-13 | `attenuate(parent: CapSet, requested: CapSet, opts?: { strict?: boolean }): CapSet`. Default strict is false and silently attenuates. With strict true, any attenuation throws `CAP_WIDENING`. Session mount always passes `{ strict: true }`. | Expose strict behavior explicitly without ambient configuration. | Keep the two-argument API with an unspecified strict mode. | types.ts KernelApi; SPEC §9.1/11.3; I-CAP-1; M1 and session mount. |
| D-023 | 2026-10-13 | Add `packages/eslint-plugin` (`@reins/eslint-plugin`) in M1. Harness components MUST pass static lint that prohibits imports of I/O modules such as `node:fs`, `node:child_process`, and `node:net`, and prohibits `process.env`, `Date`, `Math.random`, `fetch`, `crypto.getRandomValues`, and I/O outside the `@reins/core` hooks. `reins render` MUST run this lint and fail with `ELAB_IMPURE` on violations. Double elaboration detects nondeterminism only. | Combine static effect checks with runtime nondeterminism checks; repeated evaluation alone cannot establish purity. | Rely on double elaboration alone. | SPEC §6.3; I-ELAB-1 and its lint tests; I-PKG-1 detection wording; types.ts error comment; AGENT_BRIEF layout; M1 deliverables. |

## User decisions, batch 2 (2026-10-13)

The complete supplied decisions are retained in `DECISIONS-batch-2.md`. Apply D-024 through D-041 in order; validate the final type changes with strict TypeScript checking.

| ID | Date | Decision | Reason | Alternatives | Impact |
|---|---|---|---|---|---|
| D-024 | 2026-10-13 | External content is logged input: `content/fetched {ref, digest}` points into `$REINS_HOME/cas/<digest>`; `content/unavailable {ref, reason, detail?}` records timeout, not-found, denied, or error. Drivers build external inputs from these events and CAS. `ensurePlan()` fetches missing refs in parallel and retries until done; model requests MUST wait. After the default 10000 ms `suspenseTimeoutMs` or a fetch failure, resolve to `[reins: content unavailable: <ref> (<reason>)]`, and account affected nodes as degraded with reason `content-unavailable:<ref>`. Static hosts use the same procedure and CLI accepts `--suspense-timeout`. | Keep external inputs replayable and preserve accounting with bounded waiting. | Render missing content as empty strings. | SPEC §6.2/10/14; DSH_INTEGRATION §3; LogEventMap; ElaborateInput comments; I-ELAB-1. |
| D-025 | 2026-10-13 | ETree includes external: Digest, the digest of the used `{ref: digest}` map. Its digest is `digestJson({package, lock, namespace, external, root})` and excludes logSeq. Dynamic hosts record render/committed only when plan digest changes. | Reuse plans when a turn leaves rendered state unchanged. | Include logSeq in ETree.digest. | ETree; SPEC §6.2; DSH_INTEGRATION §3. |
| D-026 | 2026-10-13 | Human source edits do not automatically change the active harness. `reins reload` or `/reins-reload` records `harness/switched {digest, lock}`. Use the latest switched version, or run/start when none exists. | Support explicit live updates with replayable version selection. | Implicit file watching that changes the active version. | LogEventMap; SPEC §12.3/14. |
| D-027 | 2026-10-13 | Resolve onUnsupported from author settings or the SPEC §7.3 defaults: unsupported enforced guards error; static context/turn/task and unsupported tools drop; unavailable tool allowlists and skill directories downgrade. | Define unsupported behavior consistently. | Unspecified defaults. | SPEC §7.3; ENode.effective comment. |
| D-028 | 2026-10-13 | Add delegated accounting and its summary count. A parent plan accounts session descendants as delegated with reason `session:<key>`; the child host fully accounts them. Exactly once applies within each plan. | Account portal descendants without rendering them in the parent. | Omit descendants from parent accounting. | AccountStatus, Accounting, AccountingSummary; I-RENDER-2; SPEC §7.3. |
| D-029 | 2026-10-13 | Parent elaboration expands session.children and evaluates JavaScript branches using parent state. The child host evaluates data when/at against child TaskState; static children use the static projection, dynamic children use their own log. | Let data predicates express conditions local to a child. | Evaluate all child conditions against parent task state. | SPEC §6.4/11.3. |
| D-030 | 2026-10-13 | For nested static output, render normally in fixed prefix directory D only when the remainder is exactly `**`; otherwise use Conditional with touches(pattern). Empty D uses the root Conditional section. Other workspace authorities are filtered with `at:other-workspace`. | Preserve the precise path scope. | Treat every fixed prefix as covering the whole directory. | SPEC §7.4. |
| D-031 | 2026-10-13 | Dynamic skill names/descriptions appear in reins:static; skill_load returns bodies through logged DSH tool results. Tasks lead reins:turn using §5.8; ordinary user messages remain human-authored. Only reins run with profile reins-headless sends a compiled task as the initial user message. Section order is Rules, Instructions, Knowledge, Skills, Conditional, raw. | Define skill loading and task placement without fabricating ordinary user messages. | Always inline skill bodies or synthesize user messages. | SPEC §7.6/14; DSH_INTEGRATION §3. |
| D-032 | 2026-10-13 | Volatility determines placement, not freezing. Updated static/session nodes use their new content. render/committed includes cacheBreak: boolean, true when the system portion changes. I-RENDER-4 still requires stable system output when only turn nodes change. | Preserve honest cache behavior during live updates. | Freeze static/session nodes for the entire run. | LogEventMap; SPEC §7.3. |
| D-033 | 2026-10-13 | After S-2 validates Claude Code imports, co-rendered CLAUDE.md starts with `@AGENTS.md` from the same directory, followed by Claude-only nodes. Otherwise both files contain full content. dedupeWith is agents-md or null, defaulting to agents-md when both hosts are selected. | Avoid duplicating shared instructions when imports are supported. | Assume import support without testing it. | SPEC §7.5; OQ-01. |
| D-034 | 2026-10-13 | Convert secret references to the destination's supported environment reference syntax, such as `${NAME}` in .mcp.json. When unsupported, drop the tool with reason secret-unsupported. Never write secret values into files or logs. S-2/S-3 verify expansion support. | Keep credentials outside generated artifacts and logs. | Resolve secret values into generated configuration at commit time. | SPEC §5.6/7.5; M0 S-2/S-3. |
| D-035 | 2026-10-13 | Import Markdown as raw and convert JSON/TOML structurally: MCP entries to tool, representable permissions.deny entries to enforced rules. List unsupported fields and fail, unless --lossy explicitly reports and drops them. Markdown round trips normalize header and terminal newline; configuration round trips compare parsed values. IDs are imported.<path-slug>, with -2, -3 suffixes for collisions. | Preserve imported content and make loss explicit. | Treat structured settings as raw Markdown or silently discard fields. | SPEC §14; I-HOST-4. |
| D-036 | 2026-10-13 | Each render/check/import invocation, DSH root session, mounted child session, and Trial has its own Run. Record parent {run, session} and forkedFrom {run, seq} in RunSpec. Map DSH session IDs via runs/index.json; resume appends to the same Run. | Define log ownership and parent/fork relationships. | Implicit or inconsistent Run boundaries. | RunSpec; SPEC §10/12.3; DSH_INTEGRATION §4. |
| D-037 | 2026-10-13 | Serialize static commits to one workspace with `$REINS_HOME/state/<wsid>/lock`. After 30 seconds without the lock, fail with LOCKED. | Prevent concurrent static commits from racing. | Allow unsynchronized writers. | ReinsErrorCode; SPEC §7.2. |
| D-038 | 2026-10-13 | Recover unmatched intents on startup: re-observe render and record recovered:true committed when the plan matches; otherwise failed and retain CommitRecord. For mount, try reattach and record mounted or status unknown. For send, record unknown, notify the human, and never automatically resend. | Recover crashes without duplicate sends or fabricated outcomes. | Blindly repeat every unfinished operation. | SPEC §10; render/committed recovered field; I-LOG-3. |
| D-039 | 2026-10-13 | Charge DSH usage from assistant/message and reject over-budget agent/request without next(). Charge external usage from structured reports or PTY readings; unavailable usage is advisory. Wallclock starts at mount; on excess, interrupt, then stop after 30 seconds. | Define observable charging and enforcement points. | Assume usage can always be observed. | SPEC §9.3; DSH_INTEGRATION §3. |
| D-040 | 2026-10-13 | Execute command anchors in disposable snapshot copies. Git uses a temporary worktree plus the snapshot's working diff; non-git uses a temporary copy and reports unverifiable with too-large above 1 GiB. Remove copies after execution. | Keep checks from modifying the real workspace. | Execute anchors directly in the real workspace. | SPEC §8.3. |
| D-041 | 2026-10-13 | LLM spawn selects a predeclared session profile via {key, profile, workspace, task, interactive?}. Manifest profiles name an exported component, allowed runtime kinds, and caps; effective caps attenuate profile caps against the requester. The kernel automatically appends RequestedSessions when the root principal has spawn. | Restrict child harness selection and prevent missing spawn handlers. | Let the LLM submit an arbitrary runtime, caps, or child harness. | PackageManifest; SPEC §11.2; session/requested comment. |

Batch 2 scope: support Linux and macOS only; Windows is a non-goal. M0 uses real runtimes. If credentials are missing, mark the affected spike BLOCKED and continue independent spikes.

## 未決（既定値で進める）

| ID | 問い | 既定値 | 解決手段 |
|---|---|---|---|
| OQ-01 | Claude Code path-scoped rules and `@path` imports in CLAUDE.md; verify co-rendering deduplication (D-033). | Nested CLAUDE.md; when both hosts are selected, dedupeWith defaults to agents-md, but emits imports only after S-2 confirms support. Otherwise retain full content in both files. | Spike S-2 |
| OQ-02 | Codex の skills ディレクトリと、enforced rule を実現できる設定があるか | `.agents/skills`、guard なし（downgrade/error） | スパイク S-3 |
| OQ-03 | DSH の `claude-code` / `codex` サブエージェントプロバイダが D-009 の条件 1〜4 を満たすか | 満たさない前提でフォールバック実装も用意 | スパイク S-6 |
| OQ-04 | DSH で既存の AGENTS.md 読み込みプラグインと Reins の section が二重になるのをどう避けるか | Reins profile では既存の AGENTS.md section provider を patch.yml で無効化し、`reins import` で取り込んだ raw として出す | スパイク S-5 |
| OQ-05 | `fs` resolver の Merkle digest に含めないファイル | `.git/`、Reins 生成物（CommitRecord の targets）、`node_modules/`、`.gitignore` 対象 | M1 実装時に確定 |
| OQ-06 | ワークスペースの `ws/snapshot` をいつ取るか（コスト） | mount 時と Run 終了時と `reins check` 時のみ。ターン毎は取らない | M3 で計測 |
| OQ-07 | import-boundary アンカーの非 TS 言語対応 | custom evaluator に委ねる | M4 |
| OQ-08 | ハーネスパッケージのレジストリ | git URL テンプレートのみ | M6 |
| OQ-09 | tmux の状態推定パターンの保守方法 | ランタイム別の判定器プラグイン + 採取した画面 fixture のテスト | スパイク S-4 |
| OQ-10 | 名称 | Reins | 利用者が決める |
