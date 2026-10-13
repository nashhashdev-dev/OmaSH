import type {
  Anchor, CapSet, Check, Element, LogEventMap, Namespace, PackageManifest,
  Projection, ReinsNode, RenderPlan, RunSpec, TaskSpec, TaskState,
} from '@reins/core'
import { api, h, hooks } from '@reins/core'

// SPEC 5.11: frontmatter example, represented as its typed element.
const frontmatter: Element = {
  kind: 'knowledge', id: 'auth.session-store', claim: 'fact',
  body: { format: 'md', text: 'セッションは Redis に保存され、TTL は 24 時間。' },
  anchors: [{ kind: 'path', pattern: 'workspace://app/src/auth/session-store.ts', expect: 'exists' }],
}

// SPEC 5.7 and 5.8 are text templates; validate their data inputs separately.
declare const relaySource: string
declare const relayBody: string
const relay: ReinsNode = h('context', {
  id: 'relay', trust: 'relay',
  body: { format: 'md', text: `<relay source="${relaySource}" node="example#relay">\n${relayBody}\n</relay>` },
})
const anchor: Anchor = { kind: 'command', argv: ['pnpm', 'test'], cwd: 'workspace://app', expectExit: 0, timeoutMs: 1000 }
const checks: readonly Check[] = [
  { kind: 'command', argv: ['pnpm', 'test'], cwd: 'workspace://app', expectExit: 0 },
  { kind: 'anchor', anchor }, { kind: 'human', question: 'Accept the result?' },
]
const task: TaskSpec = { goal: 'Verify', acceptance: checks, constraints: ['Stay in the workspace'],
  deliverables: [{ name: 'report', at: 'workspace://app/report.md', description: 'Results' }],
  references: ['harness://self/content/overview.md'] }

// Ref literals and capability calls used throughout SPEC.
const ref = api.parseRef('harness://@me/swe@^2#no-raw-sql')
const formatted = api.formatRef(ref)
declare const caps: CapSet
const attenuated = api.attenuate(caps, caps, { strict: true })
const permitted = api.permits(attenuated, 'read', api.parseRef('workspace://app/src/auth/x.ts'))
declare const namespace: Namespace
const nsProjection: Projection<Namespace> = { id: 'example/namespace', version: 1, init: namespace, reduce: state => state }
const projected = api.project(nsProjection, [], -1)
const state: TaskState = hooks.useTaskState()

// D-041/D-045: canonical manifest spelling and named JSON component boundary.
const profileManifest: PackageManifest = { name: '@example/harness', version: '1.0.0', entry: 'index.js',
  sessionProfiles: { verify: { export: 'Verify', runtimes: { codex: { kind: 'codex' } }, defaultRuntime: 'codex', caps } } }
declare const run: RunSpec
const switchEvent: LogEventMap['harness/switched'] = { digest: run.harness.digest, lock: run.lock }
const missingContent: LogEventMap['content/unavailable'] = { ref: 'context://docs/readme', reason: 'timeout' }

// SPEC 7.2 pseudocode: data shapes used by intent and outcome records.
declare const plan: RenderPlan
const intent: LogEventMap['render/intent'] = { host: plan.host, plan: plan.digest }
const committed: LogEventMap['render/committed'] = { host: plan.host, plan: plan.digest, tree: plan.tree,
  outputs: [], accounting: { rendered: 0, degraded: 0, filtered: 0, dropped: 0, delegated: 0 },
  cacheBreak: false, recovered: true }

void frontmatter; void relay; void task; void formatted; void permitted; void projected;
void state; void profileManifest; void switchEvent; void missingContent; void intent; void committed

// Remaining inline kernel/hook/resolver signatures in SPEC 4/6/9.
import type { RuntimeResolver } from '@reins/core'
declare const resolver: RuntimeResolver
declare const lock: import('@reins/core').Lockfile
declare const mount: import('@reins/core').Mount
const contentText: string = hooks.useContent('harness://self/content/overview.md')
const hookNamespace: Namespace = hooks.useNamespace()
const hookProjection: Namespace = hooks.useLog(nsProjection)
const predicateResult: boolean = api.evaluatePredicate({ op: 'touches', pattern: 'workspace://app/src/auth/**' }, state)
const matching: boolean = api.matchRef('workspace://app/**', ref)
const resolved = resolver.resolve(ref, mount, lock)
const snapshot = resolver.snapshot(mount)
const fork = resolver.fork?.(mount, { mode: 'fork-worktree', authority: 'app' })
void contentText; void hookNamespace; void hookProjection; void predicateResult; void matching; void resolved; void snapshot; void fork
