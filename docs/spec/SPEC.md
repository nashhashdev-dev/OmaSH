# Reins 仕様書（規範）

> 版：0.1-draft（2026-10-13）　名称 "Reins" は仮称（D-001）。
> 規範語：**MUST / MUST NOT / SHOULD / MAY** は RFC 2119 の意味で用いる。
> 型の正本は `types.ts`、法則の正本は `INVARIANTS.md`。本書と食い違う場合の優先順位は `INVARIANTS.md` > `types.ts` > 本書 > `MILESTONES.md`。

---

## 1. 何を作るか

**Reins は「ハーネスの React」である。** ハーネス（エージェントの動かし方：指示・知識・規則・スキル・ツール・文脈・タスク・子セッション・権限）を **合成可能なコンポーネントの木** として書き、その木を **ホスト**（AGENTS.md / CLAUDE.md 等のファイル群、DSH の毎ターンのプロンプト、子エージェントのセッション）へ **render** し、宣言と実態のずれを **reconcile** する。

対応関係（これが設計の全体像である）：

| React | Reins |
|---|---|
| Component / props | ハーネスコンポーネント（純粋関数） |
| state → render | ログの射影（Projection）→ elaborate → ETree |
| DOM | ホストの実体（生成ファイル、プロンプト、ツール集合、ガード、子セッション） |
| react-dom / react-native / ink | ホスト（agents-md / claude-code / codex / dsh） |
| reconciler / key | ホスト調停（plan・observe・commit）と安定 ID |
| hydration mismatch | ドリフト（生成物が外部編集された） |
| SSR HTML の hydrate | `reins import`（既存 md の取り込み） |
| Context Provider | `scope`（適用範囲・条件・権限が木を下る） |
| Portal / createRoot | `session`（別ワークスペース・別ランタイムへの子ルート） |
| useEffect | 存在しない。世界を変えるのはホストの commit とセッション操作だけ（§3 法則 3） |
| Redux action / devtools | ログ（追記のみ）と Projection、`reins why` / `reins explain` |
| Suspense | 外部内容の読み込みを待つ elaborate の再試行 |
| npm package | ハーネスパッケージ + `reins.lock` |

### 1.1 解決する問題（入力要求との対応）

| 要求 | 本仕様での実現 |
|---|---|
| R1 ハーネス用 md をコードベースに置く不自然さ、別管理・別版管理 | §4 名前空間、§7.4 `generated` モード、§12 パッケージ |
| R2 md の抽象化（React 化） | §5 要素、§6 精緻化、§7 ホスト |
| R3 プロンプトの抽象化 | §5.7 `context`、§5.8 `task`、§7.6 DSH ホスト（毎ターン render） |
| R4 腐敗（md・文書・構造と実作業のずれ）の同期 | §8 調停（ドリフト・アンカー・提案） |
| R5 論理参照 `workspace://` `harness://` 等 | §4（独立した基盤機構。用途は分離に限らない） |
| R6 親子セッション（別 repo・PTY・Claude Code / Codex を人間のように指揮） | §11 セッション |
| R7 権限分離（作業者はハーネスを書けない、委譲時の減衰、予算・深さ） | §9 |
| R8 何が起きたかの追跡 | §10 ログ |
| R9 評価・比較・自己改善 | §13 |
| R10 配布・fork・合成 | §12 |
| R11 DSH + mise、plugin 優先、上流追随 | `DSH_INTEGRATION.md` |

### 1.2 非目標

- 新しいエージェントループ・モデルアダプタを作ること（DSH や各 CLI のものを使う）。
- 自然言語の知識を完全に形式化すること（本文は Markdown のまま持つ。構造化するのは**メタデータ**：出所・範囲・条件・認識論的地位・検証根拠）。
- 汎用ワークフローエンジン（DSH の `ctx.workflowEngine` 等を使う）。
- GUI。CLI と DSH Web UI 上の表示（任意）のみ。
- Supported operating systems are Linux and macOS. Windows is a non-goal; tmux and POSIX paths are required (batch 2 scope).

---

## 2. 用語

| 用語 | 定義 | 旧草案での呼称 |
|---|---|---|
| ハーネスパッケージ | `reins.json` を持つディレクトリ。コンポーネントと内容ファイルを含む版付き成果物 | Harness repo / bundle |
| 要素 Element | 11 種の組み込みノード（§5） | IR のノード種別 |
| コンポーネント | `(props) => ReinsNode` の純粋関数 | — |
| 精緻化 elaborate | コンポーネントを展開して ETree を作る純粋関数 | — |
| ETree | 組み込み要素だけからなる正規 JSON の木。**Harness IR はこれを指す** | Harness IR |
| ホスト Host | ETree を特定の実体へ射影するもの（plan / observe / commit） | renderer |
| ホスト調停 | 望ましい出力と観測した実体の差分を取りコミットする処理 | Reconciler（前半） |
| 真偽調停 | アンカーをワークスペースとログに対して評価する処理 | Reconciler（後半） |
| ドリフト | 生成物が最後のコミット後に外部で変更された状態 | 腐敗の一種 |
| アンカー | 記述を機械検証する根拠（§5 Anchor） | アンカー |
| 提案 Proposal | ハーネス・ワークスペースへの変更案のデータ | 修正提案 |
| ログ | 追記のみ・ハッシュ連鎖のイベント列 | 台帳 ledger |
| Projection | ログの純粋な畳み込み | — |
| 名前空間 Namespace | 実行単位ごとの、論理参照 → 実体の束縛表（Plan 9 型） | 識別とアドレス |
| Principal | 権限の主体（human / agent / reconciler / evolver / promoter / system） | — |
| セッションホスト | 子ランタイムへの `send/observe/interrupt/status/result` 実装 | セッションアダプタ |

---

## 3. 法則（Laws）

全設計はこの 6 法則から導出される。新機能が法則で表現できない場合、機能ではなく法則の不足として DECISIONS.md に起票する（MUST）。

1. **木が唯一の宣言**：エージェントに影響する宣言はすべてハーネスの木に現れる。ワークスペースに置かれた指示ファイルは木の射影（生成物）か、取り込まれて木の一部になった `raw` 要素のいずれかである。
2. **Render は純粋**：`ETree = elaborate(package, lock, namespace, log[0..n])`、`Plan = host.plan(ETree, taskState)`。どちらも副作用を持たない（I-ELAB-1, I-RENDER-1）。
3. **世界を変えるのは commit と session 操作だけ**：ファイル書き込み、プロンプト登録、ツール集合の変更、子セッションの起動・送信・停止。いずれも二相（意図 → 結果）でログに記録する（I-LOG-3）。
4. **状態はログからしか読まない**：コンポーネントが参照できる動的情報は Projection を経由したログだけ。エージェントの行動（ツール呼び出し、ファイル変更、子の起動要求）はまずログイベントになり、射影を通じて木に反映される（Elm / Redux 型の単方向データフロー）。
5. **権限は減衰しかしない**：木を下るとき、子セッションへ渡すとき、権限と予算は交差（∩）でのみ変化する（I-CAP-1）。
6. **黙って消さない、黙って強制しない**：全ノードは会計され（I-RENDER-2）、強制状態は正直に記録される（I-RENDER-5, I-CAP-3）。

