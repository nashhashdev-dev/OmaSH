# DSH / mise 統合仕様（規範）

本書は Reins を DeepSeek Harness（DSH）と mise に載せる方法を定める。DSH の API 名は 2026-10-13 時点の上流ドキュメント（末尾の出典）から取った。**実装前に M0 スパイクで実物と照合し、ずれがあれば本書だけを直す**（SPEC・types・不変条件は変えない）。

---

## 1. 位置づけ

```
            ┌──────────── @reins/core（DSH 非依存・純粋）────────────┐
            │ refs / caps / elaborate / projections / log / task-compile │
            └───────────────┬──────────────────────┬──────────────────┘
                            │                      │
        driver A: @reins/cli（単体）      driver B: dsh-plugin-reins（Cordis plugin）
        静的ホスト（agents-md /          動的ホスト dsh、DSH ログ橋渡し、
        claude-code / codex）、           session_* ツール、ctx.subagents 連携、
        tmux セッションホスト             ガードによる権限強制
```

- `@reins/core` と静的ホストは **DSH に依存してはならない**（MUST NOT）。Claude Code / Codex 単体の利用者も CLI だけで R1・R2・R4・R5 を得られる。
- DSH 依存コードは `packages/dsh-plugin/src/adapter/` 以下に集約する（MUST）。adapter 外から `@deepseek-ai/*` を import しない（lint で禁止）。

## 2. 配布形態

- `packages/dsh-plugin` は Cordis plugin を export し、`package.json` の `dsh.bundle` で `cordis.patch.yml` を指す DSH bundle として配布する。
- 利用者向け profile テンプレート `reins`：`dsh-base` の上に Reins bundle を積む。`dsh plugin add` でインストール可能にする。
- plugin 名 `reins`、提供サービス `ctx.reins`、`inject: ['systemPrompt', 'tools', 'agents', 'sessions']`、任意依存 `subagents`。
- Settings (schemastery): `{ harness: string, workspace: string, reinsHome?: string, testCommandPatterns?: string[][], suspenseTimeoutMs?: number }`. Harness is a package path or harness ref; suspenseTimeoutMs defaults to 10000 (D-024).

## 3. 動的ホスト `dsh` の写像（MUST）

エージェント 1 つにつき、そのエージェントの `agent.ctx`（per-agent scope）で以下を登録する。登録はすべて Cordis effect で、エージェント破棄時に巻き戻る。

| Reins | DSH API | 備考 |
|---|---|---|
| `static` バケット | `ctx.systemPrompt.section({ name: 'reins:static', order: 10, text: (ac) => plan(ac).system('static') })` | DSH 慣例：-100 identity、0 persona、100–199 tool guidance。Reins は persona の後・tool guidance の前 |
| `session` バケット | `section({ name: 'reins:session', order: 20, text })` | |
| `turn` バケット、`at`/`when` 付きノード | `ctx.systemPrompt.context({ name: 'reins:turn', order: 10, text })` | `PromptContext` は DSH が変化時のみログへスナップショットする cache-safe な経路 |
| `tools: 'allowlist'` | `ctx.tools.restrict()`（scope 内） | 提示・検索・実行の 3 面が揃う |
| enforced rule、Grant 外の操作 | `ctx.tools.guard()`（単調拒否）＋ `tools/pre-execute` | 拒否時に Reins ログへ `cap/denied` |
| ハーネスへの書き込み禁止（I-CAP-2） | `ctx.tools.guard()` で harness Mount の locator 配下への書き込み系ツールを常に拒否 | `fs/*` イベントでも拒否 |
| session_* ツール | `ctx.tools.register()`（`defineTool`） | `spawn` 権限が無ければ登録しない |

| Additional mapping | DSH behavior |
|---|---|
| skill | Names/descriptions under `## Skills` in reins:static; `skill_load {name}` returns the body through a logged DSH tool result (D-031). |
| task | First entry in reins:turn, compiled with SPEC §5.8. Ordinary user messages remain human-authored; only reins run with profile reins-headless sends an initial compiled task message (D-031). |
| budget usage | Read assistant/message usage and append budget/charged; an over-budget agent/request waterfall rejects without next() and stops the turn (D-039). |
| wallclock | Measure from mount, interrupt on excess, and stop after 30 seconds (D-039). |

