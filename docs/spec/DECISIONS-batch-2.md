# DECISIONS 第2バッチ（D-024〜D-041）

報告された「外部コンテンツ待ち」の穴と、仕様の総点検で見つかった穴をまとめて埋める。
各項目は **決定 / 理由 / 変更するファイル** の順。全項目を反映し、DECISIONS.md に追記して 1 コミットにすること。
適用順は番号順。types.ts の変更は最後にまとめて `tsc --strict` を通すこと。

---

## A. 外部コンテンツと純粋性

### D-024 外部コンテンツは「ログの入力」とする（報告された穴への回答）
- 外部内容の取得結果はログイベントとして記録し、elaborate の入力にする。
  - `content/fetched { ref: RefString; digest: Digest }`。本文は `$REINS_HOME/cas/<digest>` に content-addressed で保存する。
  - `content/unavailable { ref: RefString; reason: 'timeout' | 'not-found' | 'denied' | 'error'; detail?: string }`
- `ElaborateInput.external` は、ドライバがログの content イベントと CAS から組み立てる。コンポーネントからは今まで通り見えない。
- **モデル要求は suspended の木から作らない（MUST）。** 提案された「done まで保留」を採用する。ただし上限を設ける。
  1. 動的ホストはモデル要求の前に `ensurePlan()` を呼ぶ。`elaborate` が suspended なら欠落 ref を並列に取得して再試行し、done になるまで繰り返す。
  2. 上限は `suspenseTimeoutMs`（既定 10000）。超過または取得失敗した ref には `content/unavailable` を記録する。
  3. unavailable の ref はプレースホルダ `[reins: content unavailable: <ref> (<reason>)]` に解決する。このプレースホルダを使ったノードは会計上 `degraded`（理由 `content-unavailable:<ref>`）とする。
  4. これで elaborate は必ず done になり、会計が常に成立する。プレースホルダもログ由来なので純粋性は保たれる。
- **空文字で描画する旧規定（DSH_INTEGRATION §3）は削除する。**
- 静的ホスト（CLI）も同じ手順に従う。CLI の `reins render` は `--suspense-timeout` を受け付ける。
- 変更：SPEC §6.2 手順 2、§10、DSH_INTEGRATION §3、types.ts（LogEventMap に 2 イベント追加）、INVARIANTS I-ELAB-1（入力に「content イベント」を明記）。

### D-025 ETree の digest は logSeq を含めない
- `ETree.digest` = `digestJson({package, lock, namespace, external, root})`。`logSeq` はメタデータとして持つが、digest には入れない。
- ETree に `external: Digest`（使った外部内容の `{ref: digest}` 写像の digest）を追加する。
- 理由：状態が変わらないターンでは digest が変わらないようにする。そうすれば plan の memo が当たり、`render/committed` もログに積み上がらない。
- 動的ホストは plan digest が前回から変わったときだけ `render/committed` を記録する（MUST）。
- 変更：types.ts の ETree、SPEC §6.2 手順 5、DSH_INTEGRATION §3。

### D-026 ハーネスの差し替えはログイベントにする（ホットリロード）
- Run 中に人間がハーネスを編集した場合、自動では反映しない（I-REF-2）。
- `reins reload`（CLI）または DSH コマンド `/reins-reload` を実行すると、`harness/switched { digest; lock: Digest }` を記録する。elaborate は「最後の `harness/switched`、無ければ `run/start` の harness」を使う。
- 理由：ライブ更新を許しつつ、どの版で何をしたかをログから復元できるようにする。
- 変更：types.ts（イベント追加）、SPEC §12.3、§14（reload コマンド追加）。

---

## B. レンダリングの未定義部分

### D-027 onUnsupported の既定値表
作者が明示しない場合、ホストは次の既定に従う（MUST）：

| 状況 | 既定 |
|---|---|
| `enforced` rule で、ホストに guard 実現手段が無い | `error` |
| `context` / `turn` 揮発ノード（静的ホスト） | `drop` |
| `task`（静的ホスト） | `drop` |
| `tool` mcp で、ホストに MCP 設定先が無い | `drop` |
| `tool` native で、ホストがその名前を知らない | `drop` |
| `scope tools:'allowlist'` で、ホストに制限手段が無い | `downgrade`（散文「Use only these tools: …」） |
| `skill` で、ホストに skills ディレクトリが無い | `downgrade`（`## Skills` 節に名前・説明・本文を描画） |

- 変更：SPEC §7.3 に表を追加。`ENode.effective.onUnsupported` は「作者指定 or 表の既定」で解決済みの値とする。

