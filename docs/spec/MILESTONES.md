# MILESTONES — 段階・成果物・受け入れ基準

順序：M0 → M1 → M2 → M3 →（M4 と M5 は順不同）→ M6 → M7。
各マイルストーンは **受け入れ基準をすべて自動テストまたは記録済みの手動手順で満たした時** に完了。完了時に `CHANGELOG.md` へ 1 節追記し、利用者に「完了報告」（AGENT_BRIEF.md §7 の書式）を出す。

共通の受け入れ基準（全 M）：
- `mise run lint` `mise run test` が通る。そのマイルストーンで導入した全 I-* テストが存在し通る。
- 新規の公開 API は types.ts の型と一致する（`tsc` で `types.ts` の型を import して検査する型テストを置く）。
- DECISIONS.md に新しい判断が記録されている。
- `tsc -p docs/spec/checks` passes. Positive examples compile and negative examples retain their expected diagnostics.

---

## M0 — スパイク（前提の検証）

コードは `spikes/` 以下の使い捨てでよい。成果物は `SPIKES.md`（各スパイクについて：手順、観測結果、生の証拠（コマンド出力の抜粋）、仕様への影響）。

| ID | 検証すること |
|---|---|
| S-1 | 汎用 AGENTS.md：ネストした `<dir>/AGENTS.md` を Codex・OpenCode・Pi が読むか、読む条件（cwd、触ったファイル） |
| S-2 | Claude Code: nested CLAUDE.md loading, .claude/rules frontmatter, skills, .mcp.json, permissions.deny syntax, CLAUDE.md @path import support for AGENTS.md deduplication (D-033), and environment reference expansion in each configuration target (D-034). |
| S-3 | Codex: AGENTS.md hierarchy, skills, .codex/config.toml mcp_servers, native guard/sandbox realization, and environment reference expansion in each configuration target (D-034). |
| S-4 | tmux 経由で Claude Code と Codex の TUI を操作：ブラケットペースト送信、Enter、`capture-pane` での idle / working / 承認待ち の判定パターン採取（画面 fixture として保存） |
| S-5 | DSH profile/bundle installation, dump-config, per-agent section/context registration, order/shadowing, logged context snapshots, existing AGENTS.md provider disablement, tools.guard/restrict, and asynchronous system-prompt/assemble structure/replacement. Unavailable replacement is BLOCKED (D-055). |
| S-6 | DSH `ctx.subagents` の `claude-code` / `codex` プロバイダ：DSH_INTEGRATION.md §5 の条件 1〜4 |

受け入れ基準：
- 6 件すべてに結論（採用／不採用／部分）があり、SPEC §7.5 の表・DSH_INTEGRATION.md・DECISIONS.md の OQ が更新されている。
- `mise.toml` の各ツール版が固定され `mise.lock` がある。
- **停止条件**：スパイク結果が法則（SPEC §3）や不変条件と矛盾する場合、実装に進まず利用者に報告する。

Use real runtimes for all six spikes (batch 2 scope). If Claude Code/Codex authentication or a DSH LLM key is unavailable, report the affected spike as BLOCKED and continue the independent spikes. Supported development/runtime platforms are Linux and macOS.

---

## M1 — core

パッケージ：`@reins/core`。

Also deliver `@reins/eslint-plugin` in `packages/eslint-plugin` (D-023).

成果物：
- `types.ts` を `packages/core/src/types.ts` に配置（逐語）。
- refs（parse / format / match / pattern 包含）、canonicalJson（RFC 8785）、digest。
- caps（`permits` `attenuate`）、Principal 既定値（SPEC §9.2）。
- `h()`、JSX ランタイム、`use()`、フック、`elaborate`（SPEC §6.2、Suspense、二重精緻化検査）。
- `useFile`：frontmatter パーサ（`yaml` パッケージ）、kind ごとの検証。
- Projection 基盤と `reins/task-state`、Predicate 評価と describe。
- ログ writer / reader（JSONL、連鎖検証、ファイルロック）。
- `task-compile`（SPEC §5.8）。
- Resolver `fs`、`harness-pkg`（ローカルのみ）。
- `examples/hello`（SPEC §6.1 相当）。
- Static purity lint for harness components: reject I/O module imports (including `node:fs`, `node:child_process`, and `node:net`), `process.env`, `Date`, `Math.random`, `fetch`, `crypto.getRandomValues`, and I/O outside the `@reins/core` hooks. Provide the lint used by `reins render`, which MUST fail with `ELAB_IMPURE` on violations (SPEC §6.3, D-023).
- Logged external-content input, CAS/placeholder materialization, and the ETree digest excluding logSeq while including used external digests (D-024/025).

