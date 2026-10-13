# DECISIONS 第4バッチ（D-069〜D-092）— 監査 A-001〜A-022 への回答

**types.ts は同梱の完成版で丸ごと置き換える**（本バッチの型変更をすべて反映済み）。`tsc --strict`、同梱 `checks/`（batch 4 の検査を追加済み）が通ることを確認済み。
あなたが追加した checks（digest-examples / dsh-examples / host-reconcile-example など）は、新しい types.ts に合わせて**期待どおり通るように更新**すること（toJson の経由、CommitReceipt の kind など）。検査を弱めることは禁止。

| 監査 | 決定 |
|---|---|
| A-001 | D-069 |
| A-002 | D-070 |
| A-003 | D-071 |
| A-004 | D-073 |
| A-005 | D-072 |
| A-006 | D-087 |
| A-007 | D-075 |
| A-008 | D-078 |
| A-009 | D-074 |
| A-010 | D-088 |
| A-011 | D-089 |
| A-012 | D-076 |
| A-013 | D-077 |
| A-014 | D-082 |
| A-015 | D-079 |
| A-016 | D-080 |
| A-017 | D-081 |
| A-018 | D-091（＋D-083） |
| A-019 | D-084 |
| A-020 | D-086 |
| A-021 | D-085 |
| A-022 | D-090 |

---

### D-069 欠番
D-052・D-054・D-056 は**意図的な欠番**とする。DECISIONS.md に「欠番（使用しない）」として 3 行を記録する。今後も番号は再利用しない。

### D-070 CommitReceipt を静的・動的で区別する
- `CommitReceipt = { kind: 'static', record, written, removed, skippedDrift } | { kind: 'dynamic', plan, changed }` とする。
- SPEC §7.2 のホスト調停アルゴリズムは**静的ホスト専用**と明記する。動的ホストは D-062 に従う。

### D-071 生成物の削除はドリフト
- 所有している target が observe で `null` になった場合は、ドリフトとする。`drift/detected.observed` は `Digest | null` を取る。
- `reins render` はそのファイルを復元しない（I-HOST-2）。`reins status` には「deleted」と表示する。
- 自動の Proposal は作らない。人間の選択肢は次の 2 つだけである。
  - (a) `reins render --force --target <path>` で復元する。
  - (b) ハーネスを編集して、その target を生まないようにする（例：`hosts` の制限）。
- (b) の後に render すると、その target は plan から消える。last にあって observed が null、plan が null の target は、CommitRecord から黙って取り除く。

### D-072 ホスト設定を plan の入力に含める
- `HostConfig { id: HostId; settings: { [k]: Json } }` を導入する。`dedupeWith`、codex の `instructions` など、出力を変える設定はすべてここに入れる。
- `settings` は正規化する（既定値のキーは省略し、キーは canonicalJson の順に並べる）。
- `PlanContext.hostConfig` を必須にする。`RenderPlan.digest` は `{host, hostConfig, tree, taskState, outputs}` の digest とする。
- memo のキーは `(tree.digest, taskState digest, hostConfig digest)` とする。
- `Lockfile.hosts` と `RunSpec.hosts` は HostConfig を持つ。これで replay が設定込みで再現できる。

### D-073 version と snapshot の同一性
- version は常に sha256 の `Digest` とする。
  - `git-worktree` の snapshot は `digestJson({ kind: 'git', head: <commit>, diff: digestBytes(git diff --binary HEAD), untracked: { path: digestBytes } })` で求める（除外規則は D-090）。
  - `fs` の snapshot は Merkle digest で求める。
  - Pin の `git:` 形式は参照の記法にすぎず、version の形式ではない。
- `Resolved.version` の意味は次の通り。
  - 可変の Mount（workspace）では `Mount.base`（Run 開始時に固定）を返す。
  - 不変の Mount（harness、pin 済みの context）では内容の digest を返す。
  - これで I-REF-1 は書き込みの後も成り立つ。
- 実行中の内容の変化は、`ws/snapshot` / `ws/touched` イベントでのみ表現する（I-REF-2 の文言どおり）。

### D-074 セッション操作の相関 ID と結果イベント
- `session/intent` に `opId`（ULID）を付ける。
- send の場合は、送信前に `session/sent {opId, text}`（ペイロードの記録であり、結果ではない）を書き、送信後に `session/op-result {opId, outcome: 'delivered' | 'failed'}` を書く。
- interrupt / stop / detach / mount も、それぞれ同じ opId で `session/op-result` を書く。
- **結果イベントは `op-result` だけである。** op-result の無い intent を回復するときは `outcome: 'unknown'` を記録して人間に通知し、自動では再送しない（D-038 を置き換え、明確にする）。