---

## 4. 参照と名前空間

### 4.1 Ref

Canonical grammar: `<scheme>://<authority>[/<path>][@<pin>][#<fragment>]`. An empty root path omits the path separator.

- `scheme`：`[a-z][a-z0-9+.-]*`。組み込み：`workspace` `harness` `context` `session` `run` `artifact` `secret`。他は Resolver プラグインが登録する。
- For `harness`, `authority` is the package name: `(@[a-z0-9][a-z0-9._-]*/)?[a-z0-9][a-z0-9._-]*`. The slash inside an npm scoped name belongs to authority. `self` is reserved for the current package (D-018).
- Other schemes retain authority grammar `[a-z0-9][a-z0-9._-]*`, naming a binding in the namespace.
- `path`：POSIX、正規化済み、`.`/`..` なし、末尾 `/` なし、先頭 `/` は区切りとして 1 個。
- `pin`：`@sha256:<hex>`（digest）、`@git:<commit>[+dirty:<digest>]`、`@^1.2`（semver。`harness` のみ）、`@tag:<name>`。
- `fragment`：`harness` では NodeId、それ以外は解釈しない。
- RefPattern：同文法で path に `*`（1 セグメント）と `**`（0 以上）を許し、pin を禁止。

例：`workspace://app/src/auth/session.ts`、`harness://@me/swe@^2#no-raw-sql`、`harness://self/content/auth.md`、`session://dsh/01JB…`。

In `harness://@me/swe@^2#no-raw-sql`, authority is `@me/swe`, path is empty, pin is semver `^2`, and fragment is `no-raw-sql`.

### 4.2 Namespace と Mount

- Namespace は Mount の順序付き集合と親 id からなる不変値。`id = digestJson(toJson({mounts, parent}))`。
- Mount は (scheme, authority) を Resolver と config に束縛する。同じ (scheme, authority) を 2 回含む Namespace は不正。
- Mount の `ceiling` は、その Mount 経由で得られる権利の上限。実効権利 = principal の CapSet ∩ ceiling。
- At Run start, construct ceiling grants with on `<scheme>://<authority>/**` and each Mount's rights, attenuate principal caps against their union without strict rejection, and use only the resulting effective caps in permits (D-057).
- Run 開始時、各 Mount の `base` に `snapshot()` の digest を入れる（I-REF-2）。

組み込み Resolver（M1 で `fs`、M2 で `git-worktree`、M5 で `agentfs` を検討）：

| id | 対象 | config | version の定義 |
|---|---|---|---|
| `fs` | 任意ディレクトリ | `{ root: string }` | Merkle digest of included workspace files; exclusions are defined below (D-090) |
| `git-worktree` | git 作業ツリー | `{ root: string }` | SHA-256 snapshot identity of HEAD, binary diff, and untracked files (D-073) |
| `harness-pkg` | ハーネスパッケージ | `{ root?: string, registry?: string }` | パッケージ digest（§12.1） |

All versions are sha256 Digests. A git-worktree snapshot is digestJson(toJson({kind:'git', head, diff:digestBytes(git diff --binary HEAD), untracked:{path:digestBytes}})). A workspace resolve returns its fixed Mount.base; immutable harness and pinned context mounts return their content digest. Git pins are reference notation, not a version representation. Changes during a Run appear only through ws/snapshot and ws/touched (D-073).

Workspace snapshots exclude exactly .git/, every host CommitRecord target for that workspace, node_modules/, and, for git-worktree only, gitignored files. Include every other file. Changing source must change the snapshot; changing generated targets must not (D-090).

secret://env/NAME addresses a driver-process environment credential. Its right is read; values are read only at launch and never placed in logs, CAS, or files (D-079).

### 4.3 解決規則

1. Ref の (scheme, authority) で Mount を引く。無ければ `REF_UNRESOLVED`。
2. pin が `semver` / `tag` なら Lock で digest に変換。Lock に無ければ `REF_UNPINNED`（I-REF-3）。
3. Resolver の `resolve` を呼ぶ。結果は (ref, ns.id, lock digest) に対して決定的（I-REF-1）。

### 4.4 fork

`resolver.fork(mount, {mode, authority})` は新しい Mount を返し、呼び出し側は `Namespace{ mounts: [...], parent: old.id }` を作る。`fork-worktree` は `git worktree add`、`fork-cow` は CoW オーバーレイ（AgentFS 等）、`new-repo` は空 repo の `git init`。

---

## 5. 要素（Element）

Types are defined in types.ts §4. Every element except fragment may carry BaseProps: id, volatility, hosts, onUnsupported, and provenance.

### 5.1 `scope`
- `at`：`workspace:` の RefPattern。部分木を空間的に限定する。
- `when`：Predicate。部分木を時間的（タスク状態）に限定する。
- `caps`：部分木の権限を減衰する（I-ELAB-5）。
- `tools: 'allowlist'`：この部分木で可視なツールを部分木内の `tool` ノードだけに制限する。
- 実効値の継承：`at` は交差（両方ある場合、子の pattern が親の pattern に包含されなければ `REF_INVALID`）、`when` は `and`、`caps` は `attenuate`、`volatility` inherits the nearest explicitly specifying scope (D-060), `hosts` は交差、`onUnsupported` は子優先。
- Volatility inherits the nearest scope's explicit value. If no scope specifies it, context/task default to turn and all other kinds to static (D-060).

### 5.2 `instruction`
エージェントへの指針。`priority`（0–100、既定 50）は同一バケット内の順序にのみ使う。文字列ノードは `{kind:'instruction', body:{format:'md', text}}` に変換される。

### 5.3 `knowledge`
世界についての言明。`claim` は認識論的地位：
- `fact`：検証可能な事実。アンカーを持つべき（SHOULD）。
- `convention`：このプロジェクトの取り決め。
- `hypothesis`：未確定の推測。ホストは「（仮説）」と明示して描画する（MUST）。
- `rationale`：理由。機械検証不能。
- `preference`：好み。機械検証不能。
真偽調停は `fact` と `convention` のアンカーだけを評価する。

### 5.4 `rule`
制約。`enforcement: 'advisory'` は散文。`'enforced'` は `guard` 必須で、ホストの guard 機構で実現される（I-RENDER-5）。

### 5.5 `skill`
Agent Skills 形式（`SKILL.md` + frontmatter `name` `description`）で描画される手順。`resources` は SKILL.md と同じディレクトリへコピーされる。

### 5.6 `tool`
Tools are MCP server definitions or host-native tool names. ${secret:NAME} denotes secret://env/NAME (D-079). MCP env entries MUST NOT contain literal secrets. Convert `${secret:NAME}` into the destination's supported environment-variable reference syntax, such as `${NAME}` in .mcp.json. If the destination has no supported reference syntax, account the tool as dropped with reason `secret-unsupported`. Secret values MUST NOT be written to any file or log (D-034).