### D-028 セッション配下ノードの会計 `delegated`
- `AccountStatus` に `'delegated'` を追加する。親ホストは `session` ノードの子孫を `delegated`（理由 `session:<key>`）として会計し、子のホストがそれらを完全に会計する。
- I-RENDER-2 の「ちょうど 1 回」は 1 つの plan の中での話であり、木全体ではない、と明記する。
- 変更：types.ts、INVARIANTS I-RENDER-2、SPEC §7.3。

### D-029 子セッションの木の評価規則
- `session.children` は親の elaborate で展開する。JS の条件分岐は親の状態で評価される。
- データの Predicate（`when`）と `at` は、**子のホストが子の TaskState で評価する**。動的な子（`dsh`）なら子のログから作った TaskState、静的な子なら静的射影を使う。
- 理由：データ Predicate なら評価場所を後から選べる。子ごとの動的条件は `when` で書く。
- 変更：SPEC §11.3 手順 3、§6.4。

### D-030 静的ホストのネスト判定を厳密化
- pattern の固定接頭辞ディレクトリを D とする。
  - 残り部分がちょうど `**` なら、D の指示ファイルに通常描画する。
  - それ以外（例 `src/auth/*.ts`）なら、D の指示ファイルの Conditional 節に `touches(<pattern>)` として描画する。
  - D が空なら、ルートファイルの Conditional 節に描画する。
- 対象ワークスペース（`PlanContext.workspaceAuthority`）以外の authority を指す `at` は、`filtered`（理由 `at:other-workspace`）とする。
- 変更：SPEC §7.4。

### D-031 動的ホストでの skill と task
- **skill**：`reins:static` 節に `## Skills` として名前と説明だけを載せる。本文はツール `skill_load { name }` の結果として返す（DSH のツール結果としてログに残る）。
- **task**：`reins:turn` 文脈の先頭に、§5.8 の書式で `# Task` として描画する。トップレベルのユーザ発話は人間が書くので、Reins はユーザメッセージを作らない。例外は `reins run --task <file> --profile reins-headless` で、このときだけコンパイルしたタスクを最初のユーザメッセージとして送る。
- 動的ホストの節内の並び順は、静的ホストと同じ（Rules → Instructions → Knowledge → Skills → Conditional → raw）。
- 変更：SPEC §7.6、§14（`reins run`）、DSH_INTEGRATION §3。

### D-032 揮発度は「配置の契約」であり、凍結ではない
- `static` / `session` ノードが Run の途中で変わっても構わない。その場合も新しい内容を使う。
- その結果、system 部分が変わったときは `render/committed` に `cacheBreak: true` を付けて記録する。
- I-RENDER-4 は従来どおり「turn ノードだけが変わったなら system 部分は不変」を要求する。
- 変更：types.ts（`render/committed` に `cacheBreak: boolean` を追加）、SPEC §7.3。

### D-033 AGENTS.md と CLAUDE.md の二重読み込み回避
- 同じワークスペースで `agents-md` と `claude-code` を同時に描画する場合の扱いは次の通り。
  - S-2 で、Claude Code が `@path` のインポート構文を CLAUDE.md で解釈すると確認できた場合、claude-code ホストは各 CLAUDE.md を次の形で出す。
    - 先頭：`@AGENTS.md`（同じディレクトリのもの）
    - 続き：`hosts` に `claude-code` だけを持つノード
  - 確認できない場合は、両方に全内容を出す（現行通り）。
- 判定はホストの設定 `dedupeWith: 'agents-md' | null` で行う。既定は、両ホストが同時に選ばれたら `'agents-md'`。
- 変更：SPEC §7.5、OQ-01 に追記。

---

## C. 秘密情報・設定ファイル・取り込み

### D-034 秘密は値を書かず、参照構文だけを書く（既存規定の矛盾を修正）
- SPEC §5.6 の「commit 時に環境から解決する」は、生成ファイルに秘密を書くことになり、AGENT_BRIEF の禁止事項 9 と矛盾する。**この規定は削除する。**
- 新しい規定：
  - ホストは、出力先の形式が対応している環境変数参照構文に `${secret:NAME}` を変換して書く（例：`.mcp.json` の `${NAME}`）。
  - 対応構文が無い出力先では、そのツールを `dropped`（理由 `secret-unsupported`）とする。
  - **秘密の値はいかなるファイル・ログにも書かない（MUST NOT）。**
- S-2 と S-3 で各出力先の環境変数展開の有無を確認する。
- 変更：SPEC §5.6、§7.5、MILESTONES M0 S-2・S-3。

### D-035 設定ファイル（JSON/TOML）の取り込みと往復
- `reins import` は Markdown を `raw` として取り込む。設定ファイルは構造的に変換する。
  - MCP サーバ定義は `tool` に変換する。
  - `permissions.deny` で GuardSpec に写せるものは `rule enforced` に変換する。
  - 写せない項目がある場合は、一覧を出して失敗する。`--lossy` を付けると、写せない項目を捨てたことを報告して続行する。