受け入れ基準：
- I-REF-1〜5、I-ELAB-1〜5、I-CAP-1・2・4、I-LOG-1・4、I-PKG-1 のテストが通る。
- examples/hello ETree goldens normalize namespace id, absolute Mount-config paths, and base to <NS>/<PATH>/<BASE>. Two elaborations on the same machine have identical digests. Rendered-file goldens remain exact (D-051).
- 欠落 id、重複 id、hook の範囲外呼び出し、`Math.random()` を使うコンポーネント、の各々が規定のエラーコードで失敗するテストがある。
- I-ELAB-1 lint tests cover forbidden imports and expressions, including deterministic forbidden I/O, and verify that permitted core hooks pass. Double-elaboration tests verify nondeterminism detection separately.
- Type tests cover soft-branded literals, type-erased component calls, JSON package props, named exports, JSX key restoration, boolean nodes, and unconstrained TaskState projections. Development tests check projection JSON serializability (D-042/044/045/046).

---

## M2 — 静的ホストと CLI

パッケージ：`@reins/host-agents-md` `@reins/host-claude-code` `@reins/host-codex` `@reins/reconcile` `@reins/cli`。Resolver `git-worktree`。

成果物：
- 3 ホストの `plan / observe / commit`（SPEC §7.2〜7.5、M0 で確定した対象表）。
- ホスト調停、CommitRecord、git exclude 管理ブロック、原子的書き込み。
- Bounded ensurePlan/content retrieval, unsupported/delegated accounting, precise nested scopes, validated co-host deduplication, reference-only secret configuration, structural import with explicit --lossy, and serialized static commits (D-024/027/028/030/033/034/035/037).
- `reins init / render / import / status / why`。
- ドリフト検出と持ち上げ提案（SPEC §8.2、提案の作成まで。適用は M4）。

受け入れ基準（fixtures：`fixtures/ws-ts`（TS アプリ、`src/auth/` あり、既存 AGENTS.md と CLAUDE.md あり）、`fixtures/ws-py`、`fixtures/ws-notes`）：
1. Import sets source-specific hosts; rendering immediately with agents-md/claude-code and dedupeWith:null preserves normalized Markdown and parsed JSON/TOML values (I-HOST-4, D-063).
2. `examples/hello` を 3 ホストへ render した結果が golden と一致。`src/auth/AGENTS.md` と `src/auth/CLAUDE.md` が生成される。
3. render 後 `git status --porcelain` が空（I-HOST-3）。
4. 生成された `CLAUDE.md` を手で 1 行変更 → 再 render でそのファイルだけ上書きされず `drift/detected` が記録され、`reins status` が content-patch か lift-drift の提案を表示（I-HOST-2）。
5. 非所有の `.claude/settings.json` がある状態で enforced rule を含む木を render → `TARGET_OCCUPIED`（I-HOST-1）。
6. `reins why src/auth/CLAUDE.md:<n>` が gid・via・provenance を表示（I-RENDER-3）。
7. I-RENDER-1・2・3・5・6、I-HOST-1〜5 のテストが通る。
8. Static sessions are dropped with session:static-host and accountable descendants delegated. Static when conditions render under Conditional. Duplicate targets fail with TARGET_CONFLICT; Codex via-agents-md omits shared instructions/skills (D-048/059/064).

---

## M3 — DSH 動的ホスト

パッケージ：`dsh-plugin-reins`（DSH_INTEGRATION.md §2〜4）、`contracts/dsh`。

成果物：
- Cordis plugin、bundle、profile テンプレート `reins`。
- 動的ホスト `dsh`、plan の memo 化、DSH ログ橋渡し、guard による権限強制（I-CAP-2 の harness 書き込み拒否を含む）。
- ensurePlan before model requests; unchanged-plan event suppression; skill_load/task placement; cache-break recording; Run resume/fork mapping; explicit reload and headless run commands; usage charging and pre-request budget rejection (D-024/025/026/031/032/036/039).
- `reins explain --host dsh --seq <n>`。
- 決定的な台本 LLM アダプタ（テスト用、`ctx.llm` に登録、受け取った system と messages をファイルに保存し、台本どおりのツール呼び出しを返す）。

受け入れ基準：
1. `dsh --profile reins --dump-config` に Reins の行が出る。
2. 台本 LLM で 3 ターン実行：ターン 2 で `src/auth/x.ts` を読む → ターン 3 の要求にだけ auth 系ノードが現れる（on-touch）。
3. Across turns, `reins:static` and `reins:session` output strings are completely identical; only `reins:turn` changes (I-RENDER-4, D-020).
4. エージェントがハーネスディレクトリへ書こうとするツール呼び出しが拒否され、`cap/denied` が記録される（I-CAP-2, I-CAP-5）。
5. `model/request` が DSH セッションログを指し、そこから要求本文を再構成できる（I-LOG-2）。
6. DSH_INTEGRATION.md §8.2 の contract（`subagents.continuable` を除く）が全て通る。
7. **Demo:** `examples/hello/demo.sh` demonstrates one tree producing AGENTS.md, CLAUDE.md, and DSH per-turn prompts, with origin tracing through `reins why` / `reins explain` using UTF-16 code-unit ranges (D-020).