### 5.7 `context`
毎ターン変わり得る情報。既定 `volatility: 'turn'`、既定 `onUnsupported: 'drop'`。`budgetTokens` を超える本文はホストが切り詰め、末尾に `…[truncated by reins: <gid>]` を付ける。`trust: 'relay'` は外部由来（子の出力、Web）を表し、ホストは次の形でのみ描画する（I-RENDER-6, I-SESS-2）：

````
<relay source="<provenance.source>" node="<gid>">
...本文...
</relay>
````

### 5.8 `task`
「今何をするか」。TaskSpec はホストによらず次の固定書式にコンパイルされる（MUST、`reins/task-compile` 関数として core に置く）：

```
# Task
<goal>

## Acceptance criteria
- [ ] `<argv を空白連結>` exits <expectExit> (cwd: <cwd>)
- [ ] <anchor の describe>
- [ ] Ask the human: <question>

## Constraints
- <constraint>

## Deliverables
- <name>: <description>[ (at <at>)]

## References
- <ref>
```
空の節は出力しない。

### 5.9 `session`
子ルート。§11。

### 5.10 `raw`
取り込まれた未構造 Markdown。本文は改変せず描画する。

### 5.11 内容ファイル
`content/**/*.md` は YAML frontmatter + Markdown 本文。`useFile(path)` が Element に変換する。frontmatter キーは Element のプロパティ名と同一（`kind` 必須、`body` は本文から生成）。例：

```markdown
---
kind: knowledge
id: auth.session-store
claim: fact
anchors:
  - { kind: path, pattern: "workspace://app/src/auth/session-store.ts", expect: exists }
---
セッションは Redis に保存され、TTL は 24 時間。
```

**方針**：合成（どこに・いつ・誰に）はコードで、内容（何を言うか）はデータファイルで書く（SHOULD）。これにより提案は多くの場合 `content-patch` で済み、コード変更を伴わない。

---

## 6. コンポーネントと精緻化

### 6.1 オーサリング

TypeScript。JSX は任意の糖衣（`jsxImportSource: "@reins/core"`）で、`h()` と等価（MUST）。

Only scope and session accept children. Leaf JSX props reject children and leaf h calls accept no rest children. Runtime unknown kinds and leaf children fail INVALID_ELEMENT (D-081).

Brands are soft: JSX/frontmatter may use ordinary string literals, and kernel parse/validate functions enforce validity at runtime (D-042). Component calls are type-erased closures; `h(Component, props)` captures typed props, while `use(package, props?)` accepts JSON across package boundaries. LoadedPackage provides the entry and named component exports. Intrinsic h calls use IntrinsicProps; fragment syntax uses Fragment (D-045).

`packages/core/src/jsx-runtime.ts` MUST export namespace JSX with the Element, ElementType, IntrinsicElements, and ElementChildrenAttribute members from JsxNamespaceShape. Under react-jsx, session key arrives as jsx/jsxs's third argument and MUST be restored into SessionEl props (D-046).

```tsx
// examples/hello/src/index.tsx
import { h, use, useFile, useTaskState } from '@reins/core'

export default function Root() {
  const ts = useTaskState()
  return (
    <>
      {useFile('content/overview.md')}
      <scope at="workspace://app/src/auth/**">
        {useFile('content/auth/session-store.md')}
        <rule id="no-raw-sql" enforcement="enforced" onUnsupported="downgrade"
              guard={{ kind: 'deny-command', argvPrefix: ['psql'] }}
              body={{ format: 'md', text: 'DB へは ORM 経由でのみアクセスする。' }} />
      </scope>
      <scope when={{ op: 'event', kind: 'reins/test-failed', within: 'turn' }}>
        <context id="last-failure" body={{ format: 'md', text: lastFailure(ts) }} priority={90} />
      </scope>
      {use('@acme/verify', { strict: true })}
    </>
  )
}
```

### 6.2 精緻化アルゴリズム（MUST）

入力：`ElaborateInput`。出力：`ElaborateResult`。

1. フック文脈を作る（現在パッケージ = root、`external`、projection キャッシュ）。
2. `root.entry({})` を評価し、得られた ReinsNode を深さ優先・左から右で展開する：
   - Flatten arrays; discard null, undefined, and both boolean values; convert strings to instruction nodes (D-046).
   - For $component, push name into via and invoke render() inside the hook context. If pkg is present, switch the current package before rendering; produced nodes belong to that package. Props were captured at call creation. Re-entry reaching depth 256 fails with ELAB_CYCLE (D-091).
   - `fragment` は子を親へ平坦化。
   - Resolve Content refs to md. Read `harness://self/...` from the current package's files and other refs from driver-materialized `external`. Missing refs produce `suspended` with all missing refs; no suspended tree may supply a model request (D-024).
3. scope の実効値を計算（§5.1）。
4. Assign GlobalNodeId as <pkg>#<domain><local>. Domain appends @<key>/ for each enclosing session portal. Explicit local IDs are NodeIds, unique within (package, domain); anonymous locals are ~ followed by the complete structural child-index path through every authoring node, including components (for example ~0.3.1). Each portal's descendants form their own uniqueness domain. Validate IDs, refs, required props, kinds, and leaf children at runtime (I-ELAB-3, D-075/081).
5. Wrap expanded nodes in a synthetic root scope with gid `<pkg>#~root` and no authored props. Exclude root and all scopes from accounting (D-043). Set ETree.external to the digest of the used `{ref: digest}` map. Compute `ETree.digest = digestJson(toJson({package, lock, namespace, external, root}))`, keeping logSeq outside this digest (D-025).
Every ENode has deps. Include its own resolved Content refs and all refs read by hooks in every ComponentCall on its via chain, propagating those call dependencies to all output descendants. Status is ok or unavailable. Hosts use unavailable deps to account degraded nodes with content-unavailable:<ref>; marker-text searches are forbidden (D-078).

6. 開発モード（`REINS_DEV=1`、テストでは常時）では 1〜5 を 2 回行い digest 不一致なら `ELAB_IMPURE`。

Before a dynamic model request or static CLI render, the driver MUST run `ensurePlan()` (D-024). Fetch missing refs in parallel, store successful bodies in `$REINS_HOME/cas/<digest>`, record `content/fetched {ref, digest}`, rebuild `external` from logged content events and CAS, and retry elaboration until done. Components do not access this map directly.

The total wait is bounded by `suspenseTimeoutMs`, default 10000 ms; CLI accepts `--suspense-timeout`. Fetch failures and exceeded deadlines record `content/unavailable {ref, reason, detail?}`, where reason is timeout, not-found, denied, or error. Resolve unavailable refs to `[reins: content unavailable: <ref> (<reason>)]` and retry to done. Each node using this placeholder is accounted as degraded with reason `content-unavailable:<ref>`. The used-ref digest map includes the digest of each materialized placeholder. Missing content MUST NOT be silently rendered as an empty string.

### 6.3 フック