### D-075 GlobalNodeId の文法
- `<pkg>#<domain><local>`
  - domain：外側の `session` ポータルごとに `@<key>/` が連なる。各 session の子孫が、それぞれ id の一意性ドメインになる。
  - local：明示 id ならその `NodeId`。匿名なら `~` に続けて、ドメインの根からの**全オーサリングノード（コンポーネントを含む）を通る構造的な子インデックス列**（例 `~0.3.1`）。
- 構造パスは木の形から一意に決まるので、衝突しない。
- I-ELAB-3 の一意性の範囲は「(パッケージ, ドメイン)」とする。同じプロファイルから 2 つの子を作っても、キーが違えば衝突しない。同じドメインの中で、明示 id を持つコンポーネントを 2 回使った場合は、従来どおり `ID_DUPLICATE` とする（作者が id を props で受け取って区別する）。

### D-076 `touches` の時間窓
- `Predicate.touches.window`（既定 `'recent'`）を追加する。
  - `'turn'`：現在のターンで触れたもの（`touchedThisTurn`）
  - `'recent'`：現在のターンと直前のターン（`touchedThisTurn ∪ touchedPrevTurn`）
  - `'session'`：累積（`touched`）
- TaskState に `touchedThisTurn` と `touchedPrevTurn` を追加する（`turn/start` で前者を後者へ移す）。
- M3 の受け入れ基準 2 を書き換える：ターン 2 で `src/auth/x.ts` を読む → ターン 3 の要求に auth のノードがある → ターン 3 と 4 で auth に触れなければ、ターン 4 の要求には無い。

### D-077 onUnsupported の総則
- `ENode.effective.onUnsupported` は、作者が指定または継承した値だけを持つ（任意項目）。実効方針はホストが plan 時に、次の順で決める。
  1. ノード自身の指定
  2. 最も近い scope の指定
  3. D-027 の表（D-048 の session を含む）
  4. それ以外は `drop`
- ホストが `prose` で実現できる種別は「対応している」とみなし、onUnsupported を参照しない。
- elaborate はホスト能力に依存しない（I-ELAB-2）。

### D-078 外部内容の依存をノード単位で追跡する（汚染の伝播）
- `ENode.deps: { ref, status: 'ok' | 'unavailable' }[]` を必須にする。
- ノードの deps には、次の 2 つを含める。
  - そのノード自身の Content `ref` の解決結果
  - `via` 上の各 ComponentCall が render 中にフックで読んだ ref
- つまり、あるコンポーネント呼び出しが読んだ内容は、その呼び出しが生んだ全ての子孫ノードへ伝播させる（props 経由の流れも、保守的に覆うため）。
- ホストは、deps に `unavailable` を含むノードを `degraded`（理由 `content-unavailable:<ref>`）とする。マーカー文字列の検索で判定してはならない。

### D-079 秘密情報の論理参照と受け渡し
- スキーム `secret://<store>/<NAME>` を導入する。store は当面 `env`（ドライバプロセスの環境変数）だけである。権利は `read`。
- `McpServerSpec.env` の `${secret:NAME}` は `secret://env/NAME` を意味する。生成ファイルには D-034 のとおり参照構文だけを書く。
- 子への受け渡しは次の通り。
  - `SessionEl.env` またはプロファイルの `env` で `{ VAR: 'secret://env/NAME' }` を宣言する。
  - mount 時に、実効 caps に read があるかを `permits` で確認する。無ければ `CAP_DENIED` とする。
  - 値はセッションホストが起動直前に store から読む。`MountRequest.env` は名前と参照だけを持つ。
  - **値はログ・CAS・ファイルに出さない。**
- 子の環境は、既定で次の許可リストだけを引き継ぐ：`PATH HOME LANG LC_* TERM TMPDIR` と mise の変数（`MISE_*`）。

### D-080 受け入れチェックの判定
- **command**：`timeoutMs` の既定は 600000 とする。超過は `timeout` で、不合格として扱う。
- **human**：`reins session check <key> <index> pass|fail [--note]`（human principal のみ）で `check/decided` を記録する。未判定のものは `pending` とする。
- `SessionResult.accepted` の値は次の通り。
  - `true`：全て passed
  - `false`：いずれかが failed または timeout
  - `null`：失敗は無いが pending がある
