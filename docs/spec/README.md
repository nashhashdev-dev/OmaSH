# Reins 仕様一式

「ハーネスの React」を実装するための要件書・型・不変条件・実装指示。実装エージェントにこのフォルダを渡せば、解釈の余地なく実装を始められることを目的に書いてある。

| ファイル | 役割 | 規範性 |
|---|---|---|
| `AGENT_BRIEF.md` | 実装エージェントへの指示。**入口** | 規範 |
| `SPEC.md` | 何を作るか、法則、全機構の意味論 | 規範 |
| `types.ts` | カーネルのデータモデル（`tsc --strict` 通過済み） | 規範（正本） |
| `INVARIANTS.md` | 不変条件 41 件と試験義務 | 規範（最上位） |
| `DSH_INTEGRATION.md` | DSH / mise への載せ方、上流追随とパッチ方針 | 規範 |
| `MILESTONES.md` | M0〜M7 の成果物と受け入れ基準 | 規範 |
| `DECISIONS.md` | 65 recorded decisions numbered through D-068; D-052/054/056 were not supplied. Ten open questions have defaults. | Record |
| `DECISIONS-batch-2.md` | Supplied D-024 through D-041 and platform/real-runtime scope. | User decisions, reflected in the normative files. |
| `DECISIONS-batch-3.md` | Supplied batch-3 decisions and its canonical type source. | User decisions, reflected in the normative files. |
| `checks/` | Specification examples and positive/negative type checks; run tsc -p docs/spec/checks. | Validation |

## 渡し方

新しい空リポジトリにこのフォルダを `docs/spec/` として置き、エージェントに次の 1 行を渡す：

```
docs/spec/AGENT_BRIEF.md を読み、その §8 から作業を始めてください。報告は §7 の書式で。
```

## 設計の芯（30 秒版）

- ハーネスはコンポーネントの木。`ETree = elaborate(package, lock, namespace, log)` は純粋。
- 木はホストへ純粋に plan される：AGENTS.md / CLAUDE.md / Codex 設定（静的）、DSH の毎ターンのプロンプト（動的）、子セッション（Portal）。
- 世界を変えるのは commit とセッション操作だけで、すべて二相でログに残る。
- 状態はログの射影からしか読まない。エージェントの行動もまずログになり、木に反映される。
- 権限は木を下るとき・子へ渡すときに減衰しかしない。作業エージェントはハーネスを書けず、提案だけできる。
- 全ノードは会計され、強制状態は正直に記録される。生成物の外部編集はドリフトとして拾われ、提案になる。