The hooks are `useLog(projection)`, `useTaskState()`, `useContent(ref)`, `useFile(path)`, and `useNamespace()` (types.ts `Hooks`). Calling them outside elaboration fails with `ELAB_HOOK_OUTSIDE_RENDER`. Hooks MUST NOT expose host information (I-ELAB-2).

Purity checks have two required layers (D-023):

1. **Static lint (MUST):** before evaluating any harness module, enumerate every module reachable from entry with the esbuild metafile and lint the complete graph, including initializers. Top-level statements may only be import/export, function/class declarations, or const declarations with pure literal initializers. Imports are limited to @reins/core, harness dependencies composed through use(), and manifest.pureDependencies; the last list is trusted and not linted. Prohibit I/O imports (including node:fs, node:child_process, node:net), process.env, Date, Math.random, fetch, crypto.getRandomValues, and I/O outside core hooks. reins render MUST reject violations with ELAB_IMPURE (D-023/084).
2. **Double elaboration:** in development mode and tests, evaluate the same input twice and fail with `ELAB_IMPURE` if the results differ (I-ELAB-1). This detects nondeterminism only. Deterministic forbidden effects require static checks; passing repeated evaluation does not prove their absence.

### 6.4 Projection とタスク状態

- 組み込み Projection `reins/task-state` は `TaskState`（types.ts §9）を作る。`turn` 境界はログイベント `turn/start`（DSH 内では DSH の `turn/start` を橋渡しして記録する。DSH_INTEGRATION.md §4）。
- **静的射影**：`logSeq = -1`（空ログ）。静的ホスト向けの精緻化は常に静的射影で行う。したがって JS の条件分岐で `useTaskState()` に依存するノードは静的ホストには現れない。静的ホストにも条件付きで伝えたい内容は `scope when`（データの Predicate）で書く（SHOULD）。
- The static projection applies to component task-state hooks; logged content inputs are still materialized through the same ensurePlan procedure (D-024).
- Parent elaboration expands `session.children`, so JavaScript branches use parent state. Child hosts evaluate data `when`/`at` using the child's TaskState: the child's log projection for dynamic hosts, or the static projection for static hosts (D-029). Use data predicates for child-local dynamic conditions.
- Projection<T>, useLog<T>, and project<T> do not require a Json generic constraint. Development mode MUST check projection state for JSON serializability at runtime (D-044).
- At turn/start, move touchedThisTurn to touchedPrevTurn and clear touchedThisTurn. Keep touched/written cumulative. touches defaults to recent, matching the union of current and previous turn; turn and session select their respective windows (D-076).
- requestedSessions contains only session/requested keys without session/unmounted; an unmounted key cannot be requested again in the same Run (D-047).

### 6.5 Predicate の評価と記述

| op | 評価 | 静的ホストでの記述（英語固定文、ホストが見出しに使う） |
|---|---|---|
| touches | Match touchedThisTurn for window turn, current ∪ previous for recent (default), or cumulative touched for session (D-076). | `When working on files matching \`<pattern>\`` |
| event | `within` に応じ `eventsThisTurn` / `eventsThisSession` が kind を含む | `After <kind> occurs` |
| phase | `phase === is` | `During phase "<is>"` |
| and/or/not | 論理演算 | `(<a>) and (<b>)` 等 |
| custom | 登録 evaluator | `describe` |

---

## 7. ホスト

### 7.1 契約
`RuntimeHost`（types.ts §7）。`plan` は純粋・同期、`observe` は読み取りのみ、`commit` だけが書く。

PlanContext.hostConfig is required. Normalize output-affecting settings by omitting default-valued keys and using canonical key order. RenderPlan.digest is digestJson(toJson({host, hostConfig, tree, taskState, outputs})); memo keys include tree.digest, taskState digest, and hostConfig digest. Lockfile.hosts and RunSpec.hosts record HostConfig values (D-072).

CommitReceipt distinguishes kind:static, with record/written/removed/skippedDrift, from kind:dynamic, with plan/changed. Dynamic observe returns empty targets; commit updates memo and records render/committed only for a changed digest. It creates no CommitRecord or drift (D-062/070).

### 7.2 Static host reconciliation (MUST; D-070)

Static host commits to the same workspace MUST be serialized by an exclusive lock at `$REINS_HOME/state/<wsid>/lock`. Hold it across observation, ownership/drift checks, writes, and CommitRecord updates. Fail with `LOCKED` after 30 seconds without acquiring it (D-037).

Before multi-host commits, duplicate planned targets MUST fail the entire plan with TARGET_CONFLICT. When Codex is configured via-agents-md, it emits no AGENTS.md or shared skills and avoids those duplicates (D-064).

```
plan     = host.plan(tree, ctx)
log 'render/intent' {host, plan.digest}
observed = host.observe(plan)
last     = CommitRecord(workspace, host) or null
for each target T in plan ∪ last:
  o = observed[T], l = last[T], p = plan[T]
  if l != null and o == null and p == null: → remove T from CommitRecord (D-071)
  elif l == null and o != null:           → TARGET_OCCUPIED（全体失敗。import を提案）
  elif l != null and o != l.digest:       → drift/detected、T は skip（I-HOST-2）
  elif p != null and p.digest != o:     → 書く
  elif p == null and l != null:         → 削除（自分の生成物のみ）
write CommitRecord（skip した T は旧 digest を保持）
log 'render/committed' or 'render/failed'
```
書き込みは一時ファイル + rename で原子的に行う（MUST）。

### 7.3 揮発度と会計
- 静的ホスト：`static` と `session` の要素を描画。`turn` 揮発の要素は `onUnsupported` 既定 `drop`。
- 動的ホスト：`static` → `session` → `turn` の順に並べる（I-RENDER-4）。
- Account for every ENode except synthetic root and scope containers (I-RENDER-2, D-043). Scope effects appear in descendant filtered reasons. Dynamic when exclusions use `when:<describe>`; path and host exclusions use `at:<pattern>` and `hosts:<list>`.

Static when conditions render in Conditional sections and are accounted rendered. Dynamic hosts evaluate when against TaskState and filter false conditions with reason `when:<describe>` (D-059).

The parent host accounts session descendants as `delegated`, with reason `session:<key>`; the child's host accounts those nodes fully. Exactly once is required within each plan, including delegated entries, rather than globally across parent and child plans (D-028).

Volatility is a placement contract. Static/session nodes may change during a Run and the host MUST use the updated content. `render/committed.cacheBreak` is true when the system portion changes, and false otherwise. I-RENDER-4 still requires identical system outputs when only turn nodes differ (D-032).

ENode.effective.onUnsupported is optional and contains only the authored/inherited setting. At plan time, choose the node setting, nearest explicitly specifying scope setting, the table below, then drop for any unlisted case. A prose realization counts as supported and does not consult onUnsupported. Elaboration never depends on host capabilities (D-077).