- 子の relay テキストを判定の根拠にしてはならない。
- `result()` は、子が終了し、command と anchor の判定が出た時点で返す（pending を待たない）。

### D-081 葉要素の children を禁止する
- `ContainerKind = 'scope' | 'session'` だけが children を取る。
- 葉要素では、`IntrinsicProps` の `children?: never` と、`h` のオーバーロード（葉は rest 引数を取らない）で型の段階で拒否する。
- 実行時（frontmatter や `toJson` を経由した生データ）は `INVALID_ELEMENT` とする。未知の kind も同じエラーにする。

### D-082 プロファイルの runtime 選択
- プロファイルは `runtimes: { [kind]: RuntimeSpec }` と `defaultRuntime` を持つ。
- `session_spawn` の任意引数 `runtime` は、`runtimes` のキーのいずれかでなければならない。それ以外は `INVALID_ELEMENT` とする。
- model・tool・args はプロファイルの RuntimeSpec をそのまま使い、LLM からは指定できない。
- `session_spawn` のツールスキーマは `additionalProperties: false` とする。
- `mise exec` で起動できない場合は `RUNTIME_UNAVAILABLE` とし、session は `failed` とする。

### D-083 プラグインイベントの名前
- ログの writer は、組み込みの kind 以外で `<plugin>/<name>` の形（`^[a-z][a-z0-9-]*/[a-z][a-z0-9-/]*$`、かつ組み込みの接頭辞 `run/ ws/ turn/ task/ render/ content/ harness/ model/ drift/ anchor/ proposal/ session/ check/ cap/ budget/` 以外）でない kind を、`EVENT_KIND_INVALID` で拒否する。

### D-084 純粋性 lint は到達可能なモジュール全体に適用する
- esbuild の metafile で、entry から到達する全モジュールを列挙する。モジュールを評価する**前に**、トップレベルの初期化コードを含めて lint する。
- トップレベルで許すのは、import / export、関数宣言・クラス宣言、純粋なリテラルの const だけとする。
- import してよいのは `@reins/core`、他のハーネスパッケージ（`use()` 経由）、`manifest.pureDependencies` だけとする。後者は信頼された依存として扱い、lint しない。

### D-085 型から Json への変換の境界
- KernelApi に `toJson(v: unknown): Json` を追加する。対応するのはプレーンオブジェクト・配列・有限数・文字列・真偽値・null で、`undefined` のプロパティは除去する。それ以外の値は `NOT_JSON` とする。
- 仕様のコード例の digest 式は、すべて `digestJson(toJson(x))` と書く。キャストは禁止する。

### D-086 取り込みから所有への移行（adoption）
- `reins import` は、取り込んだ後にメモリ上で plan を作る。各ファイルの出力が現状と一致する（ヘッダ行を除き、I-HOST-4 の正規化に従う）場合に限り、human principal の確認（`--adopt`、または対話での y）を得て `render/adopted` を記録し、現状の digest で CommitRecord を作る。
- その後の `reins render` は、所有者としてヘッダ行を追加する書き込みを行う。
- 一致しないファイル（lossy）と、取り込み対象外の非所有ファイルは、従来どおり `TARGET_OCCUPIED` とする。
- I-HOST-1 に「所有は commit または adoption によってのみ得られる」を追記する。

### D-087 hello の enforced rule は downgrade を明示する
- SPEC §6.1 の `no-raw-sql` に `onUnsupported="downgrade"` を付ける。
- M2 の golden では、claude-code の会計は `rendered`（settings.json の deny）、agents-md と codex の会計は `degraded` とする。正直な会計のデモを兼ねる。

### D-088 golden テストの契約
- **ETree の golden**：`{ package: { name }, root }` だけを保存する。digest・namespace・lock・external は保存しない。root 内の gid と deps は、そのまま比較する。
- **出力ファイルの golden**：決定的なフィクスチャ `fixtureNamespace(name)` を使う。
  - resolver は `memfs`
  - root は `/fixture/<name>`
  - base は `sha256:` + 0 を 64 個
  - この条件で完全一致を要求する。
- `useNamespace()` を使うコンポーネントは、専用のテストで扱う（D-051 を置き換える）。

### D-089 Trial の比較キー
- `TrialKey = digestJson(toJson({ task id, workspace の Mount.base 一覧, model, seed, toolchain(mise.lock digest + dsh version/patches), principal caps, hosts }))` とする。
- 比較できるのは TrialKey が一致する Trial だけである。harness の digest、harness の Mount の config と base、harness 依存の lock エントリ、namespace id、RunSpec.parent は異なってよい。
- I-EVO-2 をこの形で書き換える。一般の Run 比較キー（SPEC §12.3、seed を除く）とは別物として明記する。

