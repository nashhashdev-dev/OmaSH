# AGENT BRIEF — 実装エージェントへの指示

あなたはこのリポジトリで **Reins** を実装するエンジニアである。この文書は入口であり、作業中は常にこれに従う。

## 0. 読む順序

1. 本書（全文）
2. `SPEC.md` §1〜§3（何を作るか・用語・法則）
3. `types.ts`（全文）
4. `INVARIANTS.md`（全文）
5. `MILESTONES.md` の現在のマイルストーン
6. 必要に応じて `SPEC.md` の該当節、`DSH_INTEGRATION.md`、`DECISIONS.md`

## 1. 使命（1 段落）

ハーネス（エージェントの動かし方）を、React のように **合成可能なコンポーネントの木** として書けるようにする。木はログの射影から純粋に精緻化され（ETree）、ホスト（AGENTS.md / CLAUDE.md / Codex 設定などの静的ファイル、DSH の毎ターンのプロンプト、子エージェントのセッション）へ純粋に plan され、副作用は commit とセッション操作だけに閉じ込められる。宣言と実態のずれ（ドリフト、アンカー違反）は検出されて提案になる。論理参照・権限の減衰・追記ログ・版固定がこれを支える。

**成功の判定文**：「同じ一つの木が、AGENTS.md と CLAUDE.md と DSH の毎ターンのプロンプトと子セッションに落ち、各バイトがどのノードから来たかを辿れ、誰かが生成物を直接直したら提案として拾われ、作業中のエージェントは自分のハーネスを書き換えられない。」

## 2. 権威の順序と、曖昧さの解き方

権威：`INVARIANTS.md` > `types.ts` > `SPEC.md` > `DSH_INTEGRATION.md` > `MILESTONES.md` > `DECISIONS.md` の既定値 > あなたの判断。

迷ったときは上から順に適用し、最初に答えが出た規則に従う：

| 状況 | 行動 |
|---|---|
| 仕様が上流（DSH・Claude Code・Codex）の実物と食い違う | 実物に合わせて **DSH_INTEGRATION.md / SPEC §7.5 の表だけ** を直し、DECISIONS.md に記録。法則・型・不変条件は変えない |
| 仕様どおりだと不変条件が満たせない | 実装を止め、利用者に報告（§7 の書式、種別 BLOCKED） |
| 仕様に書いていない細部（関数分割、内部データ構造、ファイル名） | 自由に決めてよい。公開 API・ファイル形式・CLI 引数に現れるなら DECISIONS.md に記録 |
| 新しい要素種別・新しい法則が欲しくなった | 追加しない。DECISIONS.md に OQ として起票し、既存要素の組み合わせで実装を続ける |
| types.ts の型を変えたい | 先に DECISIONS.md に D を起票し、理由と影響（どの I-* に触れるか）を書いてから変える。不変条件を弱める変更は不可 |
| 外部ツールの採用 | 既存のよく保守されたもの（yaml、fast-check、dependency-cruiser、esbuild 等）を優先。採用は DECISIONS.md に記録 |

## 3. 禁止事項（MUST NOT）

1. 組み込み要素種別（11 種）を増やす・減らす。
2. コンポーネントにホスト情報を渡す仕組みを作る（I-ELAB-2、D-013）。
3. コンポーネント内で時刻・乱数・環境変数・ファイル・ネットワークを直接読む。
4. `@reins/core` と静的ホストから `@deepseek-ai/*` を import する。DSH 依存は `packages/dsh-plugin/src/adapter/` のみ。
5. ワークスペースに CommitRecord・ログ・状態ファイルを置く（I-HOST-5）。
6. 非所有ファイルの上書き・併合、ドリフトした生成物の上書き（`--force` の human を除く）。
7. 子セッションの出力を instruction / rule / knowledge として親の木に入れる（I-SESS-2）。
8. agent principal に `harness:write` を与える経路を作る（I-CAP-2）。
9. 秘密を生成ファイル・ログ・テスト fixture に平文で書く。
10. M0 を飛ばす。テストなしで受け入れ基準を「満たした」と報告する。
11. ユニットテストでネットワークに出る、または fixtures 外の実ディレクトリに書く。

## 4. よくある誤読（先回りの訂正）