| Unsupported situation | Default |
|---|---|
| Enforced rule with no guard realization | error |
| Context or turn-volatility node on a static host | drop |
| Task on a static host | drop |
| MCP tool with no host MCP configuration target | drop |
| Native tool whose name is unknown to the host | drop |
| Session on a static host | drop, reason `session:static-host`; descendants delegated (D-048) |
| Scope with tools:allowlist and no host restriction mechanism | downgrade; prose `Use only these tools: …` |
| Skill with no skills directory | downgrade; name, description, and body under `## Skills` |

### 7.4 静的ホスト共通規則
- 出力ファイル先頭（frontmatter を持つ形式では frontmatter の直後）に 1 行のヘッダ：
  `<!-- generated by reins from <pkg>@<digest 先頭12桁>; edits are detected as drift (reins status) -->`
  TOML は `#` コメントで同じ 1 行ヘッダを付ける。JSON はコメント不可のためヘッダを付けず、所有は CommitRecord だけで追跡する。
- `generated` モード：全 target を `$(git rev-parse --git-path info/exclude)` の管理ブロック（`# >>> reins` 〜 `# <<< reins`）に列挙する（I-HOST-3）。`embedded` モードでは除外しない。
- Section order, omitting empty sections: `## Rules` → `## Instructions` → `## Knowledge` → `## Skills` → `## Conditional` → imported raw. Within a section, sort by descending priority, then ascending gid (D-031).
  - Rule：`- **<id>** (<advisory|enforced>): <body>`
  - Knowledge：`### <id>` の下に本文、`hypothesis` は見出し末尾に ` (hypothesis)`。
  - Conditional：`### <describe>` の下に、その scope の要素を同じ規則で描画。
- **raw だけからなる target** はヘッダ + raw 本文をそのまま出力する（I-HOST-4 の往復を保証）。
- For `pathScoping: 'nested-files'`, let D be the fixed prefix directory before the first glob. If D is nonempty and the remaining pattern is exactly `**`, render normally in D's instruction file (`workspace://app/src/auth/**` → `src/auth/AGENTS.md`). For every other remainder, such as `src/auth/*.ts`, render in that file's Conditional section with `touches(<pattern>)`. If D is empty, use the root file's Conditional section. An `at` authority other than PlanContext.workspaceAuthority is filtered with reason `at:other-workspace` (D-030).

### 7.5 静的ホストの対象表

既定値。**M0 スパイク S-1〜S-3 で実ランタイムに対して検証し、違えばこの表とホスト実装だけを直す**（仕様の他部分は変えない）。Ruler / rulesync のターゲット表を参照元とする。

| 要素 | `agents-md` | `claude-code` | `codex` |
|---|---|---|---|
| 指示ファイル名 | `AGENTS.md` | `CLAUDE.md` | `AGENTS.md` |
| nested（`at`） | `<D>/AGENTS.md` | `<D>/CLAUDE.md` | `<D>/AGENTS.md` |
| instruction / knowledge / rule(advisory) / raw | 散文 | 散文 | 散文 |
| skill | `.agents/skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md`（S-3 で確認） |
| tool（mcp） | none | `.mcp.json`（ファイル全体を所有） | `.codex/config.toml` の `[mcp_servers.<name>]`（ファイル全体を所有） |
| rule(enforced) guard | none | `.claude/settings.json` の `permissions.deny`：`deny-tool`→`<Tool>`、`deny-command`→`Bash(<prefix>:*)`、`deny-write`→`Edit(<path>)` と `Write(<path>)` | none（S-3 で sandbox/exec policy を調査） |
| context / task | none（drop） | none（drop） | none（drop） |
| session | none; drop with session:static-host | same | same |

M0 verification status (2026-10-13): the entries above remain provisional where native probes are blocked. The pinned Claude/OpenCode binaries abort before configuration loading; Codex reports its version but cannot load configuration without /proc/self/exe. Consequently nested-file loading, skills, configuration environment expansion, and native sandbox behavior have not been confirmed in this environment. See SPIKES.md; do not treat documentation-only evidence as a passed runtime test.

`.claude/settings.json` 等が既に存在し非所有なら `TARGET_OCCUPIED`。ユーザ自身の設定と共存したい場合、ユーザがそのファイルを `reins import` して木の `raw`（JSON は `tool`/`rule` へ変換）にする。

When agents-md and claude-code are selected together, the Claude host's `dedupeWith` setting defaults to `agents-md`; its other value is null. If S-2 confirms CLAUDE.md `@path` imports, each CLAUDE.md begins with `@AGENTS.md` from the same directory, followed by nodes whose hosts contain only claude-code. Without confirmed import support, both files retain full content (D-033, OQ-01).

MCP environment references MUST use the destination's supported reference syntax, never resolved secret values. S-2 and S-3 MUST verify expansion support for every configuration target in this table. A destination without supported expansion drops the affected tool with reason `secret-unsupported` (D-034).

Codex host setting instructions is own or via-agents-md. It defaults to via-agents-md when agents-md is co-selected, emitting only .codex configuration and leaving AGENTS.md/shared skills to agents-md. Otherwise duplicate targets fail with TARGET_CONFLICT (D-064).

### 7.6 動的ホスト `dsh`
DSH の `ctx.systemPrompt`・`ctx.tools`・`agent/*` に写像する。詳細は `DSH_INTEGRATION.md` §3。要点：
- `static`/`session` → `ctx.systemPrompt.section()`、`turn` と `at`/`when` 付き → `ctx.systemPrompt.context()`（DSH の cache-safe な動的文脈）。
- `at` は動的ホストでは `when: touches(at)` として評価する（`pathScoping: 'on-touch'`）。
- `tools: 'allowlist'` → `ctx.tools.restrict()`、enforced rule と権限 → `ctx.tools.guard()` / `tools/pre-execute`。
- Memoize by (tree.digest, taskState digest, hostConfig digest), with normalized HostConfig included in plan/replay inputs (I-RENDER-1, D-072).
- Run ensurePlan before each model request; only done trees may be planned. Record render/committed only when the plan digest differs from the previously committed plan (D-024/025).
- Skills expose only names and descriptions under `## Skills` in reins:static. `skill_load { name }` returns the body as a DSH tool result, which is logged (D-031).
- Tasks lead reins:turn, compiled with §5.8. Reins does not synthesize ordinary user messages. Only `reins run --task <file> --profile reins-headless` sends the compiled task as the initial user message (D-031).
- Dynamic section order matches static hosts: Rules → Instructions → Knowledge → Skills → Conditional → raw.
- PromptPart names are exactly reins:static, reins:session, and reins:turn; distinguish agents through Cordis registration scopes, not through names (D-061).

---

## 8. 調停（Reconciliation）

調停は 2 種類あり、別の処理である。

### 8.1 ホスト調停
§7.2。宣言 → 実体の同期と、実体の外部変更（ドリフト）の検出。

### 8.2 ドリフトの持ち上げ
For deleted owned targets (observed:null), reins status displays deleted and creates no automatic Proposal. A human may restore only with reins render --force --target <path>, or edit the harness so the target leaves the plan. When both desired and observed target are absent, remove its old record entry without a drift proposal (D-071).