### D-090 snapshot の除外規則（統一）
- workspace の snapshot から除外するのは、次の 4 つだけとする。
  - (1) `.git/`
  - (2) その workspace の全ホストの CommitRecord の targets（生成物）
  - (3) `node_modules/`
  - (4) `git-worktree` の場合は `.gitignore` の対象
- それ以外の全てのファイルを含める。SPEC §4.2 の表の誤記を直し、OQ-05 を解決済み（D-090）にする。
- テストでは、ソースを変えると snapshot が変わり、生成物を変えても snapshot が変わらないことを確かめる。

### D-091 MUST の未カバー分に受け入れ基準を追加する（A-018）
次を INVARIANTS / MILESTONES に追加する。

**新しい不変条件**
- **I-SEC-1**：ダミーの秘密値（`REINS_TEST_SECRET_<乱数>`）が、生成ファイル・`$REINS_HOME` 配下（ログ・CAS・state）・テストの出力のどこにも現れない。（e2e。全ファイルを走査する）
- **I-HOST-6**：書き込みは原子的である。一時ファイルへの書き込みと rename の間に注入した障害の後も、target は旧内容か新内容のどちらかである。（E）
- **I-HOST-7**：同じ workspace への同時 render は直列化される。注入したクロックで 30 秒を超えたら `LOCKED`。（E）
- **I-SESS-6**：op-result の無い send は、回復の後も再送されない。（E）

**M1 に追加**
- JSX と `h()` の振る舞いが等価であること（同じ ETree になる。property test）
- `session` の key が実行時に props へ戻されること
- 再入の深さ 256 で `ELAB_CYCLE` になること
- `ComponentCall.render` を elaborate の外から呼ぶと `ELAB_HOOK_OUTSIDE_RENDER` になること
- `EVENT_KIND_INVALID`
- `INVALID_ELEMENT`（未知の kind、葉要素の children）
- トップレベル初期化コードの lint（D-084）
- DSH 依存境界の lint：core と静的ホストに `@deepseek-ai/*` を import するフィクスチャが lint で失敗すること
- テスト環境の封鎖：vitest の setup で `fetch` / `net.connect` を例外にし、`HOME` と `REINS_HOME` を一時ディレクトリにする。一時ディレクトリの外への書き込みを検出したら失敗にする

**M2 に追加**
- hypothesis の見出しの golden
- I-HOST-6、I-HOST-7
- D-071（削除ドリフト）
- D-086（adoption。lossy の場合は拒否されること）
- I-SEC-1 の静的ホスト分（`${NAME}` 参照だけが書かれること、`secret-unsupported` で drop されること）

**M3 に追加**
- suspension（並列取得、注入クロックによるタイムアウト、CAS からの再構成、deps による degraded）
- static 部分を Run 中に変更したときに `cacheBreak: true` になること
- spawn 権限が無いときに session_* ツールが提示されないこと

**M4 に追加**
- command アンカーが実ワークスペースを変えないこと（書き込むコマンドで確認する）
- 一時 worktree が削除されること
- 1 GiB を超える場合（注入したサイズ）に `unverifiable` になること
- `DIRTY_PACKAGE`
- 適用コミットのメッセージ

**M5 に追加**
- I-SESS-6
- mise を経由すること（argv を記録する偽の `mise` を PATH の先頭に置いて確認する）
- `session_spawn` が余分な引数や任意の harness・caps を拒否すること
- D-079（read 権のある秘密だけが子の環境に入ること）
- D-080（human check の pending と決定、command のタイムアウト）

### D-092 作業ゲートの変更（プロセス）
- 仕様の監査はここで打ち切り、本バッチを反映した後に **M0 を開始する**。
- 以後、実装中に見つかった仕様の問題は、次のように扱う。
  - **自分で決めて進めてよいもの**：法則（SPEC §3）・不変条件・types.ts の公開型のいずれにも触れないもの。DECISIONS.md に `D-NNN (agent)` として記録し、マイルストーンの報告の「新しい決定」に列挙する。
  - **止めて報告するもの**：法則や不変条件に抵触するもの、公開型の変更が必要なもの。複数ある場合は全数をまとめて報告する。
- AGENT_BRIEF §2 の表に、この 2 行を追加する。