**Plan preparation and caching:** before a model request, run asynchronous ensurePlan(). If elaborate returns suspended, fetch missing refs in parallel, store successful bodies in `$REINS_HOME/cas/<digest>`, record content/fetched, rebuild external from content events/CAS, and retry (D-024). At the suspenseTimeoutMs deadline (default 10000), or on fetch failure, record content/unavailable and resolve the specified placeholder. Affected nodes are degraded with reason `content-unavailable:<ref>`. Requests MUST wait for done; synchronous text providers use only the completed plan.

Memoize by (tree.digest, taskState digest). ETree.digest excludes logSeq and includes the used external-content digest (D-025). Record render/committed only when plan digest changes, and include cacheBreak indicating whether the system portion changed (D-032). Section order is Rules → Instructions → Knowledge → Skills → Conditional → raw (D-031).

## 4. DSH ログの橋渡し

One DSH root session owns one Run. `$REINS_HOME/runs/index.json` maps DSH session IDs to RunIds; resume appends to the existing Run. A fork records RunSpec.forkedFrom `{run, seq}`, and each mounted child owns a Run with parent `{run, session}` (D-036).

`session/event` を購読し、Reins ログへ写す（本文は重複保存しない）：

| DSH セッションイベント | Reins ログ |
|---|---|
| `turn/start` | `turn/start {external}`（TaskState の `eventsThisTurn` をリセットする境界） |
| `tool/result`（fs 系ツール、read/write） | `ws/touched {paths, op}` |
| `tool/result`（bash 系、argv が `testCommandPatterns` に一致し exit≠0） | `reins/test-failed`（拡張イベント）|
| `agent/request`（waterfall、観察のみで `next()` を呼ぶ） | `model/request {host, bytes, external: {system:'dsh', session, seqFrom, seqTo}}` |

The model/request bridge is an observation listener that calls next(). The separate budget-enforcement waterfall may reject without next() when limits are exceeded (D-039).

`LogEventMap` 拡張：`'reins/test-failed': { argv: string[]; exit: number; excerpt: string }`。

「モデル可視 ⇒ 記録済み」は DSH 自身の実行時不変条件として既に存在する。Reins はそれを前提に I-LOG-2 を満たす（自前で本文を二重保存しない）。

## 5. セッション（§11）の DSH 写像

| runtime.kind | 第一候補 | フォールバック |
|---|---|---|
| `dsh` | `ctx.subagents` の `spawn-in-process` プロバイダ（continuable）。子 agent の scope に動的ホスト `dsh` を登録 | — |
| `claude-code` | `ctx.subagents` の `claude-code` プロバイダ | Reins 自前の構造化アダプタ（ヘッドレス JSON 出力モード）、さらに tmux |
| `codex` | `ctx.subagents` の `codex` プロバイダ | 同上 |
| その他 ACP 対応 | `acp` プロバイダ | tmux |
| `interactive: true` | 常に tmux（人間が attach するため） | — |

第一候補の採用条件（M0 スパイク S-6 で全て確認できた場合のみ）：
1. 子の作業ディレクトリを Reins が作った worktree に指定できる。
2. 子 CLI がそのディレクトリの生成済み CLAUDE.md / AGENTS.md / skills を読む。
3. follow-up（`followup`）、`interrupt`、終了通知（`subagent-settled`）が使える。
4. 子の使用量（tokens / cost）が観測できる（できなければ budget は advisory と記録）。

いずれかが欠ければフォールバックを使い、その事実を DECISIONS.md に記録する。DSH の子レポート（`subagent-report`、`relay` 形式）と終了通知は、そのまま `context trust:'relay'` として親の木へ入れる。

**深さ**：DSH の `SessionHeader.delegationDepth` と Reins の `Budget.maxDepth` の小さい方を実効値とする。

## 6. 権限境界の注意

Cordis の scope は依存とライフサイクルの単位であり、セキュリティ境界ではない。DSH の agent preset で `isolate` realm を使っても、それは権限判定の代わりにならない。Reins の権限判定は常に `permits()` と guard を通す（I-CAP-5）。