For other drift/detected events, reins status generates:
- 対象 target の sourcemap を使い、変更行を gid に対応付ける。
- 変更行が単一の内容ファイル由来なら `content-patch`（内容ファイルへの unified diff）、そうでなければ `lift-drift`（新しい `raw` ノードとして取り込む diff）を持つ Proposal を作る。
- 人間が「捨てる」を選んだ場合、`reins render --force`（human のみ）で上書きする。

### 8.3 真偽調停（アンカー評価）
`reins check` は ETree 中の `fact`/`convention` knowledge と rule の全アンカーを、指定ワークスペース snapshot に対して評価し `anchor/evaluated` を記録する。

| Anchor | 評価 | `unverifiable` になる条件 |
|---|---|---|
| path | pattern に一致するパスの有無 | Mount が無い |
| grep | pattern に一致する全ファイルで regex | 一致ファイル 0 件かつ expect=match のときは `violated`、Mount が無いときのみ unverifiable |
| command | Run argv in a disposable copy of the specified snapshot, with exec permission and timeout (D-040). | Missing permission, or a non-git snapshot above 1 GiB (`too-large`). |
| import-boundary | TS/JS は dependency-cruiser、その他は custom evaluator | 対応言語が無い |
| custom | 登録 evaluator | evaluator が無い |

Command anchors MUST NOT execute in the real workspace (D-040). For git snapshots, create a temporary worktree from the snapshot commit, apply the recorded working-tree diff, execute, and remove the worktree afterward. For non-git snapshots, copy to a temporary directory and remove it afterward; above 1 GiB, report unverifiable with reason `too-large`.

`violated` に対して Proposal を作る：変更が最近ワークスペースで起きた（`ws/touched` の write に含まれる）なら `content-patch`（ハーネスを実態に合わせる）を第一候補、そうでなければ `workspace-patch` を第一候補とし、両方を提示する（パッチ生成は M4 では空 diff + rationale でよい。LLM による diff 生成は任意プラグイン）。

### 8.4 提案（Proposal）
- 作成：`harness:propose` を持つ principal（agent を含む）。
- 適用：`harness:write` を持つ principal（human / promoter）のみ（I-CAP-2, I-PROP-1）。適用は `git apply --3way` 相当を一時ディレクトリで行い、テスト（`code-patch` なら全テスト、I-PROP-2）通過後に原子的に置換し、新しいパッケージ digest を `proposal/decided` に記録する。
- 保存先：`$REINS_HOME/proposals/<package>/<id>.json`。
- A git package with uncommitted changes MUST fail proposal application with DIRTY_PACKAGE. Successful application creates a `reins: apply proposal <id>` commit. Evolvers may write only candidate copies under `$REINS_HOME/candidates/<id>/`, never the canonical package (D-050).

### 8.5 ログからの規約候補（任意プラグイン、M4 以降）
同一の `session/sent` テキスト断片や同一コマンドの手動実行が N 回（既定 3）以上繰り返されたら `log-pattern` を basis とする Proposal を作る。

---

## 9. 権限

### 9.1 CapSet 演算（MUST、core に実装）
- `permits(caps, right, ref)`：`ref` に一致する Grant のいずれかが `right` を含めば true。Grant は union。
- `attenuate(parent, req, opts?)`: for each requested Grant g, intersect g.rights with the union of rights of parent Grants whose patterns contain g.on. RefPattern containment is conservative glob containment (`**` ⊇ `*` ⊇ literal); an undecidable containment is treated as false. Budget fields use min, with omitted fields inheriting the parent value. `opts.strict` defaults to false, which silently attenuates. With `{ strict: true }`, any attenuation throws `CAP_WIDENING`. Session mount MUST pass `{ strict: true }` (D-022).
- `harness:write` を agent principal に含む CapSet は作れない（I-CAP-2）。

### 9.2 Principal の既定
| kind | 既定 CapSet |
|---|---|
| human | 全権（ローカル CLI 利用者） |
| agent（root） | マウントされた workspace に read/write/exec、harness:self に read と `harness:propose`、spawn は manifest.caps 次第 |
| reconciler | workspace read/exec、harness read、`harness:propose` |
| evolver | write only candidate copies under REINS_HOME/candidates/<id>, propose changes to the canonical package, read propose/select splits (D-050) |
| promoter | `harness:write`、final split read |

### 9.3 強制点
- DSH 内のエージェント：`ctx.tools.guard()`（単調拒否）と `fs/*` イベント。Cordis の scope は権限境界ではない（I-CAP-5）。
- 外部ランタイム（Claude Code / Codex）：起動時の強制（独立 worktree、環境変数の最小化、必要なら `ctx.sandbox` 相当のサンドボックスでラップ）と、§7.5 の settings による拒否規則。取れない権限は `advisory` と記録（I-CAP-3）。
- DSH usage: charge from assistant/message usage through budget/charged. At agent/request, the budget waterfall rejects an over-budget request without calling next(), stopping the turn (D-039).
- External usage: charge from structured adapter usage or PTY status-reader values. When unavailable, record enforcement as advisory.
- Wallclock is always enforced from mount time. On excess, interrupt, then stop after 30 seconds (D-039).

---

## 10. ログ

- 形式：JSON Lines。`$REINS_HOME/runs/<RunId>/log.jsonl`。1 行 1 `LogEvent`（types.ts §6）。
- 書き手は Run ごとに 1 プロセス（ファイルロック）。複数 Run は別ファイル。
- 連鎖検証（I-LOG-1）は読み込み時に常に行う。
- Every log's seq 0 MUST be run/start. Any other initial kind fails with LOG_CORRUPT (D-066).
- DSH 内で起きたモデル要求の本文は DSH のセッションログが正本。Reins ログには `model/request` に `ExternalLogRef` を記録する（重複保存しない）。
- 任意：OpenTelemetry GenAI semantic conventions へのエクスポータ（プラグイン）。

External content is logged input (D-024): `content/fetched {ref: RefString, digest: Digest}` records a body in `$REINS_HOME/cas/<digest>`. `content/unavailable {ref, reason, detail?}` records timeout, not-found, denied, or error. Drivers materialize external input from content events and CAS; unavailable placeholders are reconstructed from logged ref/reason. Model requests always wait for a done tree through §6.2 ensurePlan.

Run ownership (D-036): one Run per human CLI render/check/import invocation, per DSH root session, per mounted child session, and per evaluation Trial. `$REINS_HOME/runs/index.json` maps DSH session IDs to RunIds. Resume appends to the existing Run; child/fork relationships are recorded in RunSpec.

Log writers accept only built-in kinds or plugin names matching ^[a-z][a-z0-9-]*/[a-z][a-z0-9-/]*$. Plugins cannot use the reserved run/, ws/, turn/, task/, render/, content/, harness/, model/, drift/, anchor/, proposal/, session/, check/, cap/, or budget/ prefixes. Reject invalid kinds with EVENT_KIND_INVALID (D-083).

Session intents have a ULID opId. session/sent is a pre-effect payload record, not an outcome. Only session/op-result closes an intent, using the same key/opId for mount, send, interrupt, stop, and detach. After a crash, an intent without op-result records outcome:unknown, notifies the human, and is never automatically retried; existing sessions still follow I-SESS-4 reattachment (D-074).