---

## M4 — 真偽調停と提案

成果物：アンカー評価器（path / grep / command / import-boundary(TS)）、`reins check`、提案の適用（`reins propose apply`、`git apply --3way` 相当、原子的置換、新 digest）、任意の log-pattern 検出プラグイン。Command anchors run in disposable snapshot copies, never in the real workspace (D-040).

受け入れ基準：
1. `fixtures/ws-ts` で `package.json` の `test:unit` を `test:u` に改名 → `reins check` で該当 command アンカーが `violated`、ハーネス側・ワークスペース側の 2 候補を持つ提案ができる。
2. agent principal で `reins propose apply` → `CAP_DENIED`。human で適用 → 新パッケージ digest、`proposal/decided`（I-PROP-1）。
3. `code-patch` を含みテストを壊す提案は適用されない（I-PROP-2）。
4. `rationale` / `preference` の knowledge は評価対象外であることのテスト。

---

## M5 — セッション

パッケージ：`@reins/session-tmux`、構造化アダプタ（M0 の S-6 結果に応じて DSH プロバイダ経由または自前）、DSH 側 `session_*` ツール、`<RequestedSessions/>` `<SessionDigest/>`、CLI `reins session …`。

Session work includes parent/child evaluation rules, one Run per mounted child, startup intent recovery without automatic resend, observable usage/wallclock enforcement, and predeclared profile-only LLM spawning with kernel-injected RequestedSessions (D-029/036/038/039/041).

受け入れ基準（CI は偽ランタイム `fixtures/fake-agent`：受け取ったタスクを echo し、指定ファイルを書き、`DONE` を表示するスクリプトで行う）：
1. 台本 LLM が `session_spawn` → `session/requested` → mount → 子 worktree に子ハーネスの CLAUDE.md が生成 → タスクが §5.8 書式で送られる。`session/sent` が送信より前に記録（I-LOG-2, I-LOG-3）。
2. 親より広い caps を要求 → `CAP_WIDENING`。深さ超過 → `DEPTH_EXCEEDED`（I-CAP-1, I-SESS-1）。
3. `session/mounted` に Grant ごとの Enforcement（I-CAP-3）。
4. Child output uses Reins relay context or DSH subagent-report/subagent-settled relay messages, never instruction/rule/knowledge. DSH-provider SessionDigest includes status only (I-SESS-2, D-049).
5. ノード削除で detach（プロセスは生存）、`onRemove: 'stop'` で停止（I-SESS-3）。
6. 親プロセスを kill → 再起動 → reattach 成功、または `unknown` 記録（I-SESS-4）。
7. 子の環境変数に、Grant の無い資格情報（テスト用ダミー `FAKE_TOKEN`）が無い（I-SESS-5）。
8. 手動手順書 `docs/manual/real-runtimes.md`：実 Claude Code と実 Codex で 1 と 4 を再現した記録。
9. Unmounted keys leave requestedSessions and cannot be reused within a Run (KEY_REUSED). Reconcile immediately after requests and on dynamic renders. Acceptance commands run directly only in disposable child workspaces; share-mode children use snapshot copies (D-047/058).

---

## M6 — パッケージ・依存・再現

成果物：`reins lock` `reins add`、git レジストリ、`use()` での依存合成、RunSpec の完全記録と再現コマンド `reins replay <RunId>`（静的 render の再現）。

受け入れ基準：
1. `examples/swe` が `examples/verify`（git 依存）を `use()` し、依存側ノードの gid が依存パッケージ名で付く。
2. lock を固定したまま依存リポジトリに新コミット → 結果が変わらない（I-REF-3）。
3. `reins replay` で同じ plan digest（I-RUN-1）。

---

## M7 — 評価と進化

成果物：Taskset 形式、Trial 実行器（M5 のセッションを使用）、比較レポート、evolver（Proposal 生成は LLM プラグインとして差し替え可能、既定は Meta-Harness 方式で過去 Trial のログをファイルとして読ませる）、promoter フロー。任意で Harbor アダプタ。

受け入れ基準：
1. fixtures 上の 20 タスク × 2 ハーネス版 × 3 反復を実行し、比較レポート（成功率・費用・時間・ばらつき）を出す。
2. evolver principal で final split を読もうとすると `SPLIT_LEAK`（I-EVO-1）。
3. 比較対象 Trial の RunSpec が harness digest 以外一致しない場合、比較を拒否（I-EVO-2）。
4. 1 サイクル（propose → select → final → promote）を通しで実行した記録。
5. Final data is sealed outside evolver namespaces and guarded against direct reads with SPLIT_LEAK; evolvers write only candidate copies (D-050/068).