- **論理参照（`workspace://` 等）はワークスペース分離のための付属品ではない。** 全リソースのアドレス空間であり、独立した基盤機構（SPEC §4）。
- **「Reconciler」は 2 つある。** ホスト調停（宣言 → 実体、ドリフト検出）と真偽調停（アンカー評価）。別の処理として実装する（SPEC §8）。
- **Harness IR = ETree。** ユーザが手で編集するものではなく、コンポーネントから精緻化される正規 JSON。人間が編集するのはコンポーネントと内容ファイル。
- **React 比喩は JSX 必須を意味しない。** `h()` と等価（D-003）。
- **Cordis の scope は権限境界ではない**（D-008）。
- **これは機能の寄せ集めではない。** 各機能は法則（SPEC §3）から導出される。法則で説明できない実装をしそうになったら、それは誤り。
- **既存の hermesINdsh のコードは設計の出発点ではない。** 参照しなくてよい。

## 5. リポジトリ構成（作成する）

```
reins/
  AGENTS.md            ← 本書へのポインタ（3 行）
  docs/spec/           ← 本仕様一式（SPEC.md, types.ts, INVARIANTS.md, …）
  mise.toml  mise.lock
  package.json  pnpm-workspace.yaml  tsconfig.base.json
  packages/
    core/              @reins/core
    host-agents-md/    @reins/host-agents-md
    host-claude-code/  @reins/host-claude-code
    host-codex/        @reins/host-codex
    reconcile/         @reins/reconcile   （ホスト調停・真偽調停・提案）
    session-tmux/      @reins/session-tmux
    cli/               @reins/cli          （bin: reins）
    dsh-plugin/        dsh-plugin-reins
    eval/              @reins/eval         （M7）
  contracts/dsh/       DSH contract tests
  upstream/dsh.json
  patches/dsh/
  fixtures/            ws-ts, ws-py, ws-notes, fake-agent
  examples/            hello, swe, verify
  spikes/              M0 の使い捨てコード
  SPIKES.md  CHANGELOG.md
```

## 6. 工学上の規約

- TypeScript strict（D-002 の全フラグ）。`any` 禁止、`as` キャストは境界（JSON パース直後の検証済み箇所）のみ。
- 入力検証：外部から来る JSON（ファイル、frontmatter、ツール引数）は zod 等で検証してから types.ts の型にする。
- エラー：`class ReinsError extends Error { code: ReinsErrorCode; node?; detail? }`。それ以外の throw はバグ扱い（`INTERNAL`）。
- ライブラリは `console` に書かない。CLI だけが表示する。
- テスト：不変条件テストは `test/invariants/I-XXX-N.test.ts`、名前は ID で始める。property test は fast-check、既定 200 runs、失敗時の seed をログに出す。golden は `__golden__/`、更新は `UPDATE_GOLDEN=1` のときのみ。
- 時刻と ULID は注入可能にする（テストで固定）。
- コミット：1 論理変更 1 コミット。件名 `<package>: <変更>`、本文で関係する I-* / D-* を列挙。

## 7. 作業手順と報告

各マイルストーンで：

1. 受け入れ基準を読み、対応するテストを **先に** 書く（失敗する状態でコミット可）。
2. 実装する。
3. `mise run lint && mise run test` を通す。
4. DECISIONS.md・CHANGELOG.md を更新。
5. 利用者へ報告する。

報告書式（このまま使う）：

```
[REINS REPORT] M<n> <DONE|BLOCKED|PARTIAL>
受け入れ基準: <番号ごとに PASS/FAIL と証拠（テスト名 or コマンド出力の要約）>
新しい決定: <D-/OQ- の一覧>
仕様の修正: <どのファイルのどの節を、なぜ>
次に必要な判断（利用者へ）: <無ければ「なし」>
```

BLOCKED の条件：法則・不変条件と上流の実物が矛盾する／受け入れ基準が技術的に検証不能／必要な外部アクセス（API キー、実ランタイム）が無い。BLOCKED の場合は、可能な代替案を 2 つまで添える。

## 8. 最初にやること

1. 上記構成の空リポジトリを作り、`docs/spec/` に本仕様一式を置き、`AGENTS.md` に本書へのポインタを書く。
2. `mise.toml` を DSH_INTEGRATION.md §7 の通り置く（版は M0 で固定）。
3. M0 を始める。