On startup, recover unfinished effects (D-038 render recovery; D-074 session recovery):

| Intent | Recovery |
|---|---|
| render/intent | Re-observe. If the observed outputs match the intended plan, record render/committed with recovered:true. Otherwise record render/failed and retain CommitRecord. |
| session/intent, any op | Record session/op-result with the matching opId and outcome unknown, notify the human, and MUST NOT automatically resend or repeat the effect (D-074). |

---

## 11. セッション（親子オーケストレーション）

### 11.1 宣言的マウント
`session` ノードはキー付きの子ルートである。ホスト調停の一部として、セッション調停は：
- 木に現れ、まだ mount されていない key → `mount`。
- 木から消えた key → `onRemove`（既定 `detach`）。
- `task` が変わっても再起動しない。新しいタスクは `send` で送る（再起動はノードを消して別 key で出す）。

Static hosts do not mount sessions (D-048). Session reconciliation runs only in reins run and DSH, immediately after session/requested and on each dynamic render. requestedSessions removes keys at session/unmounted. Requesting a previously unmounted key in the same Run fails with KEY_REUSED (D-047).

### 11.2 エージェントからの起動（ツール）
親エージェント（LLM）は直接プロセスを作らない。Reins が提供するツールを呼ぶ：

| ツール | 動作 |
|---|---|
| `session_spawn {key, profile, workspace, task, interactive?, runtime?}` | Select a predeclared manifest session profile, record session/requested, and wait for session/mounted before returning a session ref. RequestedSessions projects requests into session nodes; the kernel automatically appends it at the root's end when the root principal has spawn (D-041). |
| `session_send {key, text}` | Record session/intent {key,opId,op} → session/sent {key,opId,text} → send → session/op-result {key,opId,outcome:delivered or failed}. Preserve failure status reporting; only op-result is the outcome (D-021/074). |
| `session_status {key}` | 最新状態と直近観測の要約（relay として） |
| `session_interrupt {key}` | interrupt |
| `session_result {key, wait?}` | 結果（relay） |
| `session_stop {key}` | stop |

Without spawn permission, session_* tools are not presented (D-091).

The LLM MUST NOT supply arbitrary harness/caps or runtime model/tool/args. Profiles declare an exported component, runtimes:{kind:RuntimeSpec}, defaultRuntime, caps, and optional env refs. The optional runtime argument selects only a declared key, otherwise INVALID_ELEMENT. Use the full RuntimeSpec from the profile and reject extra tool arguments with additionalProperties:false. If mise exec cannot launch it, record failed and raise RUNTIME_UNAVAILABLE. Attenuate profile caps against the requester and inject RequestedSessions automatically (D-041/082).

### 11.3 マウント手順（MUST）
1. `effective caps = attenuate(parent caps, node.caps, { strict: true })`. Check depth, child count, and budgets (I-SESS-1, I-CAP-4, D-022).
2. `WorkspaceBinding` に従い子 Namespace を作る（明示されたものだけ。I-SESS-5）。`fork-worktree` の既定パスは `$REINS_HOME/worktrees/<RunId>/<key>`。
3. Parent elaboration has already expanded node.children and evaluated JavaScript branches using parent state. Plan the subtree with the child runtime's host, evaluating data when/at with child TaskState: the child log projection for dynamic DSH, or the static projection for static hosts (D-029). Map claude-code→claude-code, codex→codex, opencode/pi→agents-md, dsh→the child's DSH scope. Static plans produce renderedFiles and commit through §7.2.
4. TaskSpec を §5.8 書式にコンパイル。
5. セッションホストを選ぶ：`interactive` なら `tmux`（PTY）、そうでなければ構造化（DSH の `ctx.subagents` プロバイダ。DSH_INTEGRATION.md §5）。ランタイムは `mise exec <tool> -- <cmd>` で起動する。
6. Record session/mounted caps and per-Grant Enforcement, then the correlated session/op-result (D-074).