- I-HOST-4 の往復一致は、Markdown についてはバイト一致（ヘッダ行と末尾改行を除く）、JSON/TOML については「パースした値の構造的一致」とする。
- 取り込みノードの id は `imported.<パスを slug 化>` とする。衝突したら `-2`、`-3` … を付ける。
- 変更：SPEC §14、INVARIANTS I-HOST-4。

---

## D. 実行・ログ・並行性

### D-036 Run の単位と親子関係
- 次の 4 つは、それぞれ 1 つの Run になる。
  - `reins render`、`check`、`import` の 1 回の実行（principal は human）
  - DSH のルートセッション 1 つ（`$REINS_HOME/runs/index.json` で DSH session id と RunId を対応付ける）
  - マウントされた子セッション 1 つ
  - 評価の Trial 1 つ
- 親子・分岐の関係は RunSpec に記録する：
  - `RunSpec.parent?: { run: RunId; session: SessionKey }`（子セッション）
  - `RunSpec.forkedFrom?: { run: RunId; seq: number }`（DSH セッションの fork）
- DSH セッションを resume した場合は、同じ Run のログに追記を続ける。
- 変更：types.ts（RunSpec）、SPEC §10・§12.3、DSH_INTEGRATION §4。

### D-037 同時実行のロック
- 同じワークスペースへの静的ホストのコミットは、`$REINS_HOME/state/<wsid>/lock` の排他ロックで直列化する。
- ロックの取得に 30 秒失敗したら、エラー `LOCKED` で終了する。
- 変更：types.ts（ReinsErrorCode に `'LOCKED'` を追加）、SPEC §7.2。

### D-038 クラッシュ回復の具体手順（I-LOG-3）
起動時、結果イベントの無い意図イベントを次のように処理する。

| 意図 | 回復 |
|---|---|
| `render/intent` | 再 observe する。plan と一致していれば `render/committed`（`recovered: true`）、不一致なら `render/failed` を記録し、CommitRecord は書き換えない |
| `session/intent` mount | `reattach` を試みる。成功すれば `session/mounted`、失敗すれば `session/status unknown` |
| `session/intent` send | 送信済みかどうかは判定できない。`session/status unknown` を記録して人間に通知し、**自動では再送しない** |

- 変更：SPEC §10、types.ts（`render/committed` に `recovered?: boolean` を追加）。

### D-039 予算の課金源と強制点
- **DSH 内**：`assistant/message` の usage から `budget/charged` を記録する。超過の判定は `agent/request` の waterfall で行い、超過時は `next()` を呼ばずに拒否してターンを止める。
- **外部ランタイム**：構造化アダプタが報告する usage、または PTY の判定器が画面から読み取った値で課金する。読めなければ `advisory` とする。
- **wallclock**：mount からの経過時間で判定する。超過したら interrupt し、30 秒後に stop する。
- 変更：SPEC §9.3、DSH_INTEGRATION §3。

### D-040 command アンカーは使い捨ての複製で実行する
- command アンカーはワークスペースを変更し得るので、実ワークスペースで実行しない（MUST NOT）。
  - git ワークスペース：評価する snapshot の commit から一時 worktree を作る。作業ツリーの差分を適用してから実行し、終了後に削除する。
  - 非 git ワークスペース：一時ディレクトリへ複製して実行する。対象が 1 GiB を超える場合は `unverifiable`（理由 `too-large`）とする。
- 変更：SPEC §8.3。

---

## E. セッションの起動経路

### D-041 LLM からの子起動は「セッションプロファイル」経由に限る
- エージェントが `session_spawn` で任意の子ハーネスを作ることは認めない。子のハーネスは、パッケージが事前に宣言したものから選ぶ。
  - `PackageManifest.sessionProfiles?: { [name: string]: { export: string; runtime: RuntimeSpec['kind'][]; caps: CapSet } }`。`export` は entry モジュールが export するコンポーネント名。
  - `session_spawn` の引数は `{ key, profile, workspace, task, interactive? }`。caps は `profile.caps` と、要求者の権限を attenuate した結果になる。
- `<RequestedSessions/>` は、root principal に `spawn` 権限がある場合、kernel が root の末尾に自動で付加する。作者が書き忘れて `session_spawn` が待ち続ける事態を防ぐ。
- 変更：types.ts（PackageManifest）、SPEC §11.2。

---

## F. 範囲の明記

- **対応 OS**：Linux と macOS のみとする（tmux と POSIX パスを前提にする）。Windows は非目標とし、SPEC §1.2 に追記する。
- **M0 について**：M0 の 6 スパイクは実ランタイムを使う。Claude Code・Codex の認証、DSH の LLM キーなど、必要な資格情報が無い場合は、該当スパイクを BLOCKED として報告し、ほかのスパイクを先に進める。
