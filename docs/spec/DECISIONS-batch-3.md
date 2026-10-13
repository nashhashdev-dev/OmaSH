# DECISIONS 第3バッチ（D-042〜D-068）

報告された「型付きコンポーネントの合成」への回答と、事前の総点検で検出した矛盾・未定義をまとめて埋める。
**types.ts は同梱の完成版で丸ごと置き換える**（D-018〜D-068 の型変更をすべて反映済み。`tsc --strict` と `checks/` の型整合検査が通ることを確認済み）。本文の変更だけ各ファイルへ反映すること。

---

## A. 型・オーサリング

### D-042 ブランド型は「ソフトブランド」にする
- `Brand<T,B> = T & { readonly [__brand]?: B }`。プレーンな文字列リテラル（`id="no-raw-sql"`、`at="workspace://…"`）を JSX や frontmatter にそのまま書ける。
- 妥当性は型ではなく、kernel の parse / validate 関数が実行時に保証する（ELAB での検証は §6.2 手順 4、ref は `parseRef`）。
- 理由：ハードブランドのままだと、SPEC §6.1 のあらゆる例が型エラーになる（次に報告されるはずだった矛盾）。

### D-043 ETree の root は合成 scope
- `ETree.root` は kind `scope`、gid `<pkg>#~root`、props なしの合成ノードとする。
- 会計（I-RENDER-2）の対象は「root と `scope` を除くすべての ENode」とする。scope 自体は描画されず、その効果は子孫の `filtered` 理由に現れる。
- 変更：INVARIANTS I-RENDER-2、SPEC §6.2 手順 5。

### D-044 Projection の型制約を外す
- `Projection<T>` と `useLog<T>`、`project<T>` から `T extends Json` を外す（interface である TaskState が Json を満たさず、組み込みの `reins/task-state` 自体が型エラーになるため）。
- JSON 直列化可能であることは、開発モードで実行時に検査する（MUST）。

### D-045 ComponentCall は型消去する（報告された矛盾への回答）
- `ComponentCall` を非ジェネリックにする：`{ kind: '$component'; name: string; pkg?: string; render: () => ReinsNode }`。
- props は生成時（`h(C, props)` / `use(pkg, props)`）にクロージャへ閉じ込める。これで、どの ComponentCall も ReinsNode に代入できる。
- パッケージ境界を越える props は JSON とする：`use(pkg: string, props?: Json)`、`LoadedPackage.entry: (props: Json) => ReinsNode`。
- `LoadedPackage.exports` を追加する（D-041 のセッションプロファイル用）。
- `h` はオーバーロードにする：`h(kind, IntrinsicProps<K>, ...children): Element` と `h(Component<P>, P): ComponentCall`。
- SPEC §6.2 手順 2 の `$component` の処理は「`via` に `name` を積み、`render()` を呼ぶ。`pkg` があれば現在パッケージを切り替える」に改める。

### D-046 JSX の型定義
- types.ts の `JsxNamespaceShape` のとおりに、`packages/core/src/jsx-runtime.ts` で `export namespace JSX` を宣言する。中身は Element / ElementType / IntrinsicElements / ElementChildrenAttribute。
- `jsx: "react-jsx"` では `key` が `jsx()` の第 3 引数として渡される。ランタイムは、`session` の場合にこれを props の `key` に戻さなければならない（MUST）。
- `ReinsNode` に `boolean` を含める（`true` も描画しない）。`{cond && <x/>}` を書けるようにするため。

### D-060 volatility の既定値
- volatility を明示しない場合は、最も近い scope の指定を継承する。どの scope も指定していなければ、`context` と `task` は `turn`、それ以外は `static` とする。

### D-061 プロンプト部分の名前
- `PromptPart.name` は `reins:static` / `reins:session` / `reins:turn` の 3 つに固定する。エージェントごとの区別は、ホストが登録する Cordis scope で行い、名前には含めない（DSH_INTEGRATION §3 と一致させる）。

---

## B. 描画・会計

### D-048 静的ホストでの session ノード
- 静的ホストでは `realizes.session = 'none'` とし、session ノードの既定は `drop`（理由 `session:static-host`）とする。その子孫は `delegated` として会計する。
- D-027 の表に 1 行追加する。セッションを mount するのは、セッション調停（`reins run` と DSH）だけである。

### D-059 静的ホストでの `when` は「条件付き描画」であり、filtered ではない
- 静的ホストは、`when` 付きのノードを Conditional 節に描画し、`rendered` として会計する。
- 動的ホストは TaskState で評価し、偽なら `filtered`（理由 `when:<describe>`）とする。
- SPEC §7.3 の filtered 理由の記述を、動的ホストに限定する。

### D-062 動的ホストの observe / commit
- 動的ホストの `observe` は空の targets を返す。`commit` は、memo の更新と `render/committed` の記録（plan digest が変わったときだけ、D-025）を行う。
- CommitRecord は作らない。ドリフトの概念も無い。

### D-063 取り込みの往復と重複排除の関係
- `reins import` は、取り込み元ファイルに応じて `hosts` を付ける。
  - CLAUDE.md 由来：`['claude-code']`
  - AGENTS.md 由来：`['agents-md','codex']`