For every SessionEl.env or profile env entry {VAR:secret://env/NAME}, require read in effective caps with permits; otherwise CAP_DENIED. MountRequest.env contains names/refs only. The session host reads values immediately before launch and never serializes them. Inherit only PATH, HOME, LANG, LC_*, TERM, TMPDIR, and MISE_* by default (D-079).

### 11.4 PTY（tmux）セッションホスト
- tmux サーバはソケット `$REINS_HOME/tmux.sock` 専用。セッション名 `reins-<RunId 末尾8>-<key>`。
- Send: record intent and sent payload with one opId, then tmux load-buffer + paste-buffer -p + send-keys Enter. Record session/op-result delivered/failed afterward; failure status is separate. Never treat session/sent as an outcome (D-021/074).
- observe：`capture-pane -p -J -S -2000` を 1 秒間隔で取り、前回との差分行を `screen` 観測として出す。
- status 推定：ランタイムごとの判定器（プロンプト待ち表示・承認ダイアログの文字列パターン）をプラグインとして持つ。判定不能は `unknown`。パターンは M0 スパイク S-4 で採取する。
- 人間の介入：`tmux -S $REINS_HOME/tmux.sock attach -t <name>`（`reins session attach <key>`）。人間の入力は観測されるが送信イベントにはならない（`screen` 観測として残る）。
- Result: run TaskSpec acceptance commands directly in disposable forked child workspaces. For share-mode children, use a disposable snapshot copy as in D-040. Truth-reconciliation command anchors always follow D-040 (D-058). Result output remains a relay excerpt of the last observation.

### 11.5 子 → 親
- Child content reaches the parent model only through Reins context trust:relay or DSH relay messages with source kind subagent-report/subagent-settled. It never becomes instruction, rule, or knowledge (I-SESS-2, D-049). For DSH-provider children, SessionDigest renders status only; the DSH relay carries the output body. Other children use relay context for output.
- 親の再起動時は `reattach` を試みる（I-SESS-4）。

---

### 11.6 Acceptance decisions (D-080)

Command checks default to timeoutMs:600000; exceeding the deadline is timeout and fails acceptance. Human checks start pending. Only a human principal may run reins session check <key> <index> pass|fail [--note] to append check/decided. Child relay text cannot decide a human check. SessionResult.checks carry passed/failed/timeout/pending; accepted is true when all pass, false when any fail/timeout, and null when none fail but some remain pending. result() returns after the child exits and command/anchor checks complete, without waiting for pending human decisions.

---

## 12. パッケージ・版・実行

### 12.1 パッケージ digest
`digestJson(toJson({manifest, files: {path: digestBytes(content)}}))`。files は entry から静的 import で到達する全モジュール（バンドラ esbuild の metafile で取得）と `content` glob の全ファイル。I-PKG-1。

### 12.2 依存
`dependencies` は `harness://` Ref（semver/tag/digest ピン）。レジストリは git URL（`registry` config で `harness://<scope>` → git URL のテンプレート）。`reins lock` が解決して `reins.lock` を書く。依存のコンポーネントは `use(name, props)` で使う。

### 12.3 Run
`RunSpec`（types.ts §11）を `run/start` に完全記録する（I-RUN-1）。Run の識別：`RunId`（ULID）。General Run comparison key: digestJson(toJson(RunSpec with seed omitted)); this is distinct from TrialKey, which includes seed (D-089).

Each CLI render/check/import invocation, DSH root session, mounted child session, and evaluation Trial owns one Run (D-036). Child RunSpec.parent is `{run, session}`; a DSH fork records forkedFrom `{run, seq}`. Resume continues the same Run, using runs/index.json for DSH session-to-Run mapping.

Human harness edits do not automatically change an active Run. `reins reload` or DSH `/reins-reload` records `harness/switched {digest, lock}`. Elaboration uses the last switched harness/lock, or the run/start harness/lock when none exists. Harness bindings are the logged exception to I-REF-2; other Mount bindings remain fixed (D-026/065).

### 12.4 mise
- ハーネスパッケージは `mise.toml` を持てる。ランタイム CLI（`npm:@anthropic-ai/claude-code`、`npm:@openai/codex`、`tmux` 等）の版はここで固定し、`mise.lock` の digest を `Lockfile.mise` に入れる。
- セッション起動・アンカー command 評価は `mise exec` 経由で行う（MUST）。
- 開発タスク（`mise run test` 等）は MILESTONES.md の通り。

---

## 13. 評価と進化（M7）

- Taskset：splits（propose / select / final）は互いに素（I-EVO-1）。
- Compare Trials only when TrialKey matches: digestJson(toJson({taskId, workspaceBases, model, seed, toolchain:{miseLock,dshVersion,patches}, principalCaps, hosts})). Harness digest, harness Mount config/base, harness dependency lock entries, namespace id, and RunSpec.parent may differ. This evaluation key is separate from the general Run key (I-EVO-2, D-089).
- 進化ループ：evolver が propose split の Trial ログ（ファイルとして読む。Meta-Harness 方式）から Proposal を作る → 候補パッケージを fork に適用 → select split で評価 → promoter が final split で最終判定し `harness:write` で採用。
- 外部評価基盤（Harbor 等）はアダプタとして接続してよい（MAY）。
- Final tasks/results are stored under `$REINS_HOME/sealed/<taskset>/`, omitted from evolver Run namespaces, and protected by a read guard that raises SPLIT_LEAK. They MUST NOT remain accessible as ordinary files to evolvers (D-068).

---

## 14. CLI（`@reins/cli`、コマンド名 `reins`）

| コマンド | 機能 | 導入 |
|---|---|---|
| `reins init [--embedded]` | パッケージ雛形 | M1 |
| `reins render --harness <dir> --workspace <dir> --host <kind>[,..] [--dry-run] [--force] [--target <path>] [--suspense-timeout <ms>]` | Lint → ensurePlan with bounded content fetching → plan → reconcile → commit. Save binding on first use (D-024). | M2 |
| `reins import --workspace <dir> [--host ...] [--lossy] [--adopt]` | Import Markdown as raw and JSON/TOML as structural tool/rule nodes; generate composition components. Unsupported fields fail unless --lossy reports and drops them (D-035). | M2 |
| `reins reload` | Explicitly record harness/switched for a running harness; DSH command is /reins-reload (D-026). | M3 |
| `reins run --task <file> --profile reins-headless` | Start a headless run with the §5.8 compiled task as its initial user message (D-031). | M3 |
| `reins status` | ドリフト・未適用提案・追跡済み生成物 | M2 |
| `reins why <file>:<line>` | sourcemap → gid、via、provenance | M2 |
| `reins explain --host <kind> [--seq n]` | 会計表（rendered / filtered 理由 / dropped） | M3 |
| `reins check` | アンカー評価 → 提案 | M4 |
| `reins propose list\|show\|apply\|reject <id>` | 提案管理 | M4 |
| `reins session ls\|attach\|send\|interrupt\|stop` | 子セッション操作 | M5 |
| `reins session check <key> <index> pass\|fail [--note]` | Human-only acceptance decision (D-080). | M5 |
| `reins lock` / `reins add <ref>` | 依存解決 | M6 |
| `reins replay <RunId>` | Reproduce the static render plan from a recorded Run (MILESTONES M6). | M6 |
| `reins eval run\|compare\|promote` | 評価 | M7 |

binding：`$REINS_HOME/state/<wsid>/binding.json`（`wsid = digestBytes(realpath(git common dir) または realpath(root))`）。`REINS_HOME` 既定 `~/.reins`。

Configuration import converts MCP servers to tool nodes and representable permissions.deny settings to enforced rule nodes (D-035). List unmappable items and fail, or report their removal with --lossy. Imported IDs are `imported.<path-slug>`; resolve collisions with -2, -3, and subsequent suffixes. Set CLAUDE.md imports to hosts ['claude-code'] and AGENTS.md imports to ['agents-md','codex']. Round-trip tests use dedupeWith:null; Markdown normalizes headers/final newline and JSON/TOML compares parsed values. Deduplicated output has no round-trip equality requirement (I-HOST-4, D-063).

---

After import, plan in memory and compare each imported target with its existing normalized content. Only matching, lossless imports may be adopted with human --adopt or an interactive y. Record render/adopted and a CommitRecord using observed digests, without overwriting; a later render adds generated headers. Lossy/mismatching targets and unrelated non-owned files remain TARGET_OCCUPIED (D-086).

The JSON boundary is toJson(unknown): accept plain objects, arrays, finite numbers, strings, booleans, and null; drop undefined object properties and reject unsupported values with NOT_JSON. All structured digest formulas use digestJson(toJson(value)); unchecked casts are forbidden (D-085).

## 15. Before / After

**A. 指示ファイル**
- Before：AGENTS.md と CLAUDE.md を手で書き、`src/auth/` 用の注意を両方にコピーし、Codex 用 skills と Claude 用 skills を別々に置く。
- After：木に `<scope at="workspace://app/src/auth/**">` を 1 回書く。`reins render --host agents-md,claude-code` で `src/auth/AGENTS.md` と `src/auth/CLAUDE.md` が出る。DSH uses the recent window (current and previous turn) by default; unused touches expire as defined in D-076.

**B. 腐敗**
- Before：誰かが CLAUDE.md を直接直し、AGENTS.md と食い違う。`pnpm test:unit` が改名されても指示は古いまま。
- After：直接編集は `drift/detected` になり、`reins status` が内容ファイルへの patch として持ち上げる提案を出す。`command` アンカーが `violated` を出し、どちらを直すかの提案が出る。

**C. 子セッション**
- Before：tmux を手で開き、別 repo を作り、CLAUDE.md をコピーし、プロンプトを貼り、画面を見張る。
- After：親が `session_spawn` を呼ぶ。子 worktree に子ハーネスが CLAUDE.md として生成され、タスクが §5.8 書式で送られ、権限は減衰され強制状態が記録され、人間は `reins session attach` で覗ける。子の報告は relay として親の文脈に入る。