## 7. mise

開発リポジトリ直下の `mise.toml`（MUST）：

```toml
[tools]
node = "22"
pnpm = "10"
tmux = "latest"          # M5 以降。M0 で版を固定する
"npm:@deepseek-ai/dsh" = "<M0 で固定>"
"npm:@anthropic-ai/claude-code" = "<M0 で固定>"
"npm:@openai/codex" = "<M0 で固定>"

[tasks.build]       run = "pnpm -r build"
[tasks.test]        run = "pnpm -r test"
[tasks.invariants]  run = "pnpm -r test -- --testNamePattern '^I-'"
[tasks.contracts]   run = "pnpm --filter dsh-contracts test"
[tasks."dsh:candidate"] run = "node scripts/dsh-candidate.mjs"   # 引数: 新しい版
[tasks.lint]        run = "pnpm -r lint"
```

`mise.lock` をコミットする。ハーネスパッケージ側の `mise.toml` / `mise.lock` は SPEC §12.4。

## 8. 上流追随とパッチ方針

### 8.1 固定
`upstream/dsh.json`：`{ "package": "@deepseek-ai/dsh", "version": "x.y.z", "commit": "<sha>" }`。

### 8.2 依存面（contract tests）
`contracts/dsh/` に、Reins が依存する DSH の振る舞いだけを検査するテストを置く（MUST）。1 API 1 ファイル以上：

| contract | 検査内容 |
|---|---|
| `system-prompt.section.order` | order による連結順、scope 内 shadowing、disposer で消える |
| `system-prompt.context.snapshot` | context の変化時のみログにスナップショットされる |
| `tools.restrict` | 制限したツールが提示からも実行からも消える |
| `tools.guard` | 単調拒否、後続 waterfall で覆らない |
| `tools.pre-execute` | deny 決定の型 |
| `agent.request.observe` | 観察 listener が `next()` で透過 |
| `agent.request.budget` | Usage charges propagate to ancestors; over-budget requests are rejected without next() (D-039). |
| `session.event.stream` | `turn/start` `tool/result` の到着と順序 |
| `subagents.continuable` | startContinuable / followup / interrupt / settled 通知（S-6 で第一候補採用時のみ） |
| `scope.not-security` | 文書化された前提の回帰検知（scope 外からの呼び出しが技術的に可能であることを確認し、Reins が guard に依存していることを示す） |

### 8.3 パッチ
- 原則ゼロ。DSH は「拡張は plugin を横に載せる」設計であり、まず拡張点を探す（MUST）。
- やむを得ない場合のみ `patches/dsh/NNNN-<slug>.patch` と同名 `.md` を置く。`.md` の必須項目：目的、なぜ拡張点で足りないか、上流 issue/PR URL、削除条件、カバーする contract test 名。DECISIONS.md への記録も必須。
- パッチは pnpm の `patchedDependencies` で適用し、`Lockfile.dsh.patches` にパッチ集合の digest を入れる。

### 8.4 更新手順（`mise run dsh:candidate <version>`）
1. 一時 worktree に新版を入れ、パッチを `--3way` で当てる（失敗したら停止して報告）。
2. `mise run contracts` → `mise run test` → e2e。
3. 全通過なら `upstream/dsh.json` と lock を更新する PR を作る。失敗した contract は差分レポートに列挙する。
4. 上流に同等の拡張点が入ったら、対応パッチを削除する PR を同時に作る。

---

## 出典
- DSH architecture（profiles/bundles、core packages、events、turn flow、session log、where new behavior goes）：https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md
- System prompt assembly（`PromptSection`、`PromptContext`、`ctx.systemPrompt` API）：https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/system-prompt.md
- Subagent seam（`ctx.subagents`、providers `-codex` `-claude-code` `-acp`、continuable children）：https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/subagent.md
- Extension cookbook（AGENTS.md の扱い、hooks、skills、tools.guard）：https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/extension-cookbook.md
- Cordis scope はセキュリティ境界ではないという指摘：https://dev.to/da_sein_dffa21a60a5fd492f/deepseek-harness-3-everything-is-a-plugin-now-what-356f