- I-HOST-4 の往復テストは `dedupeWith: null` で実行する。D-033 の重複排除をしている状態では、往復一致は要求しない。

### D-064 同じ target を複数ホストが書く場合
- `agents-md` と `codex`（および `.agents/skills`）のように、同じ target を計画するホストが同時に選ばれたら、plan 全体を `TARGET_CONFLICT` で失敗させる。
- ただし codex ホストは設定 `instructions: 'own' | 'via-agents-md'` を持つ。既定は、agents-md が同時に選ばれていれば `via-agents-md` とし、その場合 AGENTS.md と skills を書かず、`.codex/` 配下だけを書く。

---

## C. セッション

### D-047 セッションキーの寿命
- `TaskState.requestedSessions` には、`session/unmounted` がまだ記録されていないキーだけを含める。
- 同じ Run の中で、一度 unmount されたキーを再び要求したら `KEY_REUSED` とする。
- セッション調停は、`session/requested` が追記された直後と、動的ホストが描画するたびに実行する。`session_spawn` の待ちは、この調停による `session/mounted` で解ける。

### D-049 DSH の子レポートと I-SESS-2
- I-SESS-2 を次のように改める。
  - 子由来の内容は、次のいずれかの relay 枠でのみ、親のモデル文脈に入る。
    - Reins の `context trust:'relay'`
    - DSH の relay 形式メッセージ（source kind が `subagent-report` / `subagent-settled`）
  - instruction / rule / knowledge には決してならない。
- DSH プロバイダ経由の子については、`<SessionDigest/>` は状態だけを描画し、出力本文は描画しない（DSH のメッセージとの二重表示を避ける）。

### D-058 セッションの受け入れチェックの実行場所
- `TaskSpec.acceptance` の command は、子のワークスペースで直接実行する（子は fork された使い捨ての作業場所なので）。
- 真偽調停のアンカー（D-040）とは扱いを分ける。`mode: 'share'` の子の場合だけは、D-040 と同じく複製の上で実行する。

---

## D. 権限・参照・ログ

### D-057 Mount の ceiling の適用点
- Run 開始時、principal の実効 caps を「principal の caps」と「各 Mount の ceiling から作った Grant `{ on: <scheme>://<authority>/**, rights: ceiling }` の和集合」の attenuate（strict = false）で求める。
- `permits()` は、この実効 caps に対してだけ判定する。

### D-065 I-REF-2 の例外を明記する
- I-REF-2 に次の一文を追加する：「ただし harness の束縛は `harness/switched`（D-026）によってのみ変わり得る。これはログに記録され、elaborate の入力となる」。

### D-066 ログの先頭
- seq 0 は必ず `run/start` とする。それ以外の Run ログは `LOG_CORRUPT` とする。

### D-067 ws/touched のパス変換
- DSH のツールが報告する絶対パスは、Namespace の locator を逆引きして `workspace://<authority>/<path>` に変換する。どの Mount にも属さないパスは記録しない。

### D-068 final split の封印
- final split のタスクと結果は `$REINS_HOME/sealed/<taskset>/` に置く。evolver の Run の Namespace には含めない。
- そのパスへの読み取りは guard で拒否し、`SPLIT_LEAK` とする。ファイルとして読める状態で放置しない。

---

## E. 提案・テスト

### D-050 提案の適用と git
- パッケージのルートが git リポジトリの場合、提案の適用は `reins: apply proposal <id>` というコミットを作る。
- 作業ツリーに未コミットの変更があれば `DIRTY_PACKAGE` で失敗する。
- evolver が書けるのは `$REINS_HOME/candidates/<id>/` の複製だけで、正本には書けない。

### D-051 golden テストの決定性
- ETree の golden は、`normalizeForGolden()` で Namespace の id、Mount の config 内の絶対パス、`base` を `<NS>` `<PATH>` `<BASE>` に置き換えてから比較する。
- 描画されたファイルの golden は完全一致で比較する（ファイル内容は Namespace に依存しないため）。
- MILESTONES M1 の受け入れ基準の「2 回の CI 実行で同一 digest」は、同一マシン内で 2 回実行したときの一致と読む。

### D-053 lint パッケージを構成に加える
- AGENT_BRIEF §5 のリポジトリ構成に `packages/eslint-plugin/`（`@reins/eslint-plugin`、D-023）を追加する。

### D-055 DSH での ensurePlan の実装位置
- section / context のプロバイダは同期関数で、memo を読むだけにする。
- `system-prompt/assemble` の waterfall（非同期、per-agent scope）で、次の順に処理する。
  1. `ensurePlan()`（D-024）を待つ。
  2. `next()` を呼ぶ。
  3. plan が変わっていれば、返ってきた assembly の `reins:*` 部分を新しい内容に置き換えて返す。
- S-5 で PromptAssembly の構造を確認する。置き換えができない場合は M0 を BLOCKED として報告する。

---

## F. ほかの文書の整合

- README の件数を更新する（不変条件の件数、決定 D-001〜D-068）。
- `checks/` ディレクトリを仕様一式に加える。SPEC のコード例と types.ts を変更したら、`tsc -p docs/spec/checks` を必ず通す（AGENT_BRIEF §7 の手順 3 に追加）。
